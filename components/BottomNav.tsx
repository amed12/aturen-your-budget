'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, PlusCircle, Bookmark, Settings } from 'lucide-react'

export function BottomNav() {
  const pathname = usePathname()

  // Don't show on auth pages
  if (pathname === '/login' || pathname === '/register') return null

  const navItems = [
    { name: 'Home', href: '/dashboard', icon: Home },
    { name: 'Reserved', href: '/reserved', icon: Bookmark },
    { name: 'Catat', href: '/expenses', icon: PlusCircle, isMain: true },
    { name: 'Settings', href: '/settings', icon: Settings },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-200 px-6 py-3 pb-safe">
      <div className="flex justify-between items-center">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          if (item.isMain) {
            return (
              <Link key={item.name} href={item.href} className="relative -top-6">
                <div className="bg-primary-600 rounded-full p-4 shadow-lg active:scale-95 transition-transform">
                  <Icon size={28} className="text-white" />
                </div>
              </Link>
            )
          }

          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`flex flex-col items-center gap-1 ${isActive ? 'text-primary-600' : 'text-gray-400'}`}
            >
              <Icon size={24} />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
