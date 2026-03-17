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

    let budget = await prisma.budget.findUnique({
      where: {
        user_id_month_year: {
          user_id: session.user_id as string,
          month,
          year,
        }
      }
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
        // Log setup as income if we want to reset history, or just leave it. 
        // For now, let's treat explicit total_amount changes not as an income stream but a budget reset.
      }
    } else {
      const newTotal = add_amount !== undefined ? add_amount : total_amount
      budget = await prisma.budget.create({
        data: {
          user_id: session.user_id as string,
          month,
          year,
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
    const month = parseInt(searchParams.get('month') || '0')
    const year = parseInt(searchParams.get('year') || '0')
    
    if (!month || !year) return apiError('Month and year required', 400)
    const budget = await prisma.budget.findUnique({
      where: {
        user_id_month_year: {
          user_id: session.user_id as string,
          month,
          year,
        }
      },
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
