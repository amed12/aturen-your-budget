import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { apiSuccess, apiError } from '@/lib/api'

export async function GET(request: Request) {
  try {
    const session = await requireAuth()

    const { searchParams } = new URL(request.url)
    const budget_id = searchParams.get('budget_id')
    
    if (!budget_id) return apiError('budget_id required', 400)

    const budget = await prisma.budget.findUnique({ where: { id: budget_id } })
    if (!budget || budget.user_id !== session.user_id) return apiError('Not found', 404)

    const [reservedItems, expenses, recentExpenses] = await Promise.all([
      prisma.reservedItem.findMany({ where: { budget_id } }),
      prisma.expense.findMany({ where: { budget_id }, include: { category: true } }),
      prisma.expense.findMany({
        where: { budget_id },
        include: { category: true },
        orderBy: { created_at: 'desc' },
        take: 5
      })
    ])

    const total_amount_raw = Number(budget.total_amount)

    // Self-heal: recalculate total_amount from actual incomes if they exist
    const allIncomes = await prisma.income.findMany({ where: { budget_id } })
    const incomeSum = allIncomes.reduce((acc, inc) => acc + Number(inc.amount), 0)
    
    // If incomes exist but total_amount is stale/zero, fix it
    if (incomeSum > 0 && Math.abs(incomeSum - total_amount_raw) > 0.01) {
      await prisma.budget.update({
        where: { id: budget_id },
        data: { total_amount: incomeSum }
      })
    }

    const total_amount = incomeSum > 0 ? incomeSum : total_amount_raw
    
    // Only unpaid reserved items subtract from our real spending pool here if we count actual expenses
    // But PRD Logic: Spendable budget = total_budget - sum(reserved_not_paid)
    // Actually, dashboard shows: Budget, Reserved, Spent, Remaining
    const reserved = reservedItems.reduce((acc, item) => acc + Number(item.amount), 0)
    const spent = expenses.reduce((acc, item) => acc + Number(item.amount), 0)

    // Unpaid reserved
    const unpaid_reserved = reservedItems
      .filter((i) => !i.is_paid)
      .reduce((acc, item) => acc + Number(item.amount), 0)

    // Remaining budget = Total Budget - Spent - Unpaid Reserved
    const remaining = total_amount - spent - unpaid_reserved

    // Top spending category
    const categoryTotals: Record<string, { total: number, name: string }> = {}
    expenses.forEach((exp) => {
      const catId = exp.category_id
      if (!categoryTotals[catId]) {
        categoryTotals[catId] = { total: 0, name: exp.category.name }
      }
      categoryTotals[catId].total += Number(exp.amount)
    })

    let topCategory = null
    let max = -1
    for (const catId in categoryTotals) {
      if (categoryTotals[catId].total > max) {
        max = categoryTotals[catId].total
        topCategory = categoryTotals[catId]
      }
    }

    // === Spending Advice Calculation ===
    const now = new Date()
    
    // Check if the budget is for the current month
    const isCurrentMonthBudget = budget.year === now.getFullYear() && budget.month === now.getMonth() + 1
    
    // If not current month, remaining days is relative to that old month (0 if past, something if future, but just simpler: 0 for anything not current month)
    const currentDay = now.getDate()
    
    let remainingDays = 0;
    if (isCurrentMonthBudget) {
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
      remainingDays = Math.max(1, daysInMonth - currentDay + 1) // include today
    } else {
      // If past month, there are no remaining days.
      remainingDays = 0;
    }

    const safeDaily = remainingDays > 0 && remaining > 0 ? Math.floor(remaining / remainingDays) : 0
    const safeWeekly = remainingDays > 0 && remaining > 0 ? Math.floor(remaining / Math.max(1, remainingDays / 7)) : 0

    // Calculate today's spending (only relevant if it is the current month)
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    
    let todaySpent = 0;
    if (isCurrentMonthBudget) {
      todaySpent = expenses
        .filter(exp => {
          const expDate = new Date(exp.date)
          return expDate >= todayStart && expDate < todayEnd
        })
        .reduce((acc, exp) => acc + Number(exp.amount), 0)
    }

    // This week's spending (Monday start)
    let thisWeekSpent = 0;
    if (isCurrentMonthBudget) {
      const dayOfWeek = now.getDay() || 7 // Convert Sunday(0) to 7
      const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek + 1)
      thisWeekSpent = expenses
        .filter(exp => {
          const expDate = new Date(exp.date)
          return expDate >= weekStart && expDate <= now
        })
        .reduce((acc, exp) => acc + Number(exp.amount), 0)
    }

    // Average daily spending this month
    // If it's a past budget, calculate average over the whole month
    let avgDailySpent = 0;
    if (isCurrentMonthBudget) {
      const daysElapsed = Math.max(1, currentDay - 1) // days before today
      avgDailySpent = daysElapsed > 0 ? Math.round(spent / daysElapsed) : 0
    } else {
      const daysInThatMonth = new Date(budget.year, budget.month, 0).getDate()
      avgDailySpent = Math.round(spent / daysInThatMonth)
    }

    // Spending status
    let spending_status: 'safe' | 'warning' | 'danger' = 'safe'
    if (remaining <= 0) {
      spending_status = 'danger'
    } else if (todaySpent > safeDaily) {
      spending_status = 'warning'
    }

    return apiSuccess({
      total_budget: total_amount,
      total_reserved: reserved,
      unpaid_reserved,
      total_spent: spent,
      remaining_budget: remaining,
      top_category: topCategory,
      top_category_amount: topCategory ? max : 0,
      recent_expenses: recentExpenses.map((exp) => ({
        id: exp.id,
        amount: Number(exp.amount),
        note: exp.note,
        category_name: exp.category.name,
        date: exp.date
      })),
      spending_advice: {
        safe_daily: safeDaily,
        safe_weekly: safeWeekly,
        today_spent: todaySpent,
        this_week_spent: thisWeekSpent,
        avg_daily_spent: avgDailySpent,
        remaining_days: remainingDays,
        spending_status,
      }
    })
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401)
    return apiError('Failed to fetch dashboard', 500)
  }
}
