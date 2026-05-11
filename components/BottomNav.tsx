'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, PlusCircle, Bookmark, Settings, PieChart } from 'lucide-react'

export function BottomNav() {
  const pathname = usePathname()

  // Don't show on auth pages
  if (pathname === '/login' || pathname === '/register') return null

  const navItems = [
    { name: 'Home', href: '/dashboard', icon: Home, emoji: '🏠' },
    { name: 'Reserved', href: '/reserved', icon: Bookmark, emoji: '🔒' },
    { name: 'Catat', href: '/expenses', icon: PlusCircle, isMain: true, emoji: '✏️' },
    { name: 'Laporan', href: '/reports', icon: PieChart, emoji: '📊' },
    { name: 'Settings', href: '/settings', icon: Settings, emoji: '⚙️' },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50 animate-slideUp" style={{ animationDelay: '200ms' }}>
      <div 
        className="mx-3 mb-3 px-4 py-3 rounded-2xl pb-safe"
        style={{
          background: 'rgba(255, 253, 251, 0.85)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(232, 168, 124, 0.15)',
          boxShadow: '0 -4px 32px rgba(139, 74, 39, 0.08), 0 4px 16px rgba(139, 74, 39, 0.04)',
        }}
      >
        <div className="flex justify-between items-center">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            if (item.isMain) {
              return (
                <Link key={item.name} href={item.href} className="relative -top-7">
                  <div 
                    className="rounded-full p-4 press-effect"
                    style={{
                      background: 'linear-gradient(135deg, #E8A87C 0%, #D4845A 100%)',
                      boxShadow: '0 6px 20px rgba(212, 132, 90, 0.35), 0 2px 8px rgba(212, 132, 90, 0.2)',
                    }}
                  >
                    <Icon size={28} className="text-white" />
                  </div>
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary-500" />
                  )}
                </Link>
              )
            }

            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'text-primary-600' 
                    : 'text-[#B0A59D] hover:text-primary-400'
                }`}
              >
                <div className="relative">
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  {isActive && (
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary-500 animate-bounceIn" />
                  )}
                </div>
                <span className="text-[10px] font-semibold" style={{ fontFamily: 'var(--font-nunito), sans-serif' }}>
                  {item.name}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
