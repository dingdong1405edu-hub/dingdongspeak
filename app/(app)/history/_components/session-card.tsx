'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, BookOpen, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QAItem {
  question: string
  transcript: string
  audioUrl?: string | null
}

interface ScoreItem {
  overall: number
  fluency: number
  lexical: number
  grammar: number
  pronunciation: number
  feedback?: string
  corrections?: Array<{ wrong: string; correct: string }>
}

interface Session {
  id: string
  type: string
  topic: string
  part: string | null
  questions: QAItem[]
  scores: ScoreItem[]
  duration: number
  createdAt: string
}

const TYPE_LABELS: Record<string, string> = {
  PRACTICE: 'Luyện IELTS',
  MOCK_TEST: 'Thi thử',
  BEGINNER: 'Beginner',
}

const PART_LABELS: Record<string, string> = {
  PART1: 'Part 1', PART2: 'Part 2', PART3: 'Part 3', FULL: 'Full Test',
}

function bandColor(b: number) {
  if (b >= 7) return 'text-emerald-400'
  if (b >= 6) return 'text-cyan-400'
  if (b >= 5) return 'text-yellow-400'
  return 'text-orange-400'
}

function pillColor(v: number) {
  return v >= 7 ? 'bg-emerald-500/15 text-emerald-400'
    : v >= 6 ? 'bg-cyan-500/15 text-cyan-400'
    : v >= 5 ? 'bg-amber-500/15 text-amber-400'
    : 'bg-orange-500/15 text-orange-400'
}

function HighlightedText({ text, corrections }: { text: string; corrections?: Array<{ wrong: string; correct: string }> }) {
  if (!corrections || corrections.length === 0) {
    return <span className="text-sm text-[var(--text)] leading-relaxed">{text}</span>
  }
  const matches = corrections
    .map(c => {
      const idx = text.toLowerCase().indexOf(c.wrong.toLowerCase())
      if (idx < 0) return null
      return { ...c, idx, endIdx: idx + c.wrong.length }
    })
    .filter((m): m is NonNullable<typeof m> => m !== null)
    .sort((a, b) => a.idx - b.idx)

  if (matches.length === 0) return <span className="text-sm text-[var(--text)] leading-relaxed">{text}</span>

  const nodes: React.ReactNode[] = []
  let cursor = 0
  for (const match of matches) {
    if (match.idx < cursor) continue
    if (match.idx > cursor) nodes.push(<span key={`t${cursor}`}>{text.slice(cursor, match.idx)}</span>)
    nodes.push(
      <span key={`e${match.idx}`} className="inline-flex items-baseline gap-1 mx-0.5">
        <span className="text-red-400 line-through">{text.slice(match.idx, match.endIdx)}</span>
        <span className="text-emerald-400 font-semibold">{match.correct}</span>
      </span>
    )
    cursor = match.endIdx
  }
  if (cursor < text.length) nodes.push(<span key={`t${cursor}`}>{text.slice(cursor)}</span>)
  return <span className="text-sm leading-relaxed text-[var(--text)]">{nodes}</span>
}

function QuestionDetail({ qa, score, idx }: { qa: QAItem; score: ScoreItem; idx: number }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-[var(--border)] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--bg-secondary)] transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xs font-bold text-[var(--text-secondary)] shrink-0">Q{idx + 1}</span>
          <span className="text-sm text-[var(--text)] truncate">{qa.question}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <span className={cn('text-sm font-bold', bandColor(score.overall))}>{score.overall.toFixed(1)}</span>
          {open ? <ChevronUp size={14} className="text-[var(--text-secondary)]" /> : <ChevronDown size={14} className="text-[var(--text-secondary)]" />}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-[var(--border)]">
              {/* Sub-scores */}
              <div className="flex flex-wrap gap-1.5 pt-3">
                {(['fluency', 'lexical', 'grammar', 'pronunciation'] as const).map(k => {
                  const labels: Record<string, string> = { fluency: 'Trôi chảy', lexical: 'Từ vựng', grammar: 'Ngữ pháp', pronunciation: 'Phát âm' }
                  const val = score[k]
                  return (
                    <span key={k} className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', pillColor(val))}>
                      {labels[k]}: {val.toFixed(1)}
                    </span>
                  )
                })}
              </div>

              {/* Audio replay */}
              {qa.audioUrl && (
                <div className="border border-[var(--border)] rounded-xl overflow-hidden">
                  <audio src={qa.audioUrl} controls className="h-8 w-full" />
                </div>
              )}

              {/* Transcript with inline corrections */}
              <div className="bg-[var(--bg-secondary)] rounded-xl p-3">
                {score.corrections && score.corrections.length > 0 && (
                  <div className="flex items-center gap-1 mb-1.5">
                    <AlertCircle size={10} className="text-red-400" />
                    <span className="text-[10px] text-red-400 font-medium">{score.corrections.length} lỗi được sửa</span>
                  </div>
                )}
                <HighlightedText text={qa.transcript} corrections={score.corrections} />
              </div>

              {/* Feedback */}
              {score.feedback && (
                <p className="text-xs text-[var(--text-secondary)] italic leading-relaxed">{score.feedback}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function SessionCard({ session }: { session: Session }) {
  const [expanded, setExpanded] = useState(false)
  const scores = session.scores ?? []
  const questions = session.questions ?? []
  const avg = scores.length > 0
    ? (scores.reduce((acc, sc) => acc + (sc.overall ?? 0), 0) / scores.length).toFixed(1)
    : null
  const minutes = Math.round((session.duration ?? 0) / 60)

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
      {/* Summary row */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-start gap-3 p-4 hover:bg-[var(--bg-secondary)] transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-medium">
              {TYPE_LABELS[session.type] ?? session.type}
            </span>
            {session.part && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 font-medium">
                {PART_LABELS[session.part] ?? session.part}
              </span>
            )}
          </div>
          <div className="font-medium text-[var(--text)] truncate">{session.topic}</div>
          <div className="flex items-center gap-3 mt-1 text-xs text-[var(--text-secondary)]">
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {minutes > 0 ? `${minutes} phút` : '< 1 phút'}
            </span>
            <span className="flex items-center gap-1">
              <BookOpen size={11} />
              {scores.length} câu
            </span>
            <span>{new Date(session.createdAt).toLocaleDateString('vi-VN')}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {avg && (
            <div className="text-right">
              <div className={cn('text-2xl font-bold', bandColor(parseFloat(avg)))}>{avg}</div>
              <div className="text-xs text-[var(--text-secondary)]">Band TB</div>
            </div>
          )}
          {expanded
            ? <ChevronUp size={16} className="text-[var(--text-secondary)]" />
            : <ChevronDown size={16} className="text-[var(--text-secondary)]" />
          }
        </div>
      </button>

      {/* Expandable Q&A detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2 border-t border-[var(--border)] pt-3">
              {questions.map((qa, i) => (
                <QuestionDetail
                  key={i}
                  idx={i}
                  qa={qa}
                  score={scores[i] ?? { overall: 0, fluency: 0, lexical: 0, grammar: 0, pronunciation: 0 }}
                />
              ))}
              {questions.length === 0 && (
                <p className="text-sm text-[var(--text-secondary)] text-center py-4">Không có dữ liệu chi tiết.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
