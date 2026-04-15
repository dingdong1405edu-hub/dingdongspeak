'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GraduationCap, Mic, Volume2, ChevronRight, Clock, Loader2, Star, BookOpen, Lightbulb, Save, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AudioRecorder } from '@/components/practice/audio-recorder'
import { ScoreCard } from '@/components/practice/score-card'
import { cn, bandToColor, formatDuration } from '@/lib/utils'
import type { IELTSQuestion, ScoreBreakdown, QARecord } from '@/types'

interface Props { sessionId: string; topic: string }

type Phase = 'loading' | 'briefing' | 'part1' | 'part2-prep' | 'part2' | 'part3' | 'scoring-all' | 'complete'

const MOCK_QUESTIONS_FALLBACK: IELTSQuestion[] = [
  { id: 'q1', question: 'Can you tell me your full name please?', part: 'PART1' },
  { id: 'q2', question: 'Where are you from?', part: 'PART1' },
  { id: 'q3', question: 'Do you work or are you a student?', part: 'PART1' },
  { id: 'q4', question: `Describe a time when you learned something new about ${'{topic}'}.`, part: 'PART2', cueCard: ['What it was', 'When you learned it', 'How you learned it', 'How it affected you'] },
  { id: 'q5', question: `How important is education about this topic in schools?`, part: 'PART3' },
  { id: 'q6', question: `What role should the government play in promoting awareness about this topic?`, part: 'PART3' },
]

export function MockTestSession({ sessionId, topic }: Props) {
  const [phase, setPhase] = useState<Phase>('loading')
  const [part1Qs, setPart1Qs] = useState<IELTSQuestion[]>([])
  const [part2Q, setPart2Q] = useState<IELTSQuestion | null>(null)
  const [part3Qs, setPart3Qs] = useState<IELTSQuestion[]>([])
  const [currentPart1Idx, setCurrentPart1Idx] = useState(0)
  const [qaRecords, setQaRecords] = useState<QARecord[]>([])
  const [prepTimer, setPrepTimer] = useState(60)
  const [elapsed, setElapsed] = useState(0)
  const [savedItems, setSavedItems] = useState<string[]>([])
  const [finalScores, setFinalScores] = useState<ScoreBreakdown | null>(null)

  // Load questions
  useEffect(() => {
    async function load() {
      try {
        const [p1, p2, p3] = await Promise.all([
          fetch('/api/ai/question', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topic, part: 'PART1', count: 4 }) }).then(r => r.json()),
          fetch('/api/ai/question', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topic, part: 'PART2', count: 1 }) }).then(r => r.json()),
          fetch('/api/ai/question', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topic, part: 'PART3', count: 4 }) }).then(r => r.json()),
        ])
        setPart1Qs(p1.questions || [])
        setPart2Q(p2.questions?.[0] || null)
        setPart3Qs(p3.questions || [])
        setPhase('briefing')
      } catch {
        toast.error('Lỗi tải câu hỏi')
      }
    }
    load()
  }, [topic])

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (['part1', 'part2', 'part3'].includes(phase)) {
      interval = setInterval(() => setElapsed(e => e + 1), 1000)
    }
    return () => clearInterval(interval)
  }, [phase])

  // Prep countdown
  useEffect(() => {
    if (phase !== 'part2-prep') return
    if (prepTimer <= 0) { setPhase('part2'); return }
    const t = setTimeout(() => setPrepTimer(p => p - 1), 1000)
    return () => clearTimeout(t)
  }, [phase, prepTimer])

  async function playTTS(text: string) {
    try {
      const res = await fetch('/api/speech/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) })
      const blob = await res.blob()
      new Audio(URL.createObjectURL(blob)).play()
    } catch {}
  }

  async function handleAnswerComplete(question: IELTSQuestion, transcript: string) {
    const res = await fetch('/api/ai/score', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: question.question, transcript, part: question.part, type: 'MOCK_TEST', topic }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error || 'Chấm điểm lỗi'); return }
    setQaRecords(prev => [...prev, { question, transcript, score: data.score }])
    return data.score as ScoreBreakdown
  }

  function calcFinalScore(records: QARecord[]): ScoreBreakdown {
    if (records.length === 0) return { overall: 0, fluency: 0, lexical: 0, grammar: 0, pronunciation: 0, feedback: '', strengths: [], improvements: [] }
    const avg = (key: keyof ScoreBreakdown) =>
      records.reduce((s, r) => s + (r.score[key] as number), 0) / records.length

    const overall = parseFloat((avg('overall')).toFixed(1))
    const validBands = [0, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9]
    const rounded = validBands.reduce((prev, curr) => Math.abs(curr - overall) < Math.abs(prev - overall) ? curr : prev)

    return {
      overall: rounded,
      fluency: parseFloat((avg('fluency')).toFixed(1)),
      lexical: parseFloat((avg('lexical')).toFixed(1)),
      grammar: parseFloat((avg('grammar')).toFixed(1)),
      pronunciation: parseFloat((avg('pronunciation')).toFixed(1)),
      feedback: `Bạn đã hoàn thành bài thi thử với band ước tính ${rounded}. Điều này dựa trên ${records.length} câu trả lời trong toàn bộ bài thi.`,
      strengths: records.flatMap(r => r.score.strengths || []).slice(0, 3),
      improvements: records.flatMap(r => r.score.improvements || []).slice(0, 3),
    }
  }

  // ===== PART 1 HANDLER =====
  const [p1CurrentScore, setP1CurrentScore] = useState<ScoreBreakdown | null>(null)
  const [p1Phase, setP1Phase] = useState<'question' | 'recording' | 'result'>('question')

  async function handlePart1Complete(blob: Blob, transcript: string) {
    setP1Phase('result')
    const score = await handleAnswerComplete(part1Qs[currentPart1Idx], transcript)
    if (score) setP1CurrentScore(score)
  }

  function advancePart1() {
    if (currentPart1Idx + 1 >= part1Qs.length) {
      setPhase('part2-prep')
    } else {
      setCurrentPart1Idx(i => i + 1)
      setP1Phase('question')
      setP1CurrentScore(null)
    }
  }

  // ===== PART 2 HANDLER =====
  const [p2Score, setP2Score] = useState<ScoreBreakdown | null>(null)
  const [p2Phase, setP2Phase] = useState<'question' | 'recording' | 'result'>('question')

  async function handlePart2Complete(blob: Blob, transcript: string) {
    setP2Phase('result')
    if (part2Q) {
      const score = await handleAnswerComplete(part2Q, transcript)
      if (score) setP2Score(score)
    }
  }

  // ===== PART 3 HANDLER =====
  const [p3Idx, setP3Idx] = useState(0)
  const [p3Records, setP3Records] = useState<QARecord[]>([])
  const [p3Phase, setP3Phase] = useState<'question' | 'recording' | 'result'>('question')
  const [p3CurrentScore, setP3CurrentScore] = useState<ScoreBreakdown | null>(null)

  async function handlePart3Complete(blob: Blob, transcript: string) {
    setP3Phase('result')
    const score = await handleAnswerComplete(part3Qs[p3Idx], transcript)
    if (score) setP3CurrentScore(score)
  }

  function advancePart3() {
    if (p3Idx + 1 >= part3Qs.length) {
      const allRecords = [...qaRecords, ...p3Records]
      const final = calcFinalScore(allRecords)
      setFinalScores(final)
      setPhase('complete')
    } else {
      setP3Idx(i => i + 1)
      setP3Phase('question')
      setP3CurrentScore(null)
    }
  }

  // ===== RENDERS =====

  if (phase === 'loading') return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 size={40} className="text-violet-400 animate-spin" />
      <p className="text-[var(--text-secondary)]">AI đang chuẩn bị đề thi về "{topic}"...</p>
    </div>
  )

  if (phase === 'briefing') return (
    <div className="max-w-2xl mx-auto">
      <Card className="text-center py-10">
        <GraduationCap size={48} className="text-violet-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-[var(--text)] mb-2">IELTS Speaking Mock Test</h2>
        <p className="text-[var(--text-secondary)] mb-6">Chủ đề: <strong className="text-violet-400">{topic}</strong></p>
        <div className="space-y-2 text-sm text-[var(--text-secondary)] text-left bg-[var(--bg-secondary)] rounded-xl p-4 mb-8">
          <p>📋 <strong>Part 1</strong>: {part1Qs.length} câu hỏi cá nhân (~4-5 phút)</p>
          <p>📋 <strong>Part 2</strong>: 1 cue card, 1 phút chuẩn bị, 2 phút nói</p>
          <p>📋 <strong>Part 3</strong>: {part3Qs.length} câu hỏi thảo luận (~4-5 phút)</p>
          <p>⚠️ AI sẽ chấm điểm nghiêm khắc như IELTS thật. Không inflate điểm.</p>
        </div>
        <Button variant="gradient" size="lg" onClick={() => {
          setPhase('part1')
          if (part1Qs[0]) setTimeout(() => playTTS(part1Qs[0].question), 500)
        }}>
          <Mic size={18} /> Bắt đầu thi
        </Button>
      </Card>
    </div>
  )

  if (phase === 'part2-prep') return (
    <div className="max-w-2xl mx-auto">
      <Card className="text-center py-10">
        <div className="text-6xl font-bold gradient-text mb-2">{prepTimer}</div>
        <p className="text-[var(--text-secondary)] mb-4">giây chuẩn bị cho Part 2</p>
        {part2Q && (
          <div className="bg-[var(--bg-secondary)] rounded-xl p-4 text-left mb-6">
            <p className="text-sm font-semibold text-violet-400 mb-2">📋 Cue Card — {topic}</p>
            <p className="text-[var(--text)] mb-3">{part2Q.question.replace('{topic}', topic)}</p>
            {part2Q.cueCard && (
              <ul className="space-y-1">
                {part2Q.cueCard.map((b, i) => (
                  <li key={i} className="text-sm text-[var(--text-secondary)] flex items-start gap-2">
                    <span className="text-violet-400">•</span> {b}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        <p className="text-xs text-[var(--text-secondary)]">Bài thi sẽ tự động bắt đầu khi hết giờ</p>
      </Card>
    </div>
  )

  if (phase === 'complete' && finalScores) return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <div className="text-5xl mb-3">🎓</div>
        <h2 className="text-2xl font-bold text-[var(--text)]">Hoàn thành IELTS Mock Test!</h2>
        <p className="text-[var(--text-secondary)] text-sm mt-1">
          Chủ đề: {topic} · Tổng thời gian: {formatDuration(elapsed)}
        </p>
      </div>
      <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-xs text-yellow-400 text-center">
        ⚠️ Đây là điểm ước tính từ AI — không phải kết quả thi IELTS chính thức
      </div>
      <ScoreCard score={finalScores} />
      <div className="flex gap-3">
        <Button variant="gradient" onClick={() => window.location.href = '/mock-test'} className="flex-1">Thi lại</Button>
        <Button variant="secondary" onClick={() => window.location.href = '/review'} className="flex-1">
          <BookOpen size={16} /> Ôn tập
        </Button>
      </div>
    </motion.div>
  )

  // Parts render
  const currentPartLabel = phase === 'part1' ? 'Part 1' : phase === 'part2' ? 'Part 2' : 'Part 3'
  const currentQuestion =
    phase === 'part1' ? part1Qs[currentPart1Idx] :
    phase === 'part2' ? part2Q :
    part3Qs[p3Idx]
  const currentPhaseLocal = phase === 'part1' ? p1Phase : phase === 'part2' ? p2Phase : p3Phase
  const currentScoreLocal = phase === 'part1' ? p1CurrentScore : phase === 'part2' ? p2Score : p3CurrentScore

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <Badge variant="info"><GraduationCap size={12} /> {currentPartLabel}</Badge>
        <span className="text-sm text-[var(--text-secondary)]">{formatDuration(elapsed)}</span>
        <Badge variant="default">{topic}</Badge>
      </div>

      {currentQuestion && (
        <Card>
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs text-violet-400 font-medium uppercase">{currentQuestion.part}</span>
            <button onClick={() => playTTS(currentQuestion.question)} className="p-1.5 rounded-lg bg-violet-400/10 text-violet-400 hover:bg-violet-400/20 transition-all">
              <Volume2 size={14} />
            </button>
          </div>
          <p className="text-lg font-medium text-[var(--text)] leading-relaxed mb-4">
            {currentQuestion.question.replace('{topic}', topic)}
          </p>
          {currentQuestion.cueCard && (
            <div className="bg-[var(--bg-secondary)] rounded-xl p-3 mb-3">
              <p className="text-xs font-semibold text-violet-400 mb-2">Nói về:</p>
              <ul className="space-y-1">
                {currentQuestion.cueCard.map((b, i) => (
                  <li key={i} className="text-sm text-[var(--text-secondary)] flex items-start gap-2">
                    <span className="text-violet-400">•</span> {b}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}

      {(currentPhaseLocal === 'question' || currentPhaseLocal === 'recording') && (
        <AudioRecorder
          onComplete={phase === 'part1' ? handlePart1Complete : phase === 'part2' ? handlePart2Complete : handlePart3Complete}
          onStart={() => {
            if (phase === 'part1') setP1Phase('recording')
            else if (phase === 'part2') setP2Phase('recording')
            else setP3Phase('recording')
          }}
        />
      )}

      {currentPhaseLocal === 'result' && currentScoreLocal && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <ScoreCard score={currentScoreLocal} />
          <Button variant="gradient" size="lg" className="w-full" onClick={() => {
            if (phase === 'part1') advancePart1()
            else if (phase === 'part2') {
              setPhase('part3')
              if (part3Qs[0]) setTimeout(() => playTTS(part3Qs[0].question), 300)
            } else advancePart3()
          }}>
            Tiếp tục <ChevronRight size={18} />
          </Button>
        </motion.div>
      )}
    </div>
  )
}
