'use client'

import { useEffect, useRef } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      document.addEventListener('mousedown', handleOutsideClick)
    }

    return () => {
      document.body.style.overflow = 'unset'
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{
        background: 'rgba(61, 44, 46, 0.3)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
      }}
    >
      <div 
        ref={modalRef}
        className="w-full sm:max-w-sm overflow-hidden animate-slideUp"
        style={{
          background: 'rgba(255, 253, 251, 0.97)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          borderRadius: '24px 24px 0 0',
          boxShadow: '0 -8px 40px rgba(139, 74, 39, 0.12)',
        }}
      >
        {/* Warm accent bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-primary-200" />
        </div>
        
        <div className="px-5 pb-2 pt-2 flex justify-between items-center">
          <h3 
            className="font-bold text-lg" 
            style={{ fontFamily: 'var(--font-nunito), sans-serif', color: '#3D2C2E' }}
          >
            {title}
          </h3>
          <button 
            onClick={onClose}
            className="text-[#B0A59D] hover:text-primary-600 transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-primary-50"
          >
            ✕
          </button>
        </div>
        <div className="px-5 pb-6 pt-1">
          {children}
        </div>
      </div>
    </div>
  )
}
