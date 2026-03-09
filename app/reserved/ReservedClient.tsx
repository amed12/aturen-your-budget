'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { CheckCircle2, Circle, AlertCircle, Plus, Trash2 } from 'lucide-react'

type ReservedItem = {
  id: string
  name: string
  amount: string
  is_paid: boolean
}

export function ReservedClient() {
  const router = useRouter()
  const [items, setItems] = useState<ReservedItem[]>([])
  const [budgetId, setBudgetId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // New item form state
  const [isAdding, setIsAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newAmount, setNewAmount] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const now = new Date()
      const budgetRes = await fetch(`/api/budgets?month=${now.getMonth() + 1}&year=${now.getFullYear()}`)
      const budgetJson = await budgetRes.json()
      
      if (!budgetJson.budget) {
        setIsLoading(false)
        return
      }

      setBudgetId(budgetJson.budget.id)
      const res = await fetch(`/api/reserved?budget_id=${budgetJson.budget.id}`)
      const json = await res.json()
      setItems(json)
    } catch (e) {
      toast.error('Gagal memuat data reserved')
    } finally {
      setIsLoading(false)
    }
  }

  const togglePaid = async (item: ReservedItem) => {
    try {
      const res = await fetch(`/api/reserved/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_paid: !item.is_paid })
      })

      if (!res.ok) throw new Error()
      
      toast.success(item.is_paid ? 'Dibatalkan' : 'Ditandai sudah dibayar 💰')
      fetchData() // refresh list
    } catch (e) {
      toast.error('Gagal mengupdate')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus alokasi ini?')) return
    try {
      const res = await fetch(`/api/reserved/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Dihapus')
      fetchData()
    } catch (e) {
      toast.error('Gagal menghapus')
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!budgetId) {
      toast.error('Atur budget bulanan dulu di Settings')
      return
    }
    if (!newName || !newAmount) return

    try {
      const res = await fetch('/api/reserved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          budget_id: budgetId,
          name: newName,
          amount: Number(newAmount.replace(/\D/g, ''))
        })
      })

      if (!res.ok) throw new Error()
      
      toast.success('Alokasi ditambahkan')
      setNewName('')
      setNewAmount('')
      setIsAdding(false)
      fetchData()
    } catch (error) {
      toast.error('Gagal menambah')
    }
  }

  const formatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })

  if (isLoading) return <div className="p-6 text-center text-gray-500">Memuat...</div>

  if (!budgetId) {
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
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dana Wajib</h1>
          <p className="text-sm text-gray-500">Total: {formatter.format(totalReserved)}</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-primary-100 text-primary-700 p-2 rounded-full active:scale-95 transition-transform"
        >
          <Plus size={24} />
        </button>
      </header>

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
            <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-3 text-gray-500 font-medium">Batal</button>
            <button type="submit" disabled={!newName || !newAmount} className="flex-1 py-3 bg-primary-600 text-white rounded-lg font-medium disabled:opacity-50">Simpan</button>
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
                <div key={item.id} className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-orange-100 active:scale-[0.99] transition-transform">
                  <div className="flex items-center gap-4 flex-1" onClick={() => togglePaid(item)}>
                    <Circle size={24} className="text-gray-300" />
                    <div>
                      <p className="font-semibold text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">{formatter.format(Number(item.amount))}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-300 hover:text-danger-500">
                    <Trash2 size={18} />
                  </button>
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
                <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl opacity-75">
                  <CheckCircle2 size={24} className="text-success-500 flex-shrink-0" onClick={() => togglePaid(item)} />
                  <div className="flex-1 line-through text-gray-500">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm">{formatter.format(Number(item.amount))}</p>
                  </div>
                  <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-300 hover:text-danger-500">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {items.length === 0 && !isAdding && (
          <div className="text-center p-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <p className="text-gray-500">Belum ada dana wajib yang dialokasikan.</p>
          </div>
        )}
      </div>
    </div>
  )
}
