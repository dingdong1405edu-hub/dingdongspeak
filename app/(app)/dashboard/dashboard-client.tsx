'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Flame, Zap, Clock, TrendingUp, Heart, Star,
  BookOpen, Mic, GraduationCap, Trophy, Gift, Crown
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ContributionHeatmap } from '@/components/dashboard/heatmap'
import { Leaderboard } from '@/components/dashboard/leaderboard'
import { cn, bandToColor } from '@/lib/utils'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

interface DashboardData {
  user: {
    name?: string | null
    tokens: number
    lives: number
    isPremiumActive?: boolean | null
    nextRegenMinutes?: number
    referralCode?: string | null
  }
  streakData: { date: string; practiced: boolean }[]
  currentStreak: number
  longestStreak: number
  totalSessions: number
  weeklyMinutes: number
  avgBand: string | null
  leaderboard: {
    userId: string; name: string; avatar?: string | null;
    totalMinutes: number; totalSessions: number; rank: number;
  }[]
  recentSessions: { createdAt: Date; duration: number; type: string; scores: unknown }[]
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
}

export function DashboardClient({ data, userId }: { data: DashboardData; userId: string }) {
  const { user, currentStreak, longestStreak, totalSessions, weeklyMinutes, avgBand, leaderboard } = data

  const quickActions = [
    { href: '/learn', icon: BookOpen, label: 'Beginner Path', color: 'from-emerald-500 to-cyan-500', desc: 'Tiếp tục hành trình' },
    { href: '/practice', icon: Mic, label: 'IELTS Practice', color: 'from-cyan-500 to-violet-600', desc: 'Luyện với AI giám khảo' },
    { href: '/mock-test', icon: GraduationCap, label: 'Mock Test', color: 'from-violet-600 to-pink-500', desc: 'Thi thử như thật' },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">
            Xin chào, {user.name || 'bạn'} 👋
          </h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            {format(new Date(), "EEEE, dd 'tháng' MM, yyyy", { locale: vi })}
          </p>
        </div>
        {!user.isPremiumActive && (
          <Link href="/premium" className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 text-yellow-400 text-sm font-medium hover:opacity-80 transition-all">
            <Crown size={16} />
            Nâng lên Premium
          </Link>
        )}
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Streak', value: `${currentStreak} ngày`, icon: Flame, color: 'text-orange-400', sub: `Kỷ lục: ${longestStreak} ngày` },
          {
            label: user.isPremiumActive ? 'Premium ∞' : `Token còn lại`,
            value: user.isPremiumActive ? '∞' : user.tokens,
            icon: user.isPremiumActive ? Crown : Zap,
            color: user.isPremiumActive ? 'text-yellow-400' : 'text-cyan-400',
            sub: user.isPremiumActive ? 'Không giới hạn' : 'Lượt luyện tập'
          },
          { label: 'Band trung bình', value: avgBand || '—', icon: TrendingUp, color: avgBand ? bandToColor(parseFloat(avgBand)) : 'text-[var(--text-secondary)]', sub: '30 ngày gần nhất' },
          { label: 'Tuần này', value: `${weeklyMinutes} phút`, icon: Clock, color: 'text-violet-400', sub: `${totalSessions} bài tổng` },
        ].map((stat, i) => {
          const Icon = stat.icon
          return (
            <motion.div key={stat.label} variants={fadeUp} initial="hidden" animate="visible" custom={i}>
              <Card className="relative overflow-hidden">
                <div className="flex items-start justify-between mb-3">
                  <Icon size={20} className={stat.color} />
                  <div className={cn('text-2xl font-bold', stat.color)}>{stat.value}</div>
                </div>
                <div className="text-sm font-medium text-[var(--text)]">{stat.label}</div>
                <div className="text-xs text-[var(--text-secondary)] mt-0.5">{stat.sub}</div>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Lives display */}
      {!user.isPremiumActive && (
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={4}>
          <Card className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Heart key={i} size={22} className={cn('transition-colors', i < user.lives ? 'text-red-500 fill-red-500' : 'text-[var(--border)]')} />
              ))}
            </div>
            <div>
              <div className="text-sm font-medium text-[var(--text)]">
                {user.lives}/5 mạng
              </div>
              {user.lives < 5 && (
                <div className="text-xs text-[var(--text-secondary)]">
                  Hồi 1 mạng sau {user.nextRegenMinutes || 30} phút
                </div>
              )}
            </div>
            {user.lives < 5 && (
              <Link href="/premium" className="ml-auto text-xs text-cyan-400 hover:underline flex items-center gap-1">
                <Crown size={12} /> Nạp premium để mạng không giới hạn
              </Link>
            )}
          </Card>
        </motion.div>
      )}

      {/* Quick actions */}
      <div className="grid sm:grid-cols-3 gap-4">
        {quickActions.map((action, i) => {
          const Icon = action.icon
          return (
            <motion.div key={action.href} variants={fadeUp} initial="hidden" animate="visible" custom={i + 4}>
              <Link href={action.href}>
                <div className="card-hover rounded-2xl p-5 border border-[var(--border)] bg-[var(--bg-card)] group cursor-pointer">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <Icon size={20} className="text-white" />
                  </div>
                  <div className="font-semibold text-[var(--text)] text-sm">{action.label}</div>
                  <div className="text-xs text-[var(--text-secondary)] mt-0.5">{action.desc}</div>
                </div>
              </Link>
            </motion.div>
          )
        })}
      </div>

      {/* Heatmap */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={7}>
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[var(--text)]">Hoạt động luyện tập</h2>
            <Badge variant="info">
              <Flame size={10} className="text-orange-400" />
              {currentStreak} ngày streak
            </Badge>
          </div>
          <ContributionHeatmap data={data.streakData} />
        </Card>
      </motion.div>

      {/* Share & Earn */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={8}>
        <div className="rounded-2xl bg-gradient-to-r from-cyan-500/10 to-violet-600/10 border border-cyan-400/20 p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center flex-shrink-0">
              <Gift size={22} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-[var(--text)]">Chia sẻ nhận 15 ngày Premium!</h3>
              <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                Giới thiệu 5 bạn bè đăng ký và luyện tập — nhận ngay 15 ngày Premium miễn phí.
              </p>
            </div>
            <Link href="/profile#referral"
              className="flex-shrink-0 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 text-white text-sm font-medium hover:opacity-90 transition-all"
            >
              Chia sẻ ngay
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Leaderboard */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={9}>
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={18} className="text-yellow-400" />
            <h2 className="font-semibold text-[var(--text)]">Bảng vinh danh tháng này</h2>
          </div>
          <Leaderboard data={leaderboard} currentUserId={userId} />
        </Card>
      </motion.div>
    </div>
  )
}
