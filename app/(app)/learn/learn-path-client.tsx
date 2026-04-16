'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { BookOpen, Settings, Mic, Lock, Check, Star, Heart, Zap, Flame, Trophy, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StageData } from '@/lib/lessons-data'

const TYPE_CONFIG = {
  vocabulary: {
    icon: BookOpen,
    label: 'Từ vựng',
    bg: 'bg-emerald-500',
    ring: 'ring-emerald-400',
    text: 'text-emerald-400',
    glow: 'shadow-emerald-500/60',
    badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-400/30',
  },
  grammar: {
    icon: Settings,
    label: 'Ngữ pháp',
    bg: 'bg-blue-500',
    ring: 'ring-blue-400',
    text: 'text-blue-400',
    glow: 'shadow-blue-500/60',
    badge: 'bg-blue-500/15 text-blue-400 border-blue-400/30',
  },
  speaking: {
    icon: Mic,
    label: 'Luyện nói',
    bg: 'bg-violet-500',
    ring: 'ring-violet-400',
    text: 'text-violet-400',
    glow: 'shadow-violet-500/60',
    badge: 'bg-violet-500/15 text-violet-400 border-violet-400/30',
  },
}

// Zigzag x-offsets (px): left=0, center=50%, right=100%
const ZIGZAG_JUSTIFY = ['justify-start', 'justify-center', 'justify-end']
const ZIGZAG_PAD     = ['pl-4',          '',               'pr-4']

interface Props {
  stages: StageData[]
  completedIds: Set<string>
  user: { lives: number | null; tokens: number | null; isPremium: boolean | null; premiumUntil: Date | null } | null
  totalXP: number
}

export function LearnPathClient({ stages, completedIds, user, totalXP }: Props) {
  const isPremium = user?.isPremium && user?.premiumUntil && new Date(user.premiumUntil) > new Date()
  const totalLessons = stages.reduce((s, st) => s + st.lessons.length, 0)
  const totalCompleted = completedIds.size
  const overallPct = totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0

  function isUnlocked(stageIdx: number, lessonIdx: number) {
    if (stageIdx === 0 && lessonIdx === 0) return true
    const stage = stages[stageIdx]
    if (lessonIdx > 0) return completedIds.has(stage.lessons[lessonIdx - 1].id)
    const prevStage = stages[stageIdx - 1]
    return prevStage?.lessons.every(l => completedIds.has(l.id)) ?? false
  }

  // find the first unlocked+incomplete lesson
  let currentLessonId: string | null = null
  for (const stage of stages) {
    for (const lesson of stage.lessons) {
      if (!completedIds.has(lesson.id)) {
        currentLessonId = lesson.id
        break
      }
    }
    if (currentLessonId) break
  }

  let globalIdx = 0

  return (
    <div className="max-w-md mx-auto pb-24">

      {/* ── Hero header ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-cyan-600 via-cyan-500 to-violet-600 p-6 mb-6 shadow-2xl"
      >
        {/* Background orbs */}
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full bg-white/10 blur-3xl" />

        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Beginner Path</h1>
              <p className="text-white/70 text-sm mt-0.5">Từ A1 → B2 · {totalLessons} bài học</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black text-white">{totalXP}</div>
              <div className="text-[11px] text-white/70 font-medium uppercase tracking-widest">XP</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-3 rounded-full bg-white/20 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-white"
              initial={{ width: 0 }}
              animate={{ width: `${overallPct}%` }}
              transition={{ duration: 1.4, ease: 'easeOut' }}
            />
          </div>
          <div className="flex justify-between items-center mt-1.5">
            <span className="text-xs text-white/70">{totalCompleted}/{totalLessons} bài hoàn thành</span>
            <span className="text-xs text-white font-bold">{overallPct}%</span>
          </div>
        </div>
      </motion.div>

      {/* ── Stats chips ── */}
      <div className="flex gap-2 mb-8">
        <div className="flex-1 flex items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] py-3">
          <Heart size={16} className="text-red-400 fill-red-400" />
          <span className="text-sm font-bold text-[var(--text)]">{isPremium ? '∞' : (user?.lives ?? 0)}</span>
          <span className="text-xs text-[var(--text-secondary)]">mạng</span>
        </div>
        <div className="flex-1 flex items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] py-3">
          <Zap size={16} className="text-cyan-400" />
          <span className="text-sm font-bold text-[var(--text)]">{isPremium ? '∞' : (user?.tokens ?? 0)}</span>
          <span className="text-xs text-[var(--text-secondary)]">lượt</span>
        </div>
        <div className="flex-1 flex items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] py-3">
          <Flame size={16} className="text-orange-400" />
          <span className="text-sm font-bold text-[var(--text)]">0</span>
          <span className="text-xs text-[var(--text-secondary)]">ngày</span>
        </div>
      </div>

      {/* ── Stages ── */}
      <div className="space-y-10">
        {stages.map((stage, si) => {
          const stageCompleted = stage.lessons.every(l => completedIds.has(l.id))
          const stageStarted   = stage.lessons.some(l => completedIds.has(l.id))
          const stageDone      = stage.lessons.filter(l => completedIds.has(l.id)).length
          const stagePct       = Math.round((stageDone / stage.lessons.length) * 100)

          return (
            <div key={stage.id}>
              {/* Stage banner */}
              <motion.div
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: si * 0.07 }}
                className={cn('rounded-2xl p-4 bg-gradient-to-r text-white shadow-lg mb-6 relative overflow-hidden', stage.color)}
              >
                <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10 blur-2xl" />
                <div className="relative flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                    <span className="text-2xl">{stage.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold uppercase tracking-widest opacity-75">{stage.title}</div>
                    <div className="font-extrabold text-lg leading-tight truncate">{stage.subtitle}</div>
                    <div className="mt-1.5 h-1.5 rounded-full bg-white/25 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-white"
                        initial={{ width: 0 }}
                        animate={{ width: `${stagePct}%` }}
                        transition={{ duration: 0.8, delay: si * 0.1 + 0.2 }}
                      />
                    </div>
                  </div>
                  <div className="shrink-0 text-right ml-2">
                    {stageCompleted ? (
                      <div className="flex flex-col items-center gap-1">
                        <Trophy size={22} />
                        <span className="text-[10px] font-bold uppercase">Done!</span>
                      </div>
                    ) : (
                      <>
                        <div className="text-xl font-black">{stagePct}%</div>
                        <div className="text-[11px] opacity-70">{stageStarted ? 'đang học' : 'chưa bắt đầu'}</div>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Lesson nodes */}
              <div className="relative">
                {/* Vertical connector line */}
                <div
                  className="absolute left-1/2 top-10 -translate-x-px w-0.5 pointer-events-none"
                  style={{ height: `calc(100% - 40px)` }}
                >
                  <div className="w-full h-full bg-gradient-to-b from-[var(--border)] via-[var(--border)] to-transparent opacity-50" />
                </div>

                <div className="flex flex-col gap-5">
                  {stage.lessons.map((lesson, li) => {
                    const pos       = globalIdx % 3
                    const unlocked  = isUnlocked(si, li)
                    const completed = completedIds.has(lesson.id)
                    const isCurrent = lesson.id === currentLessonId
                    const cfg       = TYPE_CONFIG[lesson.type]
                    const Icon      = cfg.icon
                    globalIdx++

                    return (
                      <motion.div
                        key={lesson.id}
                        initial={{ opacity: 0, scale: 0.75 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: si * 0.07 + li * 0.08, type: 'spring', bounce: 0.35 }}
                        className={cn('flex items-center', ZIGZAG_JUSTIFY[pos], ZIGZAG_PAD[pos])}
                      >
                        <div className="flex flex-col items-center gap-2">
                          {/* ── Node ── */}
                          <Link
                            href={unlocked ? `/learn/lesson/${lesson.id}` : '#'}
                            className={cn(
                              'relative w-24 h-24 rounded-3xl flex flex-col items-center justify-center gap-1.5 transition-all duration-200 select-none',
                              completed  && 'bg-gradient-to-br from-yellow-400 to-amber-500 shadow-xl shadow-yellow-500/40',
                              isCurrent  && `${cfg.bg} shadow-xl ${cfg.glow} hover:scale-110 active:scale-95 cursor-pointer`,
                              !isCurrent && unlocked && !completed && `${cfg.bg} opacity-75 hover:opacity-100 hover:scale-105 active:scale-95 cursor-pointer`,
                              !unlocked  && 'bg-[var(--bg-secondary)] border-2 border-dashed border-[var(--border)] cursor-not-allowed',
                            )}
                          >
                            {/* Pulsing ring for current lesson */}
                            {isCurrent && (
                              <motion.div
                                className={cn('absolute inset-0 rounded-3xl ring-4', cfg.ring)}
                                animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.1, 1] }}
                                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                              />
                            )}

                            {completed ? (
                              <>
                                <Check size={28} className="text-white" strokeWidth={3} />
                                <div className="flex gap-0.5">
                                  {[1,2,3].map(s => <Star key={s} size={10} className="text-white fill-white" />)}
                                </div>
                              </>
                            ) : unlocked ? (
                              <>
                                <Icon size={26} className="text-white" />
                                <span className="text-[10px] font-black text-white uppercase tracking-wide">
                                  {isCurrent ? 'Bắt đầu' : cfg.label.slice(0, 6)}
                                </span>
                              </>
                            ) : (
                              <>
                                <Lock size={22} className="text-[var(--text-secondary)] opacity-60" />
                                <span className="text-[10px] text-[var(--text-secondary)] opacity-60 uppercase">Khoá</span>
                              </>
                            )}
                          </Link>

                          {/* Label below node */}
                          <div className="text-center max-w-[108px]">
                            <span className={cn(
                              'inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border mb-1',
                              unlocked ? cfg.badge : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border)]'
                            )}>
                              {cfg.label}
                            </span>
                            <div className={cn(
                              'text-xs font-medium leading-tight',
                              unlocked ? 'text-[var(--text)]' : 'text-[var(--text-secondary)] opacity-60'
                            )}>
                              {lesson.title}
                            </div>
                            {completed ? (
                              <div className="text-[10px] text-yellow-400 font-bold mt-0.5">+{lesson.xp} XP ✓</div>
                            ) : unlocked ? (
                              <div className="text-[10px] text-cyan-400 font-semibold mt-0.5">+{lesson.xp} XP</div>
                            ) : null}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>

              {/* Stage completed banner */}
              {stageCompleted && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-5 flex items-center justify-center gap-2 rounded-2xl border border-yellow-400/30 bg-yellow-400/8 py-3"
                >
                  <Trophy size={15} className="text-yellow-400" />
                  <span className="text-sm font-bold text-yellow-400">Stage {si + 1} hoàn thành!</span>
                  <Flame size={14} className="text-orange-400" />
                </motion.div>
              )}

              {/* Divider to next stage */}
              {si < stages.length - 1 && (
                <div className="flex flex-col items-center gap-1 my-4">
                  <div className="w-0.5 h-6 bg-[var(--border)] opacity-40 rounded-full" />
                  <ChevronRight size={14} className="text-[var(--text-secondary)] opacity-40 rotate-90" />
                  <div className="w-0.5 h-6 bg-[var(--border)] opacity-40 rounded-full" />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── All done ── */}
      {totalCompleted === totalLessons && totalLessons > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-10 text-center py-14 rounded-3xl border border-yellow-400/20 bg-gradient-to-br from-yellow-400/5 to-amber-400/5"
        >
          <div className="text-7xl mb-4">🏆</div>
          <h2 className="text-2xl font-black text-[var(--text)] mb-2">Xuất sắc!</h2>
          <p className="text-[var(--text-secondary)] mb-1">Bạn đã hoàn thành toàn bộ Beginner Path.</p>
          <p className="text-sm text-yellow-400 font-bold mb-6">{totalXP} XP tích luỹ ⭐</p>
          <Link
            href="/practice"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-600 text-white font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-cyan-500/25"
          >
            Bắt đầu IELTS Practice →
          </Link>
        </motion.div>
      )}
    </div>
  )
}
