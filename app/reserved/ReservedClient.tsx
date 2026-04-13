'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { CheckCircle2, Circle, AlertCircle, Plus, Trash2, Edit2, Wallet } from 'lucide-react'
import { Modal } from '@/components/Modal'

type ReservedItem = {
  id: string
  name: string
  amount: string
  is_paid: boolean
}

type Budget = {
  id: string
  name: string
}

export function ReservedClient() {
  const router = useRouter()
  const [items, setItems] = useState<ReservedItem[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // New item form state
  const [isAdding, setIsAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  
  // Delete confirm state
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Paid confirm state
  const [confirmPayItem, setConfirmPayItem] = useState<ReservedItem | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    fetchBudgets()
  }, [])

  useEffect(() => {
    if (selectedBudgetId) {
      fetchItems(selectedBudgetId)
    }
  }, [selectedBudgetId])

  async function fetchBudgets() {
    try {
      const budgetRes = await fetch(`/api/budgets/active`)
      const budgetJson = await budgetRes.json()
      
      if (!budgetJson.budgets || budgetJson.budgets.length === 0) {
        setIsLoading(false)
        return
      }

      setBudgets(budgetJson.budgets)
      const primary = budgetJson.budgets.find((b: any) => b.is_primary)
      setSelectedBudgetId(primary ? primary.id : budgetJson.budgets[0].id)
    } catch {
      toast.error('Gagal memuat budget')
      setIsLoading(false)
    }
  }

  async function fetchItems(budgetId: string) {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/reserved?budget_id=${budgetId}`)
      const json = await res.json()
      setItems(json)
    } catch {
      toast.error('Gagal memuat data reserved')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBudgetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedBudgetId(e.target.value)
  }

  const togglePaid = async (item: ReservedItem) => {
    setIsUpdating(true)
    try {
      const res = await fetch(`/api/reserved/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_paid: !item.is_paid })
      })

      if (!res.ok) throw new Error()
      
      toast.success(item.is_paid ? 'Dibatalkan' : 'Pengeluaran wajib tercatat 💰')
      setConfirmPayItem(null)
      if (selectedBudgetId) fetchItems(selectedBudgetId)
    } catch {
      toast.error('Gagal mengupdate')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/reserved/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Dihapus')
      setDeleteId(null)
      if (selectedBudgetId) fetchItems(selectedBudgetId)
    } catch {
      toast.error('Gagal menghapus')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBudgetId) {
      toast.error('Pilih budget terlebih dahulu')
      return
    }
    if (!newName || !newAmount) return

    try {
      const url = editId ? `/api/reserved/${editId}` : '/api/reserved'
      const method = editId ? 'PATCH' : 'POST'
      
      const payload: { name: string, amount: number, budget_id?: string } = {
        name: newName,
        amount: Number(newAmount.replace(/\D/g, ''))
      }
      
      if (!editId) {
        payload.budget_id = selectedBudgetId
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error()
      
      toast.success(editId ? 'Alokasi diperbarui' : 'Alokasi ditambahkan')
      setNewName('')
      setNewAmount('')
      setIsAdding(false)
      setEditId(null)
      fetchItems(selectedBudgetId)
    } catch {
      toast.error('Gagal menyimpan')
    }
  }

  const handleEdit = (item: ReservedItem) => {
    setNewName(item.name)
    setNewAmount(item.amount)
    setEditId(item.id)
    setIsAdding(true)
    // scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancelAddEdit = () => {
    setIsAdding(false)
    setEditId(null)
    setNewName('')
    setNewAmount('')
  }

  const formatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })

  if (isLoading && items.length === 0) return <div className="p-6 text-center text-gray-500">Memuat...</div>

  if (budgets.length === 0) {
    return (
      <div className="p-6 text-center space-y-4 pt-20">
        <AlertCircle className="mx-auto text-warning-500" size={48} />
        <p className="text-gray-600">Kamu belum mengatur budget bulan ini.</p>
        <button onClick={() => router.push('/settings')} className="text-primary-600 font-medium">Ke Settings</button>
      </div>
    )
  }

  const unpaidItems = items.filter(i => !i.is_paid)
  const paidItems = items.filter(i => i.is_paid)
  const totalReserved = items.reduce((acc, i) => acc + Number(i.amount), 0)

  return (
    <div className="p-6 space-y-6 pb-24">
      <header className="flex justify-between items-center bg-white p-2 rounded-2xl shadow-sm border border-gray-100 mb-2">
        <div className="flex-1 min-w-0 pr-2">
          {budgets.length > 1 ? (
             <div className="flex items-center gap-2 pl-2 text-gray-400">
             <Wallet size={16} className="shrink-0" />
             <select 
               value={selectedBudgetId || ''} 
               onChange={handleBudgetChange}
               className="bg-transparent text-sm font-bold text-gray-900 hover:text-primary-600 focus:outline-none cursor-pointer w-full truncate border-none appearance-none"
             >
               {budgets.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
             </select>
           </div>
          ) : (
            <div className="flex items-center gap-2 pl-2 text-gray-400">
               <Wallet size={16} className="shrink-0" />
               <h1 className="text-sm font-bold text-gray-900 truncate">{budgets[0]?.name}</h1>
            </div>
          )}
        </div>
      </header>

      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dana Wajib</h1>
          <p className="text-sm text-gray-500">Total: {formatter.format(totalReserved)}</p>
        </div>
        <button 
          onClick={() => {
            if (isAdding) handleCancelAddEdit()
            else setIsAdding(true)
          }}
          className="bg-primary-100 text-primary-700 p-2 rounded-full active:scale-95 transition-transform"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Add Form */}
      {isAdding && (
        <form onSubmit={handleAdd} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <input
            autoFocus
            type="text"
            placeholder="Nama (ex: SPP Anak)"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            className="w-full bg-gray-50 border-none rounded-lg px-4 py-3 focus:ring-1 focus:ring-primary-500"
          />
          <input
            type="text"
            placeholder="Nominal (ex: 500.000)"
            value={newAmount}
            inputMode="numeric"
            onChange={e => {
              const raw = e.target.value.replace(/\D/g, '')
              setNewAmount(raw ? new Intl.NumberFormat('id-ID').format(Number(raw)) : '')
            }}
            className="w-full bg-gray-50 border-none rounded-lg px-4 py-3 focus:ring-1 focus:ring-primary-500"
          />
          <div className="flex gap-2">
            <button type="button" onClick={handleCancelAddEdit} className="flex-1 py-3 text-gray-500 font-medium">Batal</button>
            <button type="submit" disabled={!newName || !newAmount} className="flex-1 py-3 bg-primary-600 text-white rounded-lg font-medium disabled:opacity-50">
              {editId ? 'Perbarui' : 'Simpan'}
            </button>
          </div>
        </form>
      )}

      {/* Lists */}
      <div className="space-y-6">
        {unpaidItems.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Belum Dibayar</h2>
            <div className="space-y-2">
              {unpaidItems.map(item => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-orange-100 active:scale-[0.99] transition-transform cursor-pointer">
                  <div className="flex items-center gap-4 flex-1" onClick={() => setConfirmPayItem(item)}>
                    <Circle size={24} className="text-gray-300" />
                    <div>
                      <p className="font-semibold text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">{formatter.format(Number(item.amount))}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 border-l border-gray-100 pl-2 ml-2">
                    <button onClick={() => handleEdit(item)} className="p-2 text-gray-300 hover:text-primary-600">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => setDeleteId(item.id)} className="p-2 text-gray-300 hover:text-danger-500">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {paidItems.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Sudah Dibayar</h2>
            <div className="space-y-2">
              {paidItems.map(item => (
                <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl opacity-75 cursor-pointer">
                  <CheckCircle2 size={24} className="text-success-500 flex-shrink-0" onClick={() => setConfirmPayItem(item)} />
                  <div className="flex-1 line-through text-gray-500" onClick={() => setConfirmPayItem(item)}>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm">{formatter.format(Number(item.amount))}</p>
                  </div>
                  <div className="flex gap-1 border-l border-gray-200 pl-2 ml-2">
                    <button onClick={() => handleEdit(item)} className="p-2 text-gray-400 hover:text-primary-600">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => setDeleteId(item.id)} className="p-2 text-gray-400 hover:text-danger-500">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {items.length === 0 && !isAdding && (
          <div className="text-center p-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <p className="text-gray-500">Belum ada dana wajib yang dialokasikan di budget ini.</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Hapus Dana Wajib">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Apakah Anda yakin ingin menghapus alokasi dana wajib ini?</p>
          <div className="flex gap-2">
            <button 
              onClick={() => setDeleteId(null)} 
              className="flex-1 py-3 text-gray-700 font-medium bg-gray-100 rounded-lg"
            >
              Batal
            </button>
            <button 
              onClick={handleDelete} 
              disabled={isDeleting}
              className="flex-1 py-3 bg-danger-600 text-white rounded-lg font-medium outline-none focus:ring-2 focus:ring-offset-2 focus:ring-danger-500 disabled:opacity-50"
            >
              {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Pay Confirmation Modal */}
      <Modal 
        isOpen={!!confirmPayItem} 
        onClose={() => setConfirmPayItem(null)} 
        title={confirmPayItem?.is_paid ? "Batalkan Pembayaran" : "Tandatangani Pembayaran"}
      >
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-600 border border-gray-100">
            {confirmPayItem?.is_paid ? (
              <p>Dana ini akan dikembalikan statusnya jadi belum dibayar. Sisa budget utama aman tidak terpengaruh.</p>
            ) : (
              <p>Dana <strong>{confirmPayItem?.name}</strong> sebesar {formatter.format(Number(confirmPayItem?.amount || 0))} ini sudah berhasil dibayar? Data akan terekam ke database tapi tidak mengurangi &quot;Sisa Budget Aman&quot; di depan.</p>
            )}
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setConfirmPayItem(null)} 
              className="flex-1 py-3 text-gray-700 font-medium bg-gray-100 rounded-lg"
            >
              Batal
            </button>
            <button 
              onClick={() => confirmPayItem && togglePaid(confirmPayItem)} 
              disabled={isUpdating}
              className="flex-1 py-3 bg-primary-600 text-white rounded-lg font-medium disabled:opacity-50"
            >
              {isUpdating ? 'Memproses...' : 'Ya, Lanjutkan'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
