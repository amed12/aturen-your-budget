'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { LogOut } from 'lucide-react'

const budgetSchema = z.object({
  total_amount: z.string().min(1, 'Budget harus diisi'),
})

type BudgetForm = z.infer<typeof budgetSchema>

export default function SettingsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<BudgetForm>({
    resolver: zodResolver(budgetSchema)
  })

  useEffect(() => {
    async function fetchBudget() {
      try {
        const res = await fetch(`/api/budgets?month=${month}&year=${year}`)
        const json = await res.json()
        if (json.budget) {
          setValue('total_amount', new Intl.NumberFormat('id-ID').format(Number(json.budget.total_amount)))
        }
      } catch (e) {
        // ignore
      }
    }
    fetchBudget()
  }, [month, year, setValue])

  const onSubmit = async (data: BudgetForm) => {
    setIsLoading(true)
    try {
      const rawAmount = Number(data.total_amount.toString().replace(/\D/g, ''))
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ total_amount: rawAmount, month, year })
      })
      
      if (!res.ok) throw new Error('Failed')
      
      toast.success('Budget berhasil disimpan')
      router.push('/dashboard')
      router.refresh()
    } catch (error) {
      toast.error('Gagal menyimpan budget')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/login', { method: 'DELETE' })
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="p-6 space-y-8">
      <header>
        <h1 className="text-xl font-bold text-gray-900">Pengaturan</h1>
      </header>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Budget Bulan Ini</h2>
          <p className="text-sm text-gray-500">{now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Total Budget (Rp)</label>
            <input
              {...register('total_amount', {
                onChange: (e) => {
                  const raw = e.target.value.replace(/\D/g, '')
                  e.target.value = raw ? new Intl.NumberFormat('id-ID').format(Number(raw)) : ''
                }
              })}
              type="text"
              inputMode="numeric"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-3 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="5.000.000"
            />
            {errors.total_amount && <p className="mt-1 text-sm text-red-500">{errors.total_amount.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none disabled:bg-primary-300"
          >
            {isLoading ? 'Menyimpan...' : 'Simpan Budget'}
          </button>
        </form>
      </div>

      <div className="pt-8 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-danger-500 font-medium p-2 hover:bg-danger-50 rounded-lg transition-colors"
        >
          <LogOut size={20} />
          Keluar (Logout)
        </button>
      </div>
    </div>
  )
}
