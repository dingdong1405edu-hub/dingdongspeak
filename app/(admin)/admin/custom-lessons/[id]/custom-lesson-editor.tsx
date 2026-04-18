'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Trash2, Globe, Lock, CheckCircle, AlertCircle, Plus, ChevronUp, ChevronDown, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type AnyCard = Record<string, any>

interface Props {
  lesson: {
    id: string; stageId: string; title: string; type: string; topic: string
    level: string; description: string; xp: number; cards: AnyCard[]
    published: boolean
  }
  stageTitle: string
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-1">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-sm text-[var(--text)] focus:outline-none focus:border-cyan-400" />
    </div>
  )
}

function CardItem({ card, index, total, onUpdate, onDelete, onMoveUp, onMoveDown }: {
  card: AnyCard; index: number; total: number
  onUpdate: (c: AnyCard) => void; onDelete: () => void; onMoveUp: () => void; onMoveDown: () => void
}) {
  const [open, setOpen] = useState(false)
  const label = card.type === 'vocab' ? card.word : card.type === 'grammar' ? card.rule : String(card.prompt ?? '').slice(0, 60)

  return (
    <div className="rounded-xl border border-[var(--border)] overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5 bg-[var(--bg-secondary)]">
        <span className="text-xs text-[var(--text-secondary)] w-6">#{index + 1}</span>
        <button onClick={() => setOpen(o => !o)} className="flex-1 text-left text-sm font-medium text-[var(--text)] truncate">{label || '(trống)'}</button>
        <div className="flex items-center gap-0.5">
          <button onClick={onMoveUp} disabled={index === 0} className="p-1 rounded hover:bg-[var(--border)] disabled:opacity-30"><ChevronUp size={12} /></button>
          <button onClick={onMoveDown} disabled={index === total - 1} className="p-1 rounded hover:bg-[var(--border)] disabled:opacity-30"><ChevronDown size={12} /></button>
          <button onClick={onDelete} className="p-1 rounded hover:bg-red-500/10 text-red-400"><Trash2 size={12} /></button>
          <button onClick={() => setOpen(o => !o)} className="p-1 rounded hover:bg-[var(--border)] text-[var(--text-secondary)]">
            {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>
      </div>
      {open && (
        <div className="p-3 border-t border-[var(--border)]">
          <textarea
            value={JSON.stringify(card, null, 2)}
            onChange={e => { try { onUpdate(JSON.parse(e.target.value)) } catch { } }}
            rows={12}
            className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-xs text-[var(--text)] font-mono focus:outline-none focus:border-cyan-400 resize-none"
          />
          <p className="text-[10px] text-[var(--text-secondary)] mt-1">Chỉnh sửa trực tiếp JSON</p>
        </div>
      )}
    </div>
  )
}

export function CustomLessonEditor({ lesson: initial, stageTitle }: Props) {
  const router = useRouter()
  const [lesson, setLesson] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  function updateCard(i: number, c: AnyCard) {
    const cards = [...lesson.cards]; cards[i] = c
    setLesson(l => ({ ...l, cards }))
  }
  function deleteCard(i: number) {
    setLesson(l => ({ ...l, cards: l.cards.filter((_, idx) => idx !== i) }))
  }
  function moveCard(from: number, to: number) {
    const cards = [...lesson.cards]; const [m] = cards.splice(from, 1); cards.splice(to, 0, m)
    setLesson(l => ({ ...l, cards }))
  }
  function addCard() {
    const emptyCard = lesson.type === 'vocabulary'
      ? { type: 'vocab', word: '', phonetic: '', pos: 'n.', meaning: '', example: '', options: ['', '', '', ''], answer: '' }
      : lesson.type === 'grammar'
      ? { type: 'grammar', rule: '', explanation: '', examples: [], tip: '', question: '', options: ['', '', '', ''], answer: '' }
      : { type: 'speaking', prompt: '', hint: '', samplePhrases: [] }
    setLesson(l => ({ ...l, cards: [...l.cards, emptyCard] }))
  }

  async function handleSave(published?: boolean) {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/custom-lessons/${lesson.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...lesson, published: published ?? lesson.published }),
      })
      if (!res.ok) throw new Error('Lưu thất bại')
      setLesson(l => ({ ...l, published: published ?? l.published }))
      toast.success('Đã lưu thành công!')
    } catch (e: any) {
      toast.error(e?.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Xoá bài học này? Hành động không thể hoàn tác.')) return
    setDeleting(true)
    try {
      await fetch(`/api/admin/custom-lessons/${lesson.id}`, { method: 'DELETE' })
      toast.success('Đã xoá bài học')
      router.push('/admin/lessons')
    } catch {
      toast.error('Xoá thất bại')
      setDeleting(false)
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Topbar */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-card)] shrink-0">
        <button onClick={() => router.push('/admin/lessons')} className="p-2 rounded-xl hover:bg-[var(--bg-secondary)] transition-all text-[var(--text-secondary)]">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-[var(--text-secondary)]">{stageTitle} · Bài tự tạo</div>
          <h1 className="font-bold text-[var(--text)] truncate">{lesson.title}</h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={handleDelete} disabled={deleting}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-500/30 text-red-400 text-sm hover:bg-red-500/10 transition-all disabled:opacity-50">
            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            Xoá
          </button>
          <button onClick={() => handleSave(!lesson.published)} disabled={saving}
            className={cn('flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm transition-all disabled:opacity-50',
              lesson.published ? 'border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10' : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
            )}>
            {lesson.published ? <><Lock size={14} /> Gỡ đăng</> : <><Globe size={14} /> Đăng bài</>}
          </button>
          <button onClick={() => handleSave()} disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 text-white text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50">
            <Save size={14} />
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto p-6 space-y-6">
          {/* Status */}
          <div className={cn('flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm border',
            lesson.published ? 'bg-emerald-500/8 border-emerald-400/20 text-emerald-400' : 'bg-yellow-500/8 border-yellow-400/20 text-yellow-400'
          )}>
            {lesson.published ? <><Globe size={15} /> Đã đăng — Học viên có thể thấy bài này</> : <><Lock size={15} /> Nháp — Chưa hiển thị với học viên</>}
          </div>

          {/* Metadata */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-4">
            <h2 className="font-semibold text-[var(--text)]">Thông tin bài học</h2>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tiêu đề" value={lesson.title} onChange={v => setLesson(l => ({ ...l, title: v }))} />
              <Field label="Chủ đề (topic)" value={lesson.topic} onChange={v => setLesson(l => ({ ...l, topic: v }))} />
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-1">Level</label>
                <select value={lesson.level} onChange={e => setLesson(l => ({ ...l, level: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-sm text-[var(--text)] focus:outline-none focus:border-cyan-400">
                  {['A1', 'A2', 'B1', 'B2'].map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-1">XP</label>
                <input type="number" value={lesson.xp} onChange={e => setLesson(l => ({ ...l, xp: Number(e.target.value) }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-sm text-[var(--text)] focus:outline-none focus:border-cyan-400" />
              </div>
            </div>
          </div>

          {/* Cards */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-[var(--text)]">Cards ({lesson.cards.length})</h2>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">Chỉnh sửa trực tiếp JSON hoặc thêm card mới</p>
              </div>
              <button onClick={addCard}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-400/20 text-sm hover:bg-cyan-500/20 transition-all">
                <Plus size={14} /> Thêm card
              </button>
            </div>
            <div className="space-y-2">
              {lesson.cards.map((card, i) => (
                <CardItem key={i} card={card} index={i} total={lesson.cards.length}
                  onUpdate={c => updateCard(i, c)} onDelete={() => deleteCard(i)}
                  onMoveUp={() => moveCard(i, i - 1)} onMoveDown={() => moveCard(i, i + 1)} />
              ))}
            </div>
          </div>

          {/* Bottom save */}
          <div className="flex justify-end gap-3 pb-6">
            <button onClick={() => handleSave()} disabled={saving}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 text-white font-bold hover:opacity-90 transition-all disabled:opacity-50">
              <Save size={16} />
              {saving ? 'Đang lưu...' : 'Lưu tất cả thay đổi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
