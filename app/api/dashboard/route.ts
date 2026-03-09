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

    const [reservedItems, expenses, recentExpenses] = await Promise.all([
      prisma.reservedItem.findMany({ where: { budget_id } }),
      prisma.expense.findMany({ where: { budget_id }, include: { category: true } }),
      prisma.expense.findMany({
        where: { budget_id },
        include: { category: true },
        orderBy: { created_at: 'desc' },
        take: 5
      })
    ])

    const total_amount = Number(budget.total_amount)
    
    // Only unpaid reserved items subtract from our real spending pool here if we count actual expenses
    // But PRD Logic: Spendable budget = total_budget - sum(reserved_not_paid)
    // Actually, dashboard shows: Budget, Reserved, Spent, Remaining
    const reserved = reservedItems.reduce((acc: number, item: any) => acc + Number(item.amount), 0)
    const spent = expenses.reduce((acc: number, item: any) => acc + Number(item.amount), 0)

    // Unpaid reserved
    const unpaid_reserved = reservedItems
      .filter((i: any) => !i.is_paid)
      .reduce((acc: number, item: any) => acc + Number(item.amount), 0)

    // Remaining budget = Total Budget - Spent - Unpaid Reserved
    const remaining = total_amount - spent - unpaid_reserved

    // Top spending category
    const categoryTotals: Record<string, { total: number, name: string }> = {}
    expenses.forEach((exp: any) => {
      const catId = exp.category_id
      if (!categoryTotals[catId]) {
        categoryTotals[catId] = { total: 0, name: exp.category.name }
      }
      categoryTotals[catId].total += Number(exp.amount)
    })

    let topCategory = null
    let max = -1
    for (const catId in categoryTotals) {
      if (categoryTotals[catId].total > max) {
        max = categoryTotals[catId].total
        topCategory = categoryTotals[catId]
      }
    }

    return NextResponse.json({
      total_budget: total_amount,
      total_reserved: reserved,
      unpaid_reserved,
      total_spent: spent,
      remaining_budget: remaining,
      top_category: topCategory,
      top_category_amount: topCategory ? max : 0,
      recent_expenses: recentExpenses.map((exp: any) => ({
        id: exp.id,
        amount: Number(exp.amount),
        note: exp.note,
        category_name: exp.category.name,
        date: exp.date
      }))
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch dashboard' }, { status: 500 })
  }
}
