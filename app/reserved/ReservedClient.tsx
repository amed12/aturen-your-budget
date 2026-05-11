'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { CheckCircle2, Circle, AlertCircle, Plus, Trash2, Edit2, Wallet, ChevronDown } from 'lucide-react'
import { Modal } from '@/components/Modal'

type ReservedItem = { id: string; name: string; amount: string; is_paid: boolean }
type Budget = { id: string; name: string }

const nunito = { fontFamily: 'var(--font-nunito), sans-serif' }

export function ReservedClient() {
  const router = useRouter()
  const [items, setItems] = useState<ReservedItem[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmPayItem, setConfirmPayItem] = useState<ReservedItem | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => { fetchBudgets() }, [])
  useEffect(() => { if (selectedBudgetId) fetchItems(selectedBudgetId) }, [selectedBudgetId])

  async function fetchBudgets() {
    try {
      const budgetRes = await fetch(`/api/budgets/active`)
      const budgetJson = await budgetRes.json()
      if (!budgetJson.budgets || budgetJson.budgets.length === 0) { setIsLoading(false); return }
      setBudgets(budgetJson.budgets)
      const savedId = typeof window !== 'undefined' ? localStorage.getItem('last_selected_budget_id') : null
      const primary = budgetJson.budgets.find((b: any) => b.is_primary)
      if (savedId && budgetJson.budgets.find((b: any) => b.id === savedId)) setSelectedBudgetId(savedId)
      else setSelectedBudgetId(primary ? primary.id : budgetJson.budgets[0].id)
    } catch { toast.error('Gagal memuat budget'); setIsLoading(false) }
  }

  async function fetchItems(budgetId: string) {
    setIsLoading(true)
    try { setItems(await (await fetch(`/api/reserved?budget_id=${budgetId}`)).json()) }
    catch { toast.error('Gagal memuat data reserved') }
    finally { setIsLoading(false) }
  }

  const handleBudgetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value; setSelectedBudgetId(val)
    if (typeof window !== 'undefined') localStorage.setItem('last_selected_budget_id', val)
  }

  const togglePaid = async (item: ReservedItem) => {
    setIsUpdating(true)
    try {
      const res = await fetch(`/api/reserved/${item.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_paid: !item.is_paid }) })
      if (!res.ok) throw new Error()
      toast.success(item.is_paid ? 'Dibatalkan' : 'Dana wajib tercatat 💰')
      setConfirmPayItem(null); if (selectedBudgetId) fetchItems(selectedBudgetId)
    } catch { toast.error('Gagal mengupdate') } finally { setIsUpdating(false) }
  }

  const handleDelete = async () => {
    if (!deleteId) return; setIsDeleting(true)
    try {
      const res = await fetch(`/api/reserved/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Dihapus 🗑️'); setDeleteId(null); if (selectedBudgetId) fetchItems(selectedBudgetId)
    } catch { toast.error('Gagal menghapus') } finally { setIsDeleting(false) }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBudgetId) { toast.error('Pilih budget terlebih dahulu'); return }
    if (!newName || !newAmount) return
    try {
      const url = editId ? `/api/reserved/${editId}` : '/api/reserved'
      const payload: any = { name: newName, amount: Number(newAmount.replace(/\D/g, '')) }
      if (!editId) payload.budget_id = selectedBudgetId
      const res = await fetch(url, { method: editId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error()
      toast.success(editId ? 'Alokasi diperbarui ✨' : 'Alokasi ditambahkan ✨')
      setNewName(''); setNewAmount(''); setIsAdding(false); setEditId(null); fetchItems(selectedBudgetId)
    } catch { toast.error('Gagal menyimpan') }
  }

  const handleEdit = (item: ReservedItem) => {
    setNewName(item.name); setNewAmount(item.amount); setEditId(item.id); setIsAdding(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancelAddEdit = () => { setIsAdding(false); setEditId(null); setNewName(''); setNewAmount('') }
  const formatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })

  if (isLoading && items.length === 0) return <div className="p-6 text-center text-[#B0A59D]" style={nunito}>Memuat... ✨</div>

  if (budgets.length === 0) {
    return (
      <div className="p-6 text-center space-y-4 pt-20 animate-fadeInUp">
        <div className="text-4xl animate-float">💸</div>
        <p className="text-[#8B7E74]" style={nunito}>Kamu belum mengatur budget bulan ini.</p>
        <button onClick={() => router.push('/settings')} className="font-bold text-primary-600" style={nunito}>Ke Settings →</button>
      </div>
    )
  }

  const unpaidItems = items.filter(i => !i.is_paid)
  const paidItems = items.filter(i => i.is_paid)
  const totalReserved = items.reduce((acc, i) => acc + Number(i.amount), 0)

  return (
    <div className="p-6 space-y-5 pb-28 animate-fadeInUp">
      {/* Header */}
      <header className="glass-card rounded-2xl p-2.5 mb-1">
        <div className="flex-1 min-w-0">
          {budgets.length > 1 ? (
            <div className="relative inline-flex items-center max-w-[200px] w-full bg-primary-50/50 hover:bg-primary-50 rounded-xl pr-8 transition-colors border border-primary-100/50 group">
              <div className="absolute pl-2.5 text-[#B0A59D] pointer-events-none z-10"><Wallet size={16} /></div>
              <select value={selectedBudgetId || ''} onChange={handleBudgetChange} className="bg-transparent text-sm font-bold focus:outline-none cursor-pointer w-full py-2 pl-8 truncate border-none appearance-none relative z-10" style={{ ...nunito, color: '#3D2C2E' }}>
                {budgets.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <div className="absolute right-2 pointer-events-none text-[#B0A59D] group-hover:text-primary-600 z-10"><ChevronDown size={16} /></div>
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-3 pr-3 py-2 bg-primary-50/50 rounded-xl border border-primary-100/50 text-[#B0A59D] w-fit">
              <Wallet size={16} /><h1 className="text-sm font-bold truncate" style={{ ...nunito, color: '#3D2C2E' }}>{budgets[0]?.name}</h1>
            </div>
          )}
        </div>
      </header>

      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-xl font-extrabold" style={{ ...nunito, color: '#3D2C2E' }}>Dana Wajib 🔒</h1>
          <p className="text-sm text-[#8B7E74]">Total: {formatter.format(totalReserved)}</p>
        </div>
        <button onClick={() => { if (isAdding) handleCancelAddEdit(); else setIsAdding(true) }}
          className="p-2.5 rounded-2xl press-effect transition-all"
          style={{ background: 'linear-gradient(135deg, rgba(232,168,124,0.15), rgba(232,168,124,0.25))', color: '#D4845A' }}>
          <Plus size={22} />
        </button>
      </div>

      {/* Add Form */}
      {isAdding && (
        <form onSubmit={handleAdd} className="glass-card-strong rounded-3xl p-5 space-y-4 animate-bounceIn">
          <input autoFocus type="text" placeholder="Nama (ex: SPP Anak)" value={newName} onChange={e => setNewName(e.target.value)}
            className="w-full rounded-2xl px-4 py-3 border-2 border-primary-100 focus:outline-none" style={{ background: 'rgba(232,168,124,0.06)' }} />
          <input type="text" placeholder="Nominal (ex: 500.000)" value={newAmount} inputMode="numeric"
            onChange={e => { const raw = e.target.value.replace(/\D/g, ''); setNewAmount(raw ? new Intl.NumberFormat('id-ID').format(Number(raw)) : '') }}
            className="w-full rounded-2xl px-4 py-3 border-2 border-primary-100 focus:outline-none" style={{ background: 'rgba(232,168,124,0.06)' }} />
          <div className="flex gap-2">
            <button type="button" onClick={handleCancelAddEdit} className="flex-1 py-3 font-semibold rounded-2xl press-effect" style={{ ...nunito, background: 'rgba(232,168,124,0.1)', color: '#8B7E74' }}>Batal</button>
            <button type="submit" disabled={!newName || !newAmount} className="flex-1 py-3 text-white rounded-2xl font-bold disabled:opacity-50 press-effect" style={{ ...nunito, background: 'linear-gradient(135deg, #E8A87C, #D4845A)' }}>
              {editId ? 'Perbarui' : 'Simpan'}
            </button>
          </div>
        </form>
      )}

      {/* Lists */}
      <div className="space-y-5 animate-stagger">
        {unpaidItems.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#8B7E74]" style={nunito}>⏳ Belum Dibayar</h2>
            <div className="space-y-2">
              {unpaidItems.map(item => (
                <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl press-effect cursor-pointer animate-fadeInUp" style={{ background: 'rgba(242,197,124,0.08)', border: '1px solid rgba(242,197,124,0.2)' }}>
                  <div className="flex items-center gap-3.5 flex-1" onClick={() => setConfirmPayItem(item)}>
                    <Circle size={22} className="text-[#B0A59D]" />
                    <div>
                      <p className="font-bold" style={{ ...nunito, color: '#3D2C2E' }}>{item.name}</p>
                      <p className="text-sm text-[#8B7E74]">{formatter.format(Number(item.amount))}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5" style={{ borderLeft: '1px solid rgba(232,168,124,0.15)', paddingLeft: '8px', marginLeft: '8px' }}>
                    <button onClick={() => handleEdit(item)} className="p-2 text-[#B0A59D] hover:text-primary-600 transition-colors"><Edit2 size={16} /></button>
                    <button onClick={() => setDeleteId(item.id)} className="p-2 text-[#B0A59D] hover:text-danger-500 transition-colors"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {paidItems.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#B0A59D]" style={nunito}>✅ Sudah Dibayar</h2>
            <div className="space-y-2">
              {paidItems.map(item => (
                <div key={item.id} className="flex items-center gap-3.5 p-4 rounded-2xl opacity-65 cursor-pointer" style={{ background: 'rgba(133,189,166,0.08)', border: '1px solid rgba(133,189,166,0.15)' }}>
                  <CheckCircle2 size={22} className="text-success-500 flex-shrink-0" onClick={() => setConfirmPayItem(item)} />
                  <div className="flex-1 line-through text-[#B0A59D]" onClick={() => setConfirmPayItem(item)}>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm">{formatter.format(Number(item.amount))}</p>
                  </div>
                  <div className="flex gap-0.5" style={{ borderLeft: '1px solid rgba(133,189,166,0.15)', paddingLeft: '8px', marginLeft: '8px' }}>
                    <button onClick={() => handleEdit(item)} className="p-2 text-[#B0A59D] hover:text-primary-600"><Edit2 size={16} /></button>
                    <button onClick={() => setDeleteId(item.id)} className="p-2 text-[#B0A59D] hover:text-danger-500"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {items.length === 0 && !isAdding && (
          <div className="text-center p-8 rounded-3xl animate-fadeInUp" style={{ background: 'rgba(232,168,124,0.06)', border: '1px dashed rgba(232,168,124,0.2)' }}>
            <div className="text-3xl mb-2">🔒</div>
            <p className="text-[#B0A59D]" style={nunito}>Belum ada dana wajib di budget ini.</p>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Hapus Dana Wajib 🗑️">
        <div className="space-y-4">
          <p className="text-sm text-[#8B7E74]">Yakin mau hapus alokasi dana wajib ini?</p>
          <div className="flex gap-2">
            <button onClick={() => setDeleteId(null)} className="flex-1 py-3 font-semibold rounded-2xl press-effect" style={{ ...nunito, background: 'rgba(232,168,124,0.1)', color: '#8B7E74' }}>Batal</button>
            <button onClick={handleDelete} disabled={isDeleting} className="flex-1 py-3 text-white rounded-2xl font-semibold disabled:opacity-50 press-effect" style={{ ...nunito, background: 'linear-gradient(135deg, #E07A7A, #CC5F5F)' }}>
              {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Pay Confirmation Modal */}
      <Modal isOpen={!!confirmPayItem} onClose={() => setConfirmPayItem(null)} title={confirmPayItem?.is_paid ? 'Batalkan Pembayaran' : 'Konfirmasi Pembayaran 💰'}>
        <div className="space-y-4">
          <div className="p-4 rounded-2xl text-sm text-[#8B7E74]" style={{ background: 'rgba(232,168,124,0.06)', border: '1px solid rgba(232,168,124,0.12)' }}>
            {confirmPayItem?.is_paid
              ? <p>Dana ini akan dikembalikan statusnya jadi belum dibayar.</p>
              : <p>Dana <strong>{confirmPayItem?.name}</strong> sebesar {formatter.format(Number(confirmPayItem?.amount || 0))} sudah dibayar? ✅</p>}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setConfirmPayItem(null)} className="flex-1 py-3 font-semibold rounded-2xl press-effect" style={{ ...nunito, background: 'rgba(232,168,124,0.1)', color: '#8B7E74' }}>Batal</button>
            <button onClick={() => confirmPayItem && togglePaid(confirmPayItem)} disabled={isUpdating} className="flex-1 py-3 text-white rounded-2xl font-bold disabled:opacity-50 press-effect" style={{ ...nunito, background: 'linear-gradient(135deg, #E8A87C, #D4845A)' }}>
              {isUpdating ? 'Memproses...' : 'Ya, Lanjutkan'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
