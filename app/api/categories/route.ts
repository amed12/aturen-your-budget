import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { apiSuccess, apiError } from '@/lib/api'

export async function GET() {
  try {
    const session = await requireAuth()

    const categories = await prisma.category.findMany({
      where: {
        OR: [
          { user_id: session.user_id as string },
          { is_default: true }
        ]
      },
      orderBy: { created_at: 'asc' }
    })
    return apiSuccess(categories)
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401)
    return apiError('Failed to fetch categories', 500)
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth()

    const body = await request.json()
    const { name } = body
    if (!name?.trim()) return apiError('Name is required', 400)

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        user_id: session.user_id as string,
        is_default: false
      }
    })
    return apiSuccess(category, 201)
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401)
    return apiError('Failed to create category', 500)
  }
}
