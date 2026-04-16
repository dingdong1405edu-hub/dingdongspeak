import { prisma } from '@/lib/prisma'
import { STAGES, getAllLessons } from '@/lib/lessons-data'
import Link from 'next/link'
import { BookOpen, Settings, Mic, Edit3, CheckCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

export const metadata = { title: 'Quản lý bài học — Admin' }

const TYPE_LABELS = { vocabulary: 'Từ vựng', grammar: 'Ngữ pháp', speaking: 'Luyện nói' }
const TYPE_ICONS = { vocabulary: BookOpen, grammar: Settings, speaking: Mic }
const TYPE_COLORS = {
  vocabulary: 'text-emerald-400 bg-emerald-500/10',
  grammar: 'text-blue-400 bg-blue-500/10',
  speaking: 'text-violet-400 bg-violet-500/10',
}
const LEVEL_COLORS = {
  A1: 'text-emerald-400 bg-emerald-500/10',
  A2: 'text-cyan-400 bg-cyan-500/10',
  B1: 'text-yellow-400 bg-yellow-500/10',
  B2: 'text-orange-400 bg-orange-500/10',
}

export default async function AdminLessonsPage() {
  const allLessons = getAllLessons()
  const overrides = await prisma.lessonContent.findMany()
  const overrideMap = new Map(overrides.map(o => [o.lessonId, o]))

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text)]">Quản lý bài học</h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">
          Nhấn vào bài học để chỉnh sửa nội dung. Thay đổi được lưu vào DB và hiển thị ngay cho học viên.
        </p>
      </div>

      <div className="space-y-6">
        {STAGES.map((stage) => (
          <div key={stage.id} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
            {/* Stage header */}
            <div className={`p-4 bg-gradient-to-r ${stage.color} text-white`}>
              <div className="flex items-center gap-2">
                <span className="text-xl">{stage.icon}</span>
                <div>
                  <div className="font-bold">{stage.title}: {stage.subtitle}</div>
                  <div className="text-xs opacity-70">{stage.lessons.length} bài học</div>
                </div>
              </div>
            </div>

            {/* Lessons table */}
            <div className="divide-y divide-[var(--border)]">
              {stage.lessons.map((lesson) => {
                const override = overrideMap.get(lesson.id)
                const Icon = TYPE_ICONS[lesson.type]

                return (
                  <Link
                    key={lesson.id}
                    href={`/admin/lessons/${lesson.id}`}
                    className="flex items-center gap-4 p-4 hover:bg-[var(--bg-secondary)] transition-all group"
                  >
                    {/* Type badge */}
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', TYPE_COLORS[lesson.type])}>
                      <Icon size={18} />
                    </div>

                    {/* Lesson info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-[var(--text)] truncate">{lesson.title}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={cn('text-xs px-1.5 py-0.5 rounded-md font-medium', TYPE_COLORS[lesson.type])}>
                          {TYPE_LABELS[lesson.type]}
                        </span>
                        <span className={cn('text-xs px-1.5 py-0.5 rounded-md font-medium', LEVEL_COLORS[lesson.level])}>
                          {lesson.level}
                        </span>
                        <span className="text-xs text-[var(--text-secondary)]">{lesson.cards.length} cards</span>
                        <span className="text-xs text-cyan-400">+{lesson.xp} XP</span>
                      </div>
                    </div>

                    {/* Override status */}
                    <div className="shrink-0 text-right">
                      {override ? (
                        <div className="flex items-center gap-1.5">
                          <CheckCircle size={14} className="text-emerald-400" />
                          <div>
                            <div className="text-xs text-emerald-400 font-medium">Đã tuỳ chỉnh</div>
                            <div className="text-[10px] text-[var(--text-secondary)]">
                              {new Date(override.updatedAt).toLocaleDateString('vi-VN')}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <Clock size={14} className="text-[var(--text-secondary)]" />
                          <span className="text-xs text-[var(--text-secondary)]">Mặc định</span>
                        </div>
                      )}
                    </div>

                    {/* Edit icon */}
                    <Edit3 size={16} className="text-[var(--text-secondary)] group-hover:text-cyan-400 transition-colors shrink-0" />
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
