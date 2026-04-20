'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useRef, useCallback, useEffect, Suspense } from 'react'
import {
  Sparkles, FileText, Edit3, ArrowLeft, Upload, Loader2, Plus, Trash2,
  ChevronDown, ChevronUp, CheckCircle, AlertCircle, Save, Eye, EyeOff,
  Image as ImageIcon, FileUp, X
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface StageOption { id: string; title: string; subtitle: string; icon: string }

type Mode = 'ai' | 'doc' | 'manual'
type LessonType = 'vocabulary' | 'grammar' | 'speaking'
type Level = 'A1' | 'A2' | 'B1' | 'B2'

interface VocabCard { type: 'vocab'; word: string; phonetic: string; pos: string; meaning: string; example: string; options: string[]; answer: string }
interface GrammarCard { type: 'grammar'; rule: string; explanation: string; examples: string[]; tip: string; question: string; options: string[]; answer: string }
interface FillBlankCard { type: 'fill-blank'; sentence: string; answer: string; options: string[]; explanation: string }
interface ArrangeCard { type: 'arrange'; words: string[]; answer: string; hint?: string }
interface SpeakingCard { type: 'speaking'; prompt: string; hint: string; samplePhrases: string[] }
type AnyCard = VocabCard | GrammarCard | FillBlankCard | ArrangeCard | SpeakingCard

interface UploadedFile { data: string; mimeType: string; name: string; kind: 'pdf' | 'image' }

const MODES = [
  { id: 'ai' as Mode, icon: Sparkles, label: 'AI từ chủ đề', desc: 'Nhập chủ đề, AI tạo bài hoàn chỉnh', color: 'from-cyan-500 to-violet-600' },
  { id: 'doc' as Mode, icon: FileText, label: 'Upload tài liệu', desc: 'PDF, ảnh, hoặc paste text — AI phân tích → game', color: 'from-emerald-500 to-cyan-500' },
  { id: 'manual' as Mode, icon: Edit3, label: 'Thêm thủ công', desc: 'Tự điền cards từng bước', color: 'from-violet-500 to-pink-500' },
]

const TYPE_OPTIONS: { value: LessonType; label: string }[] = [
  { value: 'vocabulary', label: 'Từ vựng' },
  { value: 'grammar', label: 'Ngữ pháp' },
  { value: 'speaking', label: 'Luyện nói' },
]

const DEFAULT_COUNT: Record<LessonType, number> = { vocabulary: 10, grammar: 9, speaking: 8 }
const LEVEL_OPTIONS: Level[] = ['A1', 'A2', 'B1', 'B2']

// ── Card preview component ────────────────────────────────────────────────────
function CardPreview({ card, index, onEdit, onDelete, onMoveUp, onMoveDown, total }: {
  card: AnyCard; index: number; onEdit: (c: AnyCard) => void; onDelete: () => void
  onMoveUp: () => void; onMoveDown: () => void; total: number
}) {
  const [open, setOpen] = useState(false)

  const label = card.type === 'vocab' ? (card as VocabCard).word
    : card.type === 'grammar' ? (card as GrammarCard).rule
    : card.type === 'fill-blank' ? (card as FillBlankCard).sentence.slice(0, 60)
    : card.type === 'arrange' ? (card as ArrangeCard).answer.slice(0, 60)
    : (card as SpeakingCard).prompt.slice(0, 60)

  const typeLabel = card.type === 'vocab' ? 'V'
    : card.type === 'grammar' ? 'MCQ'
    : card.type === 'fill-blank' ? 'Fill'
    : card.type === 'arrange' ? 'Arr'
    : 'S'

  const typeColor = card.type === 'vocab' ? 'bg-emerald-500/15 text-emerald-400'
    : card.type === 'grammar' ? 'bg-blue-500/15 text-blue-400'
    : card.type === 'fill-blank' ? 'bg-indigo-500/15 text-indigo-400'
    : card.type === 'arrange' ? 'bg-purple-500/15 text-purple-400'
    : 'bg-violet-500/15 text-violet-400'

  return (
    <div className="rounded-xl border border-[var(--border)] overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5 bg-[var(--bg-secondary)]">
        <span className="text-[10px] font-bold text-[var(--text-secondary)] w-5">#{index + 1}</span>
        <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-bold', typeColor)}>{typeLabel}</span>
        <button onClick={() => setOpen(o => !o)} className="flex-1 text-left text-sm text-[var(--text)] truncate font-medium">
          {label}
        </button>
        <div className="flex items-center gap-0.5 shrink-0">
          <button onClick={onMoveUp} disabled={index === 0} className="p-1 rounded hover:bg-[var(--border)] disabled:opacity-30"><ChevronUp size={12} /></button>
          <button onClick={onMoveDown} disabled={index === total - 1} className="p-1 rounded hover:bg-[var(--border)] disabled:opacity-30"><ChevronDown size={12} /></button>
          <button onClick={onDelete} className="p-1 rounded hover:bg-red-500/10 text-red-400"><Trash2 size={12} /></button>
          <button onClick={() => setOpen(o => !o)} className="p-1 rounded hover:bg-[var(--border)] text-[var(--text-secondary)]">
            {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="p-3 border-t border-[var(--border)] space-y-2">
          {card.type === 'vocab' && <VocabEditor card={card as VocabCard} onChange={onEdit} />}
          {card.type === 'grammar' && <GrammarEditor card={card as GrammarCard} onChange={onEdit} />}
          {card.type === 'fill-blank' && <FillBlankEditor card={card as FillBlankCard} onChange={onEdit} />}
          {card.type === 'arrange' && <ArrangeEditor card={card as ArrangeCard} onChange={onEdit} />}
          {card.type === 'speaking' && <SpeakingEditor card={card as SpeakingCard} onChange={onEdit} />}
        </div>
      )}
    </div>
  )
}

// ── Card editors ──────────────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-1">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-sm text-[var(--text)] focus:outline-none focus:border-cyan-400 transition-colors" />
    </div>
  )
}
function FieldArea({ label, value, onChange, rows = 3, placeholder }: { label: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-1">{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-sm text-[var(--text)] focus:outline-none focus:border-cyan-400 resize-none transition-colors" />
    </div>
  )
}

function VocabEditor({ card, onChange }: { card: VocabCard; onChange: (c: AnyCard) => void }) {
  const u = (f: keyof VocabCard, v: string | string[]) => onChange({ ...card, [f]: v })
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <Field label="Từ" value={card.word} onChange={v => u('word', v)} />
        <Field label="Phiên âm" value={card.phonetic} onChange={v => u('phonetic', v)} />
        <Field label="Loại từ" value={card.pos} onChange={v => u('pos', v)} placeholder="n. / v. / adj." />
        <Field label="Nghĩa tiếng Việt" value={card.meaning} onChange={v => u('meaning', v)} />
      </div>
      <FieldArea label="Câu ví dụ" value={card.example} onChange={v => u('example', v)} rows={2} />
      <div>
        <label className="block text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-1">4 lựa chọn</label>
        <div className="grid grid-cols-2 gap-1.5">
          {card.options.map((opt, i) => (
            <input key={i} value={opt} onChange={e => { const o = [...card.options]; o[i] = e.target.value; u('options', o) }}
              className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-xs text-[var(--text)] focus:outline-none focus:border-cyan-400" />
          ))}
        </div>
      </div>
      <Field label="Đáp án đúng (khớp 1 trong 4 options)" value={card.answer} onChange={v => u('answer', v)} />
    </div>
  )
}

function GrammarEditor({ card, onChange }: { card: GrammarCard; onChange: (c: AnyCard) => void }) {
  const u = (f: keyof GrammarCard, v: string | string[]) => onChange({ ...card, [f]: v })
  return (
    <div className="space-y-2">
      <Field label="Tên quy tắc" value={card.rule} onChange={v => u('rule', v)} />
      <FieldArea label="Giải thích (tiếng Việt)" value={card.explanation} onChange={v => u('explanation', v)} rows={2} />
      <FieldArea label="Ví dụ (mỗi dòng 1 ví dụ)" value={card.examples.join('\n')}
        onChange={v => u('examples', v.split('\n').filter(s => s.trim()))} rows={3} />
      <Field label="Mẹo học" value={card.tip} onChange={v => u('tip', v)} />
      <FieldArea label="Câu bài tập" value={card.question} onChange={v => u('question', v)} rows={2} />
      <div>
        <label className="block text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-1">4 lựa chọn</label>
        <div className="grid grid-cols-2 gap-1.5">
          {card.options.map((opt, i) => (
            <input key={i} value={opt} onChange={e => { const o = [...card.options]; o[i] = e.target.value; u('options', o) }}
              className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-xs text-[var(--text)] focus:outline-none focus:border-cyan-400" />
          ))}
        </div>
      </div>
      <Field label="Đáp án đúng" value={card.answer} onChange={v => u('answer', v)} />
    </div>
  )
}

function FillBlankEditor({ card, onChange }: { card: FillBlankCard; onChange: (c: AnyCard) => void }) {
  const u = (f: keyof FillBlankCard, v: string | string[]) => onChange({ ...card, [f]: v })
  return (
    <div className="space-y-2">
      <Field label='Câu (dùng ___ cho chỗ trống)' value={card.sentence} onChange={v => u('sentence', v)} placeholder='She ___ to school every day.' />
      <Field label="Đáp án đúng" value={card.answer} onChange={v => u('answer', v)} />
      <div>
        <label className="block text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-1">4 lựa chọn</label>
        <div className="grid grid-cols-2 gap-1.5">
          {card.options.map((opt, i) => (
            <input key={i} value={opt} onChange={e => { const o = [...card.options]; o[i] = e.target.value; u('options', o) }}
              className="px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-xs text-[var(--text)] focus:outline-none focus:border-cyan-400" />
          ))}
        </div>
      </div>
      <Field label="Giải thích (tiếng Việt)" value={card.explanation} onChange={v => u('explanation', v)} />
    </div>
  )
}

function ArrangeEditor({ card, onChange }: { card: ArrangeCard; onChange: (c: AnyCard) => void }) {
  const u = (f: keyof ArrangeCard, v: string | string[] | undefined) => onChange({ ...card, [f]: v })
  return (
    <div className="space-y-2">
      <Field label="Câu đúng (đáp án)" value={card.answer} onChange={v => u('answer', v)} placeholder='She goes to school every day.' />
      <FieldArea label="Các từ (mỗi dòng 1 từ, sắp xếp ngẫu nhiên)" value={card.words.join('\n')}
        onChange={v => u('words', v.split('\n').filter(s => s.trim()))} rows={4} />
      <Field label="Gợi ý (tiếng Việt, không bắt buộc)" value={card.hint ?? ''} onChange={v => u('hint', v || undefined)} />
    </div>
  )
}

function SpeakingEditor({ card, onChange }: { card: SpeakingCard; onChange: (c: AnyCard) => void }) {
  const u = (f: keyof SpeakingCard, v: string | string[]) => onChange({ ...card, [f]: v })
  return (
    <div className="space-y-2">
      <FieldArea label="Câu hỏi luyện nói" value={card.prompt} onChange={v => u('prompt', v)} rows={2} />
      <Field label="Gợi ý (tiếng Việt)" value={card.hint} onChange={v => u('hint', v)} />
      <FieldArea label="Cụm từ mẫu (mỗi dòng 1 cụm)" value={card.samplePhrases.join('\n')}
        onChange={v => u('samplePhrases', v.split('\n').filter(s => s.trim()))} rows={4} />
    </div>
  )
}

// ── Default empty cards ───────────────────────────────────────────────────────
function defaultCard(type: LessonType): AnyCard {
  if (type === 'vocabulary') return { type: 'vocab', word: '', phonetic: '', pos: 'n.', meaning: '', example: '', options: ['', '', '', ''], answer: '' }
  if (type === 'grammar') return { type: 'grammar', rule: '', explanation: '', examples: ['', '', ''], tip: '', question: '', options: ['', '', '', ''], answer: '' }
  return { type: 'speaking', prompt: '', hint: '', samplePhrases: ['', '', ''] }
}

// ── Main page ─────────────────────────────────────────────────────────────────
function NewLessonPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialMode = (searchParams.get('mode') ?? 'ai') as Mode

  const [mode, setMode] = useState<Mode>(initialMode)
  const [lessonType, setLessonType] = useState<LessonType>('vocabulary')
  const [level, setLevel] = useState<Level>('A1')
  const [stageId, setStageId] = useState(searchParams.get('stageId') ?? '')
  const [stages, setStages] = useState<StageOption[]>([])
  const [title, setTitle] = useState('')
  const [topic, setTopic] = useState('')
  const [description, setDescription] = useState('')
  const [xp, setXp] = useState(50)
  const [count, setCount] = useState(10)
  const [cards, setCards] = useState<AnyCard[]>([])
  const [docText, setDocText] = useState('')
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(true)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/admin/stages')
      .then(r => r.json())
      .then((data) => {
        const list: StageOption[] = Array.isArray(data) ? data : []
        setStages(list)
        if (!stageId && list.length > 0) setStageId(list[0].id)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    setCount(DEFAULT_COUNT[lessonType])
  }, [lessonType])

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    if (file.type === 'text/plain') {
      const text = await file.text()
      setDocText(text)
      setUploadedFile(null)
      toast.success(`Đã tải file: ${file.name}`)
    } else if (file.type === 'application/pdf') {
      const reader = new FileReader()
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1]
        setUploadedFile({ data: base64, mimeType: 'application/pdf', name: file.name, kind: 'pdf' })
        setDocText('')
        toast.success(`Đã tải PDF: ${file.name}`)
      }
      reader.readAsDataURL(file)
    } else if (file.type.startsWith('image/')) {
      if (file.size > 10 * 1024 * 1024) { toast.error('Ảnh quá lớn (tối đa 10MB)'); return }
      const reader = new FileReader()
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1]
        setUploadedFile({ data: base64, mimeType: file.type, name: file.name, kind: 'image' })
        setDocText('')
        toast.success(`Đã tải ảnh: ${file.name}`)
      }
      reader.readAsDataURL(file)
    } else {
      toast.error('Hỗ trợ: .txt, .pdf, .png, .jpg, .jpeg, .webp')
    }
  }, [])

  async function handleGenerate() {
    if (!topic.trim()) { toast.error('Nhập chủ đề trước'); return }
    if (mode === 'doc' && !docText.trim() && !uploadedFile) { toast.error('Cần upload file hoặc paste nội dung'); return }
    setGenerating(true)
    try {
      const body: Record<string, unknown> = { type: lessonType, level, topic, count }
      if (mode === 'doc') {
        if (uploadedFile?.kind === 'pdf') body.pdfBase64 = uploadedFile.data
        else if (uploadedFile?.kind === 'image') { body.imageBase64 = uploadedFile.data; body.imageMimeType = uploadedFile.mimeType }
        else if (docText.trim()) body.docText = docText
      }
      const res = await fetch('/api/admin/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCards(data.cards)
      if (!title) setTitle(`${topic} — ${TYPE_OPTIONS.find(t => t.value === lessonType)?.label}`)
      toast.success(`Đã tạo ${data.cards.length} cards!`)
    } catch (e: any) {
      toast.error(e?.message || 'AI tạo thất bại')
    } finally {
      setGenerating(false)
    }
  }

  function updateCard(i: number, c: AnyCard) {
    setCards(cs => { const n = [...cs]; n[i] = c; return n })
  }
  function deleteCard(i: number) {
    setCards(cs => cs.filter((_, idx) => idx !== i))
  }
  function moveCard(from: number, to: number) {
    setCards(cs => {
      const n = [...cs]; const [m] = n.splice(from, 1); n.splice(to, 0, m); return n
    })
  }
  function addCard() {
    setCards(cs => [...cs, defaultCard(lessonType)])
  }

  async function handleSave(publish: boolean) {
    if (!title.trim()) { toast.error('Nhập tiêu đề bài học'); return }
    if (!topic.trim()) { toast.error('Nhập chủ đề'); return }
    if (cards.length === 0) { toast.error('Cần có ít nhất 1 card'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/custom-lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stageId, title, type: lessonType, topic, level, description, xp, cards, published: publish }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(publish ? 'Đã lưu và đăng bài học!' : 'Đã lưu bài học (chưa đăng)')
      router.push('/admin/lessons')
    } catch (e: any) {
      toast.error(e?.message || 'Lưu thất bại')
    } finally {
      setSaving(false)
    }
  }

  const canGenerate = !!topic.trim() && (mode !== 'doc' || !!docText.trim() || !!uploadedFile)

  return (
    <div className="h-full flex flex-col">
      {/* Topbar */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-card)] shrink-0">
        <button onClick={() => router.push('/admin/lessons')} className="p-2 rounded-xl hover:bg-[var(--bg-secondary)] transition-all text-[var(--text-secondary)]">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-[var(--text)]">Tạo bài học mới</h1>
          <p className="text-xs text-[var(--text-secondary)]">Chọn phương thức tạo bài học bên dưới</p>
        </div>
        {cards.length > 0 && (
          <div className="flex items-center gap-2">
            <button onClick={() => setShowPreview(p => !p)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-all">
              {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
              {showPreview ? 'Ẩn preview' : 'Xem cards'}
            </button>
            <button onClick={() => handleSave(false)} disabled={saving} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-all disabled:opacity-50">
              <Save size={14} />
              {saving ? 'Đang lưu...' : 'Lưu nháp'}
            </button>
            <button onClick={() => handleSave(true)} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 text-white text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50">
              <CheckCircle size={14} />
              {saving ? 'Đang lưu...' : 'Lưu & Đăng'}
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-6">

          {/* Mode selector */}
          <div className="grid grid-cols-3 gap-3">
            {MODES.map(m => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={cn(
                  'rounded-2xl border-2 p-4 text-left transition-all',
                  mode === m.id ? 'border-cyan-400 bg-cyan-500/8' : 'border-[var(--border)] bg-[var(--bg-card)] hover:border-cyan-400/40'
                )}
              >
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center mb-2.5`}>
                  <m.icon size={16} className="text-white" />
                </div>
                <div className="font-semibold text-[var(--text)] text-sm mb-0.5">{m.label}</div>
                <div className="text-xs text-[var(--text-secondary)]">{m.desc}</div>
              </button>
            ))}
          </div>

          {/* Config panel */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-4">
            <h2 className="font-semibold text-[var(--text)]">Thông tin bài học</h2>

            <div className="grid grid-cols-2 gap-3">
              {/* Stage */}
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-1">Chặng (Stage)</label>
                <select value={stageId} onChange={e => setStageId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-sm text-[var(--text)] focus:outline-none focus:border-cyan-400">
                  {stages.length === 0 && <option value="">-- Chưa có stage --</option>}
                  {stages.map(s => <option key={s.id} value={s.id}>{s.icon} {s.title}: {s.subtitle}</option>)}
                </select>
              </div>

              {/* Type */}
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-1">Loại bài</label>
                <select value={lessonType} onChange={e => setLessonType(e.target.value as LessonType)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-sm text-[var(--text)] focus:outline-none focus:border-cyan-400">
                  {TYPE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              {/* Level */}
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-1">Cấp độ</label>
                <div className="flex gap-2">
                  {LEVEL_OPTIONS.map(l => (
                    <button key={l} onClick={() => setLevel(l)}
                      className={cn('flex-1 py-2 rounded-xl text-sm font-semibold border transition-all',
                        level === l ? 'border-cyan-400 bg-cyan-500/15 text-cyan-400' : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-cyan-400/40'
                      )}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Count */}
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-1">
                  Số lượng câu hỏi {lessonType === 'grammar' ? '(MCQ + điền từ + sắp xếp)' : ''}
                </label>
                <input type="number" value={count} onChange={e => setCount(Math.max(3, Math.min(30, Number(e.target.value))))} min={3} max={30}
                  className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-sm text-[var(--text)] focus:outline-none focus:border-cyan-400" />
              </div>

              {/* XP */}
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-1">XP thưởng</label>
                <input type="number" value={xp} onChange={e => setXp(Number(e.target.value))} min={10} max={500} step={10}
                  className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-sm text-[var(--text)] focus:outline-none focus:border-cyan-400" />
              </div>

              {/* Title */}
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-1">Tiêu đề bài học</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="VD: Environment Vocabulary — A2"
                  className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-sm text-[var(--text)] focus:outline-none focus:border-cyan-400" />
              </div>

              {/* Topic */}
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-1">
                  Chủ đề {mode === 'ai' ? '(AI sẽ tạo bài từ chủ đề này)' : '(để AI hiểu ngữ cảnh)'}
                </label>
                <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="VD: Environment, Technology, Daily Routines..."
                  className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-sm text-[var(--text)] focus:outline-none focus:border-cyan-400" />
              </div>
            </div>

            {/* Document upload area (mode = doc) */}
            {mode === 'doc' && (
              <div className="space-y-3">
                {/* File upload */}
                {uploadedFile ? (
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-cyan-400/30 bg-cyan-500/8">
                    {uploadedFile.kind === 'pdf' ? <FileUp size={18} className="text-cyan-400 shrink-0" /> : <ImageIcon size={18} className="text-cyan-400 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text)] truncate">{uploadedFile.name}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{uploadedFile.kind === 'pdf' ? 'PDF — AI sẽ đọc và tạo bài học' : 'Ảnh — AI sẽ phân tích nội dung'}</p>
                    </div>
                    <button onClick={() => setUploadedFile(null)} className="p-1 rounded-lg hover:bg-red-500/10 text-red-400 shrink-0">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="border-2 border-dashed border-[var(--border)] rounded-xl p-6 text-center cursor-pointer hover:border-cyan-400/60 transition-colors group"
                  >
                    <div className="flex justify-center gap-3 mb-2">
                      <FileUp size={20} className="text-[var(--text-secondary)] group-hover:text-cyan-400 transition-colors" />
                      <ImageIcon size={20} className="text-[var(--text-secondary)] group-hover:text-cyan-400 transition-colors" />
                    </div>
                    <p className="text-sm font-medium text-[var(--text)]">Kéo thả hoặc bấm để upload</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">PDF · PNG · JPG · WEBP · TXT — tối đa 10MB</p>
                    <input ref={fileRef} type="file" accept=".txt,.pdf,.png,.jpg,.jpeg,.webp" className="hidden" onChange={handleFileChange} />
                  </div>
                )}

                {/* Text paste area */}
                {!uploadedFile && (
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-1">
                      Hoặc paste nội dung tài liệu {docText ? `(${docText.length.toLocaleString()} ký tự)` : ''}
                    </label>
                    <textarea
                      value={docText}
                      onChange={e => setDocText(e.target.value)}
                      rows={8}
                      placeholder="Paste nội dung tài liệu vào đây... AI sẽ phân tích và tạo bài học từ vựng/ngữ pháp/luyện nói từ nội dung này."
                      className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-sm text-[var(--text)] focus:outline-none focus:border-cyan-400 resize-none"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Generate button (AI modes) */}
            {mode !== 'manual' && (
              <button
                onClick={handleGenerate}
                disabled={generating || !canGenerate}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50"
              >
                {generating ? (
                  <><Loader2 size={18} className="animate-spin" /> AI đang tạo {count} câu hỏi...</>
                ) : (
                  <><Sparkles size={18} /> {cards.length > 0 ? `Tạo lại (${count} câu)` : `Tạo bài học với AI (${count} câu)`}</>
                )}
              </button>
            )}
          </div>

          {/* Cards section */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-[var(--text)]">
                  Cards {cards.length > 0 ? `(${cards.length})` : ''}
                </h2>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  {mode === 'manual' ? 'Thêm cards thủ công bên dưới' :
                   cards.length > 0 ? 'Xem lại, chỉnh sửa trước khi lưu' :
                   'Cards sẽ xuất hiện sau khi AI tạo xong'}
                </p>
              </div>
              <button onClick={addCard}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-400/20 text-sm font-medium hover:bg-cyan-500/20 transition-all">
                <Plus size={14} /> Thêm card
              </button>
            </div>

            {cards.length === 0 ? (
              <div className="text-center py-12 text-[var(--text-secondary)]">
                <AlertCircle size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">
                  {mode === 'manual' ? 'Bấm "+ Thêm card" để bắt đầu' : 'Chưa có cards — bấm "Tạo bài học với AI" ở trên'}
                </p>
              </div>
            ) : showPreview ? (
              <div className="space-y-2">
                {cards.map((card, i) => (
                  <CardPreview
                    key={i} card={card} index={i} total={cards.length}
                    onEdit={c => updateCard(i, c)}
                    onDelete={() => deleteCard(i)}
                    onMoveUp={() => moveCard(i, i - 1)}
                    onMoveDown={() => moveCard(i, i + 1)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[var(--text-secondary)] text-sm">
                {cards.length} cards đã tạo. Bấm &quot;Xem cards&quot; để xem/chỉnh sửa.
              </div>
            )}
          </div>

          {/* Bottom save */}
          {cards.length > 0 && (
            <div className="flex items-center gap-3 pb-6">
              <div className="flex-1 text-xs text-[var(--text-secondary)]">
                <CheckCircle size={12} className="inline text-emerald-400 mr-1" />
                {cards.length} cards sẵn sàng
              </div>
              <button onClick={() => handleSave(false)} disabled={saving}
                className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-all disabled:opacity-50">
                Lưu nháp
              </button>
              <button onClick={() => handleSave(true)} disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 text-white font-bold hover:opacity-90 transition-all disabled:opacity-50">
                <CheckCircle size={16} />
                {saving ? 'Đang lưu...' : 'Lưu & Đăng bài học'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function NewLessonPage() {
  return (
    <Suspense>
      <NewLessonPageInner />
    </Suspense>
  )
}
