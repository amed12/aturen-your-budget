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

    const total_amount = Number(budget.total_amount)
    
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
      }))
    })
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401)
    return apiError('Failed to fetch dashboard', 500)
  }
}
