'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PieChart, Download, ArrowLeft, ArrowDownRight, Calendar, Search, AlertCircle, ChevronDown, Edit2, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { Modal } from '@/components/Modal'
import toast from 'react-hot-toast'

type Budget = { id: string, name: string }
type Expense = { id: string; amount: number; note: string | null; category_name: string; budget_name: string; date: string }
type CategoryBreakdown = { name: string; amount: number; count: number; avg: number; percentage: number }
type SummaryData = { budget_name: string; total_spent: number; total_budget: number; breakdown: CategoryBreakdown[]; total_transactions: number; avg_per_day: number; highest_day: string | null; highest_day_amount: number }
type DetailData = { total_filtered: number; count: number; expenses: Expense[] }

const nunito = { fontFamily: 'var(--font-nunito), sans-serif' }

const renderNoteWithLink = (note: string | null) => {
  if (!note) return 'Tanpa catatan'
  
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const parts = note.split(urlRegex)
  
  if (parts.length === 1) return note

  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-primary-500 hover:text-primary-600 hover:underline font-bold break-all inline-flex items-center gap-0.5"
        >
          {part} 🔗
        </a>
      )
    }
    return part
  })
}

const categoryColors = [
  'linear-gradient(90deg, #E8A87C, #D4845A)', 'linear-gradient(90deg, #95B8D1, #6490B3)',
  'linear-gradient(90deg, #85BDA6, #518A72)', 'linear-gradient(90deg, #F2C57C, #CC9235)',
  'linear-gradient(90deg, #E07A7A, #B04545)', 'linear-gradient(90deg, #C4A7E7, #9B72CF)',
  'linear-gradient(90deg, #A8D8EA, #72B5D0)', 'linear-gradient(90deg, #F5B7B1, #E07A7A)',
]

function ReportsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [selectedBudget, setSelectedBudget] = useState<string>('all')
  const [activeTab, setActiveTab] = useState<'summary' | 'detail'>('summary')
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null)
  const [detailData, setDetailData] = useState<DetailData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('')
  const [hasLoadedBudgets, setHasLoadedBudgets] = useState(false)

  useEffect(() => {
    async function init() {
      try {
        const bRes = await fetch('/api/budgets?list=all')
        const bJson = await bRes.json()
        if (bJson.budgets) {
          setBudgets(bJson.budgets)
          const bParam = searchParams.get('budget_id')
          if (bParam && bJson.budgets.find((b:any) => b.id === bParam)) setSelectedBudget(bParam)
          else if (bJson.budgets.length > 0) {
            const savedId = typeof window !== 'undefined' ? localStorage.getItem('last_selected_budget_id') : null
            const primary = bJson.budgets.find((b: any) => b.is_primary)
            const firstActive = bJson.budgets.find((b: any) => b.is_active)
            if (savedId && bJson.budgets.find((b:any) => b.id === savedId)) setSelectedBudget(savedId)
            else setSelectedBudget(primary ? primary.id : (firstActive ? firstActive.id : 'all'))
          } else setSelectedBudget('all')
        }
      } catch (e) { console.error(e) }
      finally { setHasLoadedBudgets(true) }
    }
    init()
  }, [searchParams])

  useEffect(() => {
    if (selectedBudget && selectedBudget !== 'all' && typeof window !== 'undefined') localStorage.setItem('last_selected_budget_id', selectedBudget)
  }, [selectedBudget])

  const fetchReport = useCallback(async () => {
    if (!hasLoadedBudgets || !selectedBudget) return
    setIsLoading(true)
    try {
      if (activeTab === 'summary') {
        const res = await fetch(`/api/reports?budget_id=${selectedBudget}&view=summary${dateFrom ? '&date_from=' + dateFrom : ''}${dateTo ? '&date_to=' + dateTo : ''}`)
        setSummaryData(await res.json())
      } else {
        const qp = new URLSearchParams({ budget_id: selectedBudget, view: 'detail', sort_by: sortBy, sort_order: sortOrder })
        if (search) qp.set('search', search)
        if (dateFrom) qp.set('date_from', dateFrom)
        if (dateTo) qp.set('date_to', dateTo)
        if (selectedCategoryId) qp.set('category_id', selectedCategoryId)
        setDetailData(await (await fetch(`/api/reports?${qp.toString()}`)).json())
      }
    } catch { console.error('Failed to fetch report') }
    finally { setIsLoading(false) }
  }, [selectedBudget, activeTab, search, sortBy, sortOrder, dateFrom, dateTo, hasLoadedBudgets, selectedCategoryId])

  useEffect(() => { fetchReport() }, [fetchReport])

  const setQuickDate = (days: number) => {
    const end = new Date(); const start = new Date()
    start.setDate(end.getDate() - days)
    setDateTo(end.toISOString().split('T')[0]); setDateFrom(start.toISOString().split('T')[0])
  }

  const handleDeleteExpense = async () => {
    if (!deleteId) return; setIsDeleting(true)
    try {
      const res = await fetch(`/api/expenses/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Pengeluaran dihapus 🗑️'); setDeleteId(null); fetchReport()
    } catch { toast.error('Gagal menghapus') } finally { setIsDeleting(false) }
  }

  const exportCSV = () => {
    if (!detailData || !detailData.expenses.length) return
    let csv = 'Tanggal,Budget,Kategori,Catatan,Nominal\n'
    detailData.expenses.forEach(exp => {
      const note = exp.note ? `"${exp.note.replace(/"/g, '""')}"` : ''
      csv += `${new Date(exp.date).toLocaleDateString('id-ID')},${exp.budget_name},${exp.category_name},${note},${exp.amount}\n`
    })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `Laporan_Aturen_${Date.now()}.csv`; a.click()
  }

  const formatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })
  const activeBudgets = budgets.filter((b: any) => b.is_active)
  const archivedBudgets = budgets.filter((b: any) => !b.is_active)

  return (
    <div className="p-6 space-y-5 pb-28 animate-fadeInUp">
      <header className="flex items-center gap-4">
        <Link href="/dashboard" className="p-2.5 text-[#B0A59D] rounded-2xl press-effect hover:bg-primary-50 transition-all" style={{ background: 'rgba(232,168,124,0.1)' }}><ArrowLeft size={20} /></Link>
        <h1 className="text-xl font-extrabold" style={{ ...nunito, color: '#3D2C2E' }}>Laporan 📊</h1>
      </header>

      {/* Budget Selector */}
      <div className="glass-card rounded-2xl p-3.5">
        <label className="text-xs font-bold text-[#B0A59D] uppercase tracking-wider mb-2 flex items-center gap-1 pl-1" style={nunito}>Pilih Budget</label>
        <div className="relative group mt-1.5">
          <select value={selectedBudget} onChange={(e) => setSelectedBudget(e.target.value)} className="w-full bg-primary-50/40 text-base font-bold px-3.5 py-3 rounded-xl border border-primary-100/50 focus:outline-none cursor-pointer appearance-none transition-colors group-hover:border-primary-300 relative z-10" style={{ ...nunito, color: '#3D2C2E' }}>
            <option value="all">Semua Budget (Gabungan)</option>
            {activeBudgets.length > 0 && <optgroup label="Budget Aktif">{activeBudgets.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</optgroup>}
            {archivedBudgets.length > 0 && <optgroup label="Budget Diarsipkan">{archivedBudgets.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</optgroup>}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#B0A59D] group-hover:text-primary-600 transition-colors z-20"><ChevronDown size={20} /></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 rounded-2xl" style={{ background: 'rgba(232,168,124,0.08)' }}>
        {(['summary', 'detail'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all press-effect ${activeTab === tab ? 'text-white shadow-warm-sm' : 'text-[#B0A59D]'}`}
            style={activeTab === tab ? { ...nunito, background: 'linear-gradient(135deg, #E8A87C, #D4845A)' } : nunito}>
            {tab === 'summary' ? 'Ringkasan' : 'Detail / Filter'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center p-8 text-[#B0A59D] font-semibold" style={nunito}>Memuat data... ✨</div>
      ) : activeTab === 'summary' && summaryData ? (
        <div className="space-y-5 animate-stagger">
          {/* Overview */}
          <div className="glass-card-strong rounded-3xl p-6 space-y-4 animate-fadeInUp">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold text-[#8B7E74] mb-1" style={nunito}>{summaryData.budget_name}</p>
                <p className="text-3xl font-extrabold" style={{ ...nunito, color: '#3D2C2E' }}>{formatter.format(summaryData.total_spent)}</p>
              </div>
              <div className="p-2.5 rounded-2xl" style={{ background: 'rgba(224,122,122,0.1)', color: '#CC5F5F' }}><ArrowDownRight size={18} /></div>
            </div>
            <div className="pt-4" style={{ borderTop: '1px solid rgba(232,168,124,0.12)' }}>
              <div className="flex justify-between text-sm text-[#8B7E74] mb-2">
                <span>Dari budget {formatter.format(summaryData.total_budget)}</span>
                <span className="font-bold" style={{ color: '#3D2C2E' }}>{summaryData.total_budget > 0 ? Math.round((summaryData.total_spent / summaryData.total_budget) * 100) : 0}%</span>
              </div>
              <div className="h-2.5 w-full rounded-full overflow-hidden" style={{ background: 'rgba(232,168,124,0.12)' }}>
                <div className="h-full rounded-full transition-all duration-500 relative progress-shimmer" style={{ width: `${Math.min(100, summaryData.total_budget > 0 ? (summaryData.total_spent / summaryData.total_budget) * 100 : 0)}%`, background: (summaryData.total_spent / summaryData.total_budget) > 0.85 ? 'linear-gradient(90deg, #E07A7A, #CC5F5F)' : (summaryData.total_spent / summaryData.total_budget) > 0.70 ? 'linear-gradient(90deg, #F2C57C, #E5AD55)' : 'linear-gradient(90deg, #85BDA6, #6AA88E)' }} />
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            {[{ l: 'Rata-rata/hari', v: formatter.format(summaryData.avg_per_day) }, { l: 'Total Transaksi', v: `${summaryData.total_transactions} trx` }].map(s => (
              <div key={s.l} className="glass-card rounded-2xl p-4 animate-fadeInUp">
                <p className="text-xs text-[#B0A59D] font-semibold mb-1 truncate" style={nunito}>{s.l}</p>
                <p className="text-lg font-extrabold" style={{ ...nunito, color: '#3D2C2E' }}>{s.v}</p>
              </div>
            ))}
          </div>

          {summaryData.highest_day && (
            <div className="rounded-2xl p-4 flex items-center gap-3 animate-fadeInUp" style={{ background: 'rgba(242,197,124,0.1)', border: '1px solid rgba(242,197,124,0.2)' }}>
              <AlertCircle size={20} style={{ color: '#CC9235' }} />
              <div>
                <p className="text-sm font-bold" style={{ ...nunito, color: '#8B4A27' }}>🔥 Hari Terboros: {new Date(summaryData.highest_day).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                <p className="text-xs" style={{ color: '#CC9235' }}>Kamu menghabiskan {formatter.format(summaryData.highest_day_amount)} di hari ini.</p>
              </div>
            </div>
          )}

          {/* Breakdown */}
          <div className="glass-card-strong rounded-3xl p-6 space-y-4 animate-fadeInUp">
            <h2 className="text-lg font-extrabold flex items-center gap-2 mb-4" style={{ ...nunito, color: '#3D2C2E' }}>
              <PieChart size={20} className="text-primary-500" /> Breakdown Kategori
            </h2>
            <div className="space-y-5">
              {summaryData.breakdown.length > 0 ? summaryData.breakdown.map((cat: any, i: number) => (
                <div key={cat.name} className="space-y-2 cursor-pointer press-effect group" onClick={() => { setSelectedCategoryId(cat.id); setSelectedCategoryName(cat.name); setActiveTab('detail') }}>
                  <div className="flex justify-between items-end">
                    <div><span className="font-bold text-sm group-hover:text-primary-600 transition-colors uppercase tracking-tight" style={{ ...nunito, color: '#3D2C2E' }}>{cat.name}</span><span className="text-xs text-[#B0A59D] ml-2">{cat.count} trx</span></div>
                    <span className="font-bold text-sm" style={{ ...nunito, color: '#3D2C2E' }}>{formatter.format(cat.amount)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-2.5 flex-grow rounded-full overflow-hidden" style={{ background: 'rgba(232,168,124,0.1)' }}>
                      <div className="h-full rounded-full shrink-0 transition-all duration-500" style={{ width: `${cat.percentage}%`, background: categoryColors[i % categoryColors.length] }} />
                    </div>
                    <span className="text-xs font-bold text-[#8B7E74] w-8 text-right">{cat.percentage}%</span>
                  </div>
                  <p className="text-[10px] text-[#B0A59D] text-right mt-1">Avg: {formatter.format(cat.avg)}</p>
                </div>
              )) : <p className="text-center text-[#B0A59D] text-sm py-4">Belum ada pengeluaran 📭</p>}
            </div>
          </div>
        </div>
      ) : activeTab === 'detail' && detailData ? (
        <div className="space-y-5">
          {/* Filters */}
          <div className="glass-card rounded-2xl p-4 space-y-3.5">
            <div className="relative">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#B0A59D]" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari catatan..." className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm border-2 border-primary-100 focus:outline-none" style={{ background: 'rgba(232,168,124,0.04)' }} />
            </div>
            <div className="flex gap-2">
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full rounded-xl px-2.5 py-2 text-xs border-2 border-primary-100 focus:outline-none" style={{ background: 'rgba(232,168,124,0.04)' }} />
              <span className="text-[#B0A59D] self-center">-</span>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full rounded-xl px-2.5 py-2 text-xs border-2 border-primary-100 focus:outline-none" style={{ background: 'rgba(232,168,124,0.04)' }} />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {[{ l: '7 Hari', d: 7 }, { l: '30 Hari', d: 30 }].map(q => (
                <button key={q.l} onClick={() => setQuickDate(q.d)} className="shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold press-effect" style={{ ...nunito, background: 'rgba(232,168,124,0.1)', color: '#8B7E74' }}>{q.l}</button>
              ))}
              <button onClick={() => { setDateFrom(''); setDateTo(''); setSearch(''); setSelectedCategoryId(''); setSelectedCategoryName('') }} className="shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold press-effect" style={{ ...nunito, background: 'rgba(232,168,124,0.1)', color: '#8B7E74' }}>Reset</button>
            </div>
            {selectedCategoryName && (
              <div className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ background: 'rgba(232,168,124,0.1)', border: '1px solid rgba(232,168,124,0.15)' }}>
                <span className="text-[11px] font-bold text-primary-700" style={nunito}>Filter: {selectedCategoryName}</span>
                <button onClick={() => { setSelectedCategoryId(''); setSelectedCategoryName('') }} className="text-primary-600 text-xs font-bold hover:underline">Hapus</button>
              </div>
            )}
          </div>

          {/* Results */}
          <div className="flex justify-between items-end px-1">
            <div>
              <p className="text-xs text-[#B0A59D] uppercase tracking-wider font-bold mb-1" style={nunito}>Total ({detailData.count})</p>
              <p className="text-lg font-extrabold" style={{ ...nunito, color: '#3D2C2E' }}>{formatter.format(detailData.total_filtered)}</p>
            </div>
            <button onClick={exportCSV} disabled={detailData.expenses.length === 0} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white press-effect disabled:opacity-50" style={{ ...nunito, background: 'linear-gradient(135deg, #3D2C2E, #5A4345)' }}>
              <Download size={14} /> CSV
            </button>
          </div>

          {/* Expense List */}
          <div className="space-y-3 animate-stagger">
            {detailData.expenses.length > 0 ? detailData.expenses.map((exp) => (
              <div key={exp.id} className="glass-card rounded-2xl p-4 press-effect animate-fadeInUp">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-white px-2.5 py-0.5 rounded-lg uppercase tracking-wider" style={{ background: 'linear-gradient(135deg, #E8A87C, #D4845A)' }}>{exp.category_name}</span>
                  {selectedBudget === 'all' && <span className="text-[10px] font-bold text-[#8B7E74] px-2 py-0.5 rounded-lg uppercase" style={{ background: 'rgba(232,168,124,0.1)' }}>{exp.budget_name}</span>}
                </div>
                <div className="flex justify-between items-center mt-1">
                  <div className="flex flex-col">
                    <span className="font-semibold truncate max-w-[150px] sm:max-w-[200px] text-sm leading-relaxed" style={{ color: '#3D2C2E' }}>{renderNoteWithLink(exp.note)}</span>
                    <span className="text-[11px] text-[#B0A59D] font-medium flex items-center gap-1 mt-0.5"><Calendar size={10} />{new Date(exp.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="font-bold" style={{ ...nunito, color: '#3D2C2E' }}>{formatter.format(exp.amount)}</span>
                    <div className="flex items-center gap-3">
                      <Link href={`/expenses?edit_id=${exp.id}`} className="text-[#B0A59D] hover:text-primary-600 press-effect"><Edit2 size={14} /></Link>
                      <button onClick={() => setDeleteId(exp.id)} className="text-[#B0A59D] hover:text-danger-600 press-effect"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center p-8 rounded-2xl" style={{ background: 'rgba(232,168,124,0.06)', border: '1px dashed rgba(232,168,124,0.2)' }}>
                <p className="text-sm text-[#B0A59D]">Tidak ada data 📭</p>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Delete Modal */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Hapus Pengeluaran 🗑️">
        <div className="space-y-4">
          <p className="text-sm text-[#8B7E74]">Yakin mau hapus catatan ini?</p>
          <div className="flex gap-2">
            <button onClick={() => setDeleteId(null)} className="flex-1 py-3 font-semibold rounded-2xl press-effect" style={{ ...nunito, background: 'rgba(232,168,124,0.1)', color: '#8B7E74' }}>Batal</button>
            <button onClick={handleDeleteExpense} disabled={isDeleting} className="flex-1 py-3 text-white font-semibold rounded-2xl disabled:opacity-50 press-effect" style={{ ...nunito, background: 'linear-gradient(135deg, #E07A7A, #CC5F5F)' }}>
              {isDeleting ? 'Menghapus...' : 'Hapus'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-[#B0A59D]" style={{ fontFamily: 'var(--font-nunito)' }}>Memuat laporan... ✨</div>}>
      <ReportsContent />
    </Suspense>
  )
}
