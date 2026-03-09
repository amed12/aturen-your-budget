import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ExpensesClient } from './ExpensesClient'

export default function ExpensesPage() {
  return <ExpensesClient />
}
