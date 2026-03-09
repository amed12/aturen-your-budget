'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, PieChart } from 'lucide-react'

type ReportData = {
  total_spent: number
  breakdown: Array<{
    name: string
    amount: number
    percentage: number
  }>
}

export default function ReportsPage() {
  const router = useRouter()
  const [data, setData] = useState<ReportData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchReport() {
      try {
        const now = new Date()
        const month = now.getMonth() + 1
        const year = now.getFullYear()
        
        const budgetRes = await fetch(`/api/budgets?month=${month}&year=${year}`)
        const budgetJson = await budgetRes.json()
        
        if (!budgetJson.budget) {
          setIsLoading(false)
          return
        }

        const reportRes = await fetch(`/api/reports?budget_id=${budgetJson.budget.id}`)
        const reportJson = await reportRes.json()
        setData(reportJson)
      } catch (error) {
        console.error('Failed to load report', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchReport()
  }, [])

  const formatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto relative pb-24 shadow-2xl">
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          <header className="flex items-center gap-4">
            <button 
              onClick={() => router.back()}
              className="bg-white text-gray-700 p-2 rounded-full shadow-sm active:scale-95 transition-transform"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Laporan Pengeluaran</h1>
              <p className="text-sm text-gray-500">{new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</p>
            </div>
          </header>

          {isLoading ? (
            <div className="text-center p-8 text-gray-500">Memuat laporan...</div>
          ) : !data || data.breakdown.length === 0 ? (
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
            <div className="space-y-6">
              {/* Summary Card */}
              <div className="bg-primary-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
                <div className="relative z-10 space-y-1">
                  <p className="text-sm font-medium text-primary-200">Total Pengeluaran Bulan Ini</p>
                  <p className="text-3xl font-bold">
                    {formatter.format(data.total_spent)}
                  </p>
                </div>
                {/* Decorative blob */}
                <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-primary-800 rounded-full blur-2xl opacity-50"></div>
              </div>

              {/* Breakdown List */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
                <h3 className="font-bold text-gray-900">Breakdown Kategori</h3>
                
                <div className="space-y-5">
                  {data.breakdown.map((item, idx) => {
                    // Top 3 categories get distinct colors, the rest get gray
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
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
