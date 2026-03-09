'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PlusCircle } from 'lucide-react'

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

  useEffect(() => {
    async function fetchDashboard() {
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
    fetchDashboard()
  }, [])

  if (isLoading) return <div className="p-6 text-center text-gray-500">Memuat...</div>

  if (needsBudget) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Selamat Datang 👋</h2>
          <p className="text-gray-500 mt-2">Kamu belum mengatur budget untuk bulan ini.</p>
        </div>
        <Link 
          href="/settings"
          className="w-full bg-primary-600 text-white font-medium py-3 px-4 rounded-lg shadow-sm active:scale-[0.98]"
        >
          Atur Budget Sekarang
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
        <div className="bg-primary-50 rounded-xl p-4 border border-primary-100">
          <p className="text-sm text-primary-800">
            <span className="font-bold">Insight:</span> Pengeluaran terbesar bulan ini untuk <strong>{data.top_category.name}</strong> ({formatter.format(data.top_category.total)})
          </p>
        </div>
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
                <div className="text-right">
                  <span className="font-bold text-gray-900">{formatter.format(exp.amount)}</span>
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
    </div>
  )
}
