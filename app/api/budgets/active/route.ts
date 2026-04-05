import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { apiSuccess, apiError } from '@/lib/api'

export async function GET(request: Request) {
  try {
    const session = await requireAuth()

    const budgets = await prisma.budget.findMany({
      where: {
        user_id: session.user_id as string,
        is_active: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    })

    return apiSuccess({ budgets })
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401)
    return apiError('Failed to fetch active budgets', 500)
  }
}
