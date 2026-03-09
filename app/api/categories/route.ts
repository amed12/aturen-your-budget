import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getSession } from '@/lib/auth'

const prisma = new PrismaClient()

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const categories = await prisma.category.findMany({
      where: {
        OR: [
          { user_id: session.user_id },
          { is_default: true }
        ]
      },
      orderBy: { created_at: 'asc' }
    })
    return NextResponse.json(categories)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { name } = body
    if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        user_id: session.user_id,
        is_default: false
      }
    })
    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}
