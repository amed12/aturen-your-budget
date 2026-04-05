import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { apiSuccess, apiError } from '@/lib/api'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().optional(),
  is_active: z.boolean().optional(),
})

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth()
    const { id } = await params

    const budget = await prisma.budget.findUnique({
      where: { id },
    })

    if (!budget || budget.user_id !== session.user_id) {
      return apiError('Not found', 404)
    }

    return apiSuccess({ budget })
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401)
    return apiError('Failed to fetch budget', 500)
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth()
    const { id } = await params
    const body = await request.json()
    const dataToUpdate = updateSchema.parse(body)

    const existingBudget = await prisma.budget.findUnique({
      where: { id },
    })

    if (!existingBudget || existingBudget.user_id !== session.user_id) {
      return apiError('Not found', 404)
    }

    const updatedBudget = await prisma.budget.update({
      where: { id },
      data: dataToUpdate,
    })

    return apiSuccess({ budget: updatedBudget })
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401)
    if (error instanceof z.ZodError) return apiError(error.errors[0].message, 400)
    return apiError('Failed to update budget', 500)
  }
}
