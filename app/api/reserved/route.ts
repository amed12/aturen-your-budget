import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getSession } from '@/lib/auth'

const prisma = new PrismaClient()

export async function GET(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const budget_id = searchParams.get('budget_id')
  
  if (!budget_id) return NextResponse.json({ error: 'budget_id is required' }, { status: 400 })

  try {
    // Verify budget belongs to user
    const budget = await prisma.budget.findUnique({
      where: { id: budget_id }
    })

    if (!budget || budget.user_id !== session.user_id) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 })
    }

    const reserved = await prisma.reservedItem.findMany({
      where: { budget_id },
      orderBy: { created_at: 'asc' }
    })
    return NextResponse.json(reserved)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch reserved items' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { budget_id, name, amount } = body

    if (!budget_id || !name || amount === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const budget = await prisma.budget.findUnique({
      where: { id: budget_id }
    })

    if (!budget || budget.user_id !== session.user_id) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 })
    }

    const item = await prisma.reservedItem.create({
      data: {
        budget_id,
        name,
        amount
      }
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create reserved item' }, { status: 500 })
  }
}
