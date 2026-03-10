import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { apiSuccess, apiError } from '@/lib/api'

export async function GET(request: Request) {
  try {
    const session = await requireAuth()

    const { searchParams } = new URL(request.url)
    const budget_id = searchParams.get('budget_id')
    
    if (!budget_id) return apiError('budget_id is required', 400)


    // Verify budget belongs to user
    const budget = await prisma.budget.findUnique({
      where: { id: budget_id }
    })

    if (!budget || budget.user_id !== session.user_id) {
      return apiError('Budget not found', 404)
    }

    const reserved = await prisma.reservedItem.findMany({
      where: { budget_id },
      orderBy: { created_at: 'asc' }
    })
    return apiSuccess(reserved)
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401)
    return apiError('Failed to fetch reserved items', 500)
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth()

    const body = await request.json()
    const { budget_id, name, amount } = body

    if (!budget_id || !name || amount === undefined) {
      return apiError('Missing required fields', 400)
    }

    const budget = await prisma.budget.findUnique({
      where: { id: budget_id }
    })

    if (!budget || budget.user_id !== session.user_id) {
      return apiError('Budget not found', 404)
    }

    const item = await prisma.reservedItem.create({
      data: {
        budget_id,
        name,
        amount
      }
    })

    return apiSuccess(item, 201)
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401)
    return apiError('Failed to create reserved item', 500)
  }
}
