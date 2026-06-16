'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Mic, BookOpen, Hash, Play, Target, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useLang } from '@/components/shared/lang-provider'

const PART_COLORS = ['from-emerald-500 to-cyan-500', 'from-cyan-500 to-blue-500', 'from-violet-500 to-pink-500']
const questionCounts = [3, 5, 10]

export default function PracticePage() {
  const router = useRouter()
  const { lang, config } = useLang()
  const parts = config.sections.map((s, i) => ({ ...s, color: PART_COLORS[i % PART_COLORS.length] }))
  const [selectedTopic, setSelectedTopic] = useState('')
  const [selectedPart, setSelectedPart] = useState('PART1')
  const [questionCount, setQuestionCount] = useState(5)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  const filteredTopics = config.topics.filter(t =>
    t.toLowerCase().includes(search.toLowerCase())
  )

  async function startSession() {
    if (!selectedTopic) return
    setLoading(true)
    // Generate session ID and start
    const sessionId = Math.random().toString(36).substring(2, 12)
    router.push(`/practice/session/${sessionId}?topic=${encodeURIComponent(selectedTopic)}&part=${selectedPart}&count=${questionCount}&lang=${lang}`)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Luyện nói {config.viName} {config.flag}</h1>
        <p className="text-[var(--text-secondary)] mt-1 text-sm">
          AI đặt câu hỏi theo chủ đề — ghi âm và nhận điểm {config.exam} tức thì.
        </p>
      </div>

      {/* Topic selection */}
      <Card>
        <h2 className="font-semibold text-[var(--text)] mb-3 flex items-center gap-2">
          <Target size={18} className="text-cyan-400" />
          Chọn chủ đề
        </h2>
        <input
          type="text"
          placeholder="Tìm chủ đề..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-cyan-400/50 mb-4 text-sm"
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {filteredTopics.map(topic => (
            <button
              key={topic}
              onClick={() => setSelectedTopic(topic)}
              className={cn(
                'px-3 py-2 rounded-xl text-sm font-medium text-left transition-all border',
                selectedTopic === topic
                  ? 'bg-cyan-400/20 border-cyan-400/40 text-cyan-400'
                  : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-cyan-400/30 hover:text-[var(--text)] hover:bg-[var(--bg-secondary)]'
              )}
            >
              {topic}
            </button>
          ))}
        </div>
      </Card>

      {/* Part selection */}
      <Card>
        <h2 className="font-semibold text-[var(--text)] mb-3 flex items-center gap-2">
          <BookOpen size={18} className="text-cyan-400" />
          Chọn Part
        </h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {parts.map(part => (
            <button
              key={part.id}
              onClick={() => setSelectedPart(part.id)}
              className={cn(
                'p-4 rounded-xl text-left border transition-all',
                selectedPart === part.id
                  ? 'bg-cyan-400/10 border-cyan-400/40'
                  : 'border-[var(--border)] hover:border-cyan-400/20 hover:bg-[var(--bg-secondary)]'
              )}
            >
              <div className={`text-sm font-bold bg-gradient-to-r ${part.color} bg-clip-text text-transparent mb-1`}>
                {part.label}
              </div>
              <div className="text-xs text-[var(--text-secondary)]">{part.desc}</div>
            </button>
          ))}
        </div>
      </Card>

      {/* Question count */}
      <Card>
        <h2 className="font-semibold text-[var(--text)] mb-3 flex items-center gap-2">
          <Hash size={18} className="text-cyan-400" />
          Số câu hỏi
        </h2>
        <div className="flex gap-3">
          {questionCounts.map(count => (
            <button
              key={count}
              onClick={() => setQuestionCount(count)}
              className={cn(
                'flex-1 py-3 rounded-xl text-sm font-semibold border transition-all',
                questionCount === count
                  ? 'bg-cyan-400/20 border-cyan-400/40 text-cyan-400'
                  : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-cyan-400/20 hover:bg-[var(--bg-secondary)]'
              )}
            >
              {count} câu
            </button>
          ))}
        </div>
      </Card>

      {/* Start button */}
      <motion.div
        whileHover={{ scale: selectedTopic ? 1.01 : 1 }}
        whileTap={{ scale: selectedTopic ? 0.99 : 1 }}
      >
        <button
          onClick={startSession}
          disabled={!selectedTopic || loading}
          className={cn(
            'w-full py-4 rounded-2xl font-semibold text-lg flex items-center justify-center gap-3 transition-all',
            selectedTopic
              ? 'bg-gradient-to-r from-cyan-500 to-violet-600 text-white hover:opacity-90 glow-cyan'
              : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] cursor-not-allowed'
          )}
        >
          {loading ? (
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : <Mic size={22} />}
          {loading ? 'Đang chuẩn bị...' : selectedTopic ? `Bắt đầu luyện "${selectedTopic}"` : 'Chọn chủ đề để bắt đầu'}
          {selectedTopic && !loading && <ChevronRight size={20} />}
        </button>
      </motion.div>
    </div>
  )
}
