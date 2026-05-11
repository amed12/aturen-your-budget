'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'

const loginSchema = z.object({
  username: z.string().min(1, 'Username wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema)
  })

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      const json = await res.json()
      
      if (!res.ok) {
        toast.error(json.error || 'Gagal login')
      } else {
        toast.success('Login berhasil ✨')
        router.push('/dashboard')
        router.refresh()
      }
    } catch (error) {
      toast.error('Terjadi kesalahan')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div 
      className="flex flex-col min-h-screen items-center justify-center p-6"
      style={{ background: 'linear-gradient(165deg, #FFF8F3 0%, #FFE8D6 50%, #FFF5EE 100%)' }}
    >
      <div className="w-full max-w-sm space-y-8 animate-fadeInUp">
        {/* Logo & Greeting */}
        <div className="text-center space-y-3">
          <div className="text-5xl mb-2 animate-float">👋</div>
          <h1 
            className="text-3xl font-extrabold tracking-tight"
            style={{ fontFamily: 'var(--font-nunito), sans-serif', color: '#3D2C2E' }}
          >
            Halo, Mama!
          </h1>
          <p className="text-[#8B7E74] text-sm">Masuk dulu yuk, biar keuangannya rapi ✨</p>
        </div>

        {/* Form Card */}
        <div className="glass-card-strong rounded-3xl p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label 
                className="block text-xs font-bold uppercase tracking-wider mb-2" 
                style={{ fontFamily: 'var(--font-nunito), sans-serif', color: '#8B7E74' }}
              >
                Username
              </label>
              <input
                {...register('username')}
                type="text"
                autoCapitalize="none"
                className="block w-full rounded-2xl border-2 border-primary-100 px-4 py-3.5 text-[#3D2C2E] bg-primary-50/30 focus:outline-none transition-all placeholder:text-[#B0A59D]"
                placeholder="nama.kamu"
              />
              {errors.username && <p className="mt-1.5 text-sm text-danger-500 font-medium">{errors.username.message}</p>}
            </div>

            <div>
              <label 
                className="block text-xs font-bold uppercase tracking-wider mb-2" 
                style={{ fontFamily: 'var(--font-nunito), sans-serif', color: '#8B7E74' }}
              >
                Password
              </label>
              <input
                {...register('password')}
                type="password"
                className="block w-full rounded-2xl border-2 border-primary-100 px-4 py-3.5 text-[#3D2C2E] bg-primary-50/30 focus:outline-none transition-all placeholder:text-[#B0A59D]"
                placeholder="••••••••"
              />
              {errors.password && <p className="mt-1.5 text-sm text-danger-500 font-medium">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 px-4 rounded-2xl text-base font-bold text-white press-effect transition-all disabled:opacity-50"
              style={{
                fontFamily: 'var(--font-nunito), sans-serif',
                background: 'linear-gradient(135deg, #E8A87C 0%, #D4845A 100%)',
                boxShadow: '0 4px 16px rgba(212, 132, 90, 0.3)',
              }}
            >
              {isLoading ? 'Memproses...' : 'Masuk 🚀'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[#8B7E74]">
          Belum punya akun?{' '}
          <Link href="/register" className="font-bold text-primary-600 hover:text-primary-500">
            Yuk daftar dulu! ✨
          </Link>
        </p>
      </div>
    </div>
  )
}
