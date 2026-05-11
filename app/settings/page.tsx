'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { LogOut, Plus, Edit2, Archive, ArchiveRestore, Trash2, History, Wallet, Star } from 'lucide-react'
import { Modal } from '@/components/Modal'

const budgetSchema = z.object({ name: z.string().optional(), total_amount: z.string().min(1, 'Budget harus diisi'), month: z.number().min(1).max(12), year: z.number().min(2020) })
const addIncomeSchema = z.object({ add_amount: z.string().min(1, 'Nominal harus diisi'), source: z.string().min(1, 'Sumber pemasukan harus diisi'), budget_id: z.string().min(1, 'Pilih budget') })
type BudgetForm = z.infer<typeof budgetSchema>
type AddIncomeForm = z.infer<typeof addIncomeSchema>
type Income = { id: string; source: string; amount: string; created_at: string }
type Budget = { id: string; name: string; total_amount: string; is_active: boolean; is_primary: boolean; month: number; year: number; created_at: string }

const n = { fontFamily: 'var(--font-nunito), sans-serif' }
const warmBg = 'rgba(232,168,124,0.06)'
const warmBorder = 'rgba(232,168,124,0.15)'

export default function SettingsPage() {
  const router = useRouter()
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [incomes, setIncomes] = useState<Income[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAddingIncome, setIsAddingIncome] = useState(false)
  const [renameId, setRenameId] = useState<string | null>(null)
  const [renameName, setRenameName] = useState('')
  const [isAddingBudget, setIsAddingBudget] = useState(false)
  const [editIncomeId, setEditIncomeId] = useState<string | null>(null)
  const [editIncomeSource, setEditIncomeSource] = useState('')
  const [editIncomeAmount, setEditIncomeAmount] = useState('')
  const [deleteIncomeId, setDeleteIncomeId] = useState<string | null>(null)
  const now = new Date()

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<BudgetForm>({ resolver: zodResolver(budgetSchema), defaultValues: { month: now.getMonth() + 1, year: now.getFullYear() } })
  const { register: registerAdd, handleSubmit: handleSubmitAdd, reset: resetAdd, watch: watchAdd, formState: { errors: errorsAdd } } = useForm<AddIncomeForm>({ resolver: zodResolver(addIncomeSchema) })
  const selectedBudgetId = watchAdd('budget_id')

  const fetchIncomes = useCallback(async (budgetId: string) => {
    if (!budgetId) return
    try { const json = await (await fetch(`/api/incomes?budget_id=${budgetId}`)).json(); if (json.incomes) setIncomes(json.incomes) } catch {}
  }, [])

  const fetchBudgets = useCallback(async () => {
    try {
      const json = await (await fetch(`/api/budgets?list=all`)).json()
      if (json.budgets) {
        setBudgets(json.budgets)
        const ab = json.budgets.find((b: Budget) => b.is_primary) || json.budgets.find((b: Budget) => b.is_active)
        if (ab && !selectedBudgetId) { resetAdd({ budget_id: ab.id, source: '', add_amount: '' }); fetchIncomes(ab.id) }
      }
    } catch {}
  }, [resetAdd, selectedBudgetId, fetchIncomes])

  useEffect(() => { fetchBudgets() }, [fetchBudgets])
  useEffect(() => { if (selectedBudgetId) fetchIncomes(selectedBudgetId) }, [selectedBudgetId, fetchIncomes])

  const onSubmitNewBudget = async (data: BudgetForm) => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/budgets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ total_amount: Number(data.total_amount.toString().replace(/\D/g, '')), name: data.name || undefined, month: Number(data.month), year: Number(data.year) }) })
      if (!res.ok) throw new Error()
      toast.success('Budget baru dibuat! 🎉'); setIsAddingBudget(false); setValue('total_amount', ''); setValue('name', ''); fetchBudgets()
    } catch { toast.error('Gagal membuat budget') } finally { setIsLoading(false) }
  }

  const onAddIncome = async (data: AddIncomeForm) => {
    setIsAddingIncome(true)
    try {
      const res = await fetch('/api/incomes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: Number(data.add_amount.toString().replace(/\D/g, '')), source: data.source, budget_id: data.budget_id }) })
      if (!res.ok) throw new Error()
      toast.success('Pemasukan ditambahkan! 💰'); resetAdd({ budget_id: data.budget_id }); fetchIncomes(data.budget_id); fetchBudgets()
    } catch { toast.error('Gagal menambah pemasukan') } finally { setIsAddingIncome(false) }
  }

  const handleToggleActive = async (id: string, cur: boolean) => {
    try {
      const res = await fetch(`/api/budgets/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: !cur }) })
      if (!res.ok) throw new Error()
      toast.success(!cur ? 'Budget diaktifkan ✨' : 'Budget diarsipkan'); fetchBudgets(); router.refresh()
    } catch { toast.error('Gagal mengupdate') }
  }

  const handleRename = async () => {
    if (!renameId || !renameName.trim()) return
    try {
      const res = await fetch(`/api/budgets/${renameId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: renameName.trim() }) })
      if (!res.ok) throw new Error()
      toast.success('Nama diupdate ✨'); fetchBudgets(); router.refresh()
    } catch { toast.error('Gagal rename') } finally { setRenameId(null); setRenameName('') }
  }

  const handleSetPrimary = async (id: string) => {
    try {
      const res = await fetch(`/api/budgets/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_primary: true }) })
      if (!res.ok) throw new Error()
      toast.success('Ditetapkan sebagai Utama ⭐'); fetchBudgets(); router.refresh()
    } catch { toast.error('Gagal menetapkan') }
  }

  const handleEditIncome = async () => {
    if (!editIncomeId || !editIncomeSource.trim() || !editIncomeAmount) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/incomes/${editIncomeId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ source: editIncomeSource.trim(), amount: Number(editIncomeAmount.replace(/\D/g, '')) }) })
      if (!res.ok) throw new Error()
      toast.success('Pemasukan diperbarui ✨'); if (selectedBudgetId) fetchIncomes(selectedBudgetId); fetchBudgets(); setEditIncomeId(null)
    } catch { toast.error('Gagal memperbarui') } finally { setIsLoading(false) }
  }

  const handleDeleteIncome = async () => {
    if (!deleteIncomeId) return; setIsLoading(true)
    try {
      const res = await fetch(`/api/incomes/${deleteIncomeId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Pemasukan dihapus 🗑️'); if (selectedBudgetId) fetchIncomes(selectedBudgetId); fetchBudgets(); setDeleteIncomeId(null)
    } catch { toast.error('Gagal menghapus') } finally { setIsLoading(false) }
  }

  const handleLogout = async () => { await fetch('/api/auth/login', { method: 'DELETE' }); router.push('/login'); router.refresh() }

  const activeBudgets = budgets.filter(b => b.is_active)
  const archivedBudgets = budgets.filter(b => !b.is_active)
  const fmt = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })

  const inputCls = "block w-full rounded-2xl border-2 border-primary-100 px-4 py-3 focus:outline-none transition-all"

  return (
    <div className="p-6 space-y-6 pb-28 animate-fadeInUp">
      <header><h1 className="text-xl font-extrabold" style={{ ...n, color: '#3D2C2E' }}>Pengaturan ⚙️</h1></header>

      {/* BUDGET LIST */}
      <div className="glass-card-strong rounded-3xl p-6 space-y-5">
        <div className="flex justify-between items-center">
          <div><h2 className="text-lg font-bold" style={{ ...n, color: '#3D2C2E' }}>Daftar Budget</h2><p className="text-sm text-[#8B7E74]">Kelola semua budget kamu</p></div>
          <button onClick={() => setIsAddingBudget(!isAddingBudget)} className="p-2.5 rounded-2xl press-effect" style={{ background: 'rgba(232,168,124,0.12)', color: '#D4845A' }}><Plus size={20} /></button>
        </div>

        {isAddingBudget && (
          <form onSubmit={handleSubmit(onSubmitNewBudget)} className="space-y-4 pt-4 animate-bounceIn" style={{ borderTop: `1px solid ${warmBorder}` }}>
            <div><label className="block text-xs font-bold text-[#8B7E74] uppercase mb-1.5" style={n}>Nama (Opsional)</label><input {...register('name')} type="text" className={inputCls} style={{ background: warmBg }} placeholder="Ex: Budget Liburan" /></div>
            <div className="flex gap-2">
              <div className="flex-1"><label className="block text-xs font-bold text-[#8B7E74] uppercase mb-1.5" style={n}>Bulan</label><select {...register('month')} className={inputCls} style={{ background: warmBg }}>{[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>{new Date(2000, m-1).toLocaleString('id-ID', { month: 'long' })}</option>)}</select></div>
              <div className="flex-1"><label className="block text-xs font-bold text-[#8B7E74] uppercase mb-1.5" style={n}>Tahun</label><select {...register('year')} className={inputCls} style={{ background: warmBg }}>{[0,1,2,3].map(o => { const y = now.getFullYear()+o-1; return <option key={y} value={y}>{y}</option> })}</select></div>
            </div>
            <div><label className="block text-xs font-bold text-[#8B7E74] uppercase mb-1.5" style={n}>Total Budget (Rp)</label><input {...register('total_amount', { onChange: (e) => { const r = e.target.value.replace(/\D/g, ''); e.target.value = r ? new Intl.NumberFormat('id-ID').format(Number(r)) : '' } })} type="text" inputMode="numeric" className={inputCls} style={{ background: warmBg }} placeholder="5.000.000" />{errors.total_amount && <p className="mt-1 text-sm text-danger-500">{errors.total_amount.message}</p>}</div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setIsAddingBudget(false)} className="w-1/3 py-3 rounded-2xl font-semibold press-effect" style={{ ...n, background: 'rgba(232,168,124,0.1)', color: '#8B7E74' }}>Batal</button>
              <button type="submit" disabled={isLoading} className="flex-1 py-3 rounded-2xl font-bold text-white disabled:opacity-50 press-effect" style={{ ...n, background: 'linear-gradient(135deg, #3D2C2E, #5A4345)' }}>{isLoading ? 'Menyimpan...' : 'Simpan Budget Baru ✨'}</button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          <h3 className="text-xs uppercase font-bold text-[#B0A59D]" style={n}>Budget Aktif</h3>
          {activeBudgets.length === 0 ? <p className="text-sm text-[#B0A59D] italic">Tidak ada budget aktif</p> : activeBudgets.map(b => (
            <div key={b.id} className="p-4 rounded-2xl" style={{ background: warmBg, border: `1px solid ${warmBorder}` }}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-bold flex items-center gap-2" style={{ ...n, color: '#3D2C2E' }}>{b.name}{b.is_primary && <Star size={14} className="fill-warning-500 text-warning-500" />}<button onClick={() => { setRenameId(b.id); setRenameName(b.name) }} className="text-[#B0A59D] hover:text-primary-600"><Edit2 size={14} /></button></h4>
                  <p className="text-sm font-semibold text-primary-600">{fmt.format(Number(b.total_amount))}</p>
                </div>
                <div className="flex gap-1.5">
                  {!b.is_primary && <button onClick={() => handleSetPrimary(b.id)} className="px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 press-effect" style={{ background: 'rgba(255,255,255,0.8)', border: `1px solid ${warmBorder}`, color: '#8B7E74' }}><Star size={12} /> Utama</button>}
                  <button onClick={() => handleToggleActive(b.id, b.is_active)} className="px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 press-effect" style={{ background: 'rgba(255,255,255,0.8)', border: `1px solid ${warmBorder}`, color: '#8B7E74' }}><Archive size={12} /> Arsip</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {archivedBudgets.length > 0 && (
          <div className="space-y-3 pt-4" style={{ borderTop: `1px solid ${warmBorder}` }}>
            <h3 className="text-xs uppercase font-bold text-[#B0A59D]" style={n}>Diarsipkan</h3>
            {archivedBudgets.map(b => (
              <div key={b.id} className="p-4 rounded-2xl opacity-50 grayscale" style={{ background: warmBg, border: `1px solid ${warmBorder}` }}>
                <div className="flex justify-between items-center">
                  <div><h4 className="font-bold" style={{ ...n, color: '#3D2C2E' }}>{b.name}</h4><p className="text-xs font-semibold text-[#8B7E74]">{fmt.format(Number(b.total_amount))}</p></div>
                  <button onClick={() => handleToggleActive(b.id, b.is_active)} className="px-2.5 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1 press-effect" style={{ background: 'rgba(255,255,255,0.8)', border: `1px solid ${warmBorder}`, color: '#8B7E74' }}><ArchiveRestore size={12} /> Aktifkan</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* INCOME */}
      <div className="glass-card-strong rounded-3xl p-6 space-y-5">
        <div><h2 className="text-lg font-bold" style={{ ...n, color: '#3D2C2E' }}>Pemasukan 💰</h2><p className="text-sm text-[#8B7E74]">Kelola uang masuk di budget tertentu.</p></div>
        <form onSubmit={handleSubmitAdd(onAddIncome)} className="space-y-4 pb-5" style={{ borderBottom: `1px solid ${warmBorder}` }}>
          <div><label className="block text-xs font-bold text-[#8B7E74] uppercase mb-1.5" style={n}>Pilih Budget</label><div className="relative"><select {...registerAdd('budget_id')} className={inputCls + ' appearance-none'} style={{ background: warmBg }}><option value="">-- Pilih Budget --</option>{activeBudgets.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select><div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#B0A59D]"><Wallet size={16} /></div></div>{errorsAdd.budget_id && <p className="mt-1 text-sm text-danger-500">{errorsAdd.budget_id.message}</p>}</div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-bold text-[#8B7E74] uppercase mb-1.5" style={n}>Sumber</label><input {...registerAdd('source')} type="text" className={inputCls} style={{ background: warmBg }} placeholder="ex: Gaji" />{errorsAdd.source && <p className="mt-1 text-sm text-danger-500">{errorsAdd.source.message}</p>}</div>
            <div><label className="block text-xs font-bold text-[#8B7E74] uppercase mb-1.5" style={n}>Nominal</label><input {...registerAdd('add_amount', { onChange: (e) => { const r = e.target.value.replace(/\D/g, ''); e.target.value = r ? new Intl.NumberFormat('id-ID').format(Number(r)) : '' } })} type="text" inputMode="numeric" className={inputCls} style={{ background: warmBg }} placeholder="500.000" />{errorsAdd.add_amount && <p className="mt-1 text-sm text-danger-500">{errorsAdd.add_amount.message}</p>}</div>
          </div>
          <button type="submit" disabled={isAddingIncome || activeBudgets.length === 0} className="w-full py-3 rounded-2xl font-bold text-white disabled:opacity-50 press-effect" style={{ ...n, background: 'linear-gradient(135deg, #E8A87C, #D4845A)', boxShadow: '0 4px 16px rgba(212,132,90,0.25)' }}>{isAddingIncome ? 'Menambahkan...' : 'Simpan Pemasukan ✨'}</button>
        </form>

        <div className="space-y-3">
          <h3 className="text-sm font-bold flex items-center gap-2" style={{ ...n, color: '#3D2C2E' }}><History size={16} className="text-primary-500" />Riwayat Pemasukan</h3>
          <div className="space-y-2">
            {incomes.length > 0 ? incomes.map(inc => (
              <div key={inc.id} className="flex items-center justify-between p-3.5 rounded-2xl" style={{ background: warmBg, border: `1px solid ${warmBorder}` }}>
                <div><p className="font-bold" style={{ ...n, color: '#3D2C2E' }}>{inc.source}</p><p className="text-xs font-semibold text-primary-600">{fmt.format(Number(inc.amount))}</p><p className="text-[10px] text-[#B0A59D]">{new Date(inc.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p></div>
                <div className="flex gap-1"><button onClick={() => { setEditIncomeId(inc.id); setEditIncomeSource(inc.source); setEditIncomeAmount(new Intl.NumberFormat('id-ID').format(Number(inc.amount))) }} className="p-2 text-[#B0A59D] hover:text-primary-600"><Edit2 size={15} /></button><button onClick={() => setDeleteIncomeId(inc.id)} className="p-2 text-[#B0A59D] hover:text-danger-500"><Trash2 size={15} /></button></div>
              </div>
            )) : (
              <div className="text-center py-6 rounded-2xl" style={{ background: warmBg, border: `1px dashed ${warmBorder}` }}><p className="text-xs text-[#B0A59D] italic">Belum ada riwayat pemasukan 📭</p></div>
            )}
          </div>
        </div>
      </div>

      {/* Logout */}
      <button onClick={handleLogout} className="flex items-center gap-2 font-bold p-3.5 rounded-2xl transition-all w-full justify-center press-effect" style={{ ...n, background: 'rgba(224,122,122,0.08)', border: '1px solid rgba(224,122,122,0.2)', color: '#CC5F5F' }}><LogOut size={20} />Keluar (Logout)</button>

      {/* Rename Modal */}
      <Modal isOpen={!!renameId} onClose={() => setRenameId(null)} title="Ubah Nama Budget ✏️">
        <div className="space-y-4">
          <input autoFocus type="text" value={renameName} onChange={(e) => setRenameName(e.target.value)} placeholder="Nama Budget" className={inputCls} style={{ background: warmBg }} />
          <div className="flex gap-2">
            <button type="button" onClick={() => setRenameId(null)} className="flex-1 py-3 font-semibold rounded-2xl press-effect" style={{ ...n, background: 'rgba(232,168,124,0.1)', color: '#8B7E74' }}>Batal</button>
            <button type="button" onClick={handleRename} disabled={!renameName.trim()} className="flex-1 py-3 text-white rounded-2xl font-bold disabled:opacity-50 press-effect" style={{ ...n, background: 'linear-gradient(135deg, #E8A87C, #D4845A)' }}>Simpan</button>
          </div>
        </div>
      </Modal>

      {/* Edit Income Modal */}
      <Modal isOpen={!!editIncomeId} onClose={() => setEditIncomeId(null)} title="Edit Pemasukan ✏️">
        <div className="space-y-4">
          <div><label className="block text-xs font-bold text-[#8B7E74] uppercase mb-1.5" style={n}>Sumber</label><input autoFocus type="text" value={editIncomeSource} onChange={(e) => setEditIncomeSource(e.target.value)} className={inputCls} style={{ background: warmBg }} /></div>
          <div><label className="block text-xs font-bold text-[#8B7E74] uppercase mb-1.5" style={n}>Nominal</label><input type="text" inputMode="numeric" value={editIncomeAmount} onChange={(e) => { const r = e.target.value.replace(/\D/g, ''); setEditIncomeAmount(r ? new Intl.NumberFormat('id-ID').format(Number(r)) : '') }} className={inputCls} style={{ background: warmBg }} /></div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => setEditIncomeId(null)} className="flex-1 py-3 font-semibold rounded-2xl press-effect" style={{ ...n, background: 'rgba(232,168,124,0.1)', color: '#8B7E74' }}>Batal</button>
            <button type="button" onClick={handleEditIncome} disabled={isLoading || !editIncomeSource.trim() || !editIncomeAmount} className="flex-1 py-3 text-white rounded-2xl font-bold disabled:opacity-50 press-effect" style={{ ...n, background: 'linear-gradient(135deg, #E8A87C, #D4845A)' }}>{isLoading ? 'Menyimpan...' : 'Simpan'}</button>
          </div>
        </div>
      </Modal>

      {/* Delete Income Modal */}
      <Modal isOpen={!!deleteIncomeId} onClose={() => setDeleteIncomeId(null)} title="Hapus Pemasukan 🗑️">
        <div className="space-y-4">
          <p className="text-sm text-[#8B7E74]">Yakin mau hapus pemasukan ini? Saldo budget akan berkurang.</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => setDeleteIncomeId(null)} className="flex-1 py-3 font-semibold rounded-2xl press-effect" style={{ ...n, background: 'rgba(232,168,124,0.1)', color: '#8B7E74' }}>Batal</button>
            <button type="button" onClick={handleDeleteIncome} disabled={isLoading} className="flex-1 py-3 text-white rounded-2xl font-semibold disabled:opacity-50 press-effect" style={{ ...n, background: 'linear-gradient(135deg, #E07A7A, #CC5F5F)' }}>{isLoading ? 'Menghapus...' : 'Ya, Hapus'}</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
