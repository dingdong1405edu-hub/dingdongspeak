'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { GraduationCap, Mic, Volume2, ChevronRight, Clock, Loader2, BookOpen, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AudioRecorder } from '@/components/practice/audio-recorder'
import { ScoreCard } from '@/components/practice/score-card'
import { useLang } from '@/components/shared/lang-provider'
import { cn, formatDuration } from '@/lib/utils'
import type { IELTSQuestion, ScoreBreakdown, QARecord } from '@/types'

interface Props { sessionId: string }

type Phase = 'loading' | 'briefing' | 'part1' | 'part2-prep' | 'part2' | 'part3' | 'scoring-all' | 'complete'

interface PendingAnswer { question: IELTSQuestion; transcript: string }

export function MockTestSession({ sessionId }: Props) {
  const { lang, config } = useLang()
  // Pick a random topic from the active language's topic pool.
  const [topic] = useState(() => config.topics[Math.floor(Math.random() * config.topics.length)])
  const [phase, setPhase] = useState<Phase>('loading')
  const [part1Qs, setPart1Qs] = useState<IELTSQuestion[]>([])
  const [part2Q, setPart2Q] = useState<IELTSQuestion | null>(null)
  const [part3Qs, setPart3Qs] = useState<IELTSQuestion[]>([])
  const [currentPart1Idx, setCurrentPart1Idx] = useState(0)
  const [p3Idx, setP3Idx] = useState(0)
  const [prepTimer, setPrepTimer] = useState(60)
  const [elapsed, setElapsed] = useState(0)
  const [pendingAnswers, setPendingAnswers] = useState<PendingAnswer[]>([])
  const [finalScores, setFinalScores] = useState<ScoreBreakdown | null>(null)
  const [scoringProgress, setScoringProgress] = useState(0)

  // Section labels driven by config.
  const sectionLabel = (id: 'PART1' | 'PART2' | 'PART3') =>
    config.sections.find(s => s.id === id)?.label ?? id

  // Build fallback questions in the target language from config.fallbackQuestions.
  function buildFallback(): IELTSQuestion[] {
    const fb = config.fallbackQuestions
    const result: IELTSQuestion[] = []
    // Part 1 — first question.
    result.push({ id: 'fb-p1', question: fb[0] ?? '', part: 'PART1' })
    // Part 2 — middle (cue card only when the language uses one).
    result.push({
      id: 'fb-p2',
      question: fb[1] ?? fb[0] ?? '',
      part: 'PART2',
      ...(config.hasCueCard ? { cueCard: ['What', 'When & where', 'Who', 'Why'] } : {}),
    })
    // Part 3 — last question.
    result.push({ id: 'fb-p3', question: fb[2] ?? fb[fb.length - 1] ?? '', part: 'PART3' })
    return result
  }

  // Load questions
  useEffect(() => {
    async function load() {
      try {
        const [p1, p2, p3] = await Promise.all([
          fetch('/api/ai/question', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topic, part: 'PART1', count: 4, lang }) }).then(r => r.json()),
          fetch('/api/ai/question', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topic, part: 'PART2', count: 1, lang }) }).then(r => r.json()),
          fetch('/api/ai/question', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topic, part: 'PART3', count: 4, lang }) }).then(r => r.json()),
        ])
        const fallback = buildFallback()
        setPart1Qs(p1.questions?.length ? p1.questions : fallback.filter(q => q.part === 'PART1'))
        setPart2Q(p2.questions?.[0] || fallback.find(q => q.part === 'PART2') || null)
        setPart3Qs(p3.questions?.length ? p3.questions : fallback.filter(q => q.part === 'PART3'))
        setPhase('briefing')
      } catch {
        toast.error('Lỗi tải câu hỏi, dùng câu hỏi mặc định')
        const fallback = buildFallback()
        setPart1Qs(fallback.filter(q => q.part === 'PART1'))
        setPart2Q(fallback.find(q => q.part === 'PART2') || null)
        setPart3Qs(fallback.filter(q => q.part === 'PART3'))
        setPhase('briefing')
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic, lang])

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (['part1', 'part2', 'part3'].includes(phase)) {
      interval = setInterval(() => setElapsed(e => e + 1), 1000)
    }
    return () => clearInterval(interval)
  }, [phase])

  // Part 2 prep countdown (only relevant when the language uses a cue card)
  useEffect(() => {
    if (phase !== 'part2-prep') return
    if (prepTimer <= 0) { setPhase('part2'); return }
    const t = setTimeout(() => setPrepTimer(p => p - 1), 1000)
    return () => clearTimeout(t)
  }, [phase, prepTimer])

  async function playTTS(text: string) {
    // No server TTS voice for this language — skip gracefully (text stays visible).
    if (!config.ttsVoice) return
    try {
      const res = await fetch('/api/speech/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, lang }) })
      if (!res.ok || res.status === 204) return
      const blob = await res.blob()
      if (blob.size === 0) return
      new Audio(URL.createObjectURL(blob)).play()
    } catch {}
  }

  // Store answer without scoring — advance immediately
  function recordAnswer(question: IELTSQuestion, transcript: string) {
    setPendingAnswers(prev => [...prev, { question, transcript }])
  }

  // Score all answers at the end
  async function scoreAllAnswers(answers: PendingAnswer[]) {
    setPhase('scoring-all')
    const qaRecords: QARecord[] = []
    for (let i = 0; i < answers.length; i++) {
      const { question, transcript } = answers[i]
      try {
        const res = await fetch('/api/ai/score', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: question.question, transcript, part: question.part, type: 'MOCK_TEST', topic, lang }),
        })
        const data = await res.json()
        if (res.ok && data.score) {
          qaRecords.push({ question, transcript, score: data.score })
        }
      } catch {}
      setScoringProgress(Math.round(((i + 1) / answers.length) * 100))
    }
    if (qaRecords.length === 0) {
      toast.error('Không thể chấm điểm')
      return
    }
    const finalScore = calcFinalScore(qaRecords)
    setFinalScores(finalScore)
    // Save session to history
    fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'MOCK_TEST',
        topic,
        part: 'FULL',
        language: lang,
        questions: qaRecords.map(r => ({ question: r.question.question, transcript: r.transcript })),
        scores: qaRecords.map(r => r.score),
        duration: 0,
      }),
    }).catch(() => {})
    setPhase('complete')
  }

  function calcFinalScore(records: QARecord[]): ScoreBreakdown {
    const avg = (key: keyof Pick<ScoreBreakdown, 'overall' | 'fluency' | 'lexical' | 'grammar' | 'pronunciation'>) =>
      records.reduce((s, r) => s + (r.score[key] as number), 0) / records.length
    const overallAvg = avg('overall')
    let overall: number
    if (config.scoreScale === 9) {
      // IELTS-style: round to nearest 0.5 band step.
      const validBands = [0, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9]
      overall = validBands.reduce((prev, curr) => Math.abs(curr - overallAvg) < Math.abs(prev - overallAvg) ? curr : prev)
    } else {
      // 0–100 scale: plain integer average.
      overall = Math.round(overallAvg)
    }
    const sub = (key: keyof Pick<ScoreBreakdown, 'fluency' | 'lexical' | 'grammar' | 'pronunciation'>) =>
      config.scoreScale === 9 ? parseFloat(avg(key).toFixed(1)) : Math.round(avg(key))
    return {
      overall,
      fluency: sub('fluency'),
      lexical: sub('lexical'),
      grammar: sub('grammar'),
      pronunciation: sub('pronunciation'),
      feedback: `Bạn đã hoàn thành bài thi thử với ${records.length} câu trả lời. ${config.scoreLabel} ước tính: ${overall}. Kết quả dựa trên toàn bộ bài thi ${sectionLabel('PART1')}, ${sectionLabel('PART2')}, ${sectionLabel('PART3')}.`,
    }
  }

  // ── Part 1 state ──
  const [p1Phase, setP1Phase] = useState<'question' | 'answered'>('question')

  function handlePart1Answer(_: Blob, transcript: string) {
    recordAnswer(part1Qs[currentPart1Idx], transcript)
    setP1Phase('answered')
    setTimeout(() => {
      if (currentPart1Idx + 1 >= part1Qs.length) {
        // Cue-card prep step only when the language uses a cue card.
        if (config.hasCueCard) {
          setPhase('part2-prep')
        } else {
          setPhase('part2')
          if (part2Q) playTTS(part2Q.question)
        }
      } else {
        setCurrentPart1Idx(i => i + 1)
        setP1Phase('question')
        if (part1Qs[currentPart1Idx + 1]) playTTS(part1Qs[currentPart1Idx + 1].question)
      }
    }, 600)
  }

  // ── Part 2 state ──
  const [p2Phase, setP2Phase] = useState<'question' | 'answered'>('question')

  function handlePart2Answer(_: Blob, transcript: string) {
    if (part2Q) recordAnswer(part2Q, transcript)
    setP2Phase('answered')
    setTimeout(() => {
      setPhase('part3')
      if (part3Qs[0]) playTTS(part3Qs[0].question)
    }, 600)
  }

  // ── Part 3 state ──
  const [p3Phase, setP3Phase] = useState<'question' | 'answered'>('question')

  function handlePart3Answer(_: Blob, transcript: string) {
    recordAnswer(part3Qs[p3Idx], transcript)
    setP3Phase('answered')
    setTimeout(() => {
      if (p3Idx + 1 >= part3Qs.length) {
        scoreAllAnswers([...pendingAnswers, { question: part3Qs[p3Idx], transcript }])
      } else {
        setP3Idx(i => i + 1)
        setP3Phase('question')
        if (part3Qs[p3Idx + 1]) playTTS(part3Qs[p3Idx + 1].question)
      }
    }, 600)
  }

  // ── RENDERS ──

  if (phase === 'loading') return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 size={40} className="text-violet-400 animate-spin" />
      <p className="text-[var(--text-secondary)]">AI đang ra đề ngẫu nhiên...</p>
      <p className="text-xs text-[var(--text-secondary)] opacity-60">Chủ đề sẽ được chọn tự động</p>
    </div>
  )

  if (phase === 'scoring-all') return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="relative">
        <div className="w-20 h-20 rounded-full border-4 border-violet-400/20" />
        <div
          className="absolute inset-0 rounded-full border-4 border-violet-400 border-t-transparent animate-spin"
          style={{ animationDuration: '1s' }}
        />
        <GraduationCap size={28} className="absolute inset-0 m-auto text-violet-400" />
      </div>
      <div className="text-center">
        <p className="text-[var(--text)] font-semibold mb-1">AI đang chấm toàn bộ bài thi...</p>
        <p className="text-sm text-[var(--text-secondary)]">{scoringProgress}% hoàn thành</p>
      </div>
      <div className="w-64 h-2 bg-[var(--border)] rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full"
          animate={{ width: `${scoringProgress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  )

  if (phase === 'briefing') return (
    <div className="max-w-2xl mx-auto">
      <Card className="text-center py-10">
        <GraduationCap size={48} className="text-violet-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-[var(--text)] mb-2">Thi thử {config.examFull}</h2>
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-500/15 text-violet-400 text-sm mb-6">
          Chủ đề: <strong className="ml-1">{topic}</strong>
        </div>
        <div className="space-y-2 text-sm text-[var(--text-secondary)] text-left bg-[var(--bg-secondary)] rounded-xl p-4 mb-6">
          <p>📋 <strong>{sectionLabel('PART1')}</strong>: {part1Qs.length} câu hỏi cá nhân (~4-5 phút)</p>
          {config.hasCueCard ? (
            <p>📋 <strong>{sectionLabel('PART2')}</strong>: 1 cue card, 1 phút chuẩn bị, 2 phút nói</p>
          ) : (
            <p>📋 <strong>{sectionLabel('PART2')}</strong>: nói liên tục về một chủ đề</p>
          )}
          <p>📋 <strong>{sectionLabel('PART3')}</strong>: {part3Qs.length} câu hỏi thảo luận (~4-5 phút)</p>
          <p>⚠️ <strong>Không xem điểm giữa chừng</strong> — AI chấm tổng thể sau khi xong tất cả</p>
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
        <p className="text-[var(--text-secondary)] mb-4">giây chuẩn bị cho {sectionLabel('PART2')}</p>
        {part2Q && (
          <div className="bg-[var(--bg-secondary)] rounded-xl p-4 text-left mb-6">
            <p className="text-sm font-semibold text-violet-400 mb-2">📋 Cue Card — {topic}</p>
            <p className="text-[var(--text)] mb-3">{part2Q.question}</p>
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
        <h2 className="text-2xl font-bold text-[var(--text)]">Hoàn thành Thi thử {config.examFull}!</h2>
        <p className="text-[var(--text-secondary)] text-sm mt-1">
          Chủ đề: {topic} · Tổng thời gian: {formatDuration(elapsed)}
        </p>
      </div>
      <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-xs text-yellow-400 text-center">
        ⚠️ Đây là điểm ước tính từ AI — không phải kết quả thi {config.exam} chính thức
      </div>
      <ScoreCard score={finalScores} lang={lang} />
      <div className="flex gap-3">
        <Button variant="gradient" onClick={() => window.location.href = '/mock-test'} className="flex-1">Thi lại</Button>
        <Button variant="secondary" onClick={() => window.location.href = '/review'} className="flex-1">
          <BookOpen size={16} /> Ôn tập
        </Button>
      </div>
    </motion.div>
  )

  // ── Part renders ──
  const currentPartLabel =
    phase === 'part1' ? sectionLabel('PART1') :
    phase === 'part2' ? sectionLabel('PART2') :
    sectionLabel('PART3')
  const currentQuestion =
    phase === 'part1' ? part1Qs[currentPart1Idx] :
    phase === 'part2' ? part2Q :
    part3Qs[p3Idx]
  const currentLocalPhase = phase === 'part1' ? p1Phase : phase === 'part2' ? p2Phase : p3Phase
  const totalAnswered = pendingAnswers.length
  const totalQuestions = part1Qs.length + 1 + part3Qs.length

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <Badge variant="info"><GraduationCap size={12} /> {currentPartLabel}</Badge>
        <span className="text-sm text-[var(--text-secondary)]">{formatDuration(elapsed)}</span>
        <span className="text-xs text-violet-400">{totalAnswered}/{totalQuestions} câu</span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full"
          animate={{ width: `${(totalAnswered / totalQuestions) * 100}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      {currentQuestion && (
        <Card>
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs text-violet-400 font-medium uppercase">{currentPartLabel}</span>
            {config.ttsVoice && (
              <button onClick={() => playTTS(currentQuestion.question)} className="p-1.5 rounded-lg bg-violet-400/10 text-violet-400 hover:bg-violet-400/20 transition-all">
                <Volume2 size={14} />
              </button>
            )}
          </div>
          <p className="text-lg font-medium text-[var(--text)] leading-relaxed mb-4">
            {currentQuestion.question}
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

      {currentLocalPhase === 'question' && (
        <AudioRecorder
          lang={lang}
          onComplete={
            phase === 'part1' ? handlePart1Answer :
            phase === 'part2' ? handlePart2Answer :
            handlePart3Answer
          }
          onStart={() => {}}
        />
      )}

      {currentLocalPhase === 'answered' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20"
        >
          <CheckCircle size={18} className="text-emerald-400" />
          <span className="text-emerald-400 font-medium text-sm">Đã ghi nhận — đang chuyển câu tiếp theo...</span>
        </motion.div>
      )}
    </div>
  )
}
