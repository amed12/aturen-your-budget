'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Wifi, WifiOff } from 'lucide-react'

export function OfflineSync() {
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => console.log('SW Reg Failed', err));
    }

    // Initial check
    setIsOffline(!navigator.onLine)

    const handleOnline = async () => {
      setIsOffline(false)
      // Check for queued expenses
      const queued = localStorage.getItem('aturen_offline_queue')
      if (queued) {
        try {
          const expenses = JSON.parse(queued)
          if (expenses.length > 0) {
            toast.loading(`Sinkronisasi ${expenses.length} pengeluaran tersimpan...`, { id: 'sync' })
            
            // Send requests one by one or bulk (if backend supports). One by one is easier for MVP.
            for (const exp of expenses) {
              await fetch('/api/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(exp)
              })
            }
            
            localStorage.removeItem('aturen_offline_queue')
            toast.success('Pengeluaran berhasil disinkronisasi ke server!', { id: 'sync' })
            window.location.reload() // Refresh to update dashboard balances
          }
        } catch (e) {
          toast.error('Gagal sinkronisasi data dari memori lokal', { id: 'sync' })
        }
      }
    }

    const handleOffline = () => {
      setIsOffline(true)
      toast('Terputus dari Internet. Masuk ke Mode Offline.', { icon: '📵' })
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Run online sync immediately in case they reloaded online with items
    if (navigator.onLine) handleOnline()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!isOffline) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-warning-500 text-white text-xs font-bold px-4 py-1.5 flex items-center justify-center gap-2 shadow-md">
      <WifiOff size={14} /> Mode Offline Aktif - Data akan disimpan di HP Anda sementara.
    </div>
  )
}
