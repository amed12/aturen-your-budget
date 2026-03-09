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
      include: { category: true },
      orderBy: { date: 'desc' }
    })
    return NextResponse.json(expenses)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { budget_id, category_id, amount, note, date } = body

    if (!budget_id || !category_id || amount === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const budget = await prisma.budget.findUnique({ where: { id: budget_id } })
    if (!budget || budget.user_id !== session.user_id) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const expense = await prisma.expense.create({
      data: {
        budget_id,
        category_id,
        amount,
        note: note || null,
        date: date ? new Date(date) : new Date()
      },
      include: { category: true }
    })
    return NextResponse.json(expense, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 })
  }
}
