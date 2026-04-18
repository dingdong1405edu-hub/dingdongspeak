'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, BookOpen, Settings2, Volume2, ChevronDown, ChevronUp, Wrench, Share2, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
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
  onShare?: (isAnonymous: boolean) => Promise<void>
}

function BandBadge({ band }: { band: number }) {
  const cls = band >= 7 ? 'from-emerald-500 to-emerald-600'
    : band >= 6 ? 'from-cyan-500 to-cyan-600'
    : band >= 5 ? 'from-amber-500 to-amber-600'
    : 'from-orange-500 to-orange-600'
  return (
    <div className={cn('w-20 h-20 rounded-2xl flex flex-col items-center justify-center text-white shrink-0 shadow-xl bg-gradient-to-br', cls)}>
      <span className="text-3xl font-bold leading-none tracking-tight">{band.toFixed(1)}</span>
      <span className="text-[10px] opacity-80 font-semibold tracking-widest uppercase mt-0.5">Band</span>
    </div>
  )
}

const CRITERIA = [
  { key: 'fluency', label: 'Trôi chảy', icon: TrendingUp, hint: { high: 'Nói trôi chảy, mạch lạc. Tiếp tục duy trì!', mid: 'Đôi khi dừng để tìm từ. Luyện nói nhiều hơn để tăng tốc độ tự nhiên.', low: 'Hay dừng lâu hoặc lặp từ. Luyện nói chủ đề quen thuộc mỗi ngày.', vlow: 'Nói còn chậm và thiếu tự tin. Bắt đầu bằng câu ngắn và tăng dần.' } },
  { key: 'lexical', label: 'Từ vựng', icon: BookOpen, hint: { high: 'Vốn từ phong phú. Thử thêm idioms và collocations phức tạp hơn.', mid: 'Từ vựng khá nhưng hơi lặp. Học thêm synonyms và collocations.', low: 'Từ vựng còn hạn chế. Học 5 từ IELTS mới mỗi ngày và luyện dùng trong câu.', vlow: 'Vốn từ còn rất ít. Bắt đầu với 500 từ IELTS cơ bản nhất.' } },
  { key: 'grammar', label: 'Ngữ pháp', icon: Settings2, hint: { high: 'Ngữ pháp tốt. Thử dùng thêm cấu trúc câu phức tạp hơn.', mid: 'Một vài lỗi nhỏ. Chú ý tense và subject-verb agreement.', low: 'Nhiều lỗi cơ bản. Ôn lại tenses, articles, prepositions.', vlow: 'Lỗi ngữ pháp nhiều. Cần ôn lại toàn bộ kiến thức grammar nền tảng.' } },
  { key: 'pronunciation', label: 'Phát âm', icon: Volume2, hint: { high: 'Phát âm rõ ràng, tự nhiên. Tiếp tục duy trì!', mid: 'Khá rõ nhưng một vài âm chưa chuẩn. Tập shadow speaking.', low: 'Phát âm còn khó nghe. Tập phonetics và nghe/lặp lại theo người bản ngữ.', vlow: 'Cần tập phát âm các âm cơ bản. Thử dùng ELSA Speak hoặc Forvo.' } },
] as const

function getLevel(v: number) {
  return v >= 7 ? 'high' : v >= 6 ? 'mid' : v >= 5 ? 'low' : 'vlow'
}

function pillColor(v: number) {
  return v >= 7 ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
    : v >= 6 ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
    : v >= 5 ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
    : 'bg-orange-500/15 text-orange-400 border-orange-500/30'
}

function ScorePill({ criterion, value, corrections }: { criterion: typeof CRITERIA[number]; value: number; corrections?: Correction[] }) {
  const [open, setOpen] = useState(false)
  const Icon = criterion.icon
  const hint = criterion.key === 'grammar' && corrections && corrections.length > 0
    ? corrections.map(c => `"${c.wrong}" → "${c.correct}"`).slice(0, 3).join(' · ')
    : criterion.hint[getLevel(value)]

  return (
    <div className="flex-1 min-w-[calc(50%-0.5rem)]">
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={() => setOpen(o => !o)}
        className={cn(
          'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-sm font-semibold transition-all hover:opacity-80',
          pillColor(value)
        )}
      >
        <span className="flex items-center gap-1.5">
          <Icon size={14} />
          {criterion.label}
        </span>
        <span className="flex items-center gap-1">
          <span className="text-base font-bold">{value.toFixed(1)}</span>
          {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </span>
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <p className="text-xs text-[var(--text-secondary)] mt-1.5 mx-1 leading-relaxed">{hint}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function HighlightedTranscript({ text, corrections }: { text: string; corrections: Correction[] }) {
  if (!corrections || corrections.length === 0) {
    return <span className="text-[var(--text)] leading-loose">{text}</span>
  }

  const matches = corrections
    .map(c => {
      const idx = text.toLowerCase().indexOf(c.wrong.toLowerCase())
      if (idx < 0) return null
      return { ...c, idx, endIdx: idx + c.wrong.length }
    })
    .filter((m): m is NonNullable<typeof m> => m !== null)
    .sort((a, b) => a.idx - b.idx)

  if (matches.length === 0) return <span className="text-[var(--text)] leading-loose">{text}</span>

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
  return <span className="leading-loose text-[var(--text)]">{nodes}</span>
}

export function ScoreCard({ score, transcript, audioUrl, onImprove, loadingImprove, improvedAnswer, onShare }: ScoreCardProps) {
  const hasCorrections = score.corrections && score.corrections.length > 0
  const [showShareOptions, setShowShareOptions] = useState(false)
  const [shared, setShared] = useState(false)
  const [sharingLoading, setSharingLoading] = useState(false)

  async function handleShare(isAnonymous: boolean) {
    if (!onShare) return
    setSharingLoading(true)
    try {
      await onShare(isAnonymous)
      setShared(true)
      setShowShareOptions(false)
    } finally {
      setSharingLoading(false)
    }
  }

  return (
    <Card className="p-5 space-y-5">
      {/* Header: Band badge + score pills grid */}
      <div className="flex gap-4 items-start">
        <BandBadge band={score.overall} />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-2">
            {CRITERIA.map(c => (
              <ScorePill
                key={c.key}
                criterion={c}
                value={score[c.key as keyof ScoreBreakdown] as number}
                corrections={c.key === 'grammar' ? score.corrections : undefined}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Overall feedback */}
      {score.feedback && (
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed border-t border-[var(--border)] pt-4">
          {score.feedback}
        </p>
      )}

      {/* Audio replay */}
      {audioUrl && (
        <div className="border border-[var(--border)] rounded-xl overflow-hidden">
          <audio src={audioUrl} controls className="h-9 w-full" />
        </div>
      )}

      {/* Transcript with inline corrections */}
      {transcript && (
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4">
          {hasCorrections && (
            <div className="flex items-center gap-1.5 mb-2">
              <AlertCircle size={12} className="text-red-400" />
              <span className="text-xs text-red-400 font-medium">{score.corrections!.length} lỗi được gạch đỏ · sửa thành xanh</span>
            </div>
          )}
          <p className="text-base">
            {hasCorrections
              ? <HighlightedTranscript text={transcript} corrections={score.corrections!} />
              : <span className="text-[var(--text)] leading-loose">{transcript}</span>
            }
          </p>
        </div>
      )}

      {/* Cải thiện câu */}
      {onImprove && (
        <div className="border-t border-[var(--border)] pt-4 space-y-3">
          <div className="flex items-center gap-2">
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
                className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4"
              >
                <p className="text-sm text-[var(--text)] leading-relaxed">{improvedAnswer}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Share to leaderboard */}
      {onShare && (
        <div className="border-t border-[var(--border)] pt-4">
          {shared ? (
            <span className="flex items-center gap-1.5 text-sm text-emerald-400">
              <CheckCircle size={14} />
              Đã chia sẻ lên Bảng vàng
            </span>
          ) : showShareOptions ? (
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm text-[var(--text-secondary)]">Chia sẻ dưới tên:</span>
              <button
                onClick={() => handleShare(false)}
                disabled={sharingLoading}
                className="px-3 py-1 rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 text-sm font-medium hover:bg-cyan-500/25 disabled:opacity-50 transition-all"
              >
                {sharingLoading ? <Loader2 size={13} className="animate-spin inline mr-1" /> : null}
                Công khai
              </button>
              <button
                onClick={() => handleShare(true)}
                disabled={sharingLoading}
                className="px-3 py-1 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border)] text-sm hover:text-[var(--text)] disabled:opacity-50 transition-all"
              >
                Ẩn danh
              </button>
              <button onClick={() => setShowShareOptions(false)} className="text-sm text-[var(--text-secondary)] hover:text-[var(--text)]">✕</button>
            </div>
          ) : (
            <button
              onClick={() => setShowShareOptions(true)}
              className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
            >
              <Share2 size={14} />
              Chia sẻ lên Bảng vàng
            </button>
          )}
        </div>
      )}
    </Card>
  )
}
