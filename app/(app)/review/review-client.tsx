'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookMarked, Filter, Download, Trash2, Book, Lightbulb, MessageSquare, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn, formatDate } from '@/lib/utils'

type SavedType = 'VOCABULARY' | 'IDIOM' | 'SAMPLE_ANSWER'

interface SavedItem {
  id: string
  type: SavedType
  content: string
  context?: string | null
  topic?: string | null
  createdAt: Date
}

const typeConfig: Record<SavedType, { icon: typeof Book; label: string; color: string; bg: string }> = {
  VOCABULARY: { icon: Book, label: 'Từ vựng', color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
  IDIOM: { icon: Lightbulb, label: 'Idiom', color: 'text-violet-400', bg: 'bg-violet-400/10' },
  SAMPLE_ANSWER: { icon: MessageSquare, label: 'Câu mẫu', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
}

export function ReviewClient({ items: initialItems }: { items: SavedItem[] }) {
  const [items, setItems] = useState(initialItems)
  const [filter, setFilter] = useState<SavedType | 'ALL'>('ALL')
  const [search, setSearch] = useState('')
  const [flashMode, setFlashMode] = useState(false)
  const [flashIdx, setFlashIdx] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)

  const filtered = items.filter(item => {
    const matchFilter = filter === 'ALL' || item.type === filter
    const matchSearch = item.content.toLowerCase().includes(search.toLowerCase()) ||
      (item.topic || '').toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  async function deleteItem(id: string) {
    try {
      await fetch(`/api/review/save?id=${id}`, { method: 'DELETE' })
      setItems(prev => prev.filter(i => i.id !== id))
      toast.success('Đã xoá')
    } catch {
      toast.error('Xoá thất bại')
    }
  }

  function exportPDF() {
    const content = filtered.map(item =>
      `[${item.type}] ${item.content}${item.context ? `\nContext: ${item.context}` : ''}`
    ).join('\n\n')
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'DingDongSpeak-Review.txt'
    a.click()
    toast.success('Đã xuất file!')
  }

  const flashItems = filtered.filter(i => i.type === 'VOCABULARY' || i.type === 'IDIOM')

  if (flashMode && flashItems.length > 0) {
    const card = flashItems[flashIdx]
    const [word, ...defParts] = card.content.split(' - ')
    const definition = defParts.join(' - ')

    return (
      <div className="max-w-lg mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-[var(--text)]">Flashcard Mode</h2>
          <Button variant="secondary" size="sm" onClick={() => setFlashMode(false)}>Thoát</Button>
        </div>
        <div className="text-center text-sm text-[var(--text-secondary)]">
          {flashIdx + 1}/{flashItems.length}
        </div>
        <div className="h-1.5 rounded-full bg-[var(--border)]">
          <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-600 transition-all" style={{ width: `${((flashIdx + 1) / flashItems.length) * 100}%` }} />
        </div>

        <motion.div
          key={flashIdx}
          initial={{ rotateY: 90 }}
          animate={{ rotateY: 0 }}
          className="cursor-pointer"
          onClick={() => setShowAnswer(v => !v)}
        >
          <Card className="min-h-52 flex flex-col items-center justify-center text-center gap-4 select-none">
            <div className={cn('text-xs font-semibold uppercase px-3 py-1 rounded-full', typeConfig[card.type].bg, typeConfig[card.type].color)}>
              {typeConfig[card.type].label}
            </div>
            <p className="text-2xl font-bold text-[var(--text)]">{word}</p>
            {showAnswer && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <p className="text-[var(--text-secondary)]">{definition}</p>
                {card.context && <p className="text-xs text-[var(--text-secondary)] italic mt-2">"{card.context}"</p>}
              </motion.div>
            )}
            {!showAnswer && <p className="text-xs text-[var(--text-secondary)]">Nhấn để xem nghĩa</p>}
          </Card>
        </motion.div>

        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => { setFlashIdx(i => Math.max(0, i - 1)); setShowAnswer(false) }}>
            ← Trước
          </Button>
          <Button variant="gradient" className="flex-1" onClick={() => {
            if (flashIdx + 1 >= flashItems.length) { setFlashMode(false); setFlashIdx(0) }
            else { setFlashIdx(i => i + 1); setShowAnswer(false) }
          }}>
            {flashIdx + 1 >= flashItems.length ? 'Hoàn thành ✓' : 'Tiếp →'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)] flex items-center gap-2">
            <BookMarked className="text-cyan-400" size={24} />
            Ôn tập
          </h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            {items.length} mục đã lưu · Từ vựng, Idioms, Câu mẫu
          </p>
        </div>
        <div className="flex gap-2">
          {flashItems.length > 0 && (
            <Button variant="secondary" size="sm" onClick={() => { setFlashMode(true); setFlashIdx(0); setShowAnswer(false) }}>
              🃏 Flashcard
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={exportPDF}>
            <Download size={14} /> Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 pr-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-sm text-[var(--text)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
          />
        </div>
        {(['ALL', 'VOCABULARY', 'IDIOM', 'SAMPLE_ANSWER'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-3 py-2 rounded-xl text-sm font-medium transition-all border',
              filter === f
                ? 'bg-cyan-400/20 border-cyan-400/40 text-cyan-400'
                : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-cyan-400/20'
            )}
          >
            {f === 'ALL' ? 'Tất cả' : typeConfig[f as SavedType].label}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <BookMarked size={48} className="text-[var(--border)] mx-auto mb-3" />
          <p className="text-[var(--text-secondary)]">Chưa có mục nào được lưu.</p>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Luyện tập và lưu từ vựng, idioms trong quá trình luyện nói.</p>
        </div>
      )}

      <div className="space-y-3">
        <AnimatePresence>
          {filtered.map((item, i) => {
            const cfg = typeConfig[item.type]
            const Icon = cfg.icon
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className="py-4 px-5 group">
                  <div className="flex items-start gap-3">
                    <div className={cn('p-2 rounded-lg flex-shrink-0', cfg.bg)}>
                      <Icon size={16} className={cfg.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text)] leading-relaxed">{item.content}</p>
                      {item.context && (
                        <p className="text-xs text-[var(--text-secondary)] mt-1 italic">Context: "{item.context}"</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="default" className="text-[10px]">{cfg.label}</Badge>
                        {item.topic && <span className="text-[10px] text-[var(--text-secondary)]">{item.topic}</span>}
                        <span className="text-[10px] text-[var(--text-secondary)] ml-auto">{formatDate(item.createdAt)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-red-400 hover:bg-red-400/10 transition-all flex-shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
