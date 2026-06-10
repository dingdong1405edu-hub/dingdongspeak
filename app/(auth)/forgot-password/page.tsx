'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      // In a real app: call /api/auth/forgot-password to send reset email
      await new Promise(r => setTimeout(r, 1000)) // simulate API call
      setSent(true)
    } catch {
      toast.error('Có lỗi xảy ra. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="soft-card rounded-3xl p-8 text-center"
      >
        <CheckCircle size={48} className="text-emerald-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-[var(--text)] mb-2">Email đã được gửi!</h2>
        <p className="text-[var(--text-secondary)] text-sm mb-6">
          Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến <strong className="text-[var(--text)]">{email}</strong>.
          Vui lòng kiểm tra hộp thư (kể cả thư rác).
        </p>
        <Link href="/login"
          className="inline-flex items-center gap-2 text-[var(--brand)] hover:opacity-80 text-sm font-medium transition-colors">
          <ArrowLeft size={16} /> Quay lại đăng nhập
        </Link>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="soft-card rounded-3xl p-8"
    >
      <Link href="/login" className="inline-flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[var(--text)] text-sm mb-6 transition-colors">
        <ArrowLeft size={15} /> Quay lại
      </Link>

      <h1 className="text-2xl font-bold text-[var(--text)] mb-2">Quên mật khẩu?</h1>
      <p className="text-[var(--text-secondary)] text-sm mb-8">
        Nhập email của bạn và chúng tôi sẽ gửi link đặt lại mật khẩu.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-[var(--text)] block mb-1.5">Email</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="email@example.com"
              required
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-[var(--brand)] transition-all"
            />
          </div>
        </div>

        <Button type="submit" variant="gradient" size="lg" loading={loading} className="w-full">
          {loading ? 'Đang gửi...' : 'Gửi link đặt lại mật khẩu'}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-[var(--text-secondary)]">
        Nhớ mật khẩu rồi?{' '}
        <Link href="/login" className="text-[var(--brand)] hover:opacity-80 font-medium transition-colors">
          Đăng nhập
        </Link>
      </div>
    </motion.div>
  )
}
