import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { BookOpen, Settings, Mic, Edit3, Globe, Lock, Plus, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export const metadata = { title: 'Quản lý bài học — Admin' }

const TYPE_ICONS = { vocabulary: BookOpen, grammar: Settings, speaking: Mic }
const TYPE_LABELS = { vocabulary: 'Từ vựng', grammar: 'Ngữ pháp', speaking: 'Luyện nói' }
const TYPE_COLORS = {
  vocabulary: 'text-emerald-400 bg-emerald-500/10',
  grammar: 'text-blue-400 bg-blue-500/10',
  speaking: 'text-violet-400 bg-violet-500/10',
}
const LEVEL_COLORS: Record<string, string> = {
  A1: 'text-emerald-400 bg-emerald-500/10',
  A2: 'text-cyan-400 bg-cyan-500/10',
  B1: 'text-yellow-400 bg-yellow-500/10',
  B2: 'text-orange-400 bg-orange-500/10',
}

export default async function AdminLessonsPage() {
  const [stages, customLessons] = await Promise.all([
    prisma.stage.findMany({ orderBy: { order: 'asc' } }).catch(() => []),
    prisma.customLesson.findMany({
      orderBy: [{ stageId: 'asc' }, { order: 'asc' }],
      include: { createdBy: { select: { name: true, email: true } } },
    }),
  ])

  const customByStage = new Map<string, typeof customLessons>()
  for (const cl of customLessons) {
    const arr = customByStage.get(cl.stageId) ?? []
    arr.push(cl)
    customByStage.set(cl.stageId, arr)
  }

  const stageIds = new Set(stages.map(s => s.id))
  const orphaned = customLessons.filter(cl => !stageIds.has(cl.stageId))

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Quản lý bài học</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            {stages.length} chặng · {customLessons.length} bài học
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/stages"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm font-semibold text-[var(--text)] hover:bg-[var(--bg-secondary)] transition-all"
          >
            Quản lý Stages
          </Link>
          <Link
            href="/admin/lessons/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus size={16} />
            Tạo bài học mới
          </Link>
        </div>
      </div>

      {stages.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[var(--border)] p-12 text-center">
          <p className="text-[var(--text-secondary)] mb-4">Chưa có chặng học nào.</p>
          <Link href="/admin/stages" className="px-4 py-2 rounded-xl bg-cyan-500/15 text-cyan-400 text-sm font-semibold hover:bg-cyan-500/25 transition-colors">
            Tạo Stage đầu tiên →
          </Link>
        </div>
      )}

      <div className="space-y-6">
        {stages.map((stage) => {
          const stageCustom = customByStage.get(stage.id) ?? []

          return (
            <div key={stage.id} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
              <div className={`p-4 bg-gradient-to-r ${stage.color} text-white`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{stage.icon}</span>
                    <div>
                      <div className="font-bold">{stage.title}: {stage.subtitle}</div>
                      <div className="text-xs opacity-70">{stageCustom.length} bài học</div>
                    </div>
                  </div>
                  <Link
                    href={`/admin/lessons/new?stageId=${stage.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-semibold transition-all"
                  >
                    <Plus size={12} /> Thêm bài
                  </Link>
                </div>
              </div>

              <div className="divide-y divide-[var(--border)]">
                {stageCustom.length === 0 && (
                  <div className="p-6 text-center text-sm text-[var(--text-secondary)]">
                    Chưa có bài học — <Link href={`/admin/lessons/new?stageId=${stage.id}`} className="text-cyan-400 hover:underline">Tạo bài đầu tiên</Link>
                  </div>
                )}
                {stageCustom.map((cl) => {
                  const Icon = TYPE_ICONS[cl.type as keyof typeof TYPE_ICONS] ?? BookOpen
                  return (
                    <Link
                      key={cl.id}
                      href={`/admin/custom-lessons/${cl.id}`}
                      className="flex items-center gap-4 p-4 hover:bg-[var(--bg-secondary)] transition-all group"
                    >
                      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', TYPE_COLORS[cl.type as keyof typeof TYPE_COLORS] ?? 'text-gray-400 bg-gray-500/10')}>
                        <Icon size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-[var(--text)] truncate">{cl.title}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={cn('text-xs px-1.5 py-0.5 rounded-md font-medium', TYPE_COLORS[cl.type as keyof typeof TYPE_COLORS] ?? '')}>
                            {TYPE_LABELS[cl.type as keyof typeof TYPE_LABELS] ?? cl.type}
                          </span>
                          <span className={cn('text-xs px-1.5 py-0.5 rounded-md font-medium', LEVEL_COLORS[cl.level] ?? '')}>
                            {cl.level}
                          </span>
                          <span className="text-xs text-[var(--text-secondary)]">{Array.isArray(cl.cards) ? cl.cards.length : 0} cards</span>
                          <span className="text-xs text-cyan-400">+{cl.xp} XP</span>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {cl.published ? (
                          <div className="flex items-center gap-1.5">
                            <Globe size={14} className="text-emerald-400" />
                            <span className="text-xs text-emerald-400 font-medium">Đã đăng</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <Lock size={14} className="text-yellow-400" />
                            <span className="text-xs text-yellow-400 font-medium">Nháp</span>
                          </div>
                        )}
                      </div>
                      <Edit3 size={16} className="text-[var(--text-secondary)] group-hover:text-cyan-400 transition-colors shrink-0" />
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}

        {orphaned.length > 0 && (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
            <div className="p-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-yellow-400" />
                <span className="font-semibold text-[var(--text)]">Bài học chưa phân chặng ({orphaned.length})</span>
              </div>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {orphaned.map(cl => (
                <Link key={cl.id} href={`/admin/custom-lessons/${cl.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-[var(--bg-secondary)] transition-all">
                  <div className="font-medium text-[var(--text)] truncate">{cl.title}</div>
                  <span className="text-xs text-[var(--text-secondary)] ml-auto">Stage: {cl.stageId}</span>
                  <Edit3 size={15} className="text-[var(--text-secondary)] shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
