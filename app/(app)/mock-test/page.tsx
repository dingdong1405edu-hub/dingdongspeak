'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { GraduationCap, Clock, AlertTriangle, Play, Target } from 'lucide-react'
import { IELTS_TOPICS } from '@/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export default function MockTestPage() {
  const router = useRouter()
  const [selectedTopic, setSelectedTopic] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  const filteredTopics = IELTS_TOPICS.filter(t => t.toLowerCase().includes(search.toLowerCase()))

  function startTest() {
    if (!selectedTopic) return
    setLoading(true)
    const sessionId = Math.random().toString(36).substring(2, 12)
    router.push(`/mock-test/session/${sessionId}?topic=${encodeURIComponent(selectedTopic)}`)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)] flex items-center gap-2">
          <GraduationCap className="text-violet-400" size={26} />
          IELTS Mock Test
        </h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">
          Thi thử như thật với AI đóng vai giám khảo IELTS. Chấm điểm nghiêm khắc, chuẩn band score.
        </p>
      </div>

      {/* Warning */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
        <AlertTriangle size={18} className="text-yellow-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-yellow-400 mb-1">Lưu ý quan trọng</p>
          <p className="text-xs text-[var(--text-secondary)]">
            Mock test sẽ bao gồm đầy đủ Part 1, 2, 3. AI sẽ chấm điểm nghiêm khắc như giám khảo thật.
            Điểm số là ước tính — không phải kết quả thi chính thức IELTS.
          </p>
        </div>
      </div>

      {/* Test info */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { icon: Clock, label: '11-14 phút', desc: 'Thời gian thông thường' },
          { icon: Target, label: '3 Parts', desc: 'Part 1 + 2 + 3 đầy đủ' },
          { icon: GraduationCap, label: 'Chấm thật', desc: 'Nghiêm khắc như IELTS' },
        ].map(item => {
          const Icon = item.icon
          return (
            <Card key={item.label} className="text-center py-4">
              <Icon size={22} className="text-violet-400 mx-auto mb-2" />
              <div className="font-semibold text-[var(--text)] text-sm">{item.label}</div>
              <div className="text-xs text-[var(--text-secondary)]">{item.desc}</div>
            </Card>
          )
        })}
      </div>

      {/* Topic selection */}
      <Card>
        <h2 className="font-semibold text-[var(--text)] mb-3">Chọn chủ đề cho bài thi</h2>
        <input
          type="text"
          placeholder="Tìm chủ đề..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-violet-400/50 mb-4 text-sm"
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-72 overflow-y-auto pr-1">
          {filteredTopics.map(topic => (
            <button
              key={topic}
              onClick={() => setSelectedTopic(topic)}
              className={cn(
                'px-3 py-2 rounded-xl text-sm font-medium text-left transition-all border',
                selectedTopic === topic
                  ? 'bg-violet-500/20 border-violet-500/40 text-violet-400'
                  : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-violet-400/30 hover:text-[var(--text)] hover:bg-[var(--bg-secondary)]'
              )}
            >
              {topic}
            </button>
          ))}
        </div>
      </Card>

      <Button
        variant="gradient"
        size="lg"
        className="w-full"
        onClick={startTest}
        loading={loading}
        disabled={!selectedTopic}
      >
        <Play size={20} />
        {selectedTopic ? `Bắt đầu thi thử — ${selectedTopic}` : 'Chọn chủ đề để bắt đầu'}
      </Button>
    </div>
  )
}
