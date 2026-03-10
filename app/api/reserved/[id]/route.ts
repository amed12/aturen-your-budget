import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { apiSuccess, apiError } from '@/lib/api'

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth()

    const resolvedParams = await context.params
    const id = resolvedParams.id

    const item = await prisma.reservedItem.findUnique({
      where: { id },
      include: { budget: true }
    })

    if (!item || item.budget.user_id !== session.user_id) {
      return apiError('Not found', 404)
    }

    const body = await request.json()
    const { is_paid, amount, name } = body

    const updatedItem = await prisma.$transaction(async (tx) => {
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

    return apiSuccess(updatedItem)
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401)
    return apiError('Failed to update reserved item', 500)
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth()

    const resolvedParams = await context.params
    const id = resolvedParams.id

    const item = await prisma.reservedItem.findUnique({
      where: { id },
      include: { budget: true }
    })

    if (!item || item.budget.user_id !== session.user_id) {
      return apiError('Not found', 404)
    }

    await prisma.reservedItem.delete({ where: { id } })
    return apiSuccess({ success: true })
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401)
    return apiError('Failed to delete item', 500)
  }
}
