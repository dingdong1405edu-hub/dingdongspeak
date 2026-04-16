'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Save, Trash2, Plus, GripVertical, ChevronDown, ChevronUp,
  BookOpen, Settings, Mic, RotateCcw, CheckCircle, AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { LessonData, LessonCard, VocabCard, GrammarCard, SpeakingCard } from '@/lib/lessons-data'

interface Props {
  lessonId: string
  initialLesson: LessonData
  staticLesson: LessonData
  hasOverride: boolean
  overrideUpdatedAt: string | null
  overrideUpdatedBy: string | null
  stageTitle: string
  stageColor: string
}

const TYPE_ICONS = { vocabulary: BookOpen, grammar: Settings, speaking: Mic }

// ─── Vocab card editor ────────────────────────────────────────────────────────
function VocabCardEditor({ card, onChange }: { card: VocabCard; onChange: (c: VocabCard) => void }) {
  function update(field: keyof VocabCard, value: string | string[]) {
    onChange({ ...card, [field]: value })
  }
  function updateOption(i: number, v: string) {
    const opts = [...card.options]
    opts[i] = v
    onChange({ ...card, options: opts })
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Từ (word)" value={card.word} onChange={v => update('word', v)} />
        <Field label="Phiên âm (phonetic)" value={card.phonetic} onChange={v => update('phonetic', v)} />
        <Field label="Loại từ (pos)" value={card.pos} onChange={v => update('pos', v)} placeholder="n. / v. / adj. / adv. / phrase" />
        <Field label="Nghĩa tiếng Việt" value={card.meaning} onChange={v => update('meaning', v)} />
      </div>
      <FieldArea label="Câu ví dụ (example)" value={card.example} onChange={v => update('example', v)} />
      <div>
        <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-2">4 lựa chọn (options)</p>
        <div className="grid grid-cols-2 gap-2">
          {card.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs text-[var(--text-secondary)] w-4 shrink-0">{i + 1}.</span>
              <input
                value={opt}
                onChange={e => updateOption(i, e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-sm text-[var(--text)] focus:outline-none focus:border-cyan-400"
              />
            </div>
          ))}
        </div>
      </div>
      <Field label="Đáp án đúng (answer) — phải khớp 1 trong 4 options trên" value={card.answer} onChange={v => update('answer', v)} />
    </div>
  )
}

// ─── Grammar card editor ──────────────────────────────────────────────────────
function GrammarCardEditor({ card, onChange }: { card: GrammarCard; onChange: (c: GrammarCard) => void }) {
  function update(field: keyof GrammarCard, value: string | string[]) {
    onChange({ ...card, [field]: value })
  }

  return (
    <div className="space-y-3">
      <Field label="Tên quy tắc (rule)" value={card.rule} onChange={v => update('rule', v)} />
      <FieldArea label="Giải thích tiếng Việt (explanation)" value={card.explanation} onChange={v => update('explanation', v)} rows={3} />
      <FieldArea
        label="Ví dụ — mỗi ví dụ 1 dòng (examples)"
        value={card.examples.join('\n')}
        onChange={v => update('examples', v.split('\n').filter(s => s.trim()))}
        rows={4}
        placeholder={'I work at a school.\nShe works at a hospital.'}
      />
      <Field label="Mẹo học (tip) tiếng Việt" value={card.tip} onChange={v => update('tip', v)} />
      <FieldArea label="Câu bài tập (question)" value={card.question} onChange={v => update('question', v)} rows={2} />
      <div>
        <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-2">4 lựa chọn (options)</p>
        <div className="grid grid-cols-2 gap-2">
          {card.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs text-[var(--text-secondary)] w-4 shrink-0">{i + 1}.</span>
              <input
                value={opt}
                onChange={e => {
                  const opts = [...card.options]; opts[i] = e.target.value
                  onChange({ ...card, options: opts })
                }}
                className="flex-1 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-sm text-[var(--text)] focus:outline-none focus:border-cyan-400"
              />
            </div>
          ))}
        </div>
      </div>
      <Field label="Đáp án đúng (answer) — phải khớp 1 trong 4 options" value={card.answer} onChange={v => update('answer', v)} />
    </div>
  )
}

// ─── Speaking card editor ─────────────────────────────────────────────────────
function SpeakingCardEditor({ card, onChange }: { card: SpeakingCard; onChange: (c: SpeakingCard) => void }) {
  function update(field: keyof SpeakingCard, value: string | string[]) {
    onChange({ ...card, [field]: value })
  }

  return (
    <div className="space-y-3">
      <FieldArea label="Câu hỏi luyện nói (prompt)" value={card.prompt} onChange={v => update('prompt', v)} rows={2} />
      <Field label="Gợi ý tiếng Việt (hint)" value={card.hint} onChange={v => update('hint', v)} />
      <FieldArea
        label="Cụm từ mẫu — mỗi cụm 1 dòng (samplePhrases)"
        value={card.samplePhrases.join('\n')}
        onChange={v => update('samplePhrases', v.split('\n').filter(s => s.trim()))}
        rows={5}
        placeholder={"My name is...\nI'm from...\nI'm currently a student at..."}
      />
    </div>
  )
}

// ─── Shared field components ──────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-1">{label}</label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-sm text-[var(--text)] focus:outline-none focus:border-cyan-400 transition-colors"
      />
    </div>
  )
}

function FieldArea({ label, value, onChange, rows = 3, placeholder }: { label: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-1">{label}</label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-sm text-[var(--text)] focus:outline-none focus:border-cyan-400 transition-colors resize-none"
      />
    </div>
  )
}

// ─── Card accordion item ──────────────────────────────────────────────────────
function CardItem({
  card, index, totalCards, isOpen, onToggle, onChange, onDelete, onMoveUp, onMoveDown
}: {
  card: LessonCard; index: number; totalCards: number; isOpen: boolean; onToggle: () => void
  onChange: (c: LessonCard) => void; onDelete: () => void; onMoveUp: () => void; onMoveDown: () => void
}) {
  const cardLabel = card.type === 'vocab' ? (card as VocabCard).word
    : card.type === 'grammar' ? (card as GrammarCard).rule
    : (card as SpeakingCard).prompt.slice(0, 60) + '...'

  return (
    <div className="rounded-xl border border-[var(--border)] overflow-hidden">
      {/* Card header */}
      <div className="flex items-center gap-2 p-3 bg-[var(--bg-secondary)]">
        <GripVertical size={14} className="text-[var(--text-secondary)] shrink-0" />
        <span className="text-xs font-bold text-[var(--text-secondary)] w-6 shrink-0">#{index + 1}</span>
        <button onClick={onToggle} className="flex-1 text-left text-sm font-medium text-[var(--text)] truncate">
          {cardLabel}
        </button>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={onMoveUp} disabled={index === 0} className="p-1 rounded hover:bg-[var(--border)] disabled:opacity-30 transition-all">
            <ChevronUp size={13} className="text-[var(--text-secondary)]" />
          </button>
          <button onClick={onMoveDown} disabled={index === totalCards - 1} className="p-1 rounded hover:bg-[var(--border)] disabled:opacity-30 transition-all">
            <ChevronDown size={13} className="text-[var(--text-secondary)]" />
          </button>
          <button onClick={onDelete} className="p-1 rounded hover:bg-red-500/10 transition-all">
            <Trash2 size={13} className="text-red-400" />
          </button>
          <button onClick={onToggle} className="p-1 rounded hover:bg-[var(--border)] transition-all">
            {isOpen ? <ChevronUp size={13} className="text-[var(--text-secondary)]" /> : <ChevronDown size={13} className="text-[var(--text-secondary)]" />}
          </button>
        </div>
      </div>

      {/* Card editor */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-3 border-t border-[var(--border)]">
              {card.type === 'vocab' && <VocabCardEditor card={card as VocabCard} onChange={c => onChange(c)} />}
              {card.type === 'grammar' && <GrammarCardEditor card={card as GrammarCard} onChange={c => onChange(c)} />}
              {card.type === 'speaking' && <SpeakingCardEditor card={card as SpeakingCard} onChange={c => onChange(c)} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Default empty cards per type ────────────────────────────────────────────
function defaultCard(type: LessonData['type']): LessonCard {
  if (type === 'vocabulary') {
    return { type: 'vocab', word: 'new word', phonetic: '/.../', pos: 'n.', meaning: 'nghĩa tiếng Việt', example: 'Example sentence here.', options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'], answer: 'Option 1' } as VocabCard
  }
  if (type === 'grammar') {
    return { type: 'grammar', rule: 'Tên quy tắc', explanation: 'Giải thích bằng tiếng Việt', examples: ['Example 1', 'Example 2'], tip: 'Mẹo học', question: 'Fill in the blank: ___', options: ['Option A', 'Option B', 'Option C', 'Option D'], answer: 'Option A' } as GrammarCard
  }
  return { type: 'speaking', prompt: 'Speaking prompt here', hint: 'Gợi ý tiếng Việt', samplePhrases: ['Sample phrase 1...', 'Sample phrase 2...'] } as SpeakingCard
}

// ─── Main editor ──────────────────────────────────────────────────────────────
export function LessonEditor({ lessonId, initialLesson, staticLesson, hasOverride, overrideUpdatedAt, overrideUpdatedBy, stageTitle, stageColor }: Props) {
  const router = useRouter()
  const [lesson, setLesson] = useState<LessonData>(initialLesson)
  const [openCardIdx, setOpenCardIdx] = useState<number | null>(0)
  const [saving, setSaving] = useState(false)
  const [reverting, setReverting] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const isDirty = JSON.stringify(lesson) !== JSON.stringify(initialLesson)
  const Icon = TYPE_ICONS[lesson.type]

  function updateCard(idx: number, updated: LessonCard) {
    const cards = [...lesson.cards]
    cards[idx] = updated
    setLesson(l => ({ ...l, cards }))
  }

  function deleteCard(idx: number) {
    if (lesson.cards.length <= 1) { toast.error('Bài học phải có ít nhất 1 card'); return }
    const cards = lesson.cards.filter((_, i) => i !== idx)
    setLesson(l => ({ ...l, cards }))
    if (openCardIdx === idx) setOpenCardIdx(null)
    else if (openCardIdx !== null && openCardIdx > idx) setOpenCardIdx(openCardIdx - 1)
  }

  function addCard() {
    const newCard = defaultCard(lesson.type)
    setLesson(l => ({ ...l, cards: [...l.cards, newCard] }))
    setOpenCardIdx(lesson.cards.length)
  }

  function moveCard(from: number, to: number) {
    const cards = [...lesson.cards]
    const [moved] = cards.splice(from, 1)
    cards.splice(to, 0, moved)
    setLesson(l => ({ ...l, cards }))
    setOpenCardIdx(to)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/lessons/${lessonId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lesson),
      })
      if (!res.ok) throw new Error('Save failed')
      setSaveSuccess(true)
      toast.success('Đã lưu! Học viên thấy ngay.')
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch {
      toast.error('Lưu thất bại. Vui lòng thử lại.')
    } finally {
      setSaving(false)
    }
  }

  async function handleRevert() {
    if (!confirm('Khôi phục về dữ liệu gốc? Mọi thay đổi của bạn sẽ bị xoá.')) return
    setReverting(true)
    try {
      await fetch(`/api/admin/lessons/${lessonId}`, { method: 'DELETE' })
      setLesson(staticLesson)
      toast.success('Đã khôi phục về dữ liệu gốc')
      router.refresh()
    } catch {
      toast.error('Khôi phục thất bại')
    } finally {
      setReverting(false)
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* ── Topbar ── */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-card)] shrink-0">
        <button onClick={() => router.push('/admin/lessons')} className="p-2 rounded-xl hover:bg-[var(--bg-secondary)] transition-all text-[var(--text-secondary)]">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-[var(--text-secondary)]">{stageTitle}</div>
          <h1 className="font-bold text-[var(--text)] truncate">{lesson.title}</h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {hasOverride && (
            <button
              onClick={handleRevert}
              disabled={reverting}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-all disabled:opacity-50"
            >
              <RotateCcw size={14} />
              {reverting ? 'Đang khôi phục...' : 'Khôi phục mặc định'}
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all',
              saveSuccess
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-gradient-to-r from-cyan-500 to-violet-600 text-white hover:opacity-90 disabled:opacity-50'
            )}
          >
            {saveSuccess ? <><CheckCircle size={14} /> Đã lưu!</> : saving ? 'Đang lưu...' : <><Save size={14} /> Lưu thay đổi</>}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto p-6 space-y-6">
          {/* Override status */}
          {hasOverride && overrideUpdatedAt && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-500/8 border border-emerald-400/20 px-4 py-2.5 text-sm">
              <CheckCircle size={15} className="text-emerald-400 shrink-0" />
              <span className="text-emerald-400">
                Đang dùng bản tuỳ chỉnh · Cập nhật {new Date(overrideUpdatedAt).toLocaleString('vi-VN')}
                {overrideUpdatedBy && ` bởi ${overrideUpdatedBy}`}
              </span>
            </div>
          )}

          {!hasOverride && (
            <div className="flex items-center gap-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] px-4 py-2.5 text-sm">
              <AlertCircle size={15} className="text-yellow-400 shrink-0" />
              <span className="text-[var(--text-secondary)]">Đang dùng dữ liệu mặc định. Lưu để tạo bản tuỳ chỉnh.</span>
            </div>
          )}

          {/* Lesson metadata */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Icon size={16} className="text-[var(--text-secondary)]" />
              <h2 className="font-semibold text-[var(--text)]">Thông tin bài học</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tiêu đề (title)" value={lesson.title} onChange={v => setLesson(l => ({ ...l, title: v }))} />
              <Field label="Chủ đề (topic)" value={lesson.topic} onChange={v => setLesson(l => ({ ...l, topic: v }))} />
              <Field label="Mô tả (description)" value={lesson.description} onChange={v => setLesson(l => ({ ...l, description: v }))} />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-1">XP</label>
                  <input
                    type="number"
                    value={lesson.xp}
                    onChange={e => setLesson(l => ({ ...l, xp: Number(e.target.value) }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-sm text-[var(--text)] focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-1">Level</label>
                  <select
                    value={lesson.level}
                    onChange={e => setLesson(l => ({ ...l, level: e.target.value as LessonData['level'] }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-sm text-[var(--text)] focus:outline-none focus:border-cyan-400"
                  >
                    {['A1', 'A2', 'B1', 'B2'].map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Cards editor */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-[var(--text)]">Cards ({lesson.cards.length})</h2>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  {lesson.type === 'vocabulary' && 'Mỗi card: từ vựng + quiz → học viên học xong rồi làm bài'}
                  {lesson.type === 'grammar' && 'Mỗi card: quy tắc + giải thích + bài tập'}
                  {lesson.type === 'speaking' && 'Mỗi card: câu hỏi luyện nói + gợi ý + cụm từ mẫu'}
                </p>
              </div>
              <button
                onClick={addCard}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-400/20 text-sm font-medium hover:bg-cyan-500/20 transition-all"
              >
                <Plus size={14} /> Thêm card
              </button>
            </div>

            <div className="space-y-2">
              {lesson.cards.map((card, i) => (
                <CardItem
                  key={i}
                  card={card}
                  index={i}
                  totalCards={lesson.cards.length}
                  isOpen={openCardIdx === i}
                  onToggle={() => setOpenCardIdx(openCardIdx === i ? null : i)}
                  onChange={updated => updateCard(i, updated)}
                  onDelete={() => deleteCard(i)}
                  onMoveUp={() => moveCard(i, i - 1)}
                  onMoveDown={() => moveCard(i, i + 1)}
                />
              ))}
            </div>
          </div>

          {/* Save button (bottom) */}
          <div className="flex justify-end gap-3 pb-6">
            {isDirty && (
              <p className="text-xs text-yellow-400 flex items-center gap-1.5 mr-auto">
                <AlertCircle size={12} /> Có thay đổi chưa lưu
              </p>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 text-white font-bold hover:opacity-90 disabled:opacity-50 transition-all"
            >
              <Save size={16} />
              {saving ? 'Đang lưu...' : 'Lưu tất cả thay đổi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
