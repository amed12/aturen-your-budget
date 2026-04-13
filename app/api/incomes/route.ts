import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { apiSuccess, apiError } from '@/lib/api'

export async function GET(request: Request) {
  try {
    const session = await requireAuth()
    const { searchParams } = new URL(request.url)
    const budgetId = searchParams.get('budget_id')

    if (!budgetId) {
      return apiError('Budget ID is required', 400)
    }

    const incomes = await prisma.income.findMany({
      where: {
        budget_id: budgetId,
        budget: {
          user_id: session.user_id as string
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    return apiSuccess({ incomes })
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401)
    return apiError('Failed to fetch incomes', 500)
  }
}

import { z } from 'zod'

const createIncomeSchema = z.object({
  budget_id: z.string().min(1),
  source: z.string().min(1),
  amount: z.number().positive()
})

export async function POST(request: Request) {
  try {
    const session = await requireAuth()
    const body = await request.json()
    const { budget_id, source, amount } = createIncomeSchema.parse(body)

    const budget = await prisma.budget.findUnique({
      where: { id: budget_id }
    })

    if (!budget || budget.user_id !== session.user_id as string) {
      return apiError('Budget not found', 404)
    }

    const income = await prisma.income.create({
      data: {
        budget_id,
        source,
        amount
      }
    })

    await prisma.budget.update({
      where: { id: budget_id },
      data: { total_amount: Number(budget.total_amount) + amount }
    })

    return apiSuccess({ income }, 201)
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401)
    if (error instanceof z.ZodError) return apiError(error.issues[0].message, 400)
    return apiError('Failed to create income', 500)
  }
}
