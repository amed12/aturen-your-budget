import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getSession } from '@/lib/auth'
import { z } from 'zod'

const prisma = new PrismaClient()

const budgetSchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2020),
  total_amount: z.number().min(0)
})

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { month, year, total_amount } = budgetSchema.parse(body)

    let budget = await prisma.budget.findUnique({
      where: {
        user_id_month_year: {
          user_id: session.user_id,
          month,
          year,
        }
      }
    })

    if (budget) {
      budget = await prisma.budget.update({
        where: { id: budget.id },
        data: { total_amount }
      })
    } else {
      budget = await prisma.budget.create({
        data: {
          user_id: session.user_id,
          month,
          year,
          total_amount
        }
      })
    }

    return NextResponse.json(budget, { status: 200 })
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: (error as any).errors[0].message }, { status: 400 })
    return NextResponse.json({ error: 'Failed to process budget' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const month = parseInt(searchParams.get('month') || '0')
  const year = parseInt(searchParams.get('year') || '0')
  
  if (!month || !year) return NextResponse.json({ error: 'Month and year required' }, { status: 400 })

  try {
    const budget = await prisma.budget.findUnique({
      where: {
        user_id_month_year: {
          user_id: session.user_id,
          month,
          year,
        }
      }
    })
    return NextResponse.json({ budget: budget || null })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch budget' }, { status: 500 })
  }
}
