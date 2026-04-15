'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { BookOpen, Settings, Mic, Lock, CheckCircle, Star, Heart, Zap } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const typeIcons = {
  vocabulary: BookOpen,
  grammar: Settings,
  speaking: Mic,
}

const typeColors = {
  vocabulary: 'text-emerald-400',
  grammar: 'text-blue-400',
  speaking: 'text-violet-400',
}

interface Stage {
  id: string
  title: string
  color: string
  lessons: { id: string; title: string; type: 'vocabulary' | 'grammar' | 'speaking'; xp: number }[]
}

interface Props {
  stages: Stage[]
  completedIds: Set<string>
  user: { lives: number | null; tokens: number | null; isPremium: boolean | null; premiumUntil: Date | null } | null
}

export function LearnPathClient({ stages, completedIds, user }: Props) {
  const isPremium = user?.isPremium && user?.premiumUntil && user.premiumUntil > new Date()
  const totalCompleted = completedIds.size
  const totalLessons = stages.reduce((s, st) => s + st.lessons.length, 0)

  function isUnlocked(stageIdx: number, lessonIdx: number) {
    if (stageIdx === 0 && lessonIdx === 0) return true
    const prevStage = stages[stageIdx]
    if (lessonIdx > 0) {
      return completedIds.has(prevStage.lessons[lessonIdx - 1].id)
    }
    const prevStageLessons = stages[stageIdx - 1]?.lessons || []
    return prevStageLessons.every(l => completedIds.has(l.id))
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Beginner Path</h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">
          Học từ vựng → Ngữ pháp → Luyện nói. Từng bước một, từng chặng một.
        </p>
      </div>

      {/* Stats bar */}
      <Card className="flex items-center gap-6 py-4">
        <div className="flex items-center gap-2">
          {[...Array(5)].map((_, i) => (
            <Heart key={i} size={18} className={cn(
              i < (isPremium ? 5 : (user?.lives || 0)) ? 'text-red-500 fill-red-500' : 'text-[var(--border)]'
            )} />
          ))}
          {isPremium && <span className="text-xs text-yellow-400 ml-1">∞</span>}
        </div>
        <div className="h-4 w-px bg-[var(--border)]" />
        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          <Zap size={16} className="text-cyan-400" />
          {isPremium ? '∞' : user?.tokens || 0} lượt
        </div>
        <div className="h-4 w-px bg-[var(--border)]" />
        <div className="flex-1">
          <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-1">
            <span>Tiến độ</span>
            <span>{totalCompleted}/{totalLessons}</span>
          </div>
          <div className="h-2 rounded-full bg-[var(--border)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-600 transition-all"
              style={{ width: `${(totalCompleted / totalLessons) * 100}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Stages */}
      <div className="space-y-8">
        {stages.map((stage, si) => {
          const stageCompleted = stage.lessons.every(l => completedIds.has(l.id))

          return (
            <motion.div
              key={stage.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: si * 0.1 }}
            >
              {/* Stage header */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`h-px flex-1 bg-gradient-to-r ${stage.color} opacity-30`} />
                <div className={cn(
                  'px-4 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r text-white',
                  stage.color
                )}>
                  {stage.title}
                  {stageCompleted && ' ✓'}
                </div>
                <div className={`h-px flex-1 bg-gradient-to-l ${stage.color} opacity-30`} />
              </div>

              {/* Lessons path */}
              <div className="relative">
                {/* Connector line */}
                <div className="absolute left-8 top-10 bottom-10 w-0.5 bg-[var(--border)] -z-0" />

                <div className="space-y-3">
                  {stage.lessons.map((lesson, li) => {
                    const unlocked = isUnlocked(si, li)
                    const completed = completedIds.has(lesson.id)
                    const Icon = typeIcons[lesson.type]

                    return (
                      <div key={lesson.id} className="relative flex items-center gap-4 pl-2">
                        {/* Node */}
                        <div className={cn(
                          'w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all z-10',
                          completed
                            ? 'bg-emerald-500 border-emerald-400 shadow-lg shadow-emerald-500/30'
                            : unlocked
                              ? `bg-gradient-to-br ${stage.color} border-transparent shadow-lg`
                              : 'bg-[var(--bg-secondary)] border-[var(--border)]'
                        )}>
                          {completed
                            ? <CheckCircle size={20} className="text-white" />
                            : unlocked
                              ? <Icon size={18} className="text-white" />
                              : <Lock size={16} className="text-[var(--text-secondary)]" />
                          }
                        </div>

                        {/* Card */}
                        <Link
                          href={unlocked ? `/learn/lesson/${lesson.id}` : '#'}
                          className={cn(
                            'flex-1 rounded-xl border p-4 transition-all',
                            completed
                              ? 'border-emerald-500/30 bg-emerald-500/5'
                              : unlocked
                                ? 'border-[var(--border)] bg-[var(--bg-card)] hover:border-cyan-400/30 hover:bg-[var(--bg-secondary)] card-hover'
                                : 'border-[var(--border)] bg-[var(--bg-secondary)] opacity-60 cursor-not-allowed'
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className={cn('text-xs font-medium uppercase', typeColors[lesson.type])}>
                                  {lesson.type}
                                </span>
                                {completed && <Star size={10} className="text-yellow-400 fill-yellow-400" />}
                              </div>
                              <div className={cn('font-medium text-sm', unlocked ? 'text-[var(--text)]' : 'text-[var(--text-secondary)]')}>
                                {lesson.title}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-cyan-400 font-semibold">+{lesson.xp} XP</div>
                              {!unlocked && <Lock size={12} className="text-[var(--text-secondary)] ml-auto mt-1" />}
                            </div>
                          </div>
                        </Link>
                      </div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Completion badge */}
      {totalCompleted === totalLessons && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-10"
        >
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-xl font-bold text-[var(--text)] mb-2">
            Xuất sắc! Hoàn thành toàn bộ Beginner Path!
          </h2>
          <p className="text-[var(--text-secondary)] mb-6">Bạn đã sẵn sàng cho IELTS Practice.</p>
          <Link href="/practice" className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 text-white font-semibold hover:opacity-90 transition-all">
            Bắt đầu IELTS Practice →
          </Link>
        </motion.div>
      )}
    </div>
  )
}
