'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { LogOut, Save, Plus, Edit2, Archive, ArchiveRestore, Trash2, History, Wallet } from 'lucide-react'
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

type Income = {
  id: string
  source: string
  amount: string
  created_at: string
}

type Budget = {
  id: string
  name: string
  total_amount: string
  is_active: boolean
  month: number
  year: number
  created_at: string
}

export default function SettingsPage() {
  const router = useRouter()
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [incomes, setIncomes] = useState<Income[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAddingIncome, setIsAddingIncome] = useState(false)
  
  const [renameId, setRenameId] = useState<string | null>(null)
  const [renameName, setRenameName] = useState('')
  
  const [isAddingBudget, setIsAddingBudget] = useState(false)

  // Edit Income State
  const [editIncomeId, setEditIncomeId] = useState<string | null>(null)
  const [editIncomeSource, setEditIncomeSource] = useState('')
  const [editIncomeAmount, setEditIncomeAmount] = useState('')

  // Delete Income State
  const [deleteIncomeId, setDeleteIncomeId] = useState<string | null>(null)

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
    watch: watchAdd,
    formState: { errors: errorsAdd } 
  } = useForm<AddIncomeForm>({
    resolver: zodResolver(addIncomeSchema)
  })

  const selectedBudgetId = watchAdd('budget_id')

  const fetchIncomes = useCallback(async (budgetId: string) => {
    if (!budgetId) return
    try {
      const res = await fetch(`/api/incomes?budget_id=${budgetId}`)
      const json = await res.json()
      if (json.incomes) {
        setIncomes(json.incomes)
      }
    } catch {
      // ignore
    }
  }, [])

  const fetchBudgets = useCallback(async () => {
    try {
      const res = await fetch(`/api/budgets?list=all`)
      const json = await res.json()
      if (json.budgets) {
        setBudgets(json.budgets)
        
        const activeBudget = json.budgets.find((b: Budget) => b.is_active)
        if (activeBudget && !selectedBudgetId) { // Only set if not already set or if initially loading
          resetAdd({ budget_id: activeBudget.id, source: '', add_amount: '' })
          fetchIncomes(activeBudget.id)
        }
      }
    } catch {
      // ignore
    }
  }, [resetAdd, selectedBudgetId, fetchIncomes])

  useEffect(() => {
    fetchBudgets()
  }, [fetchBudgets])

  useEffect(() => {
    if (selectedBudgetId) {
      fetchIncomes(selectedBudgetId)
    }
  }, [selectedBudgetId, fetchIncomes])

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
      
      const targetBudget = budgets.find(b => b.id === data.budget_id)
      if (!targetBudget) throw new Error('Target budget not found')
      
      const res = await fetch('/api/incomes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: rawAmount, 
          source: data.source, 
          budget_id: data.budget_id 
        })
      })
      
      if (!res.ok) throw new Error('Failed')
      
      toast.success('Pemasukan ditambahkan!')
      resetAdd({ budget_id: data.budget_id }) 
      fetchIncomes(data.budget_id)
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

  const handleEditIncome = async () => {
    if (!editIncomeId || !editIncomeSource.trim() || !editIncomeAmount) return
    setIsLoading(true)
    try {
      const rawAmount = Number(editIncomeAmount.replace(/\D/g, ''))
      const res = await fetch(`/api/incomes/${editIncomeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          source: editIncomeSource.trim(), 
          amount: rawAmount 
        })
      })
      if (!res.ok) throw new Error()
      
      toast.success('Pemasukan diperbarui')
      if (selectedBudgetId) fetchIncomes(selectedBudgetId)
      fetchBudgets()
      setEditIncomeId(null)
    } catch {
      toast.error('Gagal memperbarui pemasukan')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteIncome = async () => {
    if (!deleteIncomeId) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/incomes/${deleteIncomeId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      
      toast.success('Pemasukan dihapus')
      if (selectedBudgetId) fetchIncomes(selectedBudgetId)
      fetchBudgets()
      setDeleteIncomeId(null)
    } catch {
      toast.error('Gagal menghapus pemasukan')
    } finally {
      setIsLoading(false)
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
      
      {/* DAFTAR BUDGET */}
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

      {/* TAMBAH & HISTORY PEMASUKAN */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Pemasukan</h2>
          <p className="text-sm text-gray-500">Kelola uang masuk di budget tertentu.</p>
        </div>

        <form onSubmit={handleSubmitAdd(onAddIncome)} className="space-y-4 border-b border-gray-100 pb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Pilih Budget</label>
            <div className="relative mt-1">
              <select
                {...registerAdd('budget_id')}
                className="block w-full rounded-md border border-gray-300 px-3 py-3 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 appearance-none bg-white"
              >
                <option value="">-- Pilih Budget --</option>
                {activeBudgets.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <Wallet size={16} />
              </div>
            </div>
            {errorsAdd.budget_id && <p className="mt-1 text-sm text-red-500">{errorsAdd.budget_id.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700">Sumber</label>
              <input
                {...registerAdd('source')}
                type="text"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-3 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="ex: Gaji"
              />
              {errorsAdd.source && <p className="mt-1 text-sm text-red-500">{errorsAdd.source.message}</p>}
            </div>
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700">Nominal</label>
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
                placeholder="500.000"
              />
              {errorsAdd.add_amount && <p className="mt-1 text-sm text-red-500">{errorsAdd.add_amount.message}</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={isAddingIncome || activeBudgets.length === 0}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
          >
            {isAddingIncome ? 'Menambahkan...' : 'Simpan Pemasukan'}
          </button>
        </form>

        {/* History Pemasukan */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <History size={16} className="text-primary-600" />
            Riwayat Pemasukan
          </h3>
          
          <div className="space-y-2">
            {incomes.length > 0 ? (
              incomes.map(income => (
                <div key={income.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <div>
                    <p className="font-semibold text-gray-900">{income.source}</p>
                    <p className="text-xs text-primary-600 font-medium">{formatter.format(Number(income.amount))}</p>
                    <p className="text-[10px] text-gray-400">{new Date(income.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setEditIncomeId(income.id)
                        setEditIncomeSource(income.source)
                        setEditIncomeAmount(new Intl.NumberFormat('id-ID').format(Number(income.amount)))
                      }}
                      className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => setDeleteIncomeId(income.id)}
                      className="p-2 text-gray-400 hover:text-danger-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <p className="text-xs text-gray-500 italic">Belum ada riwayat pemasukan {selectedBudgetId ? 'di budget ini' : ''}</p>
              </div>
            )}
          </div>
        </div>
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
      
      {/* Rename Budget Modal */}
      <Modal isOpen={!!renameId} onClose={() => setRenameId(null)} title="Ubah Nama Budget">
        <div className="space-y-4">
          <input
            autoFocus
            type="text"
            value={renameName}
            onChange={(e) => setRenameName(e.target.value)}
            placeholder="Nama Budget"
            className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 focus:ring-1 focus:ring-primary-500 outline-none"
          />
          <div className="flex gap-2">
            <button type="button" onClick={() => setRenameId(null)} className="flex-1 py-3 text-gray-500 font-medium bg-gray-100 rounded-lg">Batal</button>
            <button type="button" onClick={handleRename} disabled={!renameName.trim()} className="flex-1 py-3 bg-primary-600 text-white rounded-lg font-medium disabled:opacity-50">
              Simpan
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Income Modal */}
      <Modal isOpen={!!editIncomeId} onClose={() => setEditIncomeId(null)} title="Edit Pemasukan">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Sumber</label>
            <input
              autoFocus
              type="text"
              value={editIncomeSource}
              onChange={(e) => setEditIncomeSource(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 focus:ring-1 focus:ring-primary-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Nominal</label>
            <input
              type="text"
              inputMode="numeric"
              value={editIncomeAmount}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, '')
                setEditIncomeAmount(raw ? new Intl.NumberFormat('id-ID').format(Number(raw)) : '')
              }}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 focus:ring-1 focus:ring-primary-500 outline-none"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setEditIncomeId(null)} className="flex-1 py-3 text-gray-500 font-medium bg-gray-100 rounded-lg">Batal</button>
            <button type="button" onClick={handleEditIncome} disabled={isLoading || !editIncomeSource.trim() || !editIncomeAmount} className="flex-1 py-3 bg-primary-600 text-white rounded-lg font-medium disabled:opacity-50">
              {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Income Confirmation Modal */}
      <Modal isOpen={!!deleteIncomeId} onClose={() => setDeleteIncomeId(null)} title="Hapus Pemasukan">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Apakah Anda yakin ingin menghapus data pemasukan ini? Sisa saldo budget Anda akan berkurang sesuai nominal ini.</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => setDeleteIncomeId(null)} className="flex-1 py-3 text-gray-700 font-medium bg-gray-100 rounded-lg">Batal</button>
            <button type="button" onClick={handleDeleteIncome} disabled={isLoading} className="flex-1 py-3 bg-danger-600 text-white rounded-lg font-medium disabled:opacity-50">
              {isLoading ? 'Menghapus...' : 'Ya, Hapus'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
