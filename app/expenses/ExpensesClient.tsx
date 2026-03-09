'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import { X, Plus } from 'lucide-react'
import { Modal } from '@/components/Modal'

type Category = { id: string, name: string }

export function ExpensesClient() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [budgetId, setBudgetId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const amountInputRef = useRef<HTMLInputElement>(null)
  
  // Custom category states
  const [isAddingCat, setIsAddingCat] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [isSavingCat, setIsSavingCat] = useState(false)

  const { register, handleSubmit, setValue, watch, reset } = useForm({
    defaultValues: { amount: '', category_id: '', note: '', date: new Date().toISOString().split('T')[0] }
  })
  
  const selectedCategory = watch('category_id')

  useEffect(() => {
    async function init() {
      try {
        const params = new URLSearchParams(window.location.search)
        const eId = params.get('edit_id')
        if (eId) setEditId(eId)

        // Fetch budget
        const now = new Date()
        const budgetRes = await fetch(`/api/budgets?month=${now.getMonth() + 1}&year=${now.getFullYear()}`)
        const budgetJson = await budgetRes.json()
        if (budgetJson.budget) setBudgetId(budgetJson.budget.id)
        
        // Fetch categories
        const catRes = await fetch('/api/categories')
        const catJson = await catRes.json()
        setCategories(catJson)

        // If editing, fetch expense data to pre-fill
        if (eId) {
          const expRes = await fetch(`/api/expenses/${eId}`)
          if (expRes.ok) {
            const expJson = await expRes.json()
            setValue('amount', new Intl.NumberFormat('id-ID').format(Number(expJson.amount)))
            setValue('category_id', expJson.category_id)
            setValue('note', expJson.note || '')
            setValue('date', new Date(expJson.date).toISOString().split('T')[0])
          }
        }
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

  const fetchCategories = async () => {
    const catRes = await fetch('/api/categories')
    const catJson = await catRes.json()
    setCategories(catJson)
  }

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCatName.trim()) return
    setIsSavingCat(true)
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCatName.trim() })
      })
      if (!res.ok) throw new Error()
      
      const newCat = await res.json()
      toast.success('Kategori ditambahkan')
      setNewCatName('')
      setIsAddingCat(false)
      setValue('category_id', newCat.id)
      fetchCategories() // refresh
    } catch (e) {
      toast.error('Gagal tambah kategori')
    } finally {
      setIsSavingCat(false)
    }
  }

  const onSubmit = async (data: any) => {
    if (!budgetId) {
      toast.error('Harap atur budget bulanan terlebih dahulu di Settings')
      router.push('/settings')
      return
    }
    const rawAmount = Number(data.amount.toString().replace(/\D/g, ''))

    if (!rawAmount || !data.category_id) {
      toast.error('Nominal dan kategori wajib diisi')
      return
    }

    setIsLoading(true)
    try {
      const url = editId ? `/api/expenses/${editId}` : '/api/expenses'
      const method = editId ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          budget_id: budgetId,
          amount: rawAmount,
          category_id: data.category_id,
          note: data.note,
          date: new Date(data.date).toISOString()
        })
      })

      if (!res.ok) throw new Error('Failed')
      toast.success(editId ? 'Diperbarui ⚡' : 'Disimpan ⚡')
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
      <header className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900">{editId ? 'Edit Pengeluaran' : 'Catat Pengeluaran'}</h1>
        <button 
          onClick={() => router.back()}
          className="bg-gray-100 text-gray-500 p-2 rounded-full active:scale-95 transition-transform"
        >
          <X size={24} />
        </button>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* BIG AMOUNT INPUT */}
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-gray-400 font-bold">Rp</span>
          <input
            {...register('amount', {
              onChange: (e) => {
                const raw = e.target.value.replace(/\D/g, '')
                e.target.value = raw ? new Intl.NumberFormat('id-ID').format(Number(raw)) : ''
              }
            })}
            type="text"
            inputMode="numeric"
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
            <button
              type="button"
              onClick={() => setIsAddingCat(true)}
              className="px-3 py-2 rounded-full text-sm font-medium border border-dashed border-gray-300 text-gray-500 hover:bg-gray-50 flex items-center gap-1"
            >
              <Plus size={16} /> Baru
            </button>
          </div>
        </div>

        {/* OPTIONAL NOTE & DATE */}
        <div className="flex gap-2">
          <input
            {...register('note')}
            type="text"
            className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:ring-0"
            placeholder="Catatan opsional"
          />
          <input
            {...register('date')}
            type="date"
            required
            className="w-36 bg-white border border-gray-200 rounded-xl px-3 py-3 text-gray-900 focus:border-primary-500 focus:ring-0 text-sm"
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

      {/* Add Category Modal */}
      <Modal isOpen={isAddingCat} onClose={() => setIsAddingCat(false)} title="Kategori Baru">
        <form onSubmit={handleAddCategory} className="space-y-4">
          <input
            autoFocus
            type="text"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="Nama (ex: Belanja Bulanan)"
            className="w-full bg-gray-50 border-none rounded-lg px-4 py-3 focus:ring-1 focus:ring-primary-500"
          />
          <div className="flex gap-2">
            <button type="button" onClick={() => setIsAddingCat(false)} className="flex-1 py-3 text-gray-500 font-medium bg-gray-100 rounded-lg">Batal</button>
            <button type="submit" disabled={!newCatName.trim() || isSavingCat} className="flex-1 py-3 bg-primary-600 text-white rounded-lg font-medium disabled:opacity-50">
              {isSavingCat ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
