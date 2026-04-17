'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, BookOpen, Settings, Volume2, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn, bandToColor } from '@/lib/utils'
import type { ScoreBreakdown, Correction } from '@/types'

interface ScoreCardProps {
  score: ScoreBreakdown
  transcript?: string
}

const scoreCategories = [
  { key: 'fluency', label: 'Trôi chảy', icon: TrendingUp },
  { key: 'lexical', label: 'Từ vựng', icon: BookOpen },
  { key: 'grammar', label: 'Ngữ pháp', icon: Settings },
  { key: 'pronunciation', label: 'Phát âm', icon: Volume2 },
]

function BandRing({ band }: { band: number }) {
  const pct = (band / 9) * 100
  const color = bandToColor(band).replace('text-', '')
  const colorMap: Record<string, string> = {
    'emerald-400': '#34d399',
    'cyan-400': '#22d3ee',
    'yellow-400': '#facc15',
    'orange-400': '#fb923c',
    'red-400': '#f87171',
  }
  const strokeColor = colorMap[color] || '#22d3ee'

  return (
    <div className="relative w-28 h-28">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" className="text-[var(--border)]" strokeWidth="8" />
        <circle
          cx="50" cy="50" r="40" fill="none" stroke={strokeColor} strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${pct * 2.51} 251`}
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('text-2xl font-bold', bandToColor(band))}>{band.toFixed(1)}</span>
        <span className="text-xs text-[var(--text-secondary)]">Band</span>
      </div>
    </div>
  )
}

function ScorePill({ label, value, icon: Icon }: { label: string; value: number; icon: React.ElementType }) {
  const bg = value >= 7 ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
    : value >= 6 ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
    : value >= 5 ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
    : 'bg-orange-500/15 text-orange-400 border-orange-500/30'
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold', bg)}
    >
      <Icon size={12} />
      <span>{label}: {value.toFixed(1)}</span>
    </motion.div>
  )
}

// Highlight wrong words red, show correction in green inline
function HighlightedTranscript({ text, corrections }: { text: string; corrections: Correction[] }) {
  if (!corrections || corrections.length === 0) {
    return <span className="text-xs text-[var(--text-secondary)] italic">"{text}"</span>
  }

  // Find each correction's position in the original text
  const matches = corrections
    .map(c => {
      const idx = text.toLowerCase().indexOf(c.wrong.toLowerCase())
      if (idx < 0) return null
      return { ...c, idx, endIdx: idx + c.wrong.length }
    })
    .filter((m): m is NonNullable<typeof m> => m !== null)
    .sort((a, b) => a.idx - b.idx)

  if (matches.length === 0) {
    return <span className="text-xs text-[var(--text-secondary)] italic">"{text}"</span>
  }

  const nodes: React.ReactNode[] = []
  let cursor = 0

  for (const match of matches) {
    if (match.idx < cursor) continue // skip overlapping matches

    // Normal text before this match
    if (match.idx > cursor) {
      nodes.push(
        <span key={`t${cursor}`} className="text-[var(--text-secondary)] italic">
          {text.slice(cursor, match.idx)}
        </span>
      )
    }

    // Wrong word (red strikethrough) → correct word (green)
    nodes.push(
      <span key={`e${match.idx}`} className="inline-flex items-baseline gap-0.5 mx-0.5">
        <span className="text-red-400 line-through italic">{text.slice(match.idx, match.endIdx)}</span>
        <span className="text-emerald-400 font-semibold not-italic">{match.correct}</span>
      </span>
    )

    cursor = match.endIdx
  }

  // Remaining text after last match
  if (cursor < text.length) {
    nodes.push(
      <span key={`t${cursor}`} className="text-[var(--text-secondary)] italic">
        {text.slice(cursor)}
      </span>
    )
  }

  return <span className="text-xs leading-relaxed">{nodes}</span>
}

export function ScoreCard({ score, transcript }: ScoreCardProps) {
  const getBand = (s: number) => {
    if (s >= 8.5) return 'Xuất sắc'
    if (s >= 7.5) return 'Rất tốt'
    if (s >= 6.5) return 'Tốt'
    if (s >= 5.5) return 'Trên trung bình'
    if (s >= 4.5) return 'Trung bình'
    return 'Cần cải thiện'
  }

  const hasCorrections = score.corrections && score.corrections.length > 0

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
      <Card>
        <div className="flex flex-col sm:flex-row items-center gap-6 mb-6">
          <BandRing band={score.overall} />
          <div className="text-center sm:text-left">
            <div className="text-sm text-[var(--text-secondary)] mb-1">Điểm tổng</div>
            <div className={cn('text-4xl font-bold', bandToColor(score.overall))}>
              Band {score.overall.toFixed(1)}
            </div>
            <div className="text-[var(--text-secondary)] text-sm mt-1">{getBand(score.overall)}</div>
          </div>
        </div>

        {/* Criteria breakdown as pills */}
        <div className="flex flex-wrap gap-2 mb-5">
          {scoreCategories.map(({ key, label, icon: Icon }) => {
            const val = score[key as keyof ScoreBreakdown] as number
            return <ScorePill key={key} label={label} value={val} icon={Icon} />
          })}
        </div>

        {/* Feedback */}
        {score.feedback && (
          <div className="bg-[var(--bg-secondary)] rounded-xl p-4 mb-4">
            <p className="text-sm text-[var(--text)]">{score.feedback}</p>
          </div>
        )}

        {/* Grammar corrections */}
        {hasCorrections && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-red-400/20 bg-red-400/5 rounded-xl p-4 mb-4"
          >
            <h5 className="text-xs font-semibold text-red-400 uppercase mb-3 flex items-center gap-1.5">
              <AlertCircle size={12} />
              Sửa lỗi ({score.corrections!.length} lỗi)
            </h5>
            <div className="space-y-2">
              {score.corrections!.map((c, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <span className="shrink-0 w-4 h-4 rounded-full bg-red-400/20 text-red-400 flex items-center justify-center text-[10px] font-bold mt-0.5">{i + 1}</span>
                  <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                    <span className="text-red-400 line-through">{c.wrong}</span>
                    <span className="text-[var(--text-secondary)]">→</span>
                    <span className="text-emerald-400 font-medium">{c.correct}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Transcript with inline highlights */}
        {transcript && (
          <div className="mt-2">
            <h5 className="text-xs font-semibold text-[var(--text-secondary)] uppercase mb-2">
              Câu trả lời của bạn
              {hasCorrections && <span className="ml-1 text-red-400">— lỗi được gạch đỏ</span>}
            </h5>
            <div className="bg-[var(--bg-secondary)] rounded-xl p-3 leading-relaxed">
              {hasCorrections
                ? <HighlightedTranscript text={transcript} corrections={score.corrections!} />
                : <span className="text-xs text-[var(--text-secondary)] italic">"{transcript}"</span>
              }
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  )
}
