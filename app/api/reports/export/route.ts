import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getSession } from '@/lib/auth'

const prisma = new PrismaClient()

export async function GET(request: Request) {
  const session = await getSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const { searchParams } = new URL(request.url)
  const budget_id = searchParams.get('budget_id')
  
  if (!budget_id) return new Response('budget_id required', { status: 400 })

  try {
    const budget = await prisma.budget.findUnique({ where: { id: budget_id } })
    if (!budget || budget.user_id !== session.user_id) return new Response('Not found', { status: 404 })

    const expenses = await prisma.expense.findMany({
      where: { budget_id },
      include: { category: true },
      orderBy: { date: 'desc' }
    })

    // Create CSV header
    let csvData = 'Tanggal,Kategori,Nominal,Catatan\n'

    // Add rows
    expenses.forEach((exp: any) => {
      const date = new Date(exp.date).toLocaleDateString('id-ID')
      const category = `"${exp.category.name.replace(/"/g, '""')}"`
      const amount = exp.amount
      const note = `"${(exp.note || '').replace(/"/g, '""')}"`
      
      csvData += `${date},${category},${amount},${note}\n`
    })

    return new Response(csvData, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="laporan_aturan_${budget.month}_${budget.year}.csv"`
      }
    })
  } catch (error) {
    return new Response('Failed to generate CSV export', { status: 500 })
  }
}
