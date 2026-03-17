'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, PieChart, Download, List, ChevronDown, ChevronUp, 
  Search, X, SlidersHorizontal, Calendar, Tag, DollarSign,
  ArrowUpDown, TrendingDown
} from 'lucide-react'

type ReportSummary = {
  total_spent: number
  total_budget: number
  breakdown: Array<{
    name: string
    amount: number
    percentage: number
  }>
}

type DetailExpense = {
  id: string
  amount: number
  note: string | null
  category_id: string
  category_name: string
  date: string
  created_at: string
}

type DetailData = {
  total_filtered: number
  count: number
  expenses: DetailExpense[]
}

type CategoryOption = {
  id: string
  name: string
}

export default function ReportsPage() {
  const router = useRouter()
  
  // State
  const [activeTab, setActiveTab] = useState<'summary' | 'detail'>('summary')
  const [budgetId, setBudgetId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Summary data
  const [summaryData, setSummaryData] = useState<ReportSummary | null>(null)
  
  // Detail data
  const [detailData, setDetailData] = useState<DetailData | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  
  // Filters
  const [showFilters, setShowFilters] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')
  
  // Categories for filter
  const [categories, setCategories] = useState<CategoryOption[]>([])
  
  // Active filter count
  const activeFilterCount = [selectedCategory, dateFrom, dateTo, minAmount, maxAmount, searchQuery]
    .filter(Boolean).length

  const formatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })

  // Fetch budget
  useEffect(() => {
    async function init() {
      try {
        const now = new Date()
        const month = now.getMonth() + 1
        const year = now.getFullYear()
        
        const [budgetRes, catRes] = await Promise.all([
          fetch(`/api/budgets?month=${month}&year=${year}`),
          fetch('/api/categories')
        ])
        const budgetJson = await budgetRes.json()
        const catJson = await catRes.json()
        
        setCategories(catJson)
        
        if (!budgetJson.budget) {
          setIsLoading(false)
          return
        }

        setBudgetId(budgetJson.budget.id)
        
        // Fetch summary
        const reportRes = await fetch(`/api/reports?budget_id=${budgetJson.budget.id}&view=summary`)
        const reportJson = await reportRes.json()
        setSummaryData(reportJson)
      } catch (error) {
        console.error('Failed to load report', error)
      } finally {
        setIsLoading(false)
      }
    }
    init()
  }, [])

  // Fetch detail data
  const fetchDetail = useCallback(async () => {
    if (!budgetId) return
    setDetailLoading(true)
    try {
      const params = new URLSearchParams({
        budget_id: budgetId,
        view: 'detail',
        sort_by: sortBy,
        sort_order: sortOrder,
      })
      if (selectedCategory) params.set('category_id', selectedCategory)
      if (dateFrom) params.set('date_from', dateFrom)
      if (dateTo) params.set('date_to', dateTo)
      if (searchQuery) params.set('search', searchQuery)
      if (minAmount) params.set('min_amount', minAmount)
      if (maxAmount) params.set('max_amount', maxAmount)

      const res = await fetch(`/api/reports?${params.toString()}`)
      const json = await res.json()
      setDetailData(json)
    } catch (error) {
      console.error('Failed to load detail', error)
    } finally {
      setDetailLoading(false)
    }
  }, [budgetId, sortBy, sortOrder, selectedCategory, dateFrom, dateTo, searchQuery, minAmount, maxAmount])

  useEffect(() => {
    if (activeTab === 'detail') {
      fetchDetail()
    }
  }, [activeTab, fetchDetail])

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategory('')
    setDateFrom('')
    setDateTo('')
    setMinAmount('')
    setMaxAmount('')
    setSortBy('date')
    setSortOrder('desc')
  }

  // Group expenses by date for detail view
  const groupedExpenses = detailData?.expenses.reduce<Record<string, DetailExpense[]>>((groups, expense) => {
    const dateKey = new Date(expense.date).toLocaleDateString('id-ID', { 
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
    })
    if (!groups[dateKey]) groups[dateKey] = []
    groups[dateKey].push(expense)
    return groups
  }, {}) || {}

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto relative pb-24 shadow-2xl">
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-5">
          {/* Header */}
          <header className="flex items-center gap-4">
            <button 
              onClick={() => router.back()}
              className="bg-white text-gray-700 p-2 rounded-full shadow-sm active:scale-95 transition-transform"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">Laporan Pengeluaran</h1>
              <p className="text-sm text-gray-500">{new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</p>
            </div>
            {budgetId && (
              <a 
                href={`/api/reports/export?budget_id=${budgetId}`}
                className="bg-primary-50 text-primary-600 p-2 rounded-full shadow-sm active:scale-95 transition-transform"
                title="Unduh Laporan CSV"
              >
                <Download size={20} />
              </a>
            )}
          </header>

          {/* Tabs */}
          {budgetId && (
            <div className="flex bg-white rounded-xl p-1 shadow-sm border border-gray-100">
              <button
                onClick={() => setActiveTab('summary')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'summary' 
                    ? 'bg-primary-600 text-white shadow-md' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <PieChart size={16} />
                Ringkasan
              </button>
              <button
                onClick={() => setActiveTab('detail')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'detail' 
                    ? 'bg-primary-600 text-white shadow-md' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <List size={16} />
                Detail
                {activeFilterCount > 0 && (
                  <span className="bg-white text-primary-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
                <div className="h-4 w-32 bg-gray-200 rounded"></div>
                <div className="h-8 w-48 bg-gray-200 rounded"></div>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between"><div className="h-3 w-20 bg-gray-200 rounded"></div><div className="h-3 w-16 bg-gray-200 rounded"></div></div>
                    <div className="h-2 w-full bg-gray-200 rounded-full"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : !budgetId ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100 space-y-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
                <PieChart size={32} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Belum Ada Data</h3>
                <p className="text-gray-500 text-sm mt-1">Catat pengeluaran pertamamu bulan ini untuk melihat laporan.</p>
              </div>
            </div>
          ) : (
            <>
              {/* ============= SUMMARY TAB ============= */}
              {activeTab === 'summary' && summaryData && (
                <div className="space-y-5">
                  {/* Summary Card */}
                  <div className="bg-primary-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
                    <div className="relative z-10 space-y-1">
                      <p className="text-sm font-medium text-primary-200">Total Pengeluaran Bulan Ini</p>
                      <p className="text-3xl font-bold">
                        {formatter.format(summaryData.total_spent)}
                      </p>
                      {summaryData.total_budget > 0 && (
                        <p className="text-sm text-primary-200 mt-2">
                          {Math.round((summaryData.total_spent / summaryData.total_budget) * 100)}% dari budget {formatter.format(summaryData.total_budget)}
                        </p>
                      )}
                    </div>
                    <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-primary-800 rounded-full blur-2xl opacity-50"></div>
                  </div>

                  {/* Breakdown List */}
                  {summaryData.breakdown.length > 0 ? (
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
                      <h3 className="font-bold text-gray-900">Breakdown Kategori</h3>
                      
                      <div className="space-y-5">
                        {summaryData.breakdown.map((item, idx) => {
                          const colors = ['bg-primary-500', 'bg-warning-500', 'bg-danger-500']
                          const barColor = idx < 3 ? colors[idx] : 'bg-gray-300'
                          
                          return (
                            <div key={item.name} className="space-y-2">
                              <div className="flex justify-between items-end">
                                <div>
                                  <span className="font-semibold text-gray-900">{item.name}</span>
                                  <span className="ml-2 text-xs font-bold text-gray-500">{item.percentage}%</span>
                                </div>
                                <span className="text-sm font-medium text-gray-700">{formatter.format(item.amount)}</span>
                              </div>
                              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${barColor} transition-all duration-1000 ease-out`}
                                  style={{ width: `${item.percentage}%` }}
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100 space-y-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
                        <PieChart size={32} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">Belum Ada Data</h3>
                        <p className="text-gray-500 text-sm mt-1">Catat pengeluaran pertamamu bulan ini.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ============= DETAIL TAB ============= */}
              {activeTab === 'detail' && (
                <div className="space-y-4">
                  {/* Search Bar */}
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Cari catatan..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      {searchQuery && (
                        <button 
                          onClick={() => setSearchQuery('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className={`relative p-2.5 rounded-xl border transition-all ${
                        showFilters || activeFilterCount > 0
                          ? 'bg-primary-50 border-primary-200 text-primary-600'
                          : 'bg-white border-gray-200 text-gray-500'
                      }`}
                    >
                      <SlidersHorizontal size={18} />
                      {activeFilterCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                          {activeFilterCount}
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Advanced Filters */}
                  {showFilters && (
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4 animate-in slide-in-from-top-2">
                      <div className="flex justify-between items-center">
                        <h3 className="font-bold text-gray-900 text-sm">Filter Lanjutan</h3>
                        {activeFilterCount > 0 && (
                          <button 
                            onClick={clearFilters}
                            className="text-xs text-primary-600 font-semibold"
                          >
                            Reset Filter
                          </button>
                        )}
                      </div>

                      {/* Category Filter */}
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          <Tag size={12} />
                          Kategori
                        </label>
                        <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="w-full py-2.5 px-3 bg-gray-50 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="">Semua Kategori</option>
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Date Range */}
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          <Calendar size={12} />
                          Rentang Tanggal
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="py-2.5 px-3 bg-gray-50 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="Dari"
                          />
                          <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="py-2.5 px-3 bg-gray-50 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="Sampai"
                          />
                        </div>
                      </div>

                      {/* Amount Range */}
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          <DollarSign size={12} />
                          Rentang Nominal
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            value={minAmount}
                            onChange={(e) => setMinAmount(e.target.value)}
                            placeholder="Min"
                            className="py-2.5 px-3 bg-gray-50 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                          <input
                            type="number"
                            value={maxAmount}
                            onChange={(e) => setMaxAmount(e.target.value)}
                            placeholder="Max"
                            className="py-2.5 px-3 bg-gray-50 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                      </div>

                      {/* Sort */}
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          <ArrowUpDown size={12} />
                          Urutkan
                        </label>
                        <div className="flex gap-2">
                          <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as 'date' | 'amount')}
                            className="flex-1 py-2.5 px-3 bg-gray-50 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="date">Tanggal</option>
                            <option value="amount">Nominal</option>
                          </select>
                          <button
                            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                            className="flex items-center gap-1.5 py-2.5 px-3 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-700 font-medium"
                          >
                            {sortOrder === 'desc' ? (
                              <><ChevronDown size={14} /> Terbaru</>
                            ) : (
                              <><ChevronUp size={14} /> Terlama</>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Results Summary */}
                  {detailData && !detailLoading && (
                    <div className="flex justify-between items-center px-1">
                      <p className="text-sm text-gray-500">
                        <span className="font-semibold text-gray-900">{detailData.count}</span> transaksi
                      </p>
                      <p className="text-sm font-semibold text-gray-700">
                        Total: {formatter.format(detailData.total_filtered)}
                      </p>
                    </div>
                  )}

                  {/* Expense List */}
                  {detailLoading ? (
                    <div className="space-y-3 animate-pulse">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                          <div className="flex justify-between items-center">
                            <div className="space-y-2">
                              <div className="h-3 w-16 bg-gray-200 rounded"></div>
                              <div className="h-4 w-32 bg-gray-200 rounded"></div>
                              <div className="h-3 w-20 bg-gray-200 rounded"></div>
                            </div>
                            <div className="h-5 w-24 bg-gray-200 rounded"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : detailData && detailData.expenses.length > 0 ? (
                    <div className="space-y-5">
                      {Object.entries(groupedExpenses).map(([dateLabel, expenses]) => (
                        <div key={dateLabel} className="space-y-2">
                          {/* Date Header */}
                          <div className="flex items-center gap-2 px-1">
                            <div className="h-px flex-1 bg-gray-200"></div>
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                              {dateLabel}
                            </span>
                            <div className="h-px flex-1 bg-gray-200"></div>
                          </div>
                          
                          {/* Expenses for this date */}
                          <div className="space-y-2">
                            {expenses.map((exp) => (
                              <div 
                                key={exp.id} 
                                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex justify-between items-center"
                              >
                                <div className="flex flex-col min-w-0 flex-1">
                                  <span className="text-[10px] font-bold text-primary-600 uppercase tracking-wider mb-0.5">
                                    {exp.category_name}
                                  </span>
                                  <span className="font-semibold text-gray-900 truncate">
                                    {exp.note || 'Tanpa catatan'}
                                  </span>
                                  <span className="text-[11px] text-gray-400">
                                    {new Date(exp.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <span className="font-bold text-gray-900 ml-3 whitespace-nowrap">
                                  {formatter.format(exp.amount)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100 space-y-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
                        <TrendingDown size={32} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">
                          {activeFilterCount > 0 ? 'Tidak Ada Hasil' : 'Belum Ada Transaksi'}
                        </h3>
                        <p className="text-gray-500 text-sm mt-1">
                          {activeFilterCount > 0 
                            ? 'Coba ubah filter pencarian kamu.' 
                            : 'Catat pengeluaran pertamamu untuk melihat detail.'}
                        </p>
                        {activeFilterCount > 0 && (
                          <button 
                            onClick={clearFilters}
                            className="mt-3 text-sm font-semibold text-primary-600"
                          >
                            Reset Filter
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
