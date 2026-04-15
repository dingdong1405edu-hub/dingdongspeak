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
        className="glass-dark rounded-3xl p-8 border border-white/10 text-center"
      >
        <CheckCircle size={48} className="text-emerald-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Email đã được gửi!</h2>
        <p className="text-white/60 text-sm mb-6">
          Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến <strong className="text-white">{email}</strong>.
          Vui lòng kiểm tra hộp thư (kể cả thư rác).
        </p>
        <Link href="/login"
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors">
          <ArrowLeft size={16} /> Quay lại đăng nhập
        </Link>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-dark rounded-3xl p-8 border border-white/10"
    >
      <Link href="/login" className="inline-flex items-center gap-1.5 text-white/50 hover:text-white/80 text-sm mb-6 transition-colors">
        <ArrowLeft size={15} /> Quay lại
      </Link>

      <h1 className="text-2xl font-bold text-white mb-2">Quên mật khẩu?</h1>
      <p className="text-white/50 text-sm mb-8">
        Nhập email của bạn và chúng tôi sẽ gửi link đặt lại mật khẩu.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-white/80 block mb-1.5">Email</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="email@example.com"
              required
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all"
            />
          </div>
        </div>

        <Button type="submit" variant="gradient" size="lg" loading={loading} className="w-full">
          {loading ? 'Đang gửi...' : 'Gửi link đặt lại mật khẩu'}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-white/50">
        Nhớ mật khẩu rồi?{' '}
        <Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
          Đăng nhập
        </Link>
      </div>
    </motion.div>
  )
}
