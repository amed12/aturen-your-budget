import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getSession } from '@/lib/auth'

const prisma = new PrismaClient()

export async function GET(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const budget_id = searchParams.get('budget_id')
  
  if (!budget_id) return NextResponse.json({ error: 'budget_id required' }, { status: 400 })

  try {
    const budget = await prisma.budget.findUnique({ where: { id: budget_id } })
    if (!budget || budget.user_id !== session.user_id) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const expenses = await prisma.expense.findMany({
      where: { budget_id },
      include: { category: true }
    })

    const total_spent = expenses.reduce((sum: number, exp: any) => sum + Number(exp.amount), 0)

    const categoryMap: Record<string, number> = {}
    expenses.forEach((exp: any) => {
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

    return NextResponse.json({
      total_spent,
      breakdown
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}
