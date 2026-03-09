import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ReservedClient } from './ReservedClient'

export default function ReservedPage() {
  return <ReservedClient />
}
