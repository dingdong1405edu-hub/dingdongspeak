'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Crown, CheckCircle, Zap, Heart, Star, Shield, Gift } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { PREMIUM_PLANS } from '@/types'
import { cn } from '@/lib/utils'

const benefits = [
  { icon: Zap, text: 'Unlimited token — luyện tập không giới hạn' },
  { icon: Heart, text: 'Unlimited lives — không bao giờ hết mạng' },
  { icon: Star, text: 'Ưu tiên chấm điểm AI — kết quả nhanh hơn' },
  { icon: Shield, text: 'Analytics nâng cao — theo dõi tiến độ chi tiết' },
  { icon: Gift, text: 'Export PDF đẹp — bài học và từ vựng' },
  { icon: Crown, text: 'Badge Premium trên leaderboard' },
]

export default function PremiumPage() {
  const [selectedPlan, setSelectedPlan] = useState(1) // index
  const [loading, setLoading] = useState(false)

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
        window.location.href = data.checkoutUrl
      } else {
        toast.error('Không thể tạo link thanh toán. Vui lòng thử lại.')
      }
    } catch {
      toast.error('Có lỗi xảy ra. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
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

      {/* Share & Earn section */}
      <Card className="border-cyan-400/20 bg-gradient-to-r from-cyan-500/5 to-violet-600/5">
        <div className="flex items-start gap-4">
          <Gift size={32} className="text-cyan-400 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-[var(--text)] mb-1">Hoặc nhận Premium miễn phí!</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-3">
              Giới thiệu 5 bạn bè đăng ký và hoàn thành bài luyện đầu tiên → nhận ngay <strong className="text-cyan-400">15 ngày Premium</strong>.
            </p>
            <Button variant="secondary" size="sm" onClick={() => window.location.href = '/profile#referral'}>
              Xem link giới thiệu →
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
