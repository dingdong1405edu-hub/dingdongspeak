'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Crown, CheckCircle, Clock, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function PremiumSuccessPage() {
  const params = useSearchParams()
  const orderCode = params.get('orderCode')
  const [status, setStatus] = useState<'checking' | 'success' | 'pending'>('checking')

  useEffect(() => {
    const check = async () => {
      if (!orderCode) { setStatus('pending'); return }
      try {
        const res = await fetch(`/api/payment/status?orderCode=${orderCode}`)
        const data = await res.json()
        setStatus(data.status === 'PAID' ? 'success' : 'pending')
      } catch {
        setStatus('pending')
      }
    }
    // Wait 2s for webhook to process before checking
    const timer = setTimeout(check, 2000)
    return () => clearTimeout(timer)
  }, [orderCode])

  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      {status === 'checking' ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <Loader2 size={48} className="text-cyan-400 animate-spin mx-auto" />
          <p className="text-[var(--text-secondary)]">Đang xác nhận thanh toán...</p>
        </motion.div>
      ) : status === 'success' ? (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
          <div className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
            <CheckCircle size={52} className="text-emerald-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[var(--text)] mb-2">🎉 Đã kích hoạt Premium!</h1>
            <p className="text-[var(--text-secondary)]">Luyện tập không giới hạn ngay bây giờ.</p>
          </div>
          <Link href="/dashboard">
            <Button variant="gradient" size="lg" className="w-full bg-gradient-to-r from-yellow-500 to-orange-500">
              <Crown size={18} />
              Bắt đầu luyện tập
            </Button>
          </Link>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="w-24 h-24 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto">
            <Clock size={52} className="text-yellow-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text)] mb-2">Đang xử lý thanh toán</h1>
            <p className="text-[var(--text-secondary)]">
              Premium sẽ được kích hoạt trong vài phút sau khi xác nhận từ ngân hàng.
            </p>
          </div>
          <Link href="/dashboard">
            <Button variant="secondary" size="lg" className="w-full">Về Dashboard</Button>
          </Link>
        </motion.div>
      )}
    </div>
  )
}
