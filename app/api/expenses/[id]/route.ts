import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { apiSuccess, apiError } from '@/lib/api'

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth()
  
    const resolvedParams = await context.params
    const id = resolvedParams.id
    
    const expense = await prisma.expense.findUnique({ where: { id }, include: { budget: true } })
    if (!expense || expense.budget.user_id !== session.user_id) return apiError('Not found', 404)
    return apiSuccess(expense)
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401)
    return apiError('Failed to fetch expense', 500)
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth()
  
    const resolvedParams = await context.params
    const id = resolvedParams.id
    
    const expense = await prisma.expense.findUnique({ where: { id }, include: { budget: true } })
    if (!expense || expense.budget.user_id !== session.user_id) return apiError('Not found', 404)

    const body = await request.json()
    const { amount, category_id, note, date } = body

    const updated = await prisma.expense.update({
      where: { id },
      data: {
        amount: amount !== undefined ? amount : expense.amount,
        category_id: category_id || expense.category_id,
        note: note !== undefined ? note : expense.note,
        date: date ? new Date(date) : expense.date
      }
    })
    return apiSuccess(updated)
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401)
    return apiError('Failed to update expense', 500)
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth()
  
    const resolvedParams = await context.params
    const id = resolvedParams.id
    
    const expense = await prisma.expense.findUnique({ where: { id }, include: { budget: true } })
    if (!expense || expense.budget.user_id !== session.user_id) return apiError('Not found', 404)

    await prisma.expense.delete({ where: { id } })
    return apiSuccess({ success: true })
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401)
    return apiError('Failed to delete expense', 500)
  }
}
