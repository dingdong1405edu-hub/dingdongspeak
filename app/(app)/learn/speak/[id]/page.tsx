'use client'

import { useState, use } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Mic, Trophy, ChevronRight, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { AudioRecorder } from '@/components/practice/audio-recorder'
import { cn } from '@/lib/utils'

const SPEAK_TOPICS: Record<string, {
  title: string
  description: string
  level: 'A1' | 'A2' | 'B1'
  prompts: Array<{ prompt: string; hint: string }>
}> = {
  s1: {
    title: 'Giới thiệu bản thân',
    description: 'Học cách nói về tên, tuổi, nghề nghiệp và quê quán',
    level: 'A1',
    prompts: [
      { prompt: 'Tell me your name and where you are from.', hint: 'My name is... I am from...' },
      { prompt: 'What do you do? Are you a student or do you work?', hint: 'I am a student / I work as a...' },
      { prompt: 'How old are you and what are your hobbies?', hint: 'I am... years old. My hobbies are...' },
    ],
  },
  s2: {
    title: 'Gia đình & Bạn bè',
    description: 'Nói về người thân và mô tả tính cách',
    level: 'A2',
    prompts: [
      { prompt: 'Describe your family. How many people are in your family?', hint: 'My family has... members. My father is... My mother is...' },
      { prompt: 'Tell me about your best friend. What is he/she like?', hint: 'My best friend is... He/She is very...' },
      { prompt: 'What do you usually do with your family on weekends?', hint: 'On weekends, we usually... We enjoy...' },
    ],
  },
  s3: {
    title: 'Sở thích & Thời gian rảnh',
    description: 'Diễn đạt sở thích và hoạt động giải trí',
    level: 'A2',
    prompts: [
      { prompt: 'What are your hobbies? Why do you enjoy them?', hint: 'I love... because it helps me...' },
      { prompt: 'Do you prefer watching movies or reading books? Why?', hint: 'I prefer... because...' },
      { prompt: 'Tell me about a sport or activity you enjoy doing.', hint: 'I enjoy... I usually... It is...' },
    ],
  },
  s4: {
    title: 'Trường học & Học tập',
    description: 'Nói về trường lớp, môn học yêu thích',
    level: 'B1',
    prompts: [
      { prompt: 'Describe your school or university. What is it like?', hint: 'My school is located in... It has... students...' },
      { prompt: 'What is your favorite subject and why?', hint: 'My favorite subject is... because it...' },
      { prompt: 'How do you usually study? Do you study alone or in groups?', hint: 'I usually study... I prefer studying...' },
    ],
  },
  s5: {
    title: 'Công việc & Nghề nghiệp',
    description: 'Mô tả công việc và kế hoạch nghề nghiệp',
    level: 'B1',
    prompts: [
      { prompt: 'Describe your job or your dream job.', hint: 'I work as... / I dream of becoming... because...' },
      { prompt: 'What skills are important for your job or career?', hint: 'For this job, you need... I think the most important skill is...' },
      { prompt: 'Where do you see yourself in 5 years?', hint: 'In 5 years, I hope to... I plan to...' },
    ],
  },
}

function getTopic(id: string) {
  return SPEAK_TOPICS[id] || {
    title: 'Free Speaking Practice',
    description: 'Practice speaking freely on any topic',
    level: 'B1' as const,
    prompts: [
      { prompt: 'Tell me something interesting about yourself.', hint: 'Something unusual or memorable about you' },
      { prompt: 'Describe your hometown or city.', hint: 'What is it like? What do you like about it?' },
      { prompt: 'What are your plans for the future?', hint: 'Short-term and long-term goals' },
    ],
  }
}

export default function SpeakPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const topic = getTopic(id)

  const [promptIdx, setPromptIdx] = useState(0)
  const [scores, setScores] = useState<number[]>([])
  const [currentScore, setCurrentScore] = useState<{ score: number; feedback: string } | null>(null)
  const [completed, setCompleted] = useState(false)
  const [loading, setLoading] = useState(false)

  const prompt = topic.prompts[promptIdx]
  const progress = (promptIdx / topic.prompts.length) * 100

  async function handleSpeakingComplete(_: Blob, transcript: string) {
    if (!transcript.trim()) {
      toast.error('Không nhận diện được giọng nói. Vui lòng thử lại.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/ai/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: prompt.prompt,
          transcript,
          type: 'BEGINNER',
          topic: topic.title,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Chấm điểm thất bại')
        return
      }

      const score = data.score?.score ?? 70
      const feedback = data.score?.feedback ?? 'Câu trả lời của bạn khá tốt!'
      setCurrentScore({ score, feedback })
      setScores(prev => [...prev, score])
    } catch {
      toast.error('Lỗi kết nối. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  function handleNext() {
    setCurrentScore(null)
    if (promptIdx + 1 >= topic.prompts.length) {
      saveProgress()
      setCompleted(true)
    } else {
      setPromptIdx(i => i + 1)
    }
  }

  async function saveProgress() {
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b) / scores.length) : 70
    await fetch('/api/learn/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId: `speak_${id}`, score: avgScore }),
    })
  }

  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b) / scores.length) : 0

  if (completed) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 space-y-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}>
          <Trophy size={64} className="text-yellow-400 mx-auto mb-4" />
        </motion.div>
        <h2 className="text-2xl font-bold text-[var(--text)]">Hoàn thành bài nói!</h2>
        <p className="text-[var(--text-secondary)]">Chủ đề: {topic.title}</p>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
          <div className={cn('text-5xl font-bold mb-2', avgScore >= 75 ? 'text-emerald-400' : avgScore >= 55 ? 'text-yellow-400' : 'text-orange-400')}>
            {avgScore}%
          </div>
          <p className="text-[var(--text-secondary)] text-sm">Điểm trung bình {scores.length} câu hỏi</p>
        </div>

        <div className="flex gap-3 justify-center">
          <Button variant="secondary" onClick={() => { setCompleted(false); setPromptIdx(0); setScores([]); setCurrentScore(null) }}>
            <RotateCcw size={16} /> Làm lại
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
            <span>{topic.title}</span>
            <span>{promptIdx + 1}/{topic.prompts.length}</span>
          </div>
          <div className="h-2 rounded-full bg-[var(--border)]">
            <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* Level badge */}
      <div className="flex items-center gap-2">
        <span className={cn(
          'px-2.5 py-1 rounded-full text-xs font-bold',
          topic.level === 'A1' ? 'bg-emerald-500/15 text-emerald-400' :
          topic.level === 'A2' ? 'bg-cyan-500/15 text-cyan-400' :
          'bg-violet-500/15 text-violet-400'
        )}>
          {topic.level}
        </span>
        <span className="text-sm text-[var(--text-secondary)]">{topic.description}</span>
      </div>

      {/* Question card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={promptIdx}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 space-y-3"
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-violet-500/15 flex items-center justify-center flex-shrink-0">
              <Mic size={16} className="text-violet-400" />
            </div>
            <div>
              <p className="font-semibold text-[var(--text)] text-lg leading-relaxed">{prompt.prompt}</p>
              <p className="text-sm text-[var(--text-secondary)] mt-1 italic">💡 Gợi ý: {prompt.hint}</p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Score display */}
      <AnimatePresence>
        {currentScore && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={cn(
              'rounded-2xl border p-5 space-y-3',
              currentScore.score >= 75 ? 'border-emerald-400/30 bg-emerald-500/5' :
              currentScore.score >= 55 ? 'border-yellow-400/30 bg-yellow-500/5' :
              'border-orange-400/30 bg-orange-500/5'
            )}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[var(--text)]">Kết quả</span>
              <span className={cn(
                'text-3xl font-bold',
                currentScore.score >= 75 ? 'text-emerald-400' :
                currentScore.score >= 55 ? 'text-yellow-400' : 'text-orange-400'
              )}>
                {currentScore.score}%
              </span>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">{currentScore.feedback}</p>
            <Button variant="gradient" className="w-full" onClick={handleNext}>
              {promptIdx + 1 >= topic.prompts.length ? 'Hoàn thành' : 'Câu tiếp theo'}
              <ChevronRight size={16} />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recorder */}
      {!currentScore && (
        loading ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <div className="w-16 h-16 rounded-full border-4 border-cyan-400/30 border-t-cyan-400 animate-spin" />
            <p className="text-[var(--text-secondary)] text-sm">Đang chấm điểm...</p>
          </div>
        ) : (
          <AudioRecorder
            onComplete={handleSpeakingComplete}
            onStart={() => {}}
          />
        )
      )}
    </div>
  )
}
