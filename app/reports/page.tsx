'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PieChart, Download, ArrowLeft, ArrowUpRight, ArrowDownRight, Calendar, Search, AlertCircle, ChevronDown } from 'lucide-react'
import Link from 'next/link'

type Budget = { id: string, name: string }

type Expense = {
  id: string
  amount: number
  note: string | null
  category_name: string
  budget_name: string
  date: string
}

type CategoryBreakdown = {
  name: string
  amount: number
  count: number
  avg: number
  percentage: number
}

type SummaryData = {
  budget_name: string
  total_spent: number
  total_budget: number
  breakdown: CategoryBreakdown[]
  total_transactions: number
  avg_per_day: number
  highest_day: string | null
  highest_day_amount: number
}

type DetailData = {
  total_filtered: number
  count: number
  expenses: Expense[]
}

function ReportsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [budgets, setBudgets] = useState<Budget[]>([])
  
  // States match URL parameters ideally, but we'll use local state for fast UI then fetch
  const [selectedBudget, setSelectedBudget] = useState<string>('all')
  const [activeTab, setActiveTab] = useState<'summary' | 'detail'>('summary')
  
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null)
  const [detailData, setDetailData] = useState<DetailData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Filters for Detail
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('')

  const [hasLoadedBudgets, setHasLoadedBudgets] = useState(false)

  // 1. Fetch all budgets on mount
  useEffect(() => {
    async function init() {
      try {
        const bRes = await fetch('/api/budgets?list=all')
        const bJson = await bRes.json()
        if (bJson.budgets) {
          setBudgets(bJson.budgets)
          
          // Determine initial selected budget
          const bParam = searchParams.get('budget_id')
          if (bParam && bJson.budgets.find((b:any) => b.id === bParam)) {
            setSelectedBudget(bParam)
          } else if (bJson.budgets.length > 0) {
             // By default, select primary budget first, then first active budget if exists, else 'all'
             const primary = bJson.budgets.find((b: any) => b.is_primary)
             const firstActive = bJson.budgets.find((b: any) => b.is_active)
             setSelectedBudget(primary ? primary.id : (firstActive ? firstActive.id : 'all'))
          } else {
             setSelectedBudget('all')
          }
        }
      } catch (error) {
        console.error(error)
      } finally {
        setHasLoadedBudgets(true)
      }
    }
    init()
  }, [searchParams])

  // 2. Fetch Report Data whenever dependencies change
  const fetchReport = useCallback(async () => {
    if (!hasLoadedBudgets || !selectedBudget) return
    
    setIsLoading(true)
    try {
      if (activeTab === 'summary') {
        const res = await fetch(`/api/reports?budget_id=${selectedBudget}&view=summary${dateFrom ? '&date_from=' + dateFrom : ''}${dateTo ? '&date_to=' + dateTo : ''}`)
        const json = await res.json()
        setSummaryData(json)
      } else {
        const queryParams = new URLSearchParams({
          budget_id: selectedBudget,
          view: 'detail',
          sort_by: sortBy,
          sort_order: sortOrder
        })
        if (search) queryParams.set('search', search)
        if (dateFrom) queryParams.set('date_from', dateFrom)
        if (dateTo) queryParams.set('date_to', dateTo)
        if (selectedCategoryId) queryParams.set('category_id', selectedCategoryId)
        
        const res = await fetch(`/api/reports?${queryParams.toString()}`)
        const json = await res.json()
        setDetailData(json)
      }
    } catch (e) {
      console.error('Failed to fetch report')
    } finally {
      setIsLoading(false)
    }
  }, [selectedBudget, activeTab, search, sortBy, sortOrder, dateFrom, dateTo, hasLoadedBudgets, selectedCategoryId])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  const setQuickDate = (days: number) => {
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - days)
    setDateTo(end.toISOString().split('T')[0])
    setDateFrom(start.toISOString().split('T')[0])
  }

  const exportCSV = () => {
    if (!detailData || !detailData.expenses.length) return
    let csv = 'Tanggal,Budget,Kategori,Catatan,Nominal\n'
    detailData.expenses.forEach(exp => {
      const gDate = new Date(exp.date).toLocaleDateString('id-ID')
      const note = exp.note ? `"${exp.note.replace(/"/g, '""')}"` : ''
      csv += `${gDate},${exp.budget_name},${exp.category_name},${note},${exp.amount}\n`
    })
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Laporan_Aturen_${Date.now()}.csv`
    a.click()
  }

  const formatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })

  const activeBudgets = budgets.filter((b: any) => b.is_active)
  const archivedBudgets = budgets.filter((b: any) => !b.is_active)

  return (
    <div className="p-6 space-y-6 pb-24">
      <header className="flex items-center gap-4">
        <Link href="/dashboard" className="p-2 bg-gray-100 text-gray-500 rounded-full active:scale-95 transition-transform">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Laporan</h1>
      </header>
      
      {/* Budget Selector */}
      <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 mb-2">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1 pl-1">
          Pilih Budget
        </label>
        <div className="relative group">
          <select
            value={selectedBudget}
            onChange={(e) => setSelectedBudget(e.target.value)}
            className="w-full bg-gray-50 text-base font-bold text-gray-900 px-3 py-3 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer appearance-none transition-colors group-hover:border-primary-200 relative z-10"
          >
            <option value="all">Semua Budget (Gabungan)</option>
            {activeBudgets.length > 0 && (
              <optgroup label="Budget Aktif">
                {activeBudgets.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </optgroup>
            )}
            {archivedBudgets.length > 0 && (
              <optgroup label="Budget Diarsipkan">
                {archivedBudgets.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </optgroup>
            )}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-primary-600 transition-colors z-20">
            <ChevronDown size={20} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-gray-100 rounded-xl">
        <button
          onClick={() => setActiveTab('summary')}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
            activeTab === 'summary' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
          }`}
        >
          Ringkasan
        </button>
        <button
          onClick={() => setActiveTab('detail')}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
            activeTab === 'detail' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
          }`}
        >
          Detail / Filter
        </button>
      </div>

      {isLoading ? (
        <div className="text-center p-8 text-gray-500 font-medium animate-pulse">Memuat data...</div>
      ) : activeTab === 'summary' && summaryData ? (
        <div className="space-y-6">
          
          {/* Overview Stats */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{summaryData.budget_name}</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-gray-900">{formatter.format(summaryData.total_spent)}</p>
                </div>
              </div>
              <div className="bg-danger-50 text-danger-700 p-2 rounded-xl flex items-center gap-1">
                <ArrowDownRight size={16} />
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-100">
               <div className="flex justify-between text-sm text-gray-500 mb-2">
                  <span>Dari total budget {formatter.format(summaryData.total_budget)}</span>
                  <span className="font-bold text-gray-900">
                    {summaryData.total_budget > 0 ? Math.round((summaryData.total_spent / summaryData.total_budget) * 100) : 0}% terpakai
                  </span>
               </div>
               <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                 <div 
                   className={`h-full transition-all duration-500 ease-out ${
                     (summaryData.total_spent / summaryData.total_budget) > 0.85 ? 'bg-danger-500' : 
                     (summaryData.total_spent / summaryData.total_budget) > 0.70 ? 'bg-amber-500' : 'bg-primary-500'
                   }`}
                   style={{ width: `${Math.min(100, summaryData.total_budget > 0 ? (summaryData.total_spent / summaryData.total_budget) * 100 : 0)}%` }}
                 />
               </div>
            </div>
          </div>
          
          {/* Insight Badges */}
          <div className="grid grid-cols-2 gap-3">
             <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center">
               <p className="text-xs text-gray-500 font-medium mb-1 truncate">Rata-rata/hari</p>
               <p className="text-lg font-bold text-gray-900">{formatter.format(summaryData.avg_per_day)}</p>
             </div>
             <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center">
               <p className="text-xs text-gray-500 font-medium mb-1 truncate">Total Transaksi</p>
               <p className="text-lg font-bold text-gray-900">{summaryData.total_transactions} trx</p>
             </div>
          </div>
          
          {summaryData.highest_day && (
             <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex items-center gap-3">
               <AlertCircle size={20} className="text-amber-600" />
               <div>
                  <p className="text-sm font-bold text-amber-900">Hari Terboros: {new Date(summaryData.highest_day).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                  <p className="text-xs text-amber-700">Kamu menghabiskan {formatter.format(summaryData.highest_day_amount)} di hari ini.</p>
               </div>
             </div>
          )}

          {/* Breakdown */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4 pt-5">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
              <PieChart size={20} className="text-primary-600" />
              Breakdown Kategori
            </h2>
            
            <div className="space-y-5">
              {summaryData.breakdown.length > 0 ? summaryData.breakdown.map((cat: any) => (
                <div 
                  key={cat.name} 
                  className="space-y-2 cursor-pointer active:scale-[0.98] transition-transform group"
                  onClick={() => {
                    setSelectedCategoryId(cat.id)
                    setSelectedCategoryName(cat.name)
                    setActiveTab('detail')
                  }}
                >
                  <div className="flex justify-between items-end">
                    <div>
                       <span className="font-semibold text-gray-900 text-sm group-hover:text-primary-600 transition-colors uppercase tracking-tight">{cat.name}</span>
                       <span className="text-xs text-gray-400 ml-2">{cat.count} trx</span>
                    </div>
                    <span className="font-bold text-gray-900 text-sm">{formatter.format(cat.amount)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-2 flex-grow bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary-500 rounded-full shrink-0" 
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-gray-500 w-8 text-right">{cat.percentage}%</span>
                  </div>
                  <p className="text-[10px] text-gray-400 text-right mt-1">Avg: {formatter.format(cat.avg)}</p>
                </div>
              )) : (
                <p className="text-center text-gray-500 text-sm py-4">Belum ada pengeluaran</p>
              )}
            </div>
          </div>
          
        </div>
      ) : activeTab === 'detail' && detailData ? (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
             <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Cari referensi/catatan..." 
                  className="w-full bg-gray-50 border-none rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-1 focus:ring-primary-500"
                />
             </div>
             
             <div className="flex gap-2">
                <input 
                  type="date" 
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-lg px-2 py-2 text-xs focus:ring-1 focus:ring-primary-500"
                />
                <span className="text-gray-400 self-center">-</span>
                <input 
                  type="date" 
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-lg px-2 py-2 text-xs focus:ring-1 focus:ring-primary-500"
                />
             </div>
             
             <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                <button onClick={() => setQuickDate(7)} className="shrink-0 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium active:scale-95 transition-transform">7 Hari</button>
                <button onClick={() => setQuickDate(30)} className="shrink-0 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium active:scale-95 transition-transform">30 Hari</button>
                <button 
                  onClick={() => {
                    setDateFrom('')
                    setDateTo('')
                    setSearch('')
                    setSelectedCategoryId('')
                    setSelectedCategoryName('')
                  }} 
                  className="shrink-0 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium active:scale-95 transition-transform"
                >
                  Reset Filter
                </button>
             </div>
             
             {selectedCategoryName && (
               <div className="flex items-center justify-between bg-primary-50 px-3 py-2 rounded-lg border border-primary-100">
                  <span className="text-[11px] font-bold text-primary-700">Filter Kategori: {selectedCategoryName}</span>
                  <button onClick={() => { setSelectedCategoryId(''); setSelectedCategoryName('') }} className="text-primary-600 text-xs font-bold hover:underline">Hapus</button>
               </div>
             )}
          </div>

          {/* Results Summary */}
          <div className="flex justify-between items-end px-1">
             <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Total Filter ({detailData.count})</p>
                <p className="text-lg font-bold text-gray-900">{formatter.format(detailData.total_filtered)}</p>
             </div>
             <button 
               onClick={exportCSV} 
               disabled={detailData.expenses.length === 0}
               className="flex items-center gap-1.5 bg-gray-900 text-white px-3 py-2 rounded-lg text-xs font-medium active:scale-95 transition-transform disabled:opacity-50"
             >
                <Download size={14} /> CSV
             </button>
          </div>

          {/* List */}
          <div className="space-y-3">
             {detailData.expenses.length > 0 ? detailData.expenses.map((exp) => (
               <div key={exp.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 active:scale-[0.99] transition-transform">
                  <div className="flex justify-between items-start mb-2">
                     <span className="text-[10px] font-bold text-white bg-primary-500 px-2 py-0.5 rounded-md uppercase tracking-wider">
                       {exp.category_name}
                     </span>
                     {selectedBudget === 'all' && (
                        <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md uppercase">
                          {exp.budget_name}
                        </span>
                     )}
                  </div>
                  <div className="flex justify-between items-center mt-1">
                     <div className="flex flex-col">
                        <span className="font-semibold text-gray-900 truncate max-w-[150px] sm:max-w-[200px]">{exp.note || 'Tanpa catatan'}</span>
                        <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1 mt-0.5">
                           <Calendar size={10} />
                           {new Date(exp.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </span>
                     </div>
                     <span className="font-bold text-gray-900">{formatter.format(exp.amount)}</span>
                  </div>
               </div>
             )) : (
               <div className="text-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                 <p className="text-sm text-gray-500">Tidak ada data untuk filter ini.</p>
               </div>
             )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-gray-500">Memuat laporan...</div>}>
      <ReportsContent />
    </Suspense>
  )
}
