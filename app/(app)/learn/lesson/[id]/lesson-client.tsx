'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  ChevronRight, ArrowLeft, Trophy, Check, X, Volume2,
  BookOpen, Lightbulb, Mic, RotateCcw, Star, Printer
} from 'lucide-react'
import { toast } from 'sonner'
import { AudioRecorder } from '@/components/practice/audio-recorder'
import { cn } from '@/lib/utils'
import type { LessonData, VocabCard, GrammarCard, SpeakingCard } from '@/lib/lessons-data'

interface Props {
  lesson: LessonData
  lessonId: string
  stageColor: string
}

async function exportLessonPDF(lesson: LessonData) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const margin = 18
  const pageW = 210
  let y = margin

  function addText(text: string, opts: { size?: number; bold?: boolean; color?: [number, number, number]; indent?: number } = {}) {
    const { size = 11, bold = false, color = [30, 30, 30], indent = 0 } = opts
    doc.setFontSize(size)
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setTextColor(...color)
    const lines = doc.splitTextToSize(text, pageW - margin * 2 - indent)
    if (y + lines.length * (size * 0.45) > 280) { doc.addPage(); y = margin }
    doc.text(lines, margin + indent, y)
    y += lines.length * (size * 0.45) + 3
  }

  function addSpacer(h = 4) { y += h }
  function addDivider() {
    doc.setDrawColor(200, 200, 200)
    doc.line(margin, y, pageW - margin, y)
    y += 5
  }

  // Header
  doc.setFillColor(0, 180, 216)
  doc.rect(0, 0, pageW, 28, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(255, 255, 255)
  doc.text('DingDongSpeak', margin, 11)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`${lesson.title} · ${lesson.level} · ${lesson.type === 'vocabulary' ? 'Từ vựng' : 'Ngữ pháp'}`, margin, 20)
  y = 36

  if (lesson.type === 'vocabulary') {
    addText('DANH SÁCH TỪ VỰNG', { size: 13, bold: true, color: [0, 150, 200] })
    addDivider()
    for (const card of lesson.cards) {
      if (card.type !== 'vocab') continue
      addText(`${card.word}  ${card.phonetic}`, { size: 12, bold: true })
      addText(`${card.pos}  —  ${card.meaning}`, { size: 10, color: [80, 80, 80], indent: 3 })
      addText(`"${card.example}"`, { size: 10, color: [100, 100, 100], indent: 3 })
      addSpacer(3)
      addDivider()
    }
  } else if (lesson.type === 'grammar') {
    addText('LÝ THUYẾT NGỮ PHÁP', { size: 13, bold: true, color: [70, 130, 220] })
    addDivider()
    for (const card of lesson.cards) {
      if (card.type !== 'grammar') continue
      addText(card.rule, { size: 12, bold: true })
      addText(card.explanation, { size: 10, color: [50, 50, 50], indent: 3 })
      addSpacer(2)
      addText('Ví dụ:', { size: 10, bold: true, indent: 3, color: [80, 80, 80] })
      for (const ex of card.examples) {
        addText(`• ${ex}`, { size: 10, color: [60, 60, 60], indent: 6 })
      }
      addSpacer(1)
      addText(`💡 ${card.tip}`, { size: 9, color: [160, 120, 0], indent: 3 })
      addSpacer(3)
      addDivider()
    }
  }

  // Footer
  const today = new Date().toLocaleDateString('vi-VN')
  doc.setFontSize(8)
  doc.setTextColor(160, 160, 160)
  doc.text(`DingDongSpeak · Xuất ngày ${today}`, margin, 292)

  doc.save(`${lesson.title.replace(/\s+/g, '_')}.pdf`)
}

// ─── Vocab card UI ────────────────────────────────────────────────────────────
function VocabLearnCard({ card }: { card: VocabCard }) {
  const [flipped, setFlipped] = useState(false)

  return (
    <div className="perspective-1000">
      <motion.div
        className="relative cursor-pointer select-none"
        onClick={() => setFlipped(f => !f)}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front — word */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-8 text-center backface-hidden min-h-[220px] flex flex-col items-center justify-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-widest text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-2.5 py-1 rounded-full">
            {card.pos}
          </span>
          <h2 className="text-4xl font-bold text-[var(--text)]">{card.word}</h2>
          <p className="text-base text-[var(--text-secondary)] font-mono">{card.phonetic}</p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
            <Volume2 size={12} />
            <span>Nhấn để xem nghĩa</span>
          </div>
        </div>

        {/* Back — meaning + example */}
        <div
          className="absolute inset-0 rounded-2xl border border-emerald-400/30 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 p-8 flex flex-col items-center justify-center gap-4"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-400">{card.meaning}</p>
            <p className="text-sm text-[var(--text-secondary)] mt-1">{card.pos} • {card.word}</p>
          </div>
          <div className="w-full bg-[var(--bg-secondary)] rounded-xl p-4 text-sm text-[var(--text)] italic text-center leading-relaxed">
            &ldquo;{card.example}&rdquo;
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Grammar card UI ─────────────────────────────────────────────────────────
function GrammarExplainCard({ card }: { card: GrammarCard }) {
  const [showExamples, setShowExamples] = useState(false)

  return (
    <div className="space-y-3">
      {/* Rule header */}
      <div className="rounded-2xl border border-blue-400/20 bg-blue-500/8 p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <BookOpen size={14} className="text-blue-400" />
          </div>
          <h3 className="font-bold text-[var(--text)]">{card.rule}</h3>
        </div>
        <p className="text-sm text-[var(--text)] leading-relaxed">{card.explanation}</p>
      </div>

      {/* Examples (expandable) */}
      <button
        onClick={() => setShowExamples(s => !s)}
        className="w-full flex items-center justify-between p-3 rounded-xl border border-[var(--border)] hover:bg-[var(--bg-secondary)] transition-all text-sm"
      >
        <span className="text-[var(--text-secondary)] font-medium">Ví dụ ({card.examples.length})</span>
        <ChevronRight size={16} className={cn('text-[var(--text-secondary)] transition-transform', showExamples && 'rotate-90')} />
      </button>
      <AnimatePresence>
        {showExamples && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4 space-y-2">
              {card.examples.map((ex, i) => (
                <p key={i} className="text-sm text-[var(--text)] flex items-start gap-2">
                  <span className="text-blue-400 font-bold mt-0.5">•</span>
                  <span>{ex}</span>
                </p>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tip */}
      <div className="flex items-start gap-2.5 rounded-xl bg-yellow-400/8 border border-yellow-400/20 p-3">
        <Lightbulb size={14} className="text-yellow-400 mt-0.5 shrink-0" />
        <p className="text-xs text-[var(--text)] leading-relaxed">{card.tip}</p>
      </div>
    </div>
  )
}

// ─── Speaking card UI ─────────────────────────────────────────────────────────
function SpeakingPromptCard({ card, onComplete }: { card: SpeakingCard; onComplete: (score: number, feedback: string) => void }) {
  const [phase, setPhase] = useState<'prompt' | 'recording' | 'loading' | 'result'>('prompt')
  const [result, setResult] = useState<{ score: number; feedback: string } | null>(null)

  async function handleRecordingComplete(_: Blob, transcript: string) {
    if (!transcript.trim()) {
      toast.error('Không nhận diện được giọng nói. Hãy thử lại.')
      setPhase('prompt')
      return
    }

    setPhase('loading')
    try {
      const res = await fetch('/api/ai/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: card.prompt, transcript, type: 'BEGINNER', topic: 'Speaking practice' }),
      })
      const data = await res.json()
      const score = data.score?.score ?? 70
      const feedback = data.score?.feedback ?? 'Câu trả lời của bạn khá tốt!'
      setResult({ score, feedback })
      setPhase('result')
    } catch {
      toast.error('Lỗi kết nối. Vui lòng thử lại.')
      setPhase('prompt')
    }
  }

  return (
    <div className="space-y-4">
      {/* Prompt */}
      <div className="rounded-2xl border border-violet-400/20 bg-violet-500/8 p-5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <Mic size={15} className="text-violet-400" />
          </div>
          <p className="font-semibold text-[var(--text)] leading-relaxed">{card.prompt}</p>
        </div>
      </div>

      {/* Hint */}
      <div className="flex items-start gap-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] p-3">
        <Lightbulb size={13} className="text-yellow-400 mt-0.5 shrink-0" />
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{card.hint}</p>
      </div>

      {/* Sample phrases */}
      <div className="rounded-xl border border-[var(--border)] p-4">
        <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-2">Gợi ý cụm từ hữu ích</p>
        <div className="space-y-1.5">
          {card.samplePhrases.map((phrase, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <span className="text-cyan-400 font-bold shrink-0">→</span>
              <span className="text-[var(--text)] italic">{phrase}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recording area */}
      <AnimatePresence mode="wait">
        {phase === 'prompt' && (
          <motion.div key="prompt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AudioRecorder onComplete={handleRecordingComplete} onStart={() => setPhase('recording')} />
          </motion.div>
        )}
        {phase === 'recording' && (
          <motion.div key="recording" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AudioRecorder onComplete={handleRecordingComplete} onStart={() => {}} />
          </motion.div>
        )}
        {phase === 'loading' && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-8 gap-3">
            <div className="w-14 h-14 rounded-full border-4 border-violet-400/30 border-t-violet-400 animate-spin" />
            <p className="text-sm text-[var(--text-secondary)]">Đang chấm điểm...</p>
          </motion.div>
        )}
        {phase === 'result' && result && (
          <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <div className={cn(
              'rounded-2xl border p-5 space-y-3',
              result.score >= 75 ? 'border-emerald-400/30 bg-emerald-500/8' :
              result.score >= 55 ? 'border-yellow-400/30 bg-yellow-500/8' :
              'border-orange-400/30 bg-orange-500/8'
            )}>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[var(--text)]">Kết quả của bạn</span>
                <span className={cn('text-3xl font-bold',
                  result.score >= 75 ? 'text-emerald-400' :
                  result.score >= 55 ? 'text-yellow-400' : 'text-orange-400'
                )}>{result.score}%</span>
              </div>
              <p className="text-sm text-[var(--text-secondary)]">{result.feedback}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => { setResult(null); setPhase('prompt') }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-all"
                >
                  <RotateCcw size={14} /> Thử lại
                </button>
                <button
                  onClick={() => onComplete(result.score, result.feedback)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 text-white font-semibold text-sm hover:opacity-90 transition-all"
                >
                  Tiếp tục <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Main Lesson Client ───────────────────────────────────────────────────────
export function LessonClient({ lesson, lessonId, stageColor }: Props) {
  const router = useRouter()
  const [cardIdx, setCardIdx] = useState(0)
  const [phase, setPhase] = useState<'learn' | 'quiz'>('learn')
  const [selected, setSelected] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [completed, setCompleted] = useState(false)
  const [speakingScores, setSpeakingScores] = useState<number[]>([])

  const card = lesson.cards[cardIdx]
  const totalCards = lesson.cards.length
  const progress = ((cardIdx + (phase === 'quiz' ? 0.5 : 0)) / totalCards) * 100

  const goNext = useCallback((wasCorrect?: boolean) => {
    if (wasCorrect !== undefined && wasCorrect) {
      setCorrectCount(c => c + 1)
    }
    setSelected(null)
    setIsCorrect(null)
    setPhase('learn')

    if (cardIdx + 1 >= totalCards) {
      // Done — save progress
      const finalScore = lesson.type === 'speaking'
        ? (speakingScores.length > 0 ? Math.round(speakingScores.reduce((a, b) => a + b) / speakingScores.length) : 70)
        : Math.round(((correctCount + (wasCorrect ? 1 : 0)) / totalCards) * 100)

      fetch('/api/learn/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, score: finalScore }),
      })
      setCompleted(true)
    } else {
      setCardIdx(i => i + 1)
    }
  }, [cardIdx, totalCards, lesson.type, speakingScores, correctCount, lessonId])

  function handleQuizSelect(opt: string) {
    if (selected) return
    const vocabCard = card as VocabCard
    const correct = opt === vocabCard.answer
    setSelected(opt)
    setIsCorrect(correct)
    setTimeout(() => goNext(correct), 1100)
  }

  function handleGrammarSelect(opt: string) {
    if (selected) return
    const grammarCard = card as GrammarCard
    const correct = opt === grammarCard.answer
    setSelected(opt)
    setIsCorrect(correct)
    setTimeout(() => goNext(correct), 1100)
  }

  function handleSpeakingComplete(score: number) {
    setSpeakingScores(prev => [...prev, score])
    goNext(score >= 60)
  }

  const finalScore = lesson.type === 'speaking'
    ? (speakingScores.length > 0 ? Math.round(speakingScores.reduce((a, b) => a + b) / speakingScores.length) : 0)
    : Math.round((correctCount / totalCards) * 100)

  // ── Completion screen ──
  if (completed) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-6 px-4">
        <motion.div initial={{ scale: 0, rotate: -15 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', bounce: 0.5 }}>
          <Trophy size={72} className="text-yellow-400 mx-auto" />
        </motion.div>
        <div>
          <h2 className="text-2xl font-bold text-[var(--text)] mb-1">Bài học hoàn thành!</h2>
          <p className="text-[var(--text-secondary)]">{lesson.title}</p>
        </div>

        <div className={cn('rounded-2xl border p-6 space-y-3', 'border-[var(--border)] bg-[var(--bg-card)]')}>
          <div className={cn('text-5xl font-bold', finalScore >= 80 ? 'text-emerald-400' : finalScore >= 60 ? 'text-yellow-400' : 'text-orange-400')}>
            {finalScore}%
          </div>
          <div className="flex justify-center gap-1">
            {[1, 2, 3].map(s => (
              <Star key={s} size={22} className={cn(s <= (finalScore >= 80 ? 3 : finalScore >= 60 ? 2 : 1) ? 'text-yellow-400 fill-yellow-400' : 'text-[var(--border)]')} />
            ))}
          </div>
          <p className="text-sm text-[var(--text-secondary)]">
            {lesson.type === 'speaking' ? `${speakingScores.length} câu hỏi · điểm trung bình` : `${correctCount}/${totalCards} câu đúng`}
          </p>
          <div className="bg-[var(--bg-secondary)] rounded-xl px-4 py-2 text-sm font-semibold text-cyan-400">
            +{lesson.xp} XP
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => router.push('/learn')}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-all font-medium"
          >
            <ArrowLeft size={16} /> Về Path
          </button>
          <button
            onClick={() => router.push('/learn')}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 text-white font-bold hover:opacity-90 transition-all"
          >
            Bài tiếp theo <ChevronRight size={16} />
          </button>
        </div>
      </div>
    )
  }

  // ── Main lesson UI ──
  return (
    <div className="max-w-xl mx-auto space-y-5 px-2">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/learn')}
          className="p-2 rounded-xl hover:bg-[var(--bg-secondary)] transition-all text-[var(--text-secondary)]"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-1.5">
            <span className="font-medium">{lesson.title}</span>
            <span>{cardIdx + 1}/{totalCards}</span>
          </div>
          <div className="h-2.5 rounded-full bg-[var(--border)] overflow-hidden">
            <motion.div
              className={cn('h-full rounded-full bg-gradient-to-r', stageColor)}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>
        {(lesson.type === 'vocabulary' || lesson.type === 'grammar') && (
          <button
            onClick={() => exportLessonPDF(lesson)}
            title="In PDF"
            className="p-2 rounded-xl hover:bg-[var(--bg-secondary)] transition-all text-[var(--text-secondary)] hover:text-cyan-400"
          >
            <Printer size={16} />
          </button>
        )}
      </div>

      {/* Phase indicator */}
      <div className="flex items-center gap-2">
        <span className={cn(
          'px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide',
          lesson.type === 'vocabulary' ? 'bg-emerald-500/15 text-emerald-400' :
          lesson.type === 'grammar' ? 'bg-blue-500/15 text-blue-400' :
          'bg-violet-500/15 text-violet-400'
        )}>
          {lesson.level}
        </span>
        <span className="text-xs text-[var(--text-secondary)]">{lesson.description}</span>
      </div>

      {/* Card content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${cardIdx}-${phase}`}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.25 }}
          className="space-y-4"
        >
          {/* ── VOCABULARY ── */}
          {lesson.type === 'vocabulary' && card.type === 'vocab' && (
            <>
              {phase === 'learn' ? (
                <>
                  <VocabLearnCard card={card as VocabCard} />
                  <button
                    onClick={() => setPhase('quiz')}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2"
                  >
                    Tôi đã nhớ — làm bài quiz <ChevronRight size={16} />
                  </button>
                </>
              ) : (
                <>
                  {/* Quiz */}
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 text-center">
                    <p className="text-xs text-[var(--text-secondary)] mb-2 uppercase tracking-wide">Từ này có nghĩa là gì?</p>
                    <h2 className="text-3xl font-bold text-[var(--text)] mb-1">{(card as VocabCard).word}</h2>
                    <p className="text-sm text-[var(--text-secondary)] font-mono">{(card as VocabCard).phonetic}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {(card as VocabCard).options.map(opt => (
                      <motion.button
                        key={opt}
                        onClick={() => handleQuizSelect(opt)}
                        whileHover={!selected ? { scale: 1.02 } : {}}
                        whileTap={!selected ? { scale: 0.97 } : {}}
                        className={cn(
                          'p-4 rounded-2xl border text-sm font-medium text-left transition-all leading-snug',
                          !selected && 'border-[var(--border)] bg-[var(--bg-card)] hover:border-emerald-400/40 text-[var(--text)]',
                          selected === opt && isCorrect && 'border-emerald-400 bg-emerald-500/15 text-emerald-400',
                          selected === opt && !isCorrect && 'border-red-400 bg-red-500/15 text-red-400',
                          selected && opt === (card as VocabCard).answer && selected !== opt && 'border-emerald-400 bg-emerald-500/10 text-emerald-400',
                          selected && opt !== (card as VocabCard).answer && selected !== opt && 'opacity-40 border-[var(--border)] text-[var(--text-secondary)]',
                        )}
                      >
                        <div className="flex items-center gap-2">
                          {selected === opt && isCorrect && <Check size={15} className="shrink-0" />}
                          {selected === opt && !isCorrect && <X size={15} className="shrink-0" />}
                          {opt}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {/* ── GRAMMAR ── */}
          {lesson.type === 'grammar' && card.type === 'grammar' && (
            <>
              <GrammarExplainCard card={card as GrammarCard} />
              {/* Exercise */}
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
                <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-3">Bài tập</p>
                <p className="text-base font-semibold text-[var(--text)] mb-4 leading-relaxed">{(card as GrammarCard).question}</p>
                <div className="grid grid-cols-2 gap-2.5">
                  {(card as GrammarCard).options.map(opt => (
                    <motion.button
                      key={opt}
                      onClick={() => handleGrammarSelect(opt)}
                      whileHover={!selected ? { scale: 1.02 } : {}}
                      whileTap={!selected ? { scale: 0.97 } : {}}
                      className={cn(
                        'p-3.5 rounded-xl border text-sm font-medium text-left transition-all',
                        !selected && 'border-[var(--border)] bg-[var(--bg-secondary)] hover:border-blue-400/40 text-[var(--text)]',
                        selected === opt && isCorrect && 'border-emerald-400 bg-emerald-500/15 text-emerald-400',
                        selected === opt && !isCorrect && 'border-red-400 bg-red-500/15 text-red-400',
                        selected && opt === (card as GrammarCard).answer && selected !== opt && 'border-emerald-400 bg-emerald-500/10 text-emerald-400',
                        selected && opt !== (card as GrammarCard).answer && selected !== opt && 'opacity-40 border-[var(--border)] text-[var(--text-secondary)]',
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {selected === opt && isCorrect && <Check size={14} className="shrink-0 text-emerald-400" />}
                        {selected === opt && !isCorrect && <X size={14} className="shrink-0 text-red-400" />}
                        {opt}
                      </div>
                    </motion.button>
                  ))}
                </div>
                {selected && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn('mt-3 rounded-xl p-3 text-sm flex items-start gap-2', isCorrect ? 'bg-emerald-500/10 text-emerald-400' : 'bg-orange-500/10 text-orange-400')}
                  >
                    {isCorrect ? <Check size={14} className="mt-0.5 shrink-0" /> : <Lightbulb size={14} className="mt-0.5 shrink-0" />}
                    <span>{isCorrect ? 'Chính xác! 🎉' : `Đáp án đúng: "${(card as GrammarCard).answer}"`}</span>
                  </motion.div>
                )}
              </div>
            </>
          )}

          {/* ── SPEAKING ── */}
          {lesson.type === 'speaking' && card.type === 'speaking' && (
            <SpeakingPromptCard
              card={card as SpeakingCard}
              onComplete={(score) => handleSpeakingComplete(score)}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
