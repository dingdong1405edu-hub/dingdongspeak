'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Crown, Calendar, Copy, Gift, CheckCircle, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn, formatDate } from '@/lib/utils'

interface Props {
  user: {
    id: string; name?: string | null; email?: string | null
    avatar?: string | null; isPremium: boolean; isPremiumActive: boolean
    premiumUntil?: Date | null; tokens: number; lives: number
    referralCode?: string | null; createdAt: Date
  }
  referralStats: {
    total: number; valid: number; progress: number; referralLink: string
  }
}

export function ProfileClient({ user, referralStats }: Props) {
  const [copied, setCopied] = useState(false)

  function copyLink() {
    navigator.clipboard.writeText(referralStats.referralLink)
    setCopied(true)
    toast.success('Đã sao chép link!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-[var(--text)]">Hồ sơ</h1>

      {/* Avatar & info */}
      <Card>
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-600 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
            {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-[var(--text)]">{user.name || 'Người dùng'}</h2>
              {user.isPremiumActive && (
                <Badge variant="premium"><Crown size={10} /> Premium</Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] mt-1">
              <Mail size={14} /> {user.email}
            </div>
            <div className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] mt-1">
              <Calendar size={14} /> Tham gia từ {formatDate(user.createdAt)}
            </div>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Token', value: user.isPremiumActive ? '∞' : user.tokens, color: 'text-cyan-400' },
          { label: 'Mạng sống', value: user.isPremiumActive ? '∞' : user.lives, color: 'text-red-400' },
          { label: 'Premium', value: user.isPremiumActive ? 'Đang dùng' : 'Free', color: user.isPremiumActive ? 'text-yellow-400' : 'text-[var(--text-secondary)]' },
        ].map(s => (
          <Card key={s.label} className="text-center py-4">
            <div className={cn('text-2xl font-bold', s.color)}>{s.value}</div>
            <div className="text-xs text-[var(--text-secondary)] mt-0.5">{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Premium info */}
      {user.isPremiumActive && user.premiumUntil && (
        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <div className="flex items-center gap-3">
            <Crown size={20} className="text-yellow-400" />
            <div>
              <div className="font-semibold text-[var(--text)]">Premium đang hoạt động</div>
              <div className="text-sm text-[var(--text-secondary)]">
                Hết hạn: {formatDate(user.premiumUntil)}
              </div>
            </div>
            <Button variant="secondary" size="sm" className="ml-auto" onClick={() => window.location.href = '/premium'}>
              Gia hạn
            </Button>
          </div>
        </Card>
      )}

      {/* Referral section */}
      <Card id="referral">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift size={18} className="text-cyan-400" />
            Chia sẻ & Nhận thưởng
          </CardTitle>
        </CardHeader>

        <div className="space-y-4">
          {/* Progress */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-[var(--text-secondary)]">Tiến độ nhận thưởng</span>
              <span className="font-semibold text-[var(--text)]">{referralStats.valid}/5 bạn bè</span>
            </div>
            <div className="h-2.5 rounded-full bg-[var(--border)]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-600 transition-all"
                style={{ width: `${(referralStats.progress / 5) * 100}%` }}
              />
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-1.5">
              {referralStats.valid >= 5
                ? '🎉 Bạn đã đủ điều kiện nhận 15 ngày Premium!'
                : `Còn ${5 - referralStats.valid} bạn nữa để nhận 15 ngày Premium miễn phí`
              }
            </p>
          </div>

          {/* Link */}
          <div>
            <p className="text-sm text-[var(--text-secondary)] mb-2">Link giới thiệu của bạn:</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-sm text-[var(--text)] truncate font-mono">
                {referralStats.referralLink}
              </div>
              <Button variant="secondary" size="sm" onClick={copyLink}>
                {copied ? <CheckCircle size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </Button>
            </div>
          </div>

          {/* Rules */}
          <div className="bg-[var(--bg-secondary)] rounded-xl p-3 text-xs text-[var(--text-secondary)] space-y-1">
            <p>📋 <strong>Điều kiện:</strong></p>
            <p>• Bạn bè phải là người mới (chưa có tài khoản)</p>
            <p>• Họ phải hoàn thành ít nhất 1 bài luyện tập</p>
            <p>• Đủ 5 bạn hợp lệ → Nhận 15 ngày Premium tự động</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
