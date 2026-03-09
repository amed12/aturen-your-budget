'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'

type Category = { id: string, name: string }

export function ExpensesClient() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [budgetId, setBudgetId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const amountInputRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, setValue, watch, reset } = useForm({
    defaultValues: { amount: '', category_id: '', note: '' }
  })
  
  const selectedCategory = watch('category_id')

  useEffect(() => {
    async function init() {
      try {
        // Fetch budget
        const now = new Date()
        const budgetRes = await fetch(`/api/budgets?month=${now.getMonth() + 1}&year=${now.getFullYear()}`)
        const budgetJson = await budgetRes.json()
        if (budgetJson.budget) setBudgetId(budgetJson.budget.id)
        
        // Fetch categories
        const catRes = await fetch('/api/categories')
        const catJson = await catRes.json()
        setCategories(catJson)
      } catch (e) {
        toast.error('Gagal memuat data')
      }
    }
    init()
    
    // Auto focus amount input after slight delay for mobile keyboard
    setTimeout(() => {
      amountInputRef.current?.focus()
    }, 100)
  }, [])

  const onSubmit = async (data: any) => {
    if (!budgetId) {
      toast.error('Harap atur budget bulanan terlebih dahulu di Settings')
      router.push('/settings')
      return
    }
    if (!data.amount || !data.category_id) {
      toast.error('Nominal dan kategori wajib diisi')
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          budget_id: budgetId,
          amount: Number(data.amount),
          category_id: data.category_id,
          note: data.note
        })
      })

      if (!res.ok) throw new Error('Failed')
      toast.success('Disimpan ⚡')
      reset() // Reset form for rapid entry
      router.push('/dashboard')
      router.refresh()
    } catch (e) {
      toast.error('Gagal menyimpan')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-xl font-bold text-gray-900">Catat Pengeluaran</h1>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* BIG AMOUNT INPUT */}
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-gray-400 font-bold">Rp</span>
          <input
            {...register('amount')}
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            ref={(e) => {
              register('amount').ref(e)
              // @ts-ignore
              amountInputRef.current = e
            }}
            className="w-full text-4xl font-bold text-gray-900 bg-white rounded-2xl py-6 pl-14 pr-4 border-2 border-transparent focus:border-primary-500 focus:ring-0 shadow-sm"
            placeholder="0"
          />
        </div>

        {/* CATEGORY CHIPS */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700 block">Kategori Dulu 👆</label>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setValue('category_id', cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                  selectedCategory === cat.id 
                    ? 'bg-primary-600 border-primary-600 text-white' 
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* OPTIONAL NOTE */}
        <div>
          <input
            {...register('note')}
            type="text"
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:ring-0"
            placeholder="Catatan (Opsional)"
          />
        </div>

        {/* SAVE BUTTON */}
        <button
          type="submit"
          disabled={isLoading || !selectedCategory || !watch('amount')}
          className="w-full bg-primary-600 text-white font-bold text-lg py-4 rounded-xl shadow-md active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100"
        >
          {isLoading ? 'Menyimpan...' : 'Simpan'}
        </button>
      </form>
    </div>
  )
}
