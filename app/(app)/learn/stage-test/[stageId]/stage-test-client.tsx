'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Heart, Trophy, X, ArrowLeft, Check, Award, BookOpen, Settings } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { TestQuestion } from './page'

interface Props {
  stageId: string
  stageName: string
  stageIcon: string
  stageColor: string
  questions: TestQuestion[]
  alreadyPassed: boolean
  previousScore?: number
}

const MAX_LIVES = 5

export function StageTestClient({ stageId, stageName, stageIcon, stageColor, questions, alreadyPassed, previousScore }: Props) {
  const router = useRouter()
  const [phase, setPhase] = useState<'intro' | 'testing' | 'passed' | 'failed'>('intro')
  const [qIdx, setQIdx] = useState(0)
  const [lives, setLives] = useState(MAX_LIVES)
  const [selected, setSelected] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [finalLives, setFinalLives] = useState(0)
  const [finalScore, setFinalScore] = useState(0)

  const currentQ = questions[qIdx]
  const totalQ = questions.length

  function startTest() {
    setQIdx(0)
    setLives(MAX_LIVES)
    setSelected(null)
    setIsCorrect(null)
    setCorrectCount(0)
    setFinalLives(0)
    setFinalScore(0)
    setPhase('testing')
  }

  const handleSelect = useCallback(async (opt: string) => {
    if (selected !== null) return

    const correct = opt === currentQ.answer
    const newLives = correct ? lives : lives - 1
    const newCorrect = correctCount + (correct ? 1 : 0)

    setSelected(opt)
    setIsCorrect(correct)
    if (!correct) setLives(newLives)
    if (correct) setCorrectCount(newCorrect)

    await new Promise(res => setTimeout(res, 1100))

    if (!correct && newLives <= 0) {
      setPhase('failed')
      return
    }

    const isLast = qIdx + 1 >= totalQ
    if (isLast) {
      const score = Math.round((newCorrect / totalQ) * 100)
      setFinalScore(score)
      setFinalLives(newLives)
      try {
        await fetch('/api/learn/stage-test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stageId, score, livesLeft: newLives }),
        })
      } catch {
        toast.error('Lỗi lưu kết quả, nhưng bạn đã vượt qua!')
      }
      setPhase('passed')
    } else {
      setSelected(null)
      setIsCorrect(null)
      setQIdx(i => i + 1)
    }
  }, [selected, currentQ, lives, correctCount, qIdx, totalQ, stageId])

  // ── Intro ──
  if (phase === 'intro') {
    return (
      <div className="max-w-md mx-auto px-4 py-8 space-y-6">
        <button
          onClick={() => router.push('/learn')}
          className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text)] transition-all text-sm"
        >
          <ArrowLeft size={16} /> Về Path
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-5"
        >
          <div className={cn('w-20 h-20 rounded-3xl bg-gradient-to-br flex items-center justify-center text-4xl mx-auto shadow-xl', stageColor)}>
            {stageIcon}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text)]">Bài Thi Bỏ Qua</h1>
            <p className="text-[var(--text-secondary)] mt-1">{stageName}</p>
          </div>

          {alreadyPassed && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-400 text-sm font-semibold">
              <Check size={14} /> Đã vượt qua · {previousScore}%
            </div>
          )}

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-4 text-left">
            <div className="flex items-center gap-3">
              <Award size={18} className="text-yellow-400 shrink-0" />
              <span className="text-sm text-[var(--text)]"><strong>{totalQ}</strong> câu hỏi từ toàn bộ stage</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex gap-1 shrink-0">
                {Array.from({ length: MAX_LIVES }, (_, i) => (
                  <Heart key={i} size={13} className="text-red-400 fill-red-400" />
                ))}
              </div>
              <span className="text-sm text-[var(--text)]"><strong>5 mạng</strong> cho toàn bài thi</span>
            </div>
            <div className="text-xs text-[var(--text-secondary)] bg-[var(--bg-secondary)] rounded-xl p-3 leading-relaxed">
              Hoàn thành bài thi mà vẫn còn mạng →{' '}
              <strong className="text-cyan-400">toàn bộ stage được mở khoá!</strong>{' '}
              Không cần học từng bài.
            </div>
          </div>

          {totalQ === 0 ? (
            <p className="text-[var(--text-secondary)] text-sm py-2">
              Stage này chưa có đủ câu hỏi trắc nghiệm để thi. Hãy quay lại sau!
            </p>
          ) : (
            <button
              onClick={startTest}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-600 text-white font-bold text-base hover:opacity-90 transition-all shadow-lg shadow-cyan-500/20"
            >
              {alreadyPassed ? 'Thi lại →' : 'Bắt đầu thi →'}
            </button>
          )}
        </motion.div>
      </div>
    )
  }

  // ── Testing ──
  if (phase === 'testing') {
    const progress = (qIdx / totalQ) * 100

    return (
      <div className="max-w-xl mx-auto space-y-5 px-4">
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
              <span className="font-medium">Bài Thi · {stageName}</span>
              <span>{qIdx + 1}/{totalQ}</span>
            </div>
            <div className="h-2.5 rounded-full bg-[var(--border)] overflow-hidden">
              <motion.div
                className={cn('h-full rounded-full bg-gradient-to-r', stageColor)}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>
          {/* Lives */}
          <div className="flex gap-0.5 shrink-0">
            {Array.from({ length: MAX_LIVES }, (_, i) => (
              <motion.div
                key={i}
                animate={{ scale: i < lives ? 1 : 0.55 }}
                transition={{ type: 'spring', bounce: 0.5 }}
              >
                <Heart
                  size={17}
                  className={cn(i < lives ? 'text-red-400 fill-red-400' : 'text-[var(--border)]')}
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={qIdx}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                {currentQ.type === 'vocab' ? (
                  <BookOpen size={13} className="text-emerald-400" />
                ) : (
                  <Settings size={13} className="text-blue-400" />
                )}
                <span className="text-xs text-[var(--text-secondary)] font-semibold uppercase tracking-wide">
                  {currentQ.lessonTitle}
                </span>
              </div>
              <p className="text-base font-semibold text-[var(--text)] leading-relaxed">{currentQ.question}</p>
              {currentQ.hint && (
                <p className="text-sm text-[var(--text-secondary)] font-mono">{currentQ.hint}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {currentQ.options.map(opt => (
                <motion.button
                  key={opt}
                  onClick={() => handleSelect(opt)}
                  whileHover={!selected ? { scale: 1.02 } : {}}
                  whileTap={!selected ? { scale: 0.97 } : {}}
                  className={cn(
                    'p-4 rounded-2xl border text-sm font-medium text-left transition-all leading-snug',
                    !selected && 'border-[var(--border)] bg-[var(--bg-card)] hover:border-cyan-400/40 text-[var(--text)]',
                    selected === opt && isCorrect && 'border-emerald-400 bg-emerald-500/15 text-emerald-400',
                    selected === opt && !isCorrect && 'border-red-400 bg-red-500/15 text-red-400',
                    selected && opt === currentQ.answer && selected !== opt && 'border-emerald-400 bg-emerald-500/10 text-emerald-400',
                    selected && opt !== currentQ.answer && selected !== opt && 'opacity-40 border-[var(--border)] text-[var(--text-secondary)]',
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
          </motion.div>
        </AnimatePresence>
      </div>
    )
  }

  // ── Passed ──
  if (phase === 'passed') {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-6 px-4">
        <motion.div
          initial={{ scale: 0, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', bounce: 0.5 }}
        >
          <Trophy size={72} className="text-yellow-400 mx-auto" />
        </motion.div>
        <div>
          <h2 className="text-2xl font-bold text-[var(--text)] mb-1">Vượt qua!</h2>
          <p className="text-[var(--text-secondary)]">{stageName} đã được mở khoá</p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 space-y-4">
          <div className={cn('text-5xl font-bold', finalScore >= 80 ? 'text-emerald-400' : 'text-yellow-400')}>
            {finalScore}%
          </div>
          <div className="flex justify-center gap-1.5">
            {Array.from({ length: MAX_LIVES }, (_, i) => (
              <Heart
                key={i}
                size={20}
                className={cn(i < finalLives ? 'text-red-400 fill-red-400' : 'text-[var(--border)]')}
              />
            ))}
          </div>
          <p className="text-sm text-[var(--text-secondary)]">{finalLives} mạng còn lại</p>
          <div className="text-xs text-emerald-400 font-bold bg-emerald-500/10 rounded-xl px-4 py-2.5">
            🎉 Toàn bộ stage đã được mở khoá!
          </div>
        </div>

        <button
          onClick={() => router.push('/learn')}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-600 text-white font-bold hover:opacity-90 transition-all"
        >
          Về Path →
        </button>
      </div>
    )
  }

  // ── Failed ──
  return (
    <div className="max-w-md mx-auto text-center py-16 space-y-6 px-4">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', bounce: 0.4 }}
        className="w-20 h-20 rounded-full bg-red-500/15 border border-red-400/30 flex items-center justify-center mx-auto"
      >
        <X size={40} className="text-red-400" />
      </motion.div>
      <div>
        <h2 className="text-2xl font-bold text-[var(--text)] mb-1">Hết mạng!</h2>
        <p className="text-[var(--text-secondary)]">
          Đã làm {qIdx + 1}/{totalQ} câu — hãy ôn thêm và thử lại nhé!
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => router.push('/learn')}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-all font-medium text-sm"
        >
          <ArrowLeft size={14} /> Về Path
        </button>
        <button
          onClick={startTest}
          className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 text-white font-bold text-sm hover:opacity-90 transition-all"
        >
          Thử lại →
        </button>
      </div>
    </div>
  )
}
