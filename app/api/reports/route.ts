import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { apiSuccess, apiError } from '@/lib/api'

export async function GET(request: Request) {
  try {
    const session = await requireAuth()

    const { searchParams } = new URL(request.url)
    const budget_id_param = searchParams.get('budget_id')
    const view = searchParams.get('view') || 'summary' // 'summary' | 'detail'
    const isAll = budget_id_param === 'all'
    
    if (!budget_id_param) return apiError('budget_id required', 400)

    let budgetIds: string[] = []
    let totalBudgetAmount = 0
    let budgetName = isAll ? 'Semua Budget' : ''

    if (isAll) {
      const allBudgets = await prisma.budget.findMany({
        where: { user_id: session.user_id as string }
      })
      budgetIds = allBudgets.map(b => b.id)
      totalBudgetAmount = allBudgets.reduce((sum, b) => sum + Number(b.total_amount), 0)
    } else {
      // Could be comma separated
      budgetIds = budget_id_param.split(',')
      const budgets = await prisma.budget.findMany({
        where: { id: { in: budgetIds }, user_id: session.user_id as string }
      })
      
      if (budgets.length === 0) return apiError('Not found', 404)
      budgetIds = budgets.map(b => b.id)
      totalBudgetAmount = budgets.reduce((sum, b) => sum + Number(b.total_amount), 0)
      if (budgets.length === 1) budgetName = budgets[0].name
      else budgetName = 'Multiple Budgets'
    }

    // Base where clause for expenses
    const baseWhereClause: any = { budget_id: { in: budgetIds } }

    const category_id = searchParams.get('category_id')
    const date_from = searchParams.get('date_from')
    const date_to = searchParams.get('date_to')
    const search = searchParams.get('search')
    const min_amount = searchParams.get('min_amount')
    const max_amount = searchParams.get('max_amount')
    
    // Add filters to base where clause (applicable to both views if needed, 
    // but typically only detail view uses most filters, though summary uses date range now)
    if (category_id) baseWhereClause.category_id = category_id
    if (date_from || date_to) {
      baseWhereClause.date = {}
      if (date_from) baseWhereClause.date.gte = new Date(date_from)
      if (date_to) {
        const toDate = new Date(date_to)
        toDate.setHours(23, 59, 59, 999)
        baseWhereClause.date.lte = toDate
      }
    }
    if (search) {
      baseWhereClause.note = {
        contains: search,
        mode: 'insensitive'
      }
    }
    if (min_amount || max_amount) {
      baseWhereClause.amount = {}
      if (min_amount) baseWhereClause.amount.gte = parseFloat(min_amount)
      if (max_amount) baseWhereClause.amount.lte = parseFloat(max_amount)
    }

    // === SUMMARY VIEW ===
    if (view === 'summary') {
      const expenses = await prisma.expense.findMany({
        where: baseWhereClause,
        include: { category: true }
      })

      const total_spent = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0)

      const categoryMap: Record<string, { amount: number, count: number, id: string }> = {}
      
      // Calculate daily stats
      const dailyMap: Record<string, number> = {}
      
      expenses.forEach((exp) => {
        const catName = exp.category.name
        const catId = exp.category.id
        const amount = Number(exp.amount)
        if (!categoryMap[catName]) categoryMap[catName] = { amount: 0, count: 0, id: catId }
        categoryMap[catName].amount += amount
        categoryMap[catName].count += 1
        
        const dateStr = new Date(exp.date).toISOString().split('T')[0]
        dailyMap[dateStr] = (dailyMap[dateStr] || 0) + amount
      })

      const breakdown = Object.entries(categoryMap)
        .map(([name, data]) => ({
          name,
          id: data.id,
          amount: data.amount,
          count: data.count,
          avg: data.count > 0 ? Math.round(data.amount / data.count) : 0,
          percentage: total_spent > 0 ? Math.round((data.amount / total_spent) * 100) : 0
        }))
        .sort((a, b) => b.amount - a.amount)
        
      // Stats
      const activeDaysCount = Object.keys(dailyMap).length
      const avg_per_day = activeDaysCount > 0 ? Math.round(total_spent / activeDaysCount) : 0
      
      let highest_day = null;
      let highest_amount = -1;
      for (const [date, amt] of Object.entries(dailyMap)) {
        if (amt > highest_amount) {
          highest_amount = amt;
          highest_day = date;
        }
      }

      return apiSuccess({
        budget_name: budgetName,
        total_spent,
        total_budget: totalBudgetAmount,
        breakdown,
        total_transactions: expenses.length,
        avg_per_day,
        highest_day,
        highest_day_amount: highest_day ? highest_amount : 0
      })
    }

    // === DETAIL VIEW ===
    const sort_by = searchParams.get('sort_by') || 'date' // 'date' | 'amount'
    const sort_order = searchParams.get('sort_order') || 'desc' // 'asc' | 'desc'

    const orderBy: any = {}
    if (sort_by === 'amount') {
      orderBy.amount = sort_order
    } else {
      orderBy.date = sort_order
    }

    const expenses = await prisma.expense.findMany({
      where: baseWhereClause,
      include: { 
        category: true,
        budget: true 
      },
      orderBy
    })

    const total_filtered = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0)

    const detail_expenses = expenses.map((exp) => ({
      id: exp.id,
      amount: Number(exp.amount),
      note: exp.note,
      category_id: exp.category_id,
      category_name: exp.category.name,
      budget_name: exp.budget.name, // useful for multi-budget view
      date: exp.date,
      created_at: exp.created_at
    }))

    return apiSuccess({
      total_filtered,
      count: detail_expenses.length,
      expenses: detail_expenses
    })
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401)
    return apiError('Failed to generate report', 500)
  }
}
