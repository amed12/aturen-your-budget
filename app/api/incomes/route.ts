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
          user_id: session.user_id
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
