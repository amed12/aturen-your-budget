import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { apiSuccess, apiError } from '@/lib/api'
import { z } from 'zod'

const budgetSchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2020),
  total_amount: z.number().min(0).optional(),
  add_amount: z.number().min(1).optional(),
  source: z.string().optional()
}).refine(data => data.total_amount !== undefined || data.add_amount !== undefined, {
  message: "Harus mengisi total_amount atau add_amount"
})

export async function POST(request: Request) {
  try {
    const session = await requireAuth()
    const body = await request.json()
    const { month, year, total_amount, add_amount, source } = budgetSchema.parse(body)

    let budget;
    // We check if budget with the same ID exists when the client sends it, 
    // but the schema doesn't uniquely enforce month/day for budgets anymore.
    // However, if the client is just "adding amount", they may want to target an active budget for this month.
    // For now we will just create a new one unless 'total_amount' is updated and they didn't pass ID... wait, the client is expected to pass budget ID if they want to add!
    // But keeping it simple for the MVP behavior: If they give month/year but we are moving away from unique constraint, let's see if there is an active budget for that month.
    
    budget = await prisma.budget.findFirst({
      where: {
        user_id: session.user_id as string,
        month,
        year,
        is_active: true
      },
      orderBy: { created_at: 'desc' }
    })

    if (budget) {
      if (add_amount !== undefined) {
        const newTotal = Number(budget.total_amount) + add_amount
        budget = await prisma.budget.update({
          where: { id: budget.id },
          data: { total_amount: newTotal }
        })
        await prisma.income.create({
          data: {
            budget_id: budget.id,
            amount: add_amount,
            source: source || 'Pemasukan Tambahan',
          }
        })
      } else if (total_amount !== undefined) {
        budget = await prisma.budget.update({
          where: { id: budget.id },
          data: { total_amount }
        })
      }
    } else {
      const newTotal = add_amount !== undefined ? add_amount : total_amount
      
      const budgetName = `Budget ${new Date(year, month - 1).toLocaleString('id-ID', { month: 'long' })} ${year}`
      
      budget = await prisma.budget.create({
        data: {
          user_id: session.user_id as string,
          month,
          year,
          name: budgetName,
          is_active: true,
          total_amount: newTotal!
        }
      })
      await prisma.income.create({
        data: {
          budget_id: budget.id,
          amount: newTotal!,
          source: source || 'Budget Awal',
        }
      })
    }

    return apiSuccess(budget, 200)
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401)
    if (error instanceof z.ZodError) return apiError((error as any).errors[0].message, 400)
    return apiError('Failed to process budget', 500)
  }
}

export async function GET(request: Request) {
  try {
    const session = await requireAuth()

    const { searchParams } = new URL(request.url)
    const listAll = searchParams.get('list') === 'all'
    if (listAll) {
      const budgets = await prisma.budget.findMany({
        where: { user_id: session.user_id as string },
        orderBy: { created_at: 'desc' }
      })
      return apiSuccess({ budgets })
    }

    const month = parseInt(searchParams.get('month') || '0')
    const year = parseInt(searchParams.get('year') || '0')
    if (!month || !year) return apiError('Month and year required', 400)
    
    // We get the first active budget for that month if they search this way (fallback for old API calls)
    const budget = await prisma.budget.findFirst({
      where: {
        user_id: session.user_id as string,
        month,
        year,
      },
      orderBy: { created_at: 'desc' },
      include: {
        incomes: {
          orderBy: { created_at: 'desc' }
        }
      }
    })
    return apiSuccess({ budget: budget || null })
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401)
    return apiError('Failed to fetch budget', 500)
  }
}
