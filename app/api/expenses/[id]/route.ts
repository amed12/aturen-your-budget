import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getSession } from '@/lib/auth'

const prisma = new PrismaClient()

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  const resolvedParams = await context.params
  const id = resolvedParams.id
  
  try {
    const expense = await prisma.expense.findUnique({ where: { id }, include: { budget: true } })
    if (!expense || expense.budget.user_id !== session.user_id) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(expense)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch expense' }, { status: 500 })
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  const resolvedParams = await context.params
  const id = resolvedParams.id
  
  try {
    const expense = await prisma.expense.findUnique({ where: { id }, include: { budget: true } })
    if (!expense || expense.budget.user_id !== session.user_id) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await request.json()
    const { amount, category_id, note, date } = body

    const updated = await prisma.expense.update({
      where: { id },
      data: {
        amount: amount !== undefined ? amount : expense.amount,
        category_id: category_id || expense.category_id,
        note: note !== undefined ? note : expense.note,
        date: date ? new Date(date) : expense.date
      }
    })
    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 })
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  const resolvedParams = await context.params
  const id = resolvedParams.id
  
  try {
    const expense = await prisma.expense.findUnique({ where: { id }, include: { budget: true } })
    if (!expense || expense.budget.user_id !== session.user_id) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await prisma.expense.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 })
  }
}
