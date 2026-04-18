'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Crown, CheckCircle, Zap, Heart, Star, Shield, Gift, X, ExternalLink, Loader2, RefreshCw } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { PREMIUM_PLANS } from '@/types'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

const benefits = [
  { icon: Zap, text: 'Unlimited token — luyện tập không giới hạn' },
  { icon: Heart, text: 'Unlimited lives — không bao giờ hết mạng' },
  { icon: Star, text: 'Ưu tiên chấm điểm AI — kết quả nhanh hơn' },
  { icon: Shield, text: 'Analytics nâng cao — theo dõi tiến độ chi tiết' },
  { icon: Gift, text: 'Export PDF đẹp — bài học và từ vựng' },
  { icon: Crown, text: 'Badge Premium trên leaderboard' },
]

interface PaymentState {
  checkoutUrl: string
  qrCode: string | null
  orderCode: number
  plan: typeof PREMIUM_PLANS[0]
}

const POLL_INTERVAL = 3000
const PAYMENT_TIMEOUT = 15 * 60 // 15 minutes in seconds

export default function PremiumPage() {
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState(1)
  const [loading, setLoading] = useState(false)
  const [payment, setPayment] = useState<PaymentState | null>(null)
  const [payStatus, setPayStatus] = useState<'waiting' | 'paid'>('waiting')
  const [timeLeft, setTimeLeft] = useState(PAYMENT_TIMEOUT)
  const pollRef = useRef<NodeJS.Timeout | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  function clearTimers() {
    if (pollRef.current) clearInterval(pollRef.current)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  useEffect(() => {
    if (!payment) return
    setPayStatus('waiting')
    setTimeLeft(PAYMENT_TIMEOUT)

    // Poll payment status
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/payment/status?orderCode=${payment.orderCode}`)
        const data = await res.json()
        if (data.status === 'PAID') {
          clearTimers()
          setPayStatus('paid')
        }
      } catch { /* ignore */ }
    }, POLL_INTERVAL)

    // Countdown timer
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearTimers()
          setPayment(null)
          toast.error('Phiên thanh toán hết hạn. Vui lòng thử lại.')
          return 0
        }
        return t - 1
      })
    }, 1000)

    return clearTimers
  }, [payment])

  async function handleUpgrade() {
    setLoading(true)
    try {
      const plan = PREMIUM_PLANS[selectedPlan]
      const res = await fetch('/api/payment/create-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ months: plan.months }),
      })
      const data = await res.json()
      if (res.ok && data.checkoutUrl) {
        setPayment({ checkoutUrl: data.checkoutUrl, qrCode: data.qrCode, orderCode: data.orderCode, plan })
      } else {
        toast.error(data.error || 'Không thể tạo link thanh toán. Vui lòng thử lại.')
      }
    } catch (e: any) {
      toast.error(e?.message || 'Có lỗi xảy ra. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    clearTimers()
    setPayment(null)
    setPayStatus('waiting')
  }

  function formatTime(s: number) {
    const m = Math.floor(s / 60).toString().padStart(2, '0')
    const sec = (s % 60).toString().padStart(2, '0')
    return `${m}:${sec}`
  }

  return (
    <>
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 text-sm font-medium mb-4">
            <Crown size={14} /> DingDongSpeak Premium
          </div>
          <h1 className="text-3xl font-bold text-[var(--text)] mb-3">
            Luyện không giới hạn — Tiến bộ nhanh hơn
          </h1>
          <p className="text-[var(--text-secondary)] max-w-xl mx-auto">
            Hơn 10,000 học viên đã cải thiện band score với Premium. Bắt đầu ngay hôm nay.
          </p>
        </div>

        {/* Benefits */}
        <div className="grid sm:grid-cols-2 gap-3">
          {benefits.map(b => {
            const Icon = b.icon
            return (
              <div key={b.text} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
                <Icon size={18} className="text-yellow-400 flex-shrink-0" />
                <span className="text-sm text-[var(--text)]">{b.text}</span>
              </div>
            )
          })}
        </div>

        {/* Plans */}
        <div className="grid sm:grid-cols-3 gap-4">
          {PREMIUM_PLANS.map((plan, i) => (
            <motion.div
              key={plan.months}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedPlan(i)}
              className={cn(
                'relative cursor-pointer rounded-2xl border-2 p-6 transition-all',
                selectedPlan === i
                  ? 'border-yellow-500 bg-yellow-500/10'
                  : 'border-[var(--border)] bg-[var(--bg-card)] hover:border-yellow-500/40'
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="premium">Phổ biến nhất</Badge>
                </div>
              )}
              {plan.discount > 0 && (
                <div className="absolute top-3 right-3">
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-400/15 px-2 py-0.5 rounded-full">
                    -{plan.discount}%
                  </span>
                </div>
              )}
              <div className="text-center">
                <div className="text-sm text-[var(--text-secondary)] mb-2">{plan.label}</div>
                <div className="text-3xl font-bold text-[var(--text)] mb-1">
                  {(plan.price / 1000).toFixed(0)}k<span className="text-sm font-normal">đ</span>
                </div>
                <div className="text-xs text-[var(--text-secondary)]">
                  {Math.round(plan.price / plan.months / 1000)}k/tháng
                </div>
              </div>
              {selectedPlan === i && (
                <CheckCircle size={18} className="text-yellow-400 mx-auto mt-3" />
              )}
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center space-y-4">
          <Button
            variant="gradient"
            size="lg"
            className="w-full sm:w-auto sm:px-16 bg-gradient-to-r from-yellow-500 to-orange-500"
            onClick={handleUpgrade}
            loading={loading}
          >
            <Crown size={20} />
            Nâng cấp Premium — {PREMIUM_PLANS[selectedPlan].label}
          </Button>
          <p className="text-xs text-[var(--text-secondary)]">
            Thanh toán an toàn · Hủy bất cứ lúc nào · Hỗ trợ 24/7
          </p>
        </div>

        {/* Share & Earn */}
        <Card className="border-cyan-400/20 bg-gradient-to-r from-cyan-500/5 to-violet-600/5">
          <div className="flex items-start gap-4">
            <Gift size={32} className="text-cyan-400 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-[var(--text)] mb-1">Hoặc nhận Premium miễn phí!</h3>
              <p className="text-sm text-[var(--text-secondary)] mb-3">
                Giới thiệu 5 bạn bè đăng ký và hoàn thành bài luyện đầu tiên → nhận ngay <strong className="text-cyan-400">15 ngày Premium</strong>.
              </p>
              <Button variant="secondary" size="sm" onClick={() => router.push('/profile#referral')}>
                Xem link giới thiệu →
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* QR Payment Modal */}
      <AnimatePresence>
        {payment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) handleClose() }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              {payStatus === 'paid' ? (
                <div className="text-center space-y-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto"
                  >
                    <CheckCircle size={44} className="text-emerald-400" />
                  </motion.div>
                  <div>
                    <h2 className="text-2xl font-bold text-[var(--text)] mb-1">🎉 Kích hoạt thành công!</h2>
                    <p className="text-sm text-[var(--text-secondary)]">Premium đã được kích hoạt. Luyện tập không giới hạn ngay!</p>
                  </div>
                  <Button
                    variant="gradient"
                    size="lg"
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-500"
                    onClick={() => router.push('/dashboard')}
                  >
                    <Crown size={18} />
                    Bắt đầu luyện tập
                  </Button>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="font-bold text-[var(--text)]">Quét mã để thanh toán</h2>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {payment.plan.label} — {(payment.plan.price / 1000).toFixed(0)}k đồng
                      </p>
                    </div>
                    <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] transition-colors">
                      <X size={18} />
                    </button>
                  </div>

                  {/* QR Code */}
                  <div className="flex justify-center mb-4">
                    {payment.qrCode ? (
                      <div className="p-3 bg-white rounded-xl">
                        <QRCodeSVG
                          value={payment.qrCode}
                          size={220}
                          level="M"
                          includeMargin={false}
                        />
                      </div>
                    ) : (
                      <div className="w-[220px] h-[220px] bg-[var(--bg-secondary)] rounded-xl flex flex-col items-center justify-center gap-2 text-[var(--text-secondary)]">
                        <p className="text-xs text-center px-4">QR không khả dụng,<br />mở trang thanh toán bên dưới</p>
                      </div>
                    )}
                  </div>

                  {/* Status */}
                  <div className="flex items-center justify-center gap-2 mb-4 text-sm text-[var(--text-secondary)]">
                    <Loader2 size={14} className="animate-spin text-cyan-400" />
                    <span>Đang chờ thanh toán...</span>
                    <span className="font-mono text-yellow-400">{formatTime(timeLeft)}</span>
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-px bg-[var(--border)]" />
                    <span className="text-xs text-[var(--text-secondary)]">hoặc</span>
                    <div className="flex-1 h-px bg-[var(--border)]" />
                  </div>

                  {/* Fallback link */}
                  <a
                    href={payment.checkoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl border border-[var(--border)] text-sm text-[var(--text)] hover:bg-[var(--bg-secondary)] transition-colors"
                  >
                    <ExternalLink size={15} />
                    Mở trang thanh toán PayOS
                  </a>

                  <p className="text-xs text-center text-[var(--text-secondary)] mt-3">
                    Dùng app ngân hàng quét mã VietQR hoặc PayOS
                  </p>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
