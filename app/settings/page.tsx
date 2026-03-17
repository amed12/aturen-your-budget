'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { LogOut } from 'lucide-react'

const budgetSchema = z.object({
  total_amount: z.string().min(1, 'Budget harus diisi'),
})

const addIncomeSchema = z.object({
  add_amount: z.string().min(1, 'Nominal harus diisi'),
  source: z.string().min(1, 'Sumber pemasukan harus diisi'),
})

type BudgetForm = z.infer<typeof budgetSchema>
type AddIncomeForm = z.infer<typeof addIncomeSchema>

export default function SettingsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [incomes, setIncomes] = useState<Array<{ id: string, source: string, amount: string | number, created_at: string }>>([])
  
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<BudgetForm>({
    resolver: zodResolver(budgetSchema)
  })

  // Separate form handler for adding income
  const { 
    register: registerAdd, 
    handleSubmit: handleSubmitAdd, 
    reset: resetAdd,
    formState: { errors: errorsAdd } 
  } = useForm<AddIncomeForm>({
    resolver: zodResolver(addIncomeSchema)
  })

  const fetchBudget = useCallback(async () => {
    try {
      const res = await fetch(`/api/budgets?month=${month}&year=${year}`)
      const json = await res.json()
      if (json.budget) {
        setValue('total_amount', new Intl.NumberFormat('id-ID').format(Number(json.budget.total_amount)))
        setIncomes(json.budget.incomes || [])
      }
    } catch {
      // ignore
    }
  }, [month, year, setValue])

  useEffect(() => {
    fetchBudget()
  }, [fetchBudget])

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
      
      toast.success('Budget diatur ulang')
      fetchBudget()
    } catch {
      toast.error('Gagal mengatur budget')
    } finally {
      setIsLoading(false)
    }
  }

  const onAddIncome = async (data: AddIncomeForm) => {
    setIsAdding(true)
    try {
      const rawAmount = Number(data.add_amount.toString().replace(/\D/g, ''))
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ add_amount: rawAmount, source: data.source, month, year })
      })
      
      if (!res.ok) throw new Error('Failed')
      
      toast.success('Pemasukan ditambahkan ke Budget!')
      resetAdd() // clear form
      fetchBudget() // refresh main total budget box
    } catch {
      toast.error('Gagal menambah pemasukan')
    } finally {
      setIsAdding(false)
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
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm font-medium text-white bg-gray-900 hover:bg-gray-800 disabled:opacity-50"
          >
            {isLoading ? 'Menyimpan...' : 'Timpa Total Budget'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Tambah Pemasukan</h2>
          <p className="text-sm text-gray-500">Dapat THR atau Gaji? Tambahkan ke budget bulan ini.</p>
        </div>

        <form onSubmit={handleSubmitAdd(onAddIncome)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Sumber Pemasukan</label>
            <input
              {...registerAdd('source')}
              type="text"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-3 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="Contoh: Gaji Pokok"
            />
            {errorsAdd.source && <p className="mt-1 text-sm text-red-500">{errorsAdd.source.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Nominal Pemasukan Baru</label>
            <input
              {...registerAdd('add_amount', {
                onChange: (e) => {
                  const raw = e.target.value.replace(/\D/g, '')
                  e.target.value = raw ? new Intl.NumberFormat('id-ID').format(Number(raw)) : ''
                }
              })}
              type="text"
              inputMode="numeric"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-3 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="Contoh: 3.000.000"
            />
            {errorsAdd.add_amount && <p className="mt-1 text-sm text-red-500">{errorsAdd.add_amount.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isAdding}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
          >
            {isAdding ? 'Menambahkan...' : 'Tambah ke Budget'}
          </button>
        </form>

        {incomes.length > 0 && (
          <div className="pt-6 mt-4 border-t border-gray-100 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Riwayat Pemasukan</h3>
            <div className="space-y-2">
              {incomes.map((inc) => (
                <div key={inc.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{inc.source}</p>
                    <p className="text-xs text-gray-500">{new Date(inc.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}</p>
                  </div>
                  <p className="font-semibold text-success-600">
                    +{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(inc.amount))}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
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
