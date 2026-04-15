'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Mail, Lock, User, Eye, EyeOff, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'

export default function RegisterPage() {
  const router = useRouter()
  const params = useSearchParams()
  const ref = params.get('ref') || ''

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password !== form.confirm) {
      toast.error('Mật khẩu xác nhận không khớp')
      return
    }
    if (form.password.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password, ref }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Đăng ký thất bại')
        return
      }

      // Auto sign in
      const signInRes = await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      })

      if (signInRes?.error) {
        toast.success('Đăng ký thành công! Vui lòng đăng nhập.')
        router.push('/login')
      } else {
        toast.success('Chào mừng đến với DingDongSpeak! 🎉')
        router.push('/dashboard')
        router.refresh()
      }
    } catch {
      toast.error('Có lỗi xảy ra. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-dark rounded-3xl p-8 border border-white/10"
    >
      <h1 className="text-2xl font-bold text-white mb-2">Tạo tài khoản</h1>
      <p className="text-white/50 text-sm mb-8">Bắt đầu hành trình luyện IELTS Speaking với AI.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {[
          { label: 'Tên hiển thị', key: 'name', type: 'text', icon: User, placeholder: 'Nguyễn Văn A' },
          { label: 'Email', key: 'email', type: 'email', icon: Mail, placeholder: 'email@example.com' },
          { label: 'Mật khẩu', key: 'password', type: showPw ? 'text' : 'password', icon: Lock, placeholder: '••••••••' },
          { label: 'Xác nhận mật khẩu', key: 'confirm', type: showPw ? 'text' : 'password', icon: Lock, placeholder: '••••••••' },
        ].map(field => {
          const Icon = field.icon
          return (
            <div key={field.key}>
              <label className="text-sm font-medium text-white/80 block mb-1.5">{field.label}</label>
              <div className="relative">
                <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type={field.type}
                  value={form[field.key as keyof typeof form]}
                  onChange={e => setForm(p => ({ ...p, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all"
                />
                {(field.key === 'password' || field.key === 'confirm') && (
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                )}
              </div>
            </div>
          )
        })}

        {ref && (
          <p className="text-xs text-cyan-400/70 bg-cyan-400/10 px-3 py-2 rounded-lg">
            🎁 Bạn được giới thiệu — cả hai sẽ nhận thưởng sau khi hoàn thành bài đầu tiên!
          </p>
        )}

        <p className="text-xs text-white/30">
          Bằng cách đăng ký, bạn đồng ý với{' '}
          <Link href="/" className="text-cyan-400 underline">Điều khoản</Link> và{' '}
          <Link href="/" className="text-cyan-400 underline">Chính sách bảo mật</Link>.
        </p>

        <Button type="submit" variant="gradient" size="lg" loading={loading} className="w-full">
          <UserPlus size={18} />
          {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản miễn phí'}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-white/50">
        Đã có tài khoản?{' '}
        <Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
          Đăng nhập
        </Link>
      </div>
    </motion.div>
  )
}
