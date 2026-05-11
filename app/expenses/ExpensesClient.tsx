'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import { X, Plus, Wallet, ChevronDown } from 'lucide-react'
import { Modal } from '@/components/Modal'

type Category = { id: string, name: string }
type Budget = { id: string, name: string }

const nunito = { fontFamily: 'var(--font-nunito), sans-serif' }

export function ExpensesClient() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const amountInputRef = useRef<HTMLInputElement>(null)
  const [isAddingCat, setIsAddingCat] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [isSavingCat, setIsSavingCat] = useState(false)

  const { register, handleSubmit, setValue, watch, reset } = useForm({
    defaultValues: { amount: '', category_id: '', note: '', date: new Date().toISOString().split('T')[0], budget_id: '' }
  })
  const selectedCategory = watch('category_id')
  const selectedBudget = watch('budget_id')

  useEffect(() => {
    if (selectedBudget && typeof window !== 'undefined') localStorage.setItem('last_selected_budget_id', selectedBudget)
  }, [selectedBudget])

  useEffect(() => {
    async function init() {
      try {
        const params = new URLSearchParams(window.location.search)
        const eId = params.get('edit_id')
        const bId = params.get('budget_id')
        if (eId) setEditId(eId)
        const budgetRes = await fetch(`/api/budgets/active`)
        const budgetJson = await budgetRes.json()
        if (budgetJson.budgets) {
          setBudgets(budgetJson.budgets)
          if (bId && budgetJson.budgets.find((b: any) => b.id === bId)) setValue('budget_id', bId)
          else if (budgetJson.budgets.length > 0) {
            const savedId = typeof window !== 'undefined' ? localStorage.getItem('last_selected_budget_id') : null
            const primary = budgetJson.budgets.find((b: any) => b.is_primary)
            if (savedId && budgetJson.budgets.find((b: any) => b.id === savedId)) setValue('budget_id', savedId)
            else setValue('budget_id', primary ? primary.id : budgetJson.budgets[0].id)
          }
        }
        const catRes = await fetch('/api/categories')
        setCategories(await catRes.json())
        if (eId) {
          const expRes = await fetch(`/api/expenses/${eId}`)
          if (expRes.ok) {
            const expJson = await expRes.json()
            setValue('amount', new Intl.NumberFormat('id-ID').format(Number(expJson.amount)))
            setValue('category_id', expJson.category_id)
            setValue('note', expJson.note || '')
            setValue('date', new Date(expJson.date).toISOString().split('T')[0])
            setValue('budget_id', expJson.budget_id)
          }
        }
      } catch { toast.error('Gagal memuat data') }
    }
    init()
    setTimeout(() => amountInputRef.current?.focus(), 100)
  }, [setValue])

  const fetchCategories = async () => { setCategories(await (await fetch('/api/categories')).json()) }

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCatName.trim()) return
    setIsSavingCat(true)
    try {
      const res = await fetch('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newCatName.trim() }) })
      if (!res.ok) throw new Error()
      const newCat = await res.json()
      toast.success('Kategori ditambahkan ✨')
      setNewCatName(''); setIsAddingCat(false); setValue('category_id', newCat.id); fetchCategories()
    } catch { toast.error('Gagal tambah kategori') }
    finally { setIsSavingCat(false) }
  }

  const onSubmit = async (data: any) => {
    if (!data.budget_id) { toast.error('Harap atur budget terlebih dahulu di Settings'); router.push('/settings'); return }
    const rawAmount = Number(data.amount.toString().replace(/\D/g, ''))
    if (!rawAmount || !data.category_id) { toast.error('Nominal dan kategori wajib diisi'); return }
    setIsLoading(true)
    try {
      const payload = { budget_id: data.budget_id, amount: rawAmount, category_id: data.category_id, note: data.note, date: new Date(data.date).toISOString() }
      const res = await fetch(editId ? `/api/expenses/${editId}` : '/api/expenses', { method: editId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error('Failed')
      toast.success(editId ? 'Diperbarui ⚡' : 'Tersimpan ⚡')
      reset(); router.push('/dashboard'); router.refresh()
    } catch { toast.error('Gagal menyimpan') }
    finally { setIsLoading(false) }
  }

  return (
    <div className="p-6 space-y-6 animate-fadeInUp">
      <header className="flex justify-between items-center">
        <h1 className="text-xl font-extrabold" style={{ ...nunito, color: '#3D2C2E' }}>
          {editId ? 'Edit Pengeluaran ✏️' : 'Catat Pengeluaran ✏️'}
        </h1>
        <button onClick={() => router.back()} className="text-[#B0A59D] p-2.5 rounded-2xl press-effect transition-all hover:bg-primary-50" style={{ background: 'rgba(232,168,124,0.1)' }}>
          <X size={22} />
        </button>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {budgets.length > 1 && (
          <div className="glass-card rounded-2xl p-3.5">
            <label className="text-xs font-bold text-[#B0A59D] uppercase tracking-wider mb-2 flex items-center gap-1" style={nunito}>
              <Wallet size={14} /> Pilih Budget
            </label>
            <div className="relative group mt-1.5">
              <select {...register('budget_id')} className="w-full bg-primary-50/40 text-base font-bold focus:outline-none cursor-pointer px-3.5 py-3 rounded-xl border border-primary-100/50 appearance-none transition-colors group-hover:border-primary-300 relative z-10" style={{ ...nunito, color: '#3D2C2E' }}>
                {budgets.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#B0A59D] group-hover:text-primary-600 transition-colors z-20"><ChevronDown size={20} /></div>
            </div>
          </div>
        )}

        {/* Amount Input */}
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-[#B0A59D]" style={nunito}>Rp</span>
          <input
            {...register('amount', { onChange: (e) => { const raw = e.target.value.replace(/\D/g, ''); e.target.value = raw ? new Intl.NumberFormat('id-ID').format(Number(raw)) : '' } })}
            type="text" inputMode="numeric"
            ref={(e) => { register('amount').ref(e); (amountInputRef as any).current = e }}
            className="w-full text-4xl font-extrabold rounded-3xl py-6 pl-14 pr-4 border-2 border-primary-100 focus:outline-none transition-all"
            style={{ ...nunito, color: '#3D2C2E', background: 'rgba(255,253,251,0.8)' }}
            placeholder="0"
          />
        </div>

        {/* Category Chips */}
        <div className="space-y-3">
          <label className="text-sm font-bold block" style={{ ...nunito, color: '#8B7E74' }}>Pilih Kategori 👇</label>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button key={cat.id} type="button" onClick={() => setValue('category_id', cat.id)}
                className={`px-4 py-2.5 rounded-2xl text-sm font-bold transition-all press-effect ${
                  selectedCategory === cat.id
                    ? 'text-white shadow-warm-sm'
                    : 'text-[#8B7E74] hover:bg-primary-50'
                }`}
                style={{
                  ...nunito,
                  background: selectedCategory === cat.id ? 'linear-gradient(135deg, #E8A87C, #D4845A)' : 'rgba(232,168,124,0.08)',
                  border: `1.5px solid ${selectedCategory === cat.id ? 'transparent' : 'rgba(232,168,124,0.15)'}`,
                }}
              >
                {cat.name}
              </button>
            ))}
            <button type="button" onClick={() => setIsAddingCat(true)}
              className="px-3.5 py-2.5 rounded-2xl text-sm font-bold flex items-center gap-1 press-effect text-[#B0A59D] hover:text-primary-600 hover:bg-primary-50 transition-all"
              style={{ border: '1.5px dashed rgba(232,168,124,0.25)' }}
            >
              <Plus size={16} /> Baru
            </button>
          </div>
        </div>

        {/* Note & Date */}
        <div className="flex gap-2">
          <input {...register('note')} type="text"
            className="flex-1 rounded-2xl px-4 py-3 text-[#3D2C2E] placeholder-[#B0A59D] border-2 border-primary-100 focus:outline-none transition-all"
            style={{ background: 'rgba(255,253,251,0.8)' }}
            placeholder="Catatan opsional 📝"
          />
          <input {...register('date')} type="date" required
            className="w-36 rounded-2xl px-3 py-3 text-[#3D2C2E] border-2 border-primary-100 focus:outline-none text-sm transition-all"
            style={{ background: 'rgba(255,253,251,0.8)' }}
          />
        </div>

        {/* Save */}
        <button type="submit" disabled={isLoading || !selectedCategory || !watch('amount') || !selectedBudget}
          className="w-full font-bold text-lg py-4 rounded-2xl text-white press-effect transition-all disabled:opacity-40 disabled:scale-100"
          style={{ ...nunito, background: 'linear-gradient(135deg, #E8A87C 0%, #D4845A 100%)', boxShadow: '0 4px 16px rgba(212,132,90,0.3)' }}
        >
          {isLoading ? 'Menyimpan...' : 'Simpan ✨'}
        </button>
      </form>

      {/* Add Category Modal */}
      <Modal isOpen={isAddingCat} onClose={() => setIsAddingCat(false)} title="Kategori Baru ✨">
        <form onSubmit={handleAddCategory} className="space-y-4">
          <input autoFocus type="text" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="Nama (ex: Belanja Bulanan)" className="w-full rounded-2xl px-4 py-3 border-2 border-primary-100 focus:outline-none" style={{ background: 'rgba(232,168,124,0.06)' }} />
          <div className="flex gap-2">
            <button type="button" onClick={() => setIsAddingCat(false)} className="flex-1 py-3 font-semibold rounded-2xl press-effect" style={{ ...nunito, background: 'rgba(232,168,124,0.1)', color: '#8B7E74' }}>Batal</button>
            <button type="submit" disabled={!newCatName.trim() || isSavingCat} className="flex-1 py-3 text-white rounded-2xl font-bold disabled:opacity-50 press-effect" style={{ ...nunito, background: 'linear-gradient(135deg, #E8A87C, #D4845A)' }}>
              {isSavingCat ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
