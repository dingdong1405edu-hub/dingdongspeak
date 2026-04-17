'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Answer {
  id: string
  question: string
  transcript: string
  score: { overall: number; fluency: number; lexical: number; grammar: number; pronunciation: number; feedback: string }
  band: number
  displayName: string
  createdAt: string
}

const BAND_FILTERS = [
  { label: 'Tất cả', min: 0, max: 9 },
  { label: 'Band 8', min: 8, max: 9 },
  { label: 'Band 7', min: 7, max: 8 },
  { label: 'Band 6', min: 6, max: 7 },
]

const SUB_SCORE_LABELS: Record<string, string> = {
  fluency: 'Trôi chảy', lexical: 'Từ vựng', grammar: 'Ngữ pháp', pronunciation: 'Phát âm',
}

function pillColor(v: number) {
  return v >= 7 ? 'bg-emerald-500/15 text-emerald-400'
    : v >= 6 ? 'bg-cyan-500/15 text-cyan-400'
    : v >= 5 ? 'bg-amber-500/15 text-amber-400'
    : 'bg-orange-500/15 text-orange-400'
}

function badgeBg(b: number) {
  return b >= 7 ? 'bg-emerald-500' : b >= 6 ? 'bg-cyan-500' : b >= 5 ? 'bg-amber-500' : 'bg-orange-500'
}

function AnswerEntry({ answer, rank }: { answer: Answer; rank: number }) {
  const [open, setOpen] = useState(false)
  const rankLabel = rank === 0 ? '👑' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : `${rank + 1}.`

  return (
    <div className="border border-[var(--border)] rounded-xl p-3 bg-[var(--bg-card)]">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm w-5 shrink-0">{rankLabel}</span>
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
          {answer.displayName[0]?.toUpperCase()}
        </div>
        <span className="text-xs font-medium text-[var(--text)] flex-1 truncate">{answer.displayName}</span>
        <div className={cn('w-9 h-9 rounded-full flex flex-col items-center justify-center text-white shrink-0', badgeBg(answer.band))}>
          <span className="text-sm font-bold leading-none">{answer.band.toFixed(1)}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 mb-2">
        {(['fluency', 'lexical', 'grammar', 'pronunciation'] as const).map(k => (
          <span key={k} className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', pillColor(answer.score[k]))}>
            {SUB_SCORE_LABELS[k]}: {answer.score[k].toFixed(1)}
          </span>
        ))}
      </div>

      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors"
      >
        {open ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
        {open ? 'Thu gọn' : 'Xem câu trả lời'}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-2 bg-[var(--bg-secondary)] rounded-lg p-2.5">
              <p className="text-xs text-[var(--text)] leading-relaxed">{answer.transcript}</p>
            </div>
            {answer.score.feedback && (
              <p className="text-[11px] text-[var(--text-secondary)] mt-1.5 italic leading-relaxed">{answer.score.feedback}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface TopicLeaderboardProps {
  topic: string
  part: string
}

export function TopicLeaderboard({ topic, part }: TopicLeaderboardProps) {
  const [answers, setAnswers] = useState<Answer[]>([])
  const [loading, setLoading] = useState(true)
  const [filterIdx, setFilterIdx] = useState(0)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const f = BAND_FILTERS[filterIdx]
    const params = new URLSearchParams({
      topic,
      part,
      minBand: String(f.min),
      maxBand: String(f.max),
      limit: '10',
    })
    setLoading(true)
    fetch(`/api/leaderboard/answers?${params}`)
      .then(r => r.json())
      .then(d => { setAnswers(d.answers ?? []); setTotal(d.total ?? 0) })
      .catch(() => setAnswers([]))
      .finally(() => setLoading(false))
  }, [topic, part, filterIdx])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Trophy size={14} className="text-yellow-400" />
          <span className="text-sm font-semibold text-[var(--text)]">Bảng vàng — {topic}</span>
        </div>
        {total > 0 && <span className="text-xs text-[var(--text-secondary)]">{total} bài</span>}
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {BAND_FILTERS.map((f, i) => (
          <button
            key={i}
            onClick={() => setFilterIdx(i)}
            className={cn(
              'px-2.5 py-1 rounded-full text-xs font-medium border transition-all',
              filterIdx === i
                ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400'
                : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-yellow-500/30'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 size={22} className="text-cyan-400 animate-spin" />
        </div>
      ) : answers.length === 0 ? (
        <div className="text-center py-8 text-[var(--text-secondary)]">
          <Trophy size={28} className="mx-auto mb-2 opacity-20" />
          <p className="text-sm">Chưa có ai chia sẻ câu trả lời cho chủ đề này.</p>
          <p className="text-xs mt-1 text-cyan-400">Hãy là người đầu tiên!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {answers.map((a, i) => <AnswerEntry key={a.id} answer={a} rank={i} />)}
        </div>
      )}
    </div>
  )
}
