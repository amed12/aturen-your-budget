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

    const expenses = await prisma.expense.findMany({
      where: { budget_id },
      include: { category: true },
      orderBy: { date: 'desc' }
    })
    return apiSuccess(expenses)
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401)
    return apiError('Failed to fetch expenses', 500)
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth()

    const body = await request.json()
    const { budget_id, category_id, amount, note, date } = body

    if (!budget_id || !category_id || amount === undefined) {
      return apiError('Missing required fields', 400)
    }

    const budget = await prisma.budget.findUnique({ where: { id: budget_id } })
    if (!budget || budget.user_id !== session.user_id) return apiError('Not found', 404)

    const expense = await prisma.expense.create({
      data: {
        budget_id,
        category_id,
        amount,
        note: note || null,
        date: date ? new Date(date) : new Date()
      },
      include: { category: true }
    })
    return apiSuccess(expense, 201)
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401)
    return apiError('Failed to create expense', 500)
  }
}
