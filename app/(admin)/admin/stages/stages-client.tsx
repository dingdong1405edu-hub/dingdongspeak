'use client'

import { useState } from 'react'
import { Plus, Trash2, Edit3, ChevronUp, ChevronDown, Check, X, Layers } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Stage {
  id: string
  title: string
  subtitle: string
  icon: string
  color: string
  accentColor: string
  order: number
  published: boolean
}

const COLOR_OPTIONS = [
  { label: 'Xanh lá → Xanh dương', value: 'from-emerald-500 to-cyan-500', accent: 'emerald' },
  { label: 'Xanh điện → Tím', value: 'from-cyan-500 to-violet-600', accent: 'cyan' },
  { label: 'Cam → Đỏ', value: 'from-orange-500 to-red-500', accent: 'orange' },
  { label: 'Tím → Hồng', value: 'from-violet-500 to-pink-500', accent: 'violet' },
  { label: 'Vàng → Cam', value: 'from-yellow-500 to-orange-500', accent: 'yellow' },
  { label: 'Hồng → Tím', value: 'from-pink-500 to-purple-600', accent: 'pink' },
  { label: 'Xanh dương → Tím', value: 'from-blue-500 to-violet-500', accent: 'blue' },
  { label: 'Xanh lá → Teal', value: 'from-green-500 to-teal-500', accent: 'green' },
]

const ICON_OPTIONS = ['📚', '🌱', '🔥', '⚡', '🎯', '🏆', '💡', '🌟', '🎓', '🚀', '💪', '🧠', '🎵', '🌍', '✨']

function StageForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial?: Partial<Stage>
  onSave: (data: Omit<Stage, 'id' | 'order' | 'published' | 'createdAt' | 'updatedAt'>) => void
  onCancel: () => void
  saving: boolean
}) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [subtitle, setSubtitle] = useState(initial?.subtitle ?? '')
  const [icon, setIcon] = useState(initial?.icon ?? '📚')
  const [color, setColor] = useState(initial?.color ?? 'from-cyan-500 to-violet-600')
  const [accentColor, setAccentColor] = useState(initial?.accentColor ?? 'cyan')

  return (
    <div className="space-y-4 p-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)]">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-1">Tên chặng</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="VD: Stage 1"
            className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-sm text-[var(--text)] focus:outline-none focus:border-cyan-400"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-1">Tiêu đề phụ</label>
          <input
            value={subtitle}
            onChange={e => setSubtitle(e.target.value)}
            placeholder="VD: Nền tảng"
            className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-sm text-[var(--text)] focus:outline-none focus:border-cyan-400"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-2">Icon</label>
        <div className="flex flex-wrap gap-2">
          {ICON_OPTIONS.map(ic => (
            <button
              key={ic}
              onClick={() => setIcon(ic)}
              className={cn('w-9 h-9 rounded-xl text-lg flex items-center justify-center border transition-all',
                icon === ic ? 'border-cyan-400 bg-cyan-500/15' : 'border-[var(--border)] hover:border-cyan-400/40'
              )}
            >
              {ic}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-2">Màu gradient</label>
        <div className="grid grid-cols-2 gap-2">
          {COLOR_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => { setColor(opt.value); setAccentColor(opt.accent) }}
              className={cn('flex items-center gap-2 p-2 rounded-xl border transition-all text-xs',
                color === opt.value ? 'border-cyan-400 bg-cyan-500/10' : 'border-[var(--border)] hover:border-cyan-400/40'
              )}
            >
              <div className={`w-6 h-6 rounded-lg bg-gradient-to-r ${opt.value} shrink-0`} />
              <span className="text-[var(--text)]">{opt.label}</span>
              {color === opt.value && <Check size={12} className="ml-auto text-cyan-400 shrink-0" />}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="px-4 py-2 rounded-xl border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:bg-[var(--bg)] transition-all">
          Huỷ
        </button>
        <button
          onClick={() => onSave({ title, subtitle, icon, color, accentColor })}
          disabled={saving || !title.trim() || !subtitle.trim()}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
        >
          {saving ? 'Đang lưu...' : 'Lưu'}
        </button>
      </div>
    </div>
  )
}

export function StagesClient({
  initialStages,
  lessonCounts,
}: {
  initialStages: Stage[]
  lessonCounts: Record<string, number>
}) {
  const [stages, setStages] = useState<Stage[]>(initialStages)
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleAdd(data: any) {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/stages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setStages(s => [...s, json])
      setShowAdd(false)
      toast.success('Đã tạo stage mới!')
    } catch (e: any) {
      toast.error(e?.message || 'Tạo thất bại')
    } finally {
      setSaving(false)
    }
  }

  async function handleEdit(id: string, data: any) {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/stages/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setStages(s => s.map(st => st.id === id ? { ...st, ...json } : st))
      setEditingId(null)
      toast.success('Đã cập nhật!')
    } catch (e: any) {
      toast.error(e?.message || 'Cập nhật thất bại')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    const count = lessonCounts[id] ?? 0
    if (count > 0) {
      toast.error(`Stage còn ${count} bài học. Xóa bài học trước.`)
      return
    }
    if (!confirm('Xóa stage này?')) return
    try {
      const res = await fetch(`/api/admin/stages/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setStages(s => s.filter(st => st.id !== id))
      toast.success('Đã xóa stage')
    } catch (e: any) {
      toast.error(e?.message || 'Xóa thất bại')
    }
  }

  async function handleMove(id: string, dir: 'up' | 'down') {
    const idx = stages.findIndex(s => s.id === id)
    if (dir === 'up' && idx === 0) return
    if (dir === 'down' && idx === stages.length - 1) return

    const newStages = [...stages]
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1
    ;[newStages[idx], newStages[swapIdx]] = [newStages[swapIdx], newStages[idx]]
    setStages(newStages)

    try {
      await Promise.all([
        fetch(`/api/admin/stages/${newStages[idx].id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: idx }),
        }),
        fetch(`/api/admin/stages/${newStages[swapIdx].id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: swapIdx }),
        }),
      ])
    } catch {
      toast.error('Lỗi khi sắp xếp')
      setStages(stages)
    }
  }

  async function handleTogglePublish(id: string, published: boolean) {
    try {
      const res = await fetch(`/api/admin/stages/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !published }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setStages(s => s.map(st => st.id === id ? { ...st, published: !published } : st))
      toast.success(!published ? 'Đã công khai' : 'Đã ẩn')
    } catch (e: any) {
      toast.error(e?.message || 'Lỗi')
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Quản lý Stages</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">{stages.length} chặng học trên lộ trình</p>
        </div>
        <button
          onClick={() => { setShowAdd(true); setEditingId(null) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          Thêm Stage
        </button>
      </div>

      {showAdd && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-[var(--text)] mb-3">Tạo Stage mới</h2>
          <StageForm onSave={handleAdd} onCancel={() => setShowAdd(false)} saving={saving} />
        </div>
      )}

      {stages.length === 0 && !showAdd && (
        <div className="rounded-2xl border border-dashed border-[var(--border)] p-16 text-center">
          <Layers size={40} className="mx-auto text-[var(--text-secondary)] mb-4 opacity-40" />
          <p className="text-[var(--text-secondary)] mb-4">Chưa có stage nào. Tạo stage đầu tiên để bắt đầu!</p>
        </div>
      )}

      <div className="space-y-3">
        {stages.map((stage, idx) => (
          <div key={stage.id} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
            {editingId === stage.id ? (
              <div className="p-4">
                <StageForm
                  initial={stage}
                  onSave={(data) => handleEdit(stage.id, data)}
                  onCancel={() => setEditingId(null)}
                  saving={saving}
                />
              </div>
            ) : (
              <div className={`p-4 bg-gradient-to-r ${stage.color}`}>
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-0.5">
                    <button onClick={() => handleMove(stage.id, 'up')} disabled={idx === 0}
                      className="p-0.5 rounded hover:bg-white/20 disabled:opacity-30 text-white transition-colors">
                      <ChevronUp size={14} />
                    </button>
                    <button onClick={() => handleMove(stage.id, 'down')} disabled={idx === stages.length - 1}
                      className="p-0.5 rounded hover:bg-white/20 disabled:opacity-30 text-white transition-colors">
                      <ChevronDown size={14} />
                    </button>
                  </div>

                  <span className="text-2xl">{stage.icon}</span>

                  <div className="flex-1">
                    <div className="font-bold text-white">{stage.title}: {stage.subtitle}</div>
                    <div className="text-xs text-white/70">
                      {lessonCounts[stage.id] ?? 0} bài học
                      {!stage.published && ' · Đang ẩn'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTogglePublish(stage.id, stage.published)}
                      className={cn('px-3 py-1 rounded-lg text-xs font-semibold transition-all',
                        stage.published ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-black/30 hover:bg-black/40 text-white/70'
                      )}
                    >
                      {stage.published ? 'Công khai' : 'Đang ẩn'}
                    </button>
                    <button
                      onClick={() => { setEditingId(stage.id); setShowAdd(false) }}
                      className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-all"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(stage.id)}
                      className="p-2 rounded-lg bg-red-500/30 hover:bg-red-500/50 text-white transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
