import { prisma } from '@/lib/prisma'
import { getAllLessons, STAGES } from '@/lib/lessons-data'
import Link from 'next/link'
import { BookOpen, Users, CheckCircle, Edit3, Plus, Sparkles, FileText, BarChart3 } from 'lucide-react'

export const metadata = { title: 'Admin Dashboard — DingDongSpeak' }

export default async function AdminPage() {
  const [totalUsers, totalSessions, lessonOverrides, premiumUsers, customLessons] = await Promise.all([
    prisma.user.count(),
    prisma.practiceSession.count(),
    prisma.lessonContent.count(),
    prisma.user.count({ where: { isPremium: true, premiumUntil: { gt: new Date() } } }),
    prisma.customLesson.count(),
  ])

  const allLessons = getAllLessons()

  const stats = [
    { label: 'Người dùng', value: totalUsers, icon: Users, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
    { label: 'Phiên luyện tập', value: totalSessions, icon: BarChart3, color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
    { label: 'Premium đang dùng', value: premiumUsers, icon: Sparkles, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
    { label: 'Bài học đã tạo', value: allLessons.length + customLessons, icon: BookOpen, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  ]

  const quickActions = [
    { href: '/admin/lessons/new?mode=ai', label: 'Tạo bài từ chủ đề', desc: 'AI tự động tạo cards', icon: Sparkles, color: 'from-cyan-500 to-violet-600' },
    { href: '/admin/lessons/new?mode=doc', label: 'Upload tài liệu', desc: 'AI phân tích → game', icon: FileText, color: 'from-emerald-500 to-cyan-500' },
    { href: '/admin/lessons/new?mode=manual', label: 'Thêm thủ công', desc: 'Điền cards tay', icon: Edit3, color: 'from-violet-500 to-pink-500' },
  ]

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Dashboard</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">Tổng quan hệ thống DingDongSpeak</p>
        </div>
        <Link
          href="/admin/lessons/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          Tạo bài học mới
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className={`rounded-2xl border ${s.border} bg-[var(--bg-card)] p-5`}>
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
              <s.icon size={20} className={s.color} />
            </div>
            <div className="text-2xl font-bold text-[var(--text)]">{s.value}</div>
            <div className="text-sm text-[var(--text-secondary)] mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mb-8">
        <h2 className="text-base font-semibold text-[var(--text)] mb-3">Tạo bài học nhanh</h2>
        <div className="grid grid-cols-3 gap-3">
          {quickActions.map(a => (
            <Link
              key={a.href}
              href={a.href}
              className="group rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 hover:border-cyan-400/40 hover:bg-[var(--bg-secondary)] transition-all"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${a.color} flex items-center justify-center mb-3`}>
                <a.icon size={18} className="text-white" />
              </div>
              <div className="font-semibold text-[var(--text)] text-sm mb-0.5">{a.label}</div>
              <div className="text-xs text-[var(--text-secondary)]">{a.desc}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Stages overview */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-[var(--text)]">Lộ trình bài học</h2>
          <Link href="/admin/lessons" className="text-sm text-cyan-400 hover:underline">
            Xem tất cả →
          </Link>
        </div>
        <div className="space-y-3">
          {STAGES.map((stage) => (
            <div key={stage.id} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
              <div className={`px-4 py-3 bg-gradient-to-r ${stage.color}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{stage.icon}</span>
                    <span className="font-semibold text-white text-sm">{stage.title}: {stage.subtitle}</span>
                  </div>
                  <span className="text-white/70 text-xs">{stage.lessons.length} bài</span>
                </div>
              </div>
              <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {stage.lessons.slice(0, 6).map(lesson => (
                  <Link
                    key={lesson.id}
                    href={`/admin/lessons/${lesson.id}`}
                    className="flex items-center gap-2 p-2.5 rounded-xl border border-[var(--border)] hover:border-cyan-400/40 hover:bg-[var(--bg-secondary)] transition-all text-xs"
                  >
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center text-white text-[10px] font-bold shrink-0 bg-gradient-to-br ${stage.color}`}>
                      {lesson.type === 'vocabulary' ? 'V' : lesson.type === 'grammar' ? 'G' : 'S'}
                    </div>
                    <span className="text-[var(--text)] truncate">{lesson.title}</span>
                  </Link>
                ))}
                {stage.lessons.length > 6 && (
                  <Link href="/admin/lessons" className="flex items-center justify-center p-2.5 rounded-xl border border-dashed border-[var(--border)] text-xs text-[var(--text-secondary)] hover:border-cyan-400/40 transition-colors">
                    +{stage.lessons.length - 6} bài nữa
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
