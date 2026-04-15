'use client'

import { useState, use } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  ChevronRight, ChevronLeft, Volume2, CheckCircle,
  XCircle, Mic, ArrowLeft, Trophy
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { AudioRecorder } from '@/components/practice/audio-recorder'
import { cn } from '@/lib/utils'

const LESSON_CONTENT: Record<string, {
  title: string
  type: 'vocabulary' | 'grammar' | 'speaking'
  topic: string
  cards: Array<{
    question: string
    answer: string
    hint?: string
    options?: string[]
  }>
}> = {
  l1: {
    title: 'Chào hỏi & Giới thiệu bản thân',
    type: 'vocabulary',
    topic: 'Introductions',
    cards: [
      { question: 'Hi, my name is ___.', answer: 'Hello / Hi / Good morning', hint: 'Cách chào hỏi thông thường', options: ['Hello', 'Goodbye', 'Please', 'Sorry'] },
      { question: 'What is the meaning of "occupation"?', answer: 'Nghề nghiệp', hint: 'Từ dùng trong IELTS Part 1', options: ['Nghề nghiệp', 'Sở thích', 'Địa chỉ', 'Tuổi tác'] },
      { question: 'Nice to ___ you!', answer: 'meet', hint: 'Nice to meet you!', options: ['meet', 'know', 'see', 'find'] },
    ]
  },
  l2: {
    title: 'Thì hiện tại đơn',
    type: 'grammar',
    topic: 'Simple Present',
    cards: [
      { question: 'She ___ (study) English every day.', answer: 'studies', hint: 'Ngôi thứ 3 số ít + s/es', options: ['study', 'studies', 'studied', 'studying'] },
      { question: 'They ___ (not work) on weekends.', answer: "don't work", hint: 'Phủ định dùng "do not/does not"', options: ["don't work", "doesn't work", "not work", "isn't work"] },
      { question: 'What is the correct form: "He go/goes to school."', answer: 'goes', hint: 'Ngôi thứ 3 số ít', options: ['go', 'goes', 'going', 'went'] },
    ]
  },
  l3: {
    title: 'Nói về bản thân',
    type: 'speaking',
    topic: 'About Me',
    cards: [
      { question: 'Tell me about yourself. Where are you from?', answer: '', hint: 'Nói tên, quê quán, nghề nghiệp/học sinh' },
      { question: 'What do you do for a living?', answer: '', hint: 'Mô tả công việc hoặc việc học' },
      { question: 'What are your hobbies and interests?', answer: '', hint: 'Đề cập 2-3 sở thích và lý do thích' },
    ]
  },
}

// Default content for unknown lesson IDs
function getLesson(id: string) {
  return LESSON_CONTENT[id] || {
    title: 'Vocabulary Lesson',
    type: 'vocabulary' as const,
    topic: 'General',
    cards: [
      { question: 'Ambiguous', answer: 'Having more than one meaning; unclear', hint: 'Used to describe unclear statements', options: ['Clear', 'Unclear/Double meaning', 'Simple', 'Complex'] },
      { question: 'Eloquent', answer: 'Fluent or persuasive in speaking', hint: 'Describes a good speaker', options: ['Silent', 'Fluent/Persuasive', 'Rude', 'Boring'] },
    ]
  }
}

export default function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const lesson = getLesson(id)

  const [cardIdx, setCardIdx] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [score, setScore] = useState(0)
  const [completed, setCompleted] = useState(false)
  const [speakingScore, setSpeakingScore] = useState<number | null>(null)

  const card = lesson.cards[cardIdx]
  const progress = (cardIdx / lesson.cards.length) * 100

  function handleSelect(opt: string) {
    if (selected) return
    setSelected(opt)
    const correct = opt === card.answer
    setIsCorrect(correct)
    if (correct) setScore(s => s + 1)
    setTimeout(() => {
      if (cardIdx + 1 >= lesson.cards.length) {
        saveProgress()
        setCompleted(true)
      } else {
        setCardIdx(i => i + 1)
        setSelected(null)
        setIsCorrect(null)
      }
    }, 1200)
  }

  async function handleSpeakingComplete(_: Blob, transcript: string) {
    const res = await fetch('/api/ai/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: card.question, transcript, type: 'BEGINNER', topic: lesson.topic,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error || 'Chấm điểm thất bại')
      return
    }
    setSpeakingScore(data.score?.score || 70)
    setScore(s => s + (data.score?.score >= 60 ? 1 : 0))

    setTimeout(() => {
      setSpeakingScore(null)
      if (cardIdx + 1 >= lesson.cards.length) {
        saveProgress()
        setCompleted(true)
      } else {
        setCardIdx(i => i + 1)
      }
    }, 2000)
  }

  async function saveProgress() {
    await fetch(`/api/learn/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId: id, score: Math.round((score / lesson.cards.length) * 100) }),
    })
  }

  if (completed) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <Trophy size={64} className="text-yellow-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-[var(--text)] mb-2">Bài học hoàn thành!</h2>
        <p className="text-[var(--text-secondary)] mb-6">
          Điểm: {score}/{lesson.cards.length} · {Math.round((score / lesson.cards.length) * 100)}%
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="secondary" onClick={() => router.push('/learn')}>
            <ChevronLeft size={16} /> Về Path
          </Button>
          <Button variant="gradient" onClick={() => router.push('/learn')}>
            Tiếp tục <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/learn')} className="p-2 rounded-xl hover:bg-[var(--bg-secondary)] transition-all text-[var(--text-secondary)]">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-1">
            <span>{lesson.title}</span>
            <span>{cardIdx + 1}/{lesson.cards.length}</span>
          </div>
          <div className="h-2 rounded-full bg-[var(--border)]">
            <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-600 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={cardIdx}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          className="space-y-4"
        >
          {/* Question */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 text-center">
            <p className="text-lg font-semibold text-[var(--text)] mb-2">{card.question}</p>
            {card.hint && <p className="text-sm text-[var(--text-secondary)] italic">{card.hint}</p>}
          </div>

          {/* Multiple choice */}
          {lesson.type !== 'speaking' && card.options && (
            <div className="grid grid-cols-2 gap-3">
              {card.options.map(opt => (
                <motion.button
                  key={opt}
                  onClick={() => handleSelect(opt)}
                  whileHover={!selected ? { scale: 1.02 } : {}}
                  whileTap={!selected ? { scale: 0.98 } : {}}
                  className={cn(
                    'p-4 rounded-xl border text-sm font-medium text-left transition-all',
                    !selected && 'border-[var(--border)] hover:border-cyan-400/40 hover:bg-[var(--bg-secondary)] text-[var(--text)]',
                    selected === opt && isCorrect && 'border-emerald-400 bg-emerald-500/15 text-emerald-400',
                    selected === opt && !isCorrect && 'border-red-400 bg-red-500/15 text-red-400',
                    selected && opt === card.answer && selected !== opt && 'border-emerald-400 bg-emerald-500/10 text-emerald-400',
                    selected && opt !== card.answer && selected !== opt && 'opacity-40 border-[var(--border)] text-[var(--text-secondary)]'
                  )}
                >
                  <div className="flex items-center gap-2">
                    {selected === opt && isCorrect && <CheckCircle size={16} />}
                    {selected === opt && !isCorrect && <XCircle size={16} />}
                    {opt}
                  </div>
                </motion.button>
              ))}
            </div>
          )}

          {/* Speaking mode */}
          {lesson.type === 'speaking' && (
            <div>
              {speakingScore !== null ? (
                <div className="text-center py-8">
                  <div className={cn('text-4xl font-bold mb-2', speakingScore >= 60 ? 'text-emerald-400' : 'text-orange-400')}>
                    {speakingScore}%
                  </div>
                  <p className="text-[var(--text-secondary)]">{speakingScore >= 60 ? 'Tốt lắm! 🎉' : 'Thử lại nhé! 💪'}</p>
                </div>
              ) : (
                <AudioRecorder
                  onComplete={handleSpeakingComplete}
                  onStart={() => {}}
                />
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
