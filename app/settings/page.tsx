'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { LogOut, Save, Plus, Edit2, Archive, ArchiveRestore } from 'lucide-react'
import { Modal } from '@/components/Modal'

const budgetSchema = z.object({
  name: z.string().optional(),
  total_amount: z.string().min(1, 'Budget harus diisi'),
  month: z.number().min(1).max(12),
  year: z.number().min(2020),
})

const addIncomeSchema = z.object({
  add_amount: z.string().min(1, 'Nominal harus diisi'),
  source: z.string().min(1, 'Sumber pemasukan harus diisi'),
  budget_id: z.string().min(1, 'Pilih budget'),
})

type BudgetForm = z.infer<typeof budgetSchema>
type AddIncomeForm = z.infer<typeof addIncomeSchema>

type Budget = {
  id: string
  name: string
  total_amount: string
  is_active: boolean
  month: number
  year: number
  created_at: string
  incomes?: Array<{ id: string, source: string, amount: string, created_at: string }>
}

export default function SettingsPage() {
  const router = useRouter()
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAddingIncome, setIsAddingIncome] = useState(false)
  const [renameId, setRenameId] = useState<string | null>(null)
  const [renameName, setRenameName] = useState('')
  
  const [isAddingBudget, setIsAddingBudget] = useState(false)

  const now = new Date()

  // Setup form for creating a new budget
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<BudgetForm>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      month: now.getMonth() + 1,
      year: now.getFullYear()
    }
  })

  const { 
    register: registerAdd, 
    handleSubmit: handleSubmitAdd, 
    reset: resetAdd,
    formState: { errors: errorsAdd } 
  } = useForm<AddIncomeForm>({
    resolver: zodResolver(addIncomeSchema)
  })

  const fetchBudgets = useCallback(async () => {
    try {
      // Fetch ALL budgets including active and archived
      const res = await fetch(`/api/budgets?list=all`)
      const json = await res.json()
      if (json.budgets) {
        setBudgets(json.budgets)
        
        // Auto-select first active budget for income form
        const activeBudget = json.budgets.find((b: Budget) => b.is_active)
        if (activeBudget) {
          resetAdd({ budget_id: activeBudget.id, source: '', add_amount: '' })
        }
      }
    } catch {
      // ignore
    }
  }, [resetAdd])

  useEffect(() => {
    fetchBudgets()
  }, [fetchBudgets])

  const onSubmitNewBudget = async (data: BudgetForm) => {
    setIsLoading(true)
    try {
      const rawAmount = Number(data.total_amount.toString().replace(/\D/g, ''))
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          total_amount: rawAmount, 
          name: data.name || undefined,
          month: Number(data.month), 
          year: Number(data.year) 
        })
      })
      
      if (!res.ok) throw new Error('Failed')
      
      toast.success('Budget baru dibuat!')
      setIsAddingBudget(false)
      setValue('total_amount', '')
      setValue('name', '')
      fetchBudgets()
    } catch {
      toast.error('Gagal membuat budget')
    } finally {
      setIsLoading(false)
    }
  }

  const onAddIncome = async (data: AddIncomeForm) => {
    setIsAddingIncome(true)
    try {
      const rawAmount = Number(data.add_amount.toString().replace(/\D/g, ''))
      
      // Get the target budget to get its month/year
      const targetBudget = budgets.find(b => b.id === data.budget_id)
      if (!targetBudget) throw new Error('Target budget not found')
      
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          add_amount: rawAmount, 
          source: data.source, 
          month: targetBudget.month, 
          year: targetBudget.year 
        })
      })
      
      if (!res.ok) throw new Error('Failed')
      
      toast.success('Pemasukan ditambahkan ke Budget!')
      resetAdd({ budget_id: data.budget_id }) // clear form but keep budget
      fetchBudgets()
    } catch {
      toast.error('Gagal menambah pemasukan')
    } finally {
      setIsAddingIncome(false)
    }
  }
  
  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/budgets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus })
      })
      if (!res.ok) throw new Error()
      
      toast.success(!currentStatus ? 'Budget diaktifkan kembali' : 'Budget dinonaktifkan')
      fetchBudgets()
      router.refresh()
    } catch {
      toast.error('Gagal mengupdate status budget')
    }
  }

  const handleRename = async () => {
    if (!renameId || !renameName.trim()) return
    try {
      const res = await fetch(`/api/budgets/${renameId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: renameName.trim() })
      })
      if (!res.ok) throw new Error()
      
      toast.success('Nama budget diupdate')
      fetchBudgets()
      router.refresh()
    } catch {
      toast.error('Gagal rename budget')
    } finally {
      setRenameId(null)
      setRenameName('')
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/login', { method: 'DELETE' })
    router.push('/login')
    router.refresh()
  }

  const activeBudgets = budgets.filter(b => b.is_active)
  const archivedBudgets = budgets.filter(b => !b.is_active)
  const formatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })

  return (
    <div className="p-6 space-y-8 pb-24">
      <header>
        <h1 className="text-xl font-bold text-gray-900">Pengaturan</h1>
      </header>
      
      {/* ADD NEW BUDGET */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Daftar Budget</h2>
            <p className="text-sm text-gray-500">Kelola semua budget Anda</p>
          </div>
          <button 
             onClick={() => setIsAddingBudget(!isAddingBudget)}
             className="bg-primary-50 text-primary-600 p-2 rounded-full hover:bg-primary-100 transition-colors"
          >
             <Plus size={20} />
          </button>
        </div>
        
        {isAddingBudget && (
          <form onSubmit={handleSubmit(onSubmitNewBudget)} className="space-y-4 pt-4 border-t border-gray-100">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nama Budget (Opsional)</label>
              <input
                {...register('name')}
                type="text"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="Contoh: Budget Liburan"
              />
            </div>
            
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">Bulan</label>
                <select
                  {...register('month')}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                    <option key={m} value={m}>{new Date(2000, m - 1).toLocaleString('id-ID', { month: 'long' })}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">Tahun</label>
                <select
                  {...register('year')}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  {[0,1,2,3].map(offset => {
                    const y = now.getFullYear() + offset - 1
                    return <option key={y} value={y}>{y}</option>
                  })}
                </select>
              </div>
            </div>

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

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsAddingBudget(false)}
                className="w-1/3 flex justify-center py-3 px-4 border border-gray-200 rounded-lg text-gray-700 bg-white"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm font-medium text-white bg-gray-900 hover:bg-gray-800 disabled:opacity-50"
              >
                {isLoading ? 'Menyimpan...' : 'Simpan Budget Baru'}
              </button>
            </div>
          </form>
        )}
        
        <div className="space-y-4">
          <h3 className="text-xs uppercase font-bold text-gray-500">Budget Aktif</h3>
          {activeBudgets.length === 0 ? (
            <p className="text-sm text-gray-500 italic">Tidak ada budget aktif</p>
          ) : (
            activeBudgets.map(b => (
              <div key={b.id} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                 <div className="flex justify-between items-start mb-2">
                   <div>
                     <h4 className="font-bold text-gray-900 flex items-center gap-2">
                       {b.name}
                       <button onClick={() => { setRenameId(b.id); setRenameName(b.name); }} className="text-gray-400 hover:text-primary-600"><Edit2 size={14} /></button>
                     </h4>
                     <p className="text-sm font-medium text-primary-600">{formatter.format(Number(b.total_amount))}</p>
                   </div>
                   <button 
                     onClick={() => handleToggleActive(b.id, b.is_active)}
                     className="text-gray-500 bg-white p-2 rounded-lg border shadow-sm flex items-center gap-1 text-xs font-semibold hover:bg-gray-50"
                   >
                     <Archive size={14} /> Arsipkan
                   </button>
                 </div>
              </div>
            ))
          )}
        </div>
        
        {archivedBudgets.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <h3 className="text-xs uppercase font-bold text-gray-500">Budget Diarsipkan</h3>
            {archivedBudgets.map(b => (
              <div key={b.id} className="bg-gray-50 p-4 rounded-xl border border-gray-200 opacity-60 grayscale">
                 <div className="flex justify-between items-center">
                   <div>
                     <h4 className="font-bold text-gray-900">{b.name}</h4>
                     <p className="text-xs font-medium text-gray-600">{formatter.format(Number(b.total_amount))}</p>
                   </div>
                   <button 
                     onClick={() => handleToggleActive(b.id, b.is_active)}
                     className="text-gray-700 bg-white p-2 text-xs font-bold rounded-lg border shadow-sm flex items-center gap-1"
                   >
                     <ArchiveRestore size={14} /> Aktifkan
                   </button>
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Tambah Pemasukan</h2>
          <p className="text-sm text-gray-500">Dapat uang tambahan? Tambahkan ke budget tertentu.</p>
        </div>

        <form onSubmit={handleSubmitAdd(onAddIncome)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Pilih Budget</label>
            <select
              {...registerAdd('budget_id')}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-3 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="">-- Pilih Budget --</option>
              {activeBudgets.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            {errorsAdd.budget_id && <p className="mt-1 text-sm text-red-500">{errorsAdd.budget_id.message}</p>}
          </div>

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
            <label className="block text-sm font-medium text-gray-700">Nominal Penambah Budget</label>
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
            disabled={isAddingIncome || activeBudgets.length === 0}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
          >
            {isAddingIncome ? 'Menambahkan...' : 'Tambah ke Budget'}
          </button>
        </form>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-danger-500 font-medium p-2 hover:bg-danger-50 rounded-lg transition-colors w-full justify-center bg-white border border-danger-200"
        >
          <LogOut size={20} />
          Keluar (Logout)
        </button>
      </div>
      
      {/* Rename Modal */}
      <Modal isOpen={!!renameId} onClose={() => setRenameId(null)} title="Ubah Nama Budget">
        <div className="space-y-4">
          <input
            autoFocus
            type="text"
            value={renameName}
            onChange={(e) => setRenameName(e.target.value)}
            placeholder="Nama Budget"
            className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 focus:ring-1 focus:ring-primary-500"
          />
          <div className="flex gap-2">
            <button type="button" onClick={() => setRenameId(null)} className="flex-1 py-3 text-gray-500 font-medium bg-gray-100 rounded-lg">Batal</button>
            <button type="button" onClick={handleRename} disabled={!renameName.trim()} className="flex-1 py-3 bg-primary-600 text-white rounded-lg font-medium disabled:opacity-50">
              Simpan
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
