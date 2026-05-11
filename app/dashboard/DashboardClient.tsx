'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { PlusCircle, Trash2, Edit2, AlertTriangle, Wallet, TrendingUp, CalendarDays, ShieldCheck, ShieldAlert, ShieldX, Settings, ChevronDown, ArrowRight, PieChart } from 'lucide-react'
import { Modal } from '@/components/Modal'
import toast from 'react-hot-toast'

type Budget = { id: string; name: string; is_active: boolean }

type SpendingAdvice = {
  safe_daily: number; safe_weekly: number; today_spent: number
  this_week_spent: number; avg_daily_spent: number; remaining_days: number
  spending_status: 'safe' | 'warning' | 'danger'
}

type DashboardData = {
  total_budget: number; total_reserved: number; unpaid_reserved: number
  total_spent: number; remaining_budget: number
  top_category: { name: string; total: number } | null
  recent_expenses: Array<{ id: string; amount: number; note: string | null; category_name: string; date: string }>
  spending_advice: SpendingAdvice
}

const nunito = { fontFamily: 'var(--font-nunito), sans-serif' }

export function DashboardClient() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(null)
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchDashboard = useCallback(async (budgetIdToFetch?: string) => {
    setIsLoading(true)
    try {
      let currentBudgetId = budgetIdToFetch || selectedBudgetId
      const budgetRes = await fetch(`/api/budgets/active`)
      const budgetJson = await budgetRes.json()
      if (!budgetJson.budgets || budgetJson.budgets.length === 0) {
        setBudgets([]); setData(null); setIsLoading(false); return
      }
      setBudgets(budgetJson.budgets)
      if (!currentBudgetId || !budgetJson.budgets.find((b: any) => b.id === currentBudgetId)) {
        const savedId = typeof window !== 'undefined' ? localStorage.getItem('last_selected_budget_id') : null
        const primary = budgetJson.budgets.find((b: any) => b.is_primary)
        if (savedId && budgetJson.budgets.find((b: any) => b.id === savedId)) currentBudgetId = savedId
        else if (primary) currentBudgetId = primary.id
        else currentBudgetId = budgetJson.budgets[0].id
        setSelectedBudgetId(currentBudgetId)
      }
      if (currentBudgetId) {
        const dashboardRes = await fetch(`/api/dashboard?budget_id=${currentBudgetId}`)
        setData(await dashboardRes.json())
      }
    } catch (error) { console.error('Failed to load dashboard', error) }
    finally { setIsLoading(false) }
  }, [selectedBudgetId])

  useEffect(() => { fetchDashboard() }, [])

  const handleBudgetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value
    setSelectedBudgetId(id)
    if (typeof window !== 'undefined') localStorage.setItem('last_selected_budget_id', id)
    fetchDashboard(id)
  }

  const handleDeleteExpense = async () => {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/expenses/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Pengeluaran dihapus 🗑️')
      setDeleteId(null); fetchDashboard()
    } catch { toast.error('Gagal menghapus pengeluaran') }
    finally { setIsDeleting(false) }
  }

  if (isLoading && !data) {
    return (
      <div className="p-6 space-y-6 animate-stagger">
        <div className="flex justify-between items-center">
          <div className="space-y-2"><div className="h-6 w-28 skeleton-warm" /><div className="h-4 w-36 skeleton-warm" /></div>
          <div className="w-10 h-10 skeleton-warm rounded-full" />
        </div>
        <div className="glass-card rounded-3xl p-6 space-y-5">
          <div className="space-y-2"><div className="h-4 w-44 skeleton-warm" /><div className="h-10 w-40 skeleton-warm" /></div>
          <div className="h-3 w-full skeleton-warm rounded-full" />
        </div>
        {[1,2,3].map(i => <div key={i} className="glass-card rounded-2xl p-4 flex justify-between"><div className="space-y-2"><div className="h-3 w-20 skeleton-warm" /><div className="h-4 w-32 skeleton-warm" /></div><div className="h-5 w-24 skeleton-warm" /></div>)}
      </div>
    )
  }

  if (budgets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[75vh] p-6 space-y-8 animate-fadeInUp">
        <div className="text-center space-y-2">
          <div className="text-5xl mb-3 animate-float">💰</div>
          <h2 className="text-2xl font-extrabold" style={{ ...nunito, color: '#3D2C2E' }}>Selamat Datang! 👋</h2>
          <p className="text-[#8B7E74]">Mari kelola keuanganmu hanya dengan 3 langkah mudah.</p>
        </div>
        <div className="glass-card-strong rounded-3xl p-6 w-full space-y-5">
          {[
            { n: 1, t: 'Targetkan Budget', d: 'Tentukan batas pengeluaran agar uangmu tidak bablas.', active: true },
            { n: 2, t: 'Pisahkan Dana Wajib', d: 'Sisihkan untuk tagihan, cicilan, dan tabungan di awal.', active: false },
            { n: 3, t: 'Catat Secara Rutin', d: 'Catat setiap pengeluaran barumu di bawah 5 detik!', active: false },
          ].map(s => (
            <div key={s.n} className={`flex items-start gap-4 ${!s.active ? 'opacity-40' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 text-sm ${s.active ? 'gradient-warm text-white' : 'bg-primary-50 text-[#B0A59D]'}`} style={nunito}>{s.n}</div>
              <div><h3 className="font-bold" style={{ ...nunito, color: '#3D2C2E' }}>{s.t}</h3><p className="text-sm text-[#8B7E74]">{s.d}</p></div>
            </div>
          ))}
        </div>
        <Link href="/settings" className="w-full text-center font-bold py-4 px-4 rounded-2xl text-white press-effect transition-all" style={{ ...nunito, background: 'linear-gradient(135deg, #E8A87C 0%, #D4845A 100%)', boxShadow: '0 4px 16px rgba(212,132,90,0.3)' }}>
          Mulai: Buat Budget Pertama ✨
        </Link>
      </div>
    )
  }

  if (!data) return null

  const usagePercent = data.total_budget > 0
    ? Math.min(100, Math.round(((data.total_budget - data.remaining_budget) / data.total_budget) * 100))
    : (data.total_spent > 0 ? 100 : 0)

  const progressGradient = usagePercent > 90
    ? 'linear-gradient(90deg, #E07A7A, #CC5F5F)'
    : usagePercent > 70
    ? 'linear-gradient(90deg, #F2C57C, #E5AD55)'
    : 'linear-gradient(90deg, #85BDA6, #6AA88E)'

  const formatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })

  const statusConfig = {
    safe: { bg: 'rgba(133,189,166,0.12)', border: 'rgba(133,189,166,0.25)', iconBg: '#D4EBE0', iconColor: '#518A72', text: '#518A72', label: '🌿 Pengeluaran Aman', subColor: '#6AA88E' },
    warning: { bg: 'rgba(242,197,124,0.12)', border: 'rgba(242,197,124,0.25)', iconBg: '#FEF0CC', iconColor: '#CC9235', text: '#CC9235', label: '⚡ Mendekati Batas', subColor: '#E5AD55' },
    danger: { bg: 'rgba(224,122,122,0.12)', border: 'rgba(224,122,122,0.25)', iconBg: '#FFE0E0', iconColor: '#B04545', text: '#B04545', label: '🔥 Budget Hampir Habis!', subColor: '#CC5F5F' },
  }

  return (
    <div className="p-6 space-y-5 pb-28 animate-stagger">
      {/* Header */}
      <header className="glass-card rounded-2xl p-2.5 flex justify-between items-center animate-fadeInUp">
        <div className="flex-1 min-w-0 pr-2">
          {budgets.length > 1 ? (
            <div className="relative inline-flex items-center w-full max-w-[200px] bg-primary-50/50 hover:bg-primary-50 rounded-xl pr-8 transition-colors border border-primary-100/50 group">
              <select value={selectedBudgetId || ''} onChange={handleBudgetChange} className="bg-transparent text-base font-bold focus:outline-none cursor-pointer w-full py-2 pl-3 truncate border-none appearance-none relative z-10" style={{ ...nunito, color: '#3D2C2E' }}>
                {budgets.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <div className="absolute right-2 pointer-events-none text-[#B0A59D] group-hover:text-primary-600 z-10"><ChevronDown size={18} /></div>
            </div>
          ) : (
            <div className="bg-primary-50/50 rounded-xl px-3 py-2 border border-primary-100/50 inline-block w-full max-w-[200px]">
              <h1 className="text-base font-bold truncate" style={{ ...nunito, color: '#3D2C2E' }}>{budgets[0]?.name}</h1>
            </div>
          )}
        </div>
        <div className="flex shrink-0 gap-0.5">
          <Link href="/reports" className="p-2 text-[#B0A59D] hover:text-primary-600 press-effect rounded-xl hover:bg-primary-50/50 transition-all" title="Laporan"><PieChart size={20} /></Link>
          <Link href="/settings" className="p-2 text-[#B0A59D] hover:text-primary-600 press-effect rounded-xl hover:bg-primary-50/50 transition-all" title="Pengaturan"><Settings size={20} /></Link>
        </div>
      </header>

      {/* Alert */}
      {usagePercent >= 85 && (
        <div className="rounded-2xl p-4 flex items-start gap-3 animate-fadeInUp" style={{ background: 'rgba(224,122,122,0.1)', border: '1px solid rgba(224,122,122,0.2)' }}>
          <div className="text-danger-500 mt-0.5 animate-pulse-warm"><AlertTriangle size={20} /></div>
          <div>
            <h3 className="text-sm font-bold text-danger-700" style={nunito}>Peringatan Budget! 🚨</h3>
            <p className="text-xs text-danger-600 mt-1">Budget sudah terpakai {usagePercent}%. Hati-hati ya, Mama!</p>
          </div>
        </div>
      )}

      {/* Main Card */}
      <div className="rounded-3xl p-6 space-y-5 relative overflow-hidden animate-fadeInUp" style={{ background: 'linear-gradient(145deg, rgba(255,253,251,0.95) 0%, rgba(255,232,214,0.4) 100%)', border: '1px solid rgba(232,168,124,0.15)', boxShadow: '0 8px 32px rgba(139,74,39,0.08)' }}>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-[#8B7E74]" style={nunito}>Sisa Budget (Aman Dipakai) 💰</p>
          <p className={`text-4xl font-extrabold ${data.remaining_budget < 0 ? 'text-danger-500' : ''}`} style={{ ...nunito, color: data.remaining_budget < 0 ? undefined : '#3D2C2E' }}>
            {formatter.format(data.remaining_budget)}
          </p>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold text-[#8B7E74]">
            <span>Terpakai {usagePercent}%</span>
            <span>{formatter.format(data.total_budget - data.remaining_budget)} / {formatter.format(data.total_budget)}</span>
          </div>
          <div className="h-3 w-full rounded-full overflow-hidden" style={{ background: 'rgba(232,168,124,0.12)' }}>
            <div className="h-full rounded-full transition-all duration-700 ease-out relative progress-shimmer" style={{ width: `${usagePercent}%`, background: progressGradient }} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-4" style={{ borderTop: '1px solid rgba(232,168,124,0.12)' }}>
          <div><p className="text-xs text-[#B0A59D] font-semibold mb-1">Total Pengeluaran</p><p className="font-bold" style={{ ...nunito, color: '#3D2C2E' }}>{formatter.format(data.total_spent)}</p></div>
          <div><p className="text-xs text-[#B0A59D] font-semibold mb-1">Reserved (Belum Bayar)</p><p className="font-bold" style={{ ...nunito, color: '#3D2C2E' }}>{formatter.format(data.unpaid_reserved)}</p></div>
        </div>
      </div>

      {/* Spending Advice */}
      {data.spending_advice && (() => {
        const sc = statusConfig[data.spending_advice.spending_status]
        return (
          <div className="rounded-3xl p-5 space-y-4 animate-fadeInUp" style={{ background: sc.bg, border: `1px solid ${sc.border}` }}>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl" style={{ background: sc.iconBg, color: sc.iconColor }}>
                {data.spending_advice.spending_status === 'safe' ? <ShieldCheck size={20} /> : data.spending_advice.spending_status === 'warning' ? <ShieldAlert size={20} /> : <ShieldX size={20} />}
              </div>
              <div>
                <h3 className="font-bold text-sm" style={{ ...nunito, color: sc.text }}>{sc.label}</h3>
                <p className="text-xs" style={{ color: sc.subColor }}>
                  {data.spending_advice.remaining_days > 0 ? `${data.spending_advice.remaining_days} hari tersisa bulan ini` : 'Info budget di masa lalu'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: <Wallet size={13} />, label: 'Aman / Hari', value: data.spending_advice.safe_daily },
                { icon: <CalendarDays size={13} />, label: 'Aman / Minggu', value: data.spending_advice.safe_weekly },
              ].map(item => (
                <div key={item.label} className="rounded-2xl p-3 space-y-1" style={{ background: 'rgba(255,255,255,0.7)' }}>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#B0A59D]">{item.icon}</span>
                    <p className="text-[10px] font-bold text-[#B0A59D] uppercase tracking-wider">{item.label}</p>
                  </div>
                  <p className="text-base font-bold" style={{ ...nunito, color: data.spending_advice.spending_status === 'danger' ? '#CC5F5F' : '#3D2C2E' }}>
                    {formatter.format(item.value)}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 px-1">
              <TrendingUp size={13} className="text-[#B0A59D]" />
              <p className="text-xs text-[#8B7E74]">
                Rata-rata harianmu: <span className="font-bold" style={{ color: '#3D2C2E' }}>{formatter.format(data.spending_advice.avg_daily_spent)}</span>
                {data.spending_advice.avg_daily_spent > data.spending_advice.safe_daily && data.spending_advice.safe_daily > 0 && (
                  <span className="text-danger-600 font-semibold"> — terlalu tinggi! 📈</span>
                )}
              </p>
            </div>
          </div>
        )
      })()}

      {/* Insight */}
      {data.top_category && (
        <Link href="/reports" className="block rounded-2xl p-4 press-effect transition-transform animate-fadeInUp" style={{ background: 'rgba(232,168,124,0.1)', border: '1px solid rgba(232,168,124,0.15)' }}>
          <p className="text-sm" style={{ color: '#8B4A27' }}>
            <span className="font-bold">💡 Insight:</span> <strong>{data.top_category.name}</strong> menghabiskan <strong>{formatter.format(data.top_category.total)}</strong> ({data.total_budget > 0 ? Math.round((data.top_category.total / data.total_budget) * 100) : 0}% dari budget)
          </p>
          <div className="mt-2 text-xs font-bold text-primary-600 flex items-center gap-1">Lihat Laporan Detail →</div>
        </Link>
      )}

      {/* Recent History */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold px-1" style={{ ...nunito, color: '#3D2C2E' }}>Riwayat Terakhir 📝</h2>
        <div className="space-y-3 animate-stagger">
          {data.recent_expenses.length > 0 ? data.recent_expenses.map(exp => (
            <div key={exp.id} className="glass-card rounded-2xl p-4 flex justify-between items-center press-effect transition-transform animate-fadeInUp">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-primary-600 uppercase tracking-wider mb-0.5" style={nunito}>{exp.category_name}</span>
                <span className="font-semibold" style={{ color: '#3D2C2E' }}>{exp.note || 'Tanpa catatan'}</span>
                <span className="text-xs text-[#B0A59D]">{new Date(exp.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
              </div>
              <div className="text-right flex items-center gap-2">
                <span className="font-bold" style={{ ...nunito, color: '#3D2C2E' }}>{formatter.format(exp.amount)}</span>
                <div className="flex -mr-1">
                  <Link href={`/expenses?edit_id=${exp.id}`} className="text-[#B0A59D] hover:text-primary-500 transition-colors p-1.5"><Edit2 size={15} /></Link>
                  <button onClick={() => setDeleteId(exp.id)} className="text-[#B0A59D] hover:text-danger-500 transition-colors p-1.5"><Trash2 size={15} /></button>
                </div>
              </div>
            </div>
          )) : (
            <div className="text-center p-8 rounded-2xl" style={{ background: 'rgba(232,168,124,0.06)', border: '1px dashed rgba(232,168,124,0.2)' }}>
              <p className="text-sm text-[#B0A59D]">Belum ada pengeluaran tercatat 📭</p>
            </div>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="pt-2">
        <Link href={`/reports${selectedBudgetId ? '?budget_id=' + selectedBudgetId : ''}`} className="flex items-center justify-center gap-2 w-full font-bold py-4 px-4 rounded-2xl press-effect transition-all text-white" style={{ ...nunito, background: 'linear-gradient(135deg, #3D2C2E 0%, #5A4345 100%)', boxShadow: '0 4px 16px rgba(61,44,46,0.2)' }}>
          Lihat Detail 📊 <ArrowRight size={20} />
        </Link>
      </div>

      {/* Delete Modal */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Hapus Pengeluaran 🗑️">
        <div className="space-y-4">
          <p className="text-sm text-[#8B7E74]">Yakin mau hapus catatan pengeluaran ini?</p>
          <div className="flex gap-2">
            <button onClick={() => setDeleteId(null)} className="flex-1 py-3 font-semibold rounded-2xl transition-all press-effect" style={{ ...nunito, background: 'rgba(232,168,124,0.1)', color: '#8B7E74' }}>Batal</button>
            <button onClick={handleDeleteExpense} disabled={isDeleting} className="flex-1 py-3 text-white rounded-2xl font-semibold disabled:opacity-50 press-effect" style={{ ...nunito, background: 'linear-gradient(135deg, #E07A7A, #CC5F5F)' }}>
              {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
