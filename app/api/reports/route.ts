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
      breakdown
    })
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401)
    return apiError('Failed to generate report', 500)
  }
}
