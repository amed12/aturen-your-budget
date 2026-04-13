import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { apiSuccess, apiError } from '@/lib/api'
import { z } from 'zod'

const updateSchema = z.object({
  source: z.string().min(1),
  amount: z.number().positive(),
})

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth()
    const { id } = await params
    const body = await request.json()
    const { source, amount } = updateSchema.parse(body)

    const income = await prisma.income.findUnique({
      where: { id },
      include: { budget: true }
    })

    if (!income || income.budget.user_id !== session.user_id as string) {
      return apiError('Income not found', 404)
    }

    const updatedIncome = await prisma.income.update({
      where: { id },
      data: { source, amount }
    })

    // Sync budget total_amount
    const diff = amount - Number(income.amount)
    await prisma.budget.update({
      where: { id: income.budget_id },
      data: { total_amount: Number(income.budget.total_amount) + diff }
    })

    return apiSuccess({ income: updatedIncome })
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401)
    if (error instanceof z.ZodError) return apiError(error.issues[0].message, 400)
    return apiError('Failed to update income', 500)
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth()
    const { id } = await params

    const income = await prisma.income.findUnique({
      where: { id },
      include: { budget: true }
    })

    if (!income || income.budget.user_id !== session.user_id as string) {
      return apiError('Income not found', 404)
    }

    // Sync budget total_amount BEFORE deleting the income
    await prisma.budget.update({
      where: { id: income.budget_id },
      data: { total_amount: Number(income.budget.total_amount) - Number(income.amount) }
    })

    await prisma.income.delete({
      where: { id }
    })

    return apiSuccess({ message: 'Income deleted' })
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401)
    return apiError('Failed to delete income', 500)
  }
}
