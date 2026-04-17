'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic, Square, Play, Volume2, ChevronRight,
  Star, BookOpen, Lightbulb, Save, CheckCircle,
  Loader2, Headphones, Trophy
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScoreCard } from '@/components/practice/score-card'
import { AudioRecorder } from '@/components/practice/audio-recorder'
import { TopicLeaderboard } from '@/components/practice/topic-leaderboard'
import { cn, bandToColor, formatDuration } from '@/lib/utils'
import type { IELTSQuestion, ScoreBreakdown, QARecord } from '@/types'

interface Props {
  sessionId: string
  topic: string
  part: 'PART1' | 'PART2' | 'PART3'
  count: number
}

type Phase = 'loading' | 'intro' | 'question' | 'recording' | 'scoring' | 'result' | 'complete'

export function PracticeSession({ sessionId, topic, part, count }: Props) {
  const [phase, setPhase] = useState<Phase>('loading')
  const [questions, setQuestions] = useState<IELTSQuestion[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [qaRecords, setQaRecords] = useState<QARecord[]>([])
  const [currentScore, setCurrentScore] = useState<ScoreBreakdown | null>(null)
  const [transcript, setTranscript] = useState('')
  const [sampleAnswer, setSampleAnswer] = useState('')
  const [vocabData, setVocabData] = useState<{ vocabulary: string[]; idioms: string[] } | null>(null)
  const [loadingSample, setLoadingSample] = useState(false)
  const [loadingVocab, setLoadingVocab] = useState(false)
  const [savedItems, setSavedItems] = useState<string[]>([])
  const [elapsed, setElapsed] = useState(0)
  const [ttsState, setTtsState] = useState<'idle' | 'loading' | 'playing'>('idle')
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null)
  const [improvedAnswer, setImprovedAnswer] = useState('')
  const [loadingImprove, setLoadingImprove] = useState(false)
  const [rightTab, setRightTab] = useState<'ai' | 'leaderboard'>('leaderboard')
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined)

  const currentQuestion = questions[currentIdx]

  // Load questions
  useEffect(() => {
    async function loadQuestions() {
      try {
        const res = await fetch('/api/ai/question', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic, part, count }),
        })
        const data = await res.json()
        setQuestions(data.questions || [])
        setPhase('intro')
      } catch {
        toast.error('Không tải được câu hỏi. Vui lòng thử lại.')
      }
    }
    loadQuestions()
  }, [topic, part, count])

  // Timer
  useEffect(() => {
    if (phase === 'question' || phase === 'recording') {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [phase])

  async function playQuestion(text: string) {
    // Stop any currently playing TTS
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current = null
    }
    setTtsState('loading')
    try {
      const res = await fetch('/api/speech/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (!res.ok) throw new Error('TTS failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      currentAudioRef.current = audio
      setTtsState('playing')
      audio.onended = () => {
        setTtsState('idle')
        currentAudioRef.current = null
        URL.revokeObjectURL(url)
      }
      audio.onerror = () => {
        setTtsState('idle')
        currentAudioRef.current = null
      }
      audio.play()
    } catch {
      setTtsState('idle')
      // TTS failed silently — user can still read the question
    }
  }

  function startQuestion() {
    setPhase('question')
    setCurrentScore(null)
    setTranscript('')
    setSampleAnswer('')
    setVocabData(null)
    if (currentQuestion) {
      setTimeout(() => playQuestion(currentQuestion.question), 300)
    }
  }

  async function onRecordingComplete(audioBlob: Blob, transcriptText: string) {
    setTranscript(transcriptText)
    setPhase('scoring')
    // Store blob URL for replay
    if (recordingUrl) URL.revokeObjectURL(recordingUrl)
    setRecordingUrl(URL.createObjectURL(audioBlob))

    try {
      const res = await fetch('/api/ai/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQuestion?.question,
          transcript: transcriptText,
          part,
          type: 'PRACTICE',
          topic,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Không chấm được điểm')
        setPhase('question')
        return
      }
      setCurrentScore(data.score)
      setPhase('result')

      // Add to records
      const record: QARecord = {
        question: currentQuestion!,
        transcript: transcriptText,
        score: data.score,
      }
      setQaRecords(prev => [...prev, record])
    } catch {
      toast.error('Lỗi chấm điểm. Vui lòng thử lại.')
      setPhase('question')
    }
  }

  async function loadSampleAnswer() {
    setLoadingSample(true)
    try {
      const res = await fetch('/api/ai/sample', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: currentQuestion?.question, part, type: 'answer' }),
      })
      const data = await res.json()
      setSampleAnswer(data.answer || '')
    } catch {
      toast.error('Không tải được câu trả lời mẫu')
    } finally {
      setLoadingSample(false)
    }
  }

  async function loadVocabAndIdioms() {
    setLoadingVocab(true)
    try {
      const res = await fetch('/api/ai/sample', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: currentQuestion?.question, type: 'vocab', topic }),
      })
      const data = await res.json()
      setVocabData(data)
    } catch {
      toast.error('Không tải được từ vựng')
    } finally {
      setLoadingVocab(false)
    }
  }

  async function saveItem(content: string, type: 'VOCABULARY' | 'IDIOM') {
    try {
      await fetch('/api/review/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          type,
          context: currentQuestion?.question,
          topic,
        }),
      })
      setSavedItems(prev => [...prev, content])
      toast.success('Đã lưu vào mục Ôn tập!')
    } catch {
      toast.error('Không lưu được')
    }
  }

  async function handleImprove() {
    if (!currentQuestion || !transcript) return
    setLoadingImprove(true)
    try {
      const res = await fetch('/api/ai/sample', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: currentQuestion.question, transcript, part, type: 'improve' }),
      })
      const data = await res.json()
      setImprovedAnswer(data.improved || '')
    } catch {
      toast.error('Không cải thiện được')
    } finally {
      setLoadingImprove(false)
    }
  }

  async function saveSession(records: QARecord[]) {
    try {
      await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'PRACTICE',
          topic,
          part,
          questions: records.map(r => ({ question: r.question.question, transcript: r.transcript })),
          scores: records.map(r => r.score),
          duration: elapsed,
        }),
      })
    } catch { /* silent — history is non-critical */ }
  }

  function nextQuestion() {
    if (currentIdx + 1 >= questions.length) {
      saveSession([...qaRecords])
      setPhase('complete')
    } else {
      setCurrentIdx(i => i + 1)
      setPhase('question')
      setCurrentScore(null)
      setTranscript('')
      setSampleAnswer('')
      setVocabData(null)
      setRecordingUrl(null)
      setImprovedAnswer('')
      setRightTab('leaderboard')
      if (questions[currentIdx + 1]) {
        setTimeout(() => playQuestion(questions[currentIdx + 1].question), 300)
      }
    }
  }

  const avgScore = qaRecords.length > 0
    ? (qaRecords.reduce((s, r) => s + r.score.overall, 0) / qaRecords.length).toFixed(1)
    : null

  // ===== RENDER =====

  if (phase === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 size={40} className="text-cyan-400 animate-spin" />
        <p className="text-[var(--text-secondary)]">AI đang chuẩn bị câu hỏi về "{topic}"...</p>
      </div>
    )
  }

  if (phase === 'complete') {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-6">
        <Card className="text-center py-8">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-[var(--text)] mb-2">Hoàn thành buổi luyện tập!</h2>
          <p className="text-[var(--text-secondary)] mb-6">
            Bạn đã trả lời {qaRecords.length} câu hỏi về chủ đề <strong className="text-cyan-400">{topic}</strong>
          </p>
          {avgScore && (
            <div className={cn('text-5xl font-bold mb-2', bandToColor(parseFloat(avgScore)))}>
              Band {avgScore}
            </div>
          )}
          <p className="text-[var(--text-secondary)] text-sm mb-8">Điểm trung bình buổi luyện tập này</p>

          <div className="grid grid-cols-3 gap-4 mb-8">
            {qaRecords.map((r, i) => (
              <div key={i} className="rounded-xl border border-[var(--border)] p-3">
                <div className={cn('text-xl font-bold', bandToColor(r.score.overall))}>
                  {r.score.overall.toFixed(1)}
                </div>
                <div className="text-xs text-[var(--text-secondary)]">Câu {i + 1}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="gradient" onClick={() => window.location.href = '/practice'}>
              Luyện tiếp
            </Button>
            <Button variant="secondary" onClick={() => window.location.href = '/review'}>
              <BookOpen size={16} />
              Xem từ vựng đã lưu
            </Button>
          </div>
        </Card>
      </motion.div>
    )
  }

  if (phase === 'intro') {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
        <Card className="text-center py-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center mx-auto mb-6">
            <Mic size={28} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--text)] mb-2">
            {part} — {topic}
          </h2>
          <p className="text-[var(--text-secondary)] mb-2">
            {count} câu hỏi · AI giám khảo sẽ đọc câu hỏi cho bạn
          </p>
          <div className="text-sm text-[var(--text-secondary)] bg-[var(--bg-secondary)] rounded-xl p-4 mb-8 text-left">
            <p className="font-medium text-[var(--text)] mb-2">📌 Hướng dẫn:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Nhấn <strong>Play</strong> để nghe câu hỏi từ AI giám khảo</li>
              <li>Nhấn nút <strong>Ghi âm</strong> khi sẵn sàng trả lời</li>
              <li>Nói rõ ràng và tự nhiên bằng tiếng Anh</li>
              <li>Nhấn <strong>Dừng</strong> khi trả lời xong để nhận điểm</li>
            </ul>
          </div>
          <Button variant="gradient" size="lg" onClick={startQuestion}>
            <Play size={18} />
            Bắt đầu
          </Button>
        </Card>
      </motion.div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm text-[var(--text-secondary)]">
        <span>Câu {currentIdx + 1}/{questions.length}</span>
        <span>{formatDuration(elapsed)}</span>
        <Badge variant="info">{part}</Badge>
      </div>
      <div className="h-1.5 rounded-full bg-[var(--border)]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-600 transition-all duration-300"
          style={{ width: `${((currentIdx) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIdx}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          <Card>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">
                {currentQuestion?.part} · {topic}
              </div>
              <button
                onClick={() => currentQuestion && playQuestion(currentQuestion.question)}
                disabled={ttsState === 'loading'}
                className={cn(
                  'p-2 rounded-xl transition-all flex-shrink-0 flex items-center gap-1.5',
                  ttsState === 'playing'
                    ? 'bg-cyan-400/20 text-cyan-400'
                    : ttsState === 'loading'
                      ? 'bg-cyan-400/10 text-cyan-400/60 cursor-wait'
                      : 'bg-cyan-400/10 text-cyan-400 hover:bg-cyan-400/20'
                )}
                title={ttsState === 'playing' ? 'Đang đọc...' : 'Nghe lại câu hỏi'}
              >
                {ttsState === 'loading' ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : ttsState === 'playing' ? (
                  <Volume2 size={16} className="animate-pulse" />
                ) : (
                  <Volume2 size={16} />
                )}
                <span className="text-xs hidden sm:inline">
                  {ttsState === 'loading' ? 'Đang tải...' : ttsState === 'playing' ? 'Đang đọc' : 'Nghe đề'}
                </span>
              </button>
            </div>

            {/* TTS playing indicator */}
            {ttsState === 'playing' && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 mb-3 text-xs text-cyan-400"
              >
                <div className="flex items-end gap-0.5 h-4">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1 bg-cyan-400 rounded-full"
                      animate={{ height: ['4px', '12px', '4px'] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.12 }}
                    />
                  ))}
                </div>
                <span>Giám khảo đang đọc câu hỏi...</span>
              </motion.div>
            )}

            <p className="text-lg font-medium text-[var(--text)] mb-4 leading-relaxed">
              {currentQuestion?.question}
            </p>

            {currentQuestion?.cueCard && (
              <div className="bg-[var(--bg-secondary)] rounded-xl p-4 mb-4">
                <p className="text-xs font-semibold text-cyan-400 uppercase mb-2">Cue Card</p>
                <ul className="space-y-1">
                  {currentQuestion.cueCard.map((item, i) => (
                    <li key={i} className="text-sm text-[var(--text)] flex items-start gap-2">
                      <span className="text-cyan-400 mt-0.5">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
                {part === 'PART2' && (
                  <p className="text-xs text-yellow-400 mt-2 font-medium">
                    ⏱ Bạn có 1 phút chuẩn bị, sau đó nói trong 2 phút.
                  </p>
                )}
              </div>
            )}

            {currentQuestion?.hint && (
              <p className="text-xs text-[var(--text-secondary)] italic">
                💡 Gợi ý: {currentQuestion.hint}
              </p>
            )}
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Recording */}
      {(phase === 'question' || phase === 'recording' || phase === 'scoring') && (
        <AudioRecorder
          onComplete={onRecordingComplete}
          onStart={() => setPhase('recording')}
          disabled={phase === 'scoring'}
        />
      )}

      {/* Scoring indicator */}
      {phase === 'scoring' && (
        <div className="flex items-center justify-center gap-3 py-6">
          <Loader2 size={24} className="text-cyan-400 animate-spin" />
          <span className="text-[var(--text-secondary)]">AI đang chấm điểm...</span>
        </div>
      )}

      {/* Score result — two-column layout */}
      {phase === 'result' && currentScore && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            {/* Left: Score card */}
            <ScoreCard
              score={currentScore}
              transcript={transcript}
              audioUrl={recordingUrl ?? undefined}
              onImprove={handleImprove}
              loadingImprove={loadingImprove}
              improvedAnswer={improvedAnswer}
              onShare={async () => {
                try {
                  await fetch('/api/share/answer', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ question: currentQuestion?.question, transcript, score: currentScore, topic, part, isAnonymous: false }),
                  })
                  toast.success('Đã chia sẻ lên Bảng vàng!')
                } catch {
                  toast.error('Không chia sẻ được')
                }
              }}
            />

            {/* Right: AI hỗ trợ | Bảng vàng tabs */}
            <div className="space-y-3">
              {/* Tab switcher */}
              <div className="flex rounded-xl overflow-hidden border border-[var(--border)]">
                <button
                  onClick={() => setRightTab('ai')}
                  className={`flex-1 py-2 text-sm font-medium transition-all ${rightTab === 'ai' ? 'bg-cyan-500/20 text-cyan-400' : 'text-[var(--text-secondary)] hover:text-[var(--text)]'}`}
                >
                  AI hỗ trợ
                </button>
                <button
                  onClick={() => setRightTab('leaderboard')}
                  className={`flex-1 py-2 text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${rightTab === 'leaderboard' ? 'bg-yellow-500/20 text-yellow-400' : 'text-[var(--text-secondary)] hover:text-[var(--text)]'}`}
                >
                  <Trophy size={13} />
                  Bảng vàng
                </button>
              </div>

              {rightTab === 'ai' ? (
                <div className="space-y-3">
                  <div className="flex flex-col gap-2">
                    <Button variant="secondary" onClick={loadSampleAnswer} loading={loadingSample}>
                      <Star size={15} className="text-yellow-400" />
                      Câu trả lời mẫu Band 8.0
                    </Button>
                    <Button variant="secondary" onClick={loadVocabAndIdioms} loading={loadingVocab}>
                      <Lightbulb size={15} className="text-cyan-400" />
                      Từ vựng & Idioms hay
                    </Button>
                  </div>

                  <AnimatePresence>
                    {sampleAnswer && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                        <Card className="border-yellow-500/20 bg-yellow-500/5">
                          <div className="flex items-center gap-2 mb-2">
                            <Star size={14} className="text-yellow-400" />
                            <span className="text-sm font-semibold text-[var(--text)]">Mẫu Band 8.0</span>
                          </div>
                          <p className="text-sm text-[var(--text)] leading-relaxed">{sampleAnswer}</p>
                        </Card>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {vocabData && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                        <Card>
                          <h4 className="text-sm font-semibold text-[var(--text)] mb-3 flex items-center gap-1.5">
                            <Lightbulb size={14} className="text-cyan-400" />
                            Từ vựng & Idioms
                          </h4>
                          {vocabData.vocabulary.length > 0 && (
                            <div className="mb-3">
                              <p className="text-[10px] font-semibold text-cyan-400 uppercase mb-1.5">Từ vựng</p>
                              <div className="space-y-1.5">
                                {vocabData.vocabulary.map((v, i) => (
                                  <div key={i} className="flex items-center justify-between gap-2 text-sm">
                                    <span className="text-[var(--text)]">{v}</span>
                                    <button onClick={() => saveItem(v, 'VOCABULARY')} disabled={savedItems.includes(v)}
                                      className="shrink-0 text-cyan-400 hover:text-cyan-300 disabled:text-emerald-400">
                                      {savedItems.includes(v) ? <CheckCircle size={13} /> : <Save size={13} />}
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {vocabData.idioms.length > 0 && (
                            <div>
                              <p className="text-[10px] font-semibold text-violet-400 uppercase mb-1.5">Idioms</p>
                              <div className="space-y-1.5">
                                {vocabData.idioms.map((idiom, i) => (
                                  <div key={i} className="flex items-center justify-between gap-2 text-sm">
                                    <span className="text-[var(--text)]">{idiom}</span>
                                    <button onClick={() => saveItem(idiom, 'IDIOM')} disabled={savedItems.includes(idiom)}
                                      className="shrink-0 text-violet-400 hover:text-violet-300 disabled:text-emerald-400">
                                      {savedItems.includes(idiom) ? <CheckCircle size={13} /> : <Save size={13} />}
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </Card>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <TopicLeaderboard topic={topic} part={part} />
              )}
            </div>
          </div>

          {/* Next / Complete — full width */}
          <Button variant="gradient" size="lg" className="w-full" onClick={nextQuestion}>
            {currentIdx + 1 >= questions.length ? (
              <><CheckCircle size={18} /> Xem kết quả tổng</>
            ) : (
              <>Câu tiếp theo <ChevronRight size={18} /></>
            )}
          </Button>
        </motion.div>
      )}
    </div>
  )
}
