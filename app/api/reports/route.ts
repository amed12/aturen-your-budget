import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { apiSuccess, apiError } from '@/lib/api'

export async function GET(request: Request) {
  try {
    const session = await requireAuth()

    const { searchParams } = new URL(request.url)
    const budget_id = searchParams.get('budget_id')
    const view = searchParams.get('view') || 'summary' // 'summary' | 'detail'
    
    if (!budget_id) return apiError('budget_id required', 400)

    const budget = await prisma.budget.findUnique({ where: { id: budget_id } })
    if (!budget || budget.user_id !== session.user_id) return apiError('Not found', 404)

    // === SUMMARY VIEW (existing behavior + enhanced) ===
    if (view === 'summary') {
      const expenses = await prisma.expense.findMany({
        where: { budget_id },
        include: { category: true }
      })

      const total_spent = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0)

      const categoryMap: Record<string, number> = {}
      expenses.forEach((exp) => {
        const catName = exp.category.name
        categoryMap[catName] = (categoryMap[catName] || 0) + Number(exp.amount)
      })

      const breakdown = Object.entries(categoryMap)
        .map(([name, amount]) => ({
          name,
          amount,
          percentage: total_spent > 0 ? Math.round((amount / total_spent) * 100) : 0
        }))
        .sort((a, b) => b.amount - a.amount)

      return apiSuccess({
        total_spent,
        total_budget: Number(budget.total_amount),
        breakdown
      })
    }

    // === DETAIL VIEW (new: full expense list with filters) ===
    const category_id = searchParams.get('category_id')
    const date_from = searchParams.get('date_from')
    const date_to = searchParams.get('date_to')
    const search = searchParams.get('search')
    const sort_by = searchParams.get('sort_by') || 'date' // 'date' | 'amount'
    const sort_order = searchParams.get('sort_order') || 'desc' // 'asc' | 'desc'
    const min_amount = searchParams.get('min_amount')
    const max_amount = searchParams.get('max_amount')

    // Build filter conditions
    const whereClause: any = { budget_id }

    if (category_id) {
      whereClause.category_id = category_id
    }

    if (date_from || date_to) {
      whereClause.date = {}
      if (date_from) whereClause.date.gte = new Date(date_from)
      if (date_to) {
        const toDate = new Date(date_to)
        toDate.setHours(23, 59, 59, 999)
        whereClause.date.lte = toDate
      }
    }

    if (search) {
      whereClause.note = {
        contains: search,
        mode: 'insensitive'
      }
    }

    if (min_amount || max_amount) {
      whereClause.amount = {}
      if (min_amount) whereClause.amount.gte = parseFloat(min_amount)
      if (max_amount) whereClause.amount.lte = parseFloat(max_amount)
    }

    // Build sort
    const orderBy: any = {}
    if (sort_by === 'amount') {
      orderBy.amount = sort_order
    } else {
      orderBy.date = sort_order
    }

    const expenses = await prisma.expense.findMany({
      where: whereClause,
      include: { category: true },
      orderBy
    })

    const total_filtered = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0)

    const detail_expenses = expenses.map((exp) => ({
      id: exp.id,
      amount: Number(exp.amount),
      note: exp.note,
      category_id: exp.category_id,
      category_name: exp.category.name,
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
