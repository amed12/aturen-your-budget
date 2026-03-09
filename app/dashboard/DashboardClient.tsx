'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PlusCircle, Trash2, Edit2, PieChart } from 'lucide-react'
import { Modal } from '@/components/Modal'
import toast from 'react-hot-toast'

type DashboardData = {
  total_budget: number
  total_reserved: number
  unpaid_reserved: number
  total_spent: number
  remaining_budget: number
  top_category: { name: string, total: number } | null
  recent_expenses: Array<{
    id: string
    amount: number
    note: string | null
    category_name: string
    date: string
  }>
}

export function DashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [needsBudget, setNeedsBudget] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const fetchDashboard = async () => {
    try {
      const now = new Date()
      const month = now.getMonth() + 1
      const year = now.getFullYear()
      
      const budgetRes = await fetch(`/api/budgets?month=${month}&year=${year}`)
      const budgetJson = await budgetRes.json()
      
      if (!budgetJson.budget) {
        setNeedsBudget(true)
        setIsLoading(false)
        return
      }

      const dashboardRes = await fetch(`/api/dashboard?budget_id=${budgetJson.budget.id}`)
      const dashboardJson = await dashboardRes.json()
      setData(dashboardJson)
    } catch (error) {
      console.error('Failed to load dashboard', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboard()
  }, [])

  const handleDeleteExpense = async () => {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/expenses/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Pengeluaran dihapus')
      setDeleteId(null)
      fetchDashboard() // refresh data
    } catch (e) {
      toast.error('Gagal menghapus pengeluaran')
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-8 animate-pulse">
        <header className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-6 w-24 bg-gray-200 rounded"></div>
            <div className="h-4 w-32 bg-gray-200 rounded"></div>
          </div>
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
        </header>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
          <div className="space-y-2">
            <div className="h-4 w-48 bg-gray-200 rounded"></div>
            <div className="h-10 w-40 bg-gray-200 rounded"></div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <div className="h-3 w-16 bg-gray-200 rounded"></div>
              <div className="h-3 w-24 bg-gray-200 rounded"></div>
            </div>
            <div className="h-3 w-full bg-gray-200 rounded-full"></div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="h-6 w-32 bg-gray-200 rounded"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex justify-between items-center">
                <div className="space-y-2">
                  <div className="h-3 w-20 bg-gray-200 rounded"></div>
                  <div className="h-4 w-32 bg-gray-200 rounded"></div>
                </div>
                <div className="h-5 w-24 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (needsBudget) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[75vh] p-6 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">Selamat Datang di Aturen 👋</h2>
          <p className="text-gray-500">Mari kelola keuanganmu hanya dengan 3 langkah mudah.</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 w-full space-y-6">
          <div className="flex items-start gap-4">
            <div className="bg-primary-100 text-primary-700 w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0">1</div>
            <div>
              <h3 className="font-semibold text-gray-900">Targetkan Budget</h3>
              <p className="text-sm text-gray-500">Tentukan batas pengeluaran bulan ini agar uangmu tidak bablas.</p>
            </div>
          </div>
          <div className="flex items-start gap-4 opacity-50">
            <div className="bg-gray-100 text-gray-500 w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0">2</div>
            <div>
              <h3 className="font-semibold text-gray-900">Pisahkan Dana Wajib</h3>
              <p className="text-sm text-gray-500">Sisihkan untuk tagihan, cicilan, dan tabungan di awal.</p>
            </div>
          </div>
          <div className="flex items-start gap-4 opacity-50">
            <div className="bg-gray-100 text-gray-500 w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0">3</div>
            <div>
              <h3 className="font-semibold text-gray-900">Catat Secara Rutin</h3>
              <p className="text-sm text-gray-500">Catat setiap pengeluaran barumu di bawah 5 detik!</p>
            </div>
          </div>
        </div>

        <Link 
          href="/settings"
          className="w-full text-center bg-primary-600 text-white font-bold py-4 px-4 rounded-xl shadow-md active:scale-[0.98] transition-all"
        >
          Mulai: Atur Budget
        </Link>
      </div>
    )
  }

  if (!data) return null

  const usagePercent = data.total_budget > 0 
    ? Math.min(100, Math.round(((data.total_budget - data.remaining_budget) / data.total_budget) * 100))
    : 0

  let progressColor = 'bg-success-500'
  if (usagePercent > 70) progressColor = 'bg-warning-500'
  if (usagePercent > 90) progressColor = 'bg-danger-500'

  const formatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })

  return (
    <div className="p-6 space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Aturen</h1>
          <p className="text-sm text-gray-500">{new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</p>
        </div>
        <Link href="/reports" className="p-2 bg-gray-100 text-gray-700 rounded-full active:scale-95 transition-transform">
          <PieChart size={20} />
        </Link>
      </header>

      {/* Main Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6 relative overflow-hidden">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-500">Sisa Budget (Aman Dipakai)</p>
          <p className={`text-4xl font-bold ${data.remaining_budget < 0 ? 'text-danger-500' : 'text-gray-900'}`}>
            {formatter.format(data.remaining_budget)}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-500 font-medium">
            <span>Terpakai {usagePercent}%</span>
            <span>{formatter.format(data.total_budget - data.remaining_budget)} / {formatter.format(data.total_budget)}</span>
          </div>
          <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`h-full ${progressColor} transition-all duration-500 ease-out`}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-500 font-medium mb-1">Total Pengeluaran</p>
            <p className="font-semibold text-gray-900">{formatter.format(data.total_spent)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium mb-1">Reserved (Belum Dibayar)</p>
            <p className="font-semibold text-gray-900">{formatter.format(data.unpaid_reserved)}</p>
          </div>
        </div>
      </div>

      {/* Insight Section */}
      {data.top_category && (
        <Link href="/reports" className="block bg-primary-50 rounded-xl p-4 border border-primary-100 active:scale-[0.99] transition-transform">
          <p className="text-sm text-primary-800">
            <span className="font-bold">Insight:</span> <strong>{data.top_category.name}</strong> menghabiskan <strong>{formatter.format(data.top_category.total)}</strong> ({data.total_budget > 0 ? Math.round((data.top_category.total / data.total_budget) * 100) : 0}% dari budget)
          </p>
          <div className="mt-2 text-xs font-bold text-primary-600 flex items-center gap-1">
            Lihat Laporan Detail <span aria-hidden="true">&rarr;</span>
          </div>
        </Link>
      )}

      {/* History Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-lg font-bold text-gray-900">Riwayat Terakhir</h2>
        </div>
        
        <div className="space-y-3">
          {data.recent_expenses.length > 0 ? (
            data.recent_expenses.map((exp) => (
              <div key={exp.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex justify-between items-center active:scale-[0.99] transition-transform">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-primary-600 uppercase tracking-wider mb-0.5">{exp.category_name}</span>
                  <span className="font-semibold text-gray-900">{exp.note || 'Tanpa catatan'}</span>
                  <span className="text-xs text-gray-400">{new Date(exp.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                </div>
                <div className="text-right flex items-center gap-2">
                  <span className="font-bold text-gray-900">{formatter.format(exp.amount)}</span>
                  <div className="flex -mr-2">
                    <Link href={`/expenses?edit_id=${exp.id}`} className="text-gray-300 hover:text-primary-500 transition-colors p-2">
                      <Edit2 size={16} />
                    </Link>
                    <button onClick={() => setDeleteId(exp.id)} className="text-gray-300 hover:text-danger-500 transition-colors p-2">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <p className="text-sm text-gray-500">Belum ada pengeluaran tercatat.</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Action */}
      <div className="pt-4">
        <Link href="/expenses" className="flex items-center justify-center gap-2 w-full bg-gray-900 text-white font-medium py-4 px-4 rounded-xl shadow-sm active:scale-[0.98] transition-transform">
          <PlusCircle size={20} />
          Catat Pengeluaran
        </Link>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Hapus Pengeluaran">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Apakah Anda yakin ingin menghapus catatan pengeluaran ini?</p>
          <div className="flex gap-2">
            <button 
              onClick={() => setDeleteId(null)} 
              className="flex-1 py-3 text-gray-700 font-medium bg-gray-100 rounded-lg"
            >
              Batal
            </button>
            <button 
              onClick={handleDeleteExpense} 
              disabled={isDeleting}
              className="flex-1 py-3 bg-danger-600 text-white rounded-lg font-medium outline-none focus:ring-2 focus:ring-offset-2 focus:ring-danger-500 disabled:opacity-50"
            >
              {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
