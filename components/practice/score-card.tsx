'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, BookOpen, Settings2, Volume2, ChevronDown, ChevronUp, Wrench, Share2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { ScoreBreakdown, Correction } from '@/types'

interface ScoreCardProps {
  score: ScoreBreakdown
  transcript?: string
  audioUrl?: string
  onImprove?: () => void
  loadingImprove?: boolean
  improvedAnswer?: string
  onShare?: () => void
}

function BandBadge({ band }: { band: number }) {
  const cls = band >= 7 ? 'bg-emerald-500'
    : band >= 6 ? 'bg-cyan-500'
    : band >= 5 ? 'bg-amber-500'
    : 'bg-orange-500'
  return (
    <div className={cn('w-14 h-14 rounded-full flex flex-col items-center justify-center text-white shrink-0 shadow-lg', cls)}>
      <span className="text-xl font-bold leading-none">{band.toFixed(1)}</span>
      <span className="text-[9px] opacity-80 font-medium tracking-wide">BAND</span>
    </div>
  )
}

function getCriterionDetail(key: string, score: number, corrections?: Correction[]): string {
  if (key === 'grammar' && corrections && corrections.length > 0) {
    return corrections.map(c => `"${c.wrong}" → "${c.correct}"`).slice(0, 3).join(' · ')
  }
  const map: Record<string, Record<string, string>> = {
    fluency: {
      high: 'Nói trôi chảy, mạch lạc. Tiếp tục duy trì!',
      mid: 'Đôi khi dừng để tìm từ. Luyện nói nhiều hơn để tăng tốc độ tự nhiên.',
      low: 'Hay dừng lâu hoặc lặp từ. Luyện nói chủ đề quen thuộc mỗi ngày.',
      vlow: 'Nói còn chậm và thiếu tự tin. Bắt đầu bằng câu ngắn và tăng dần.',
    },
    lexical: {
      high: 'Vốn từ phong phú. Thử thêm idioms và collocations phức tạp hơn.',
      mid: 'Từ vựng khá nhưng hơi lặp. Học thêm synonyms và collocations.',
      low: 'Từ vựng còn hạn chế. Học 5 từ IELTS mới mỗi ngày và luyện dùng trong câu.',
      vlow: 'Vốn từ còn rất ít. Bắt đầu với 500 từ IELTS cơ bản nhất.',
    },
    grammar: {
      high: 'Ngữ pháp tốt. Thử dùng thêm cấu trúc câu phức tạp hơn.',
      mid: 'Một vài lỗi nhỏ. Chú ý tense và subject-verb agreement.',
      low: 'Nhiều lỗi cơ bản. Ôn lại tenses, articles, prepositions.',
      vlow: 'Lỗi ngữ pháp nhiều. Cần ôn lại toàn bộ kiến thức grammar nền tảng.',
    },
    pronunciation: {
      high: 'Phát âm rõ ràng, tự nhiên. Tiếp tục duy trì!',
      mid: 'Khá rõ nhưng một vài âm chưa chuẩn. Tập shadow speaking.',
      low: 'Phát âm còn khó nghe. Tập phonetics và nghe/lặp lại theo người bản ngữ.',
      vlow: 'Cần tập phát âm các âm cơ bản. Thử dùng ELSA Speak hoặc Forvo.',
    },
  }
  const level = score >= 7 ? 'high' : score >= 6 ? 'mid' : score >= 5 ? 'low' : 'vlow'
  return map[key]?.[level] || ''
}

function ScorePill({ label, value, icon: Icon, criterionKey, corrections }: {
  label: string; value: number; icon: React.ElementType; criterionKey: string; corrections?: Correction[]
}) {
  const [open, setOpen] = useState(false)
  const color = value >= 7 ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
    : value >= 6 ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
    : value >= 5 ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
    : 'bg-orange-500/15 text-orange-400 border-orange-500/30'
  const detail = getCriterionDetail(criterionKey, value, corrections)

  return (
    <div>
      <motion.button
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={() => setOpen(o => !o)}
        className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all hover:opacity-80', color)}
      >
        <Icon size={12} />
        {label}: {value.toFixed(1)}
        {open ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <p className="text-[11px] text-[var(--text-secondary)] mt-1 ml-1 max-w-[220px] leading-relaxed">
              {detail}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function HighlightedTranscript({ text, corrections }: { text: string; corrections: Correction[] }) {
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

  if (matches.length === 0) {
    return <span className="text-sm text-[var(--text)] leading-relaxed">{text}</span>
  }

  const nodes: React.ReactNode[] = []
  let cursor = 0

  for (const match of matches) {
    if (match.idx < cursor) continue
    if (match.idx > cursor) {
      nodes.push(<span key={`t${cursor}`} className="text-[var(--text)]">{text.slice(cursor, match.idx)}</span>)
    }
    nodes.push(
      <span key={`e${match.idx}`} className="inline-flex items-baseline gap-1 mx-0.5">
        <span className="text-red-400 line-through">{text.slice(match.idx, match.endIdx)}</span>
        <span className="text-emerald-400 font-semibold">{match.correct}</span>
      </span>
    )
    cursor = match.endIdx
  }

  if (cursor < text.length) {
    nodes.push(<span key={`t${cursor}`} className="text-[var(--text)]">{text.slice(cursor)}</span>)
  }

  return <span className="text-sm leading-relaxed">{nodes}</span>
}

const CATEGORIES = [
  { key: 'fluency', label: 'Trôi chảy', icon: TrendingUp },
  { key: 'lexical', label: 'Từ vựng', icon: BookOpen },
  { key: 'grammar', label: 'Ngữ pháp', icon: Settings2 },
  { key: 'pronunciation', label: 'Phát âm', icon: Volume2 },
]

export function ScoreCard({ score, transcript, audioUrl, onImprove, loadingImprove, improvedAnswer, onShare }: ScoreCardProps) {
  const hasCorrections = score.corrections && score.corrections.length > 0

  return (
    <Card>
      {/* Audio replay */}
      {audioUrl && (
        <div className="mb-4 pb-4 border-b border-[var(--border)]">
          <audio src={audioUrl} controls className="h-8 w-full" />
        </div>
      )}

      {/* Score header: pills + badge */}
      <div className="flex items-start gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(({ key, label, icon }) => (
              <ScorePill
                key={key}
                label={label}
                value={score[key as keyof ScoreBreakdown] as number}
                icon={icon}
                criterionKey={key}
                corrections={key === 'grammar' ? score.corrections : undefined}
              />
            ))}
          </div>
          {score.feedback && (
            <p className="text-xs text-[var(--text-secondary)] mt-2 leading-relaxed">{score.feedback}</p>
          )}
        </div>
        <BandBadge band={score.overall} />
      </div>

      {/* Transcript with inline corrections */}
      {transcript && (
        <div className="bg-[var(--bg-secondary)] rounded-xl p-3 mb-4 leading-relaxed">
          {hasCorrections && (
            <div className="flex items-center gap-1 mb-1.5">
              <AlertCircle size={11} className="text-red-400" />
              <span className="text-[10px] text-red-400 font-medium">{score.corrections!.length} lỗi được gạch đỏ</span>
            </div>
          )}
          {hasCorrections
            ? <HighlightedTranscript text={transcript} corrections={score.corrections!} />
            : <span className="text-sm text-[var(--text)]">{transcript}</span>
          }
        </div>
      )}

      {/* Cải thiện câu section */}
      {onImprove && (
        <div className="border-t border-[var(--border)] pt-4">
          <div className="flex items-center gap-2 mb-2">
            <Wrench size={14} className="text-violet-400" />
            <span className="text-sm font-medium text-[var(--text)]">Cải thiện cả câu nhé :)</span>
          </div>
          <Button variant="secondary" size="sm" onClick={onImprove} loading={loadingImprove}>
            nhấn → Cải thiện câu
          </Button>
          <AnimatePresence>
            {improvedAnswer && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3"
              >
                <p className="text-sm text-[var(--text)] leading-relaxed">{improvedAnswer}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Share link */}
      {onShare && (
        <button
          onClick={onShare}
          className="mt-3 flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <Share2 size={12} />
          Chia sẻ lên Bảng vàng
        </button>
      )}
    </Card>
  )
}
