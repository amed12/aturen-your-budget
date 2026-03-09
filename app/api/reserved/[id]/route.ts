import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getSession } from '@/lib/auth'

const prisma = new PrismaClient()

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const resolvedParams = await context.params
  const id = resolvedParams.id

  try {
    const item = await prisma.reservedItem.findUnique({
      where: { id },
      include: { budget: true }
    })

    if (!item || item.budget.user_id !== session.user_id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const body = await request.json()
    const { is_paid, amount, name } = body

    const updatedItem = await prisma.$transaction(async (tx: any) => {
      const updated = await tx.reservedItem.update({
        where: { id },
        data: {
          is_paid: is_paid !== undefined ? is_paid : item.is_paid,
          amount: amount !== undefined ? amount : item.amount,
          name: name !== undefined ? name : item.name,
          paid_at: is_paid && !item.is_paid ? new Date() : (is_paid === false ? null : item.paid_at)
        }
      })

      // If marking as paid today, auto-create expense (MVP logic)
      if (is_paid && !item.is_paid) {
         // Need a default category for auto-generated expense. We use Tagihan.
         let tagihanCat = await tx.category.findFirst({
           where: { name: 'Tagihan', user_id: null }
         })
         
         await tx.expense.create({
           data: {
             budget_id: item.budget_id,
             category_id: tagihanCat?.id || '', // Note: In a real app we'd guarantee this exists
             amount: updated.amount,
             note: `Auto: ${updated.name}`,
             date: new Date()
           }
         })
      }

      return updated
    })

    return NextResponse.json(updatedItem)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update reserved item' }, { status: 500 })
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const resolvedParams = await context.params
  const id = resolvedParams.id

  try {
    const item = await prisma.reservedItem.findUnique({
      where: { id },
      include: { budget: true }
    })

    if (!item || item.budget.user_id !== session.user_id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await prisma.reservedItem.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 })
  }
}
