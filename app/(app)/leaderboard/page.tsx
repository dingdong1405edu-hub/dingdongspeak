'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Filter, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useLang } from '@/components/shared/lang-provider'
import { formatScore, scoreToColor, scoreRatio } from '@/lib/languages'

interface SharedAnswer {
  id: string
  question: string
  transcript: string
  audioUrl: string | null
  score: { overall: number; fluency: number; lexical: number; grammar: number; pronunciation: number; feedback: string }
  band: number
  topic: string
  part: string
  language: string
  createdAt: string
  likes: number
  displayName: string
  avatar: string | null
}

interface ScoreFilter { label: string; min: number; max: number }

// Score buckets: IELTS uses 0–9 bands, other exams use a normalised 0–100 score.
const BAND_BUCKETS: ScoreFilter[] = [
  { label: 'Tất cả', min: 0, max: 9 },
  { label: 'Band 7+', min: 7, max: 9 },
  { label: 'Band 6–7', min: 6, max: 7 },
  { label: 'Band 5–6', min: 5, max: 6 },
  { label: 'Band < 5', min: 0, max: 5 },
]

const SCORE_BUCKETS: ScoreFilter[] = [
  { label: 'Tất cả', min: 0, max: 100 },
  { label: '90+', min: 90, max: 100 },
  { label: '80+', min: 80, max: 100 },
  { label: '70+', min: 70, max: 100 },
  { label: '< 70', min: 0, max: 70 },
]

function AnswerCard({ answer }: { answer: SharedAnswer }) {
  const [expanded, setExpanded] = useState(false)
  const { config } = useLang()

  return (
    <Card className="transition-all">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
          {answer.displayName[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-sm font-medium text-[var(--text)]">{answer.displayName}</span>
            <span className={cn('text-xl font-bold shrink-0', scoreToColor(answer.band, answer.language))}>
              {formatScore(answer.band, answer.language)}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400">{answer.topic}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400">
              {config.sections.find(s => s.id === answer.part)?.label ?? answer.part}
            </span>
            <span className="text-xs text-[var(--text-secondary)]">
              {new Date(answer.createdAt).toLocaleDateString('vi-VN')}
            </span>
          </div>
          <p className="text-sm text-[var(--text-secondary)] italic mb-2">
            "{answer.question}"
          </p>

          <button
            onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {expanded ? 'Thu gọn' : 'Xem câu trả lời'}
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                {answer.audioUrl && (
                  <div className="mt-3 border border-[var(--border)] rounded-xl overflow-hidden">
                    <audio src={answer.audioUrl} controls className="h-8 w-full" />
                  </div>
                )}
                <div className="mt-3 bg-[var(--bg-secondary)] rounded-xl p-3">
                  <p className="text-sm text-[var(--text)] leading-relaxed">{answer.transcript}</p>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {config.criteria.map(c => {
                    const val = answer.score[c.key]
                    const r = scoreRatio(val, answer.language)
                    const color = r >= 0.78 ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : r >= 0.66 ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
                      : r >= 0.55 ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
                      : 'bg-orange-500/15 text-orange-400 border-orange-500/30'
                    return (
                      <span key={c.key} className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', color)}>
                        {c.label}: {formatScore(val, answer.language)}
                      </span>
                    )
                  })}
                </div>
                {answer.score.feedback && (
                  <p className="text-xs text-[var(--text-secondary)] mt-2 italic">{answer.score.feedback}</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Card>
  )
}

export default function LeaderboardPage() {
  const { lang, config } = useLang()
  const [answers, setAnswers] = useState<SharedAnswer[]>([])
  const [loading, setLoading] = useState(true)
  const [bandFilter, setBandFilter] = useState(0)
  const [partFilter, setPartFilter] = useState('Tất cả')
  const [topicFilter, setTopicFilter] = useState('Tất cả')
  const [total, setTotal] = useState(0)

  // Scale-aware score buckets (Band 0–9 for IELTS, 0–100 for other exams).
  const scoreBuckets = useMemo(
    () => (config.scoreScale === 9 ? BAND_BUCKETS : SCORE_BUCKETS),
    [config.scoreScale]
  )

  // Reset filters when the active language changes (sections/scale differ).
  useEffect(() => {
    setBandFilter(0)
    setPartFilter('Tất cả')
    setTopicFilter('Tất cả')
  }, [lang])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const f = scoreBuckets[bandFilter] ?? scoreBuckets[0]
      const part = partFilter === 'Tất cả' ? '' : partFilter
      const topic = topicFilter === 'Tất cả' ? '' : topicFilter
      const params = new URLSearchParams({
        lang,
        minBand: String(f.min),
        maxBand: String(f.max),
        ...(part ? { part } : {}),
        ...(topic ? { topic } : {}),
      })
      const res = await fetch(`/api/leaderboard/answers?${params}`)
      const data = await res.json()
      setAnswers(data.answers ?? [])
      setTotal(data.total ?? 0)
    } finally {
      setLoading(false)
    }
  }, [lang, scoreBuckets, bandFilter, partFilter, topicFilter])

  useEffect(() => { load() }, [load])

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Trophy size={22} className="text-yellow-400" />
          <h1 className="text-2xl font-bold text-[var(--text)]">Bảng vàng</h1>
        </div>
        <p className="text-[var(--text-secondary)] text-sm">
          Câu trả lời hay nhất từ cộng đồng — {total} bài đã chia sẻ
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex gap-2 flex-wrap">
          {scoreBuckets.map((f, i) => (
            <button
              key={i}
              onClick={() => setBandFilter(i)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                bandFilter === i
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                  : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-cyan-500/30'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPartFilter('Tất cả')}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
              partFilter === 'Tất cả'
                ? 'bg-violet-500/20 border-violet-500/50 text-violet-400'
                : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-violet-500/30'
            )}
          >
            Tất cả
          </button>
          {config.sections.map(sec => (
            <button
              key={sec.id}
              onClick={() => setPartFilter(sec.id)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                partFilter === sec.id
                  ? 'bg-violet-500/20 border-violet-500/50 text-violet-400'
                  : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-violet-500/30'
              )}
            >
              {sec.label}
            </button>
          ))}
        </div>
        {/* Topic filter */}
        <div className="flex gap-2 flex-wrap">
          {['Tất cả', ...config.topics.slice(0, 12)].map(t => (
            <button
              key={t}
              onClick={() => setTopicFilter(t)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium border transition-all',
                topicFilter === t
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                  : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-emerald-500/30'
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={32} className="text-cyan-400 animate-spin" />
        </div>
      ) : answers.length === 0 ? (
        <div className="text-center py-16 text-[var(--text-secondary)]">
          <Trophy size={40} className="mx-auto mb-3 opacity-30" />
          <p>Chưa có ai chia sẻ câu trả lời với bộ lọc này.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {answers.map(a => <AnswerCard key={a.id} answer={a} />)}
        </div>
      )}
    </div>
  )
}
