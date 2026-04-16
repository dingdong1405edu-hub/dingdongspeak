import { prisma } from '@/lib/prisma'
import { STAGES, getAllLessons } from '@/lib/lessons-data'
import Link from 'next/link'
import { BookOpen, Users, CheckCircle, Edit3 } from 'lucide-react'

export const metadata = { title: 'Admin Dashboard — DingDongSpeak' }

export default async function AdminPage() {
  const [totalUsers, totalSessions, lessonOverrides] = await Promise.all([
    prisma.user.count(),
    prisma.practiceSession.count(),
    prisma.lessonContent.count(),
  ])

  const allLessons = getAllLessons()

  const stats = [
    { label: 'Tổng người dùng', value: totalUsers, icon: Users, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { label: 'Tổng phiên luyện tập', value: totalSessions, icon: BookOpen, color: 'text-violet-400', bg: 'bg-violet-500/10' },
    { label: 'Bài học đã tuỳ chỉnh', value: lessonOverrides, icon: Edit3, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { label: 'Tổng số bài học', value: allLessons.length, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text)]">Dashboard</h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">Tổng quan hệ thống DingDongSpeak</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map(s => (
          <div key={s.label} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
              <s.icon size={20} className={s.color} />
            </div>
            <div className="text-2xl font-bold text-[var(--text)]">{s.value}</div>
            <div className="text-sm text-[var(--text-secondary)] mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Stages overview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--text)]">Lộ trình bài học</h2>
          <Link href="/admin/lessons" className="text-sm text-cyan-400 hover:underline">
            Quản lý tất cả →
          </Link>
        </div>
        <div className="space-y-3">
          {STAGES.map((stage, i) => (
            <div key={stage.id} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{stage.icon}</span>
                <div>
                  <div className="font-semibold text-[var(--text)]">{stage.title}: {stage.subtitle}</div>
                  <div className="text-xs text-[var(--text-secondary)]">{stage.lessons.length} bài học</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {stage.lessons.map(lesson => (
                  <Link
                    key={lesson.id}
                    href={`/admin/lessons/${lesson.id}`}
                    className="flex items-center gap-2 p-2.5 rounded-xl border border-[var(--border)] hover:border-cyan-400/40 hover:bg-[var(--bg-secondary)] transition-all"
                  >
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs shrink-0 bg-gradient-to-br ${stage.color}`}>
                      {lesson.type === 'vocabulary' ? 'V' : lesson.type === 'grammar' ? 'G' : 'S'}
                    </div>
                    <span className="text-xs text-[var(--text)] truncate">{lesson.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
