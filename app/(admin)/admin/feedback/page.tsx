import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'
import { MessageCircle, CheckCircle2, Clock } from 'lucide-react'
import { FeedbackClient } from './feedback-client'

export const metadata = { title: 'Chat Feedback — Admin' }
export const dynamic = 'force-dynamic'

export default async function FeedbackPage() {
  try {
    await requireAdmin()
  } catch {
    redirect('/login')
  }

  const [sessions, sourceStats, openCount, resolvedCount] = await Promise.all([
    prisma.chatWidgetSession.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true, userId: true, userName: true, userEmail: true,
        source: true, messages: true, adminReply: true, repliedAt: true,
        status: true, createdAt: true,
      },
    }),
    prisma.chatWidgetSession.groupBy({
      by: ['source'],
      _count: true,
      orderBy: { _count: { source: 'desc' } },
    }),
    prisma.chatWidgetSession.count({ where: { status: 'OPEN' } }),
    prisma.chatWidgetSession.count({ where: { status: 'RESOLVED' } }),
  ])

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text)] flex items-center gap-2">
          <MessageCircle size={24} className="text-cyan-400" />
          Chat Widget Feedback
        </h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">Tin nhắn và phản hồi từ users qua chat widget</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
          <div className="text-2xl font-bold text-[var(--text)]">{openCount + resolvedCount}</div>
          <div className="text-sm text-[var(--text-secondary)]">Tổng sessions</div>
        </div>
        <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4">
          <div className="text-2xl font-bold text-orange-400 flex items-center gap-1">
            <Clock size={18} /> {openCount}
          </div>
          <div className="text-sm text-[var(--text-secondary)]">Chờ xử lý</div>
        </div>
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="text-2xl font-bold text-emerald-400 flex items-center gap-1">
            <CheckCircle2 size={18} /> {resolvedCount}
          </div>
          <div className="text-sm text-[var(--text-secondary)]">Đã xử lý</div>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
          <div className="text-sm font-semibold text-[var(--text)] mb-2">Nguồn truy cập</div>
          <div className="space-y-0.5">
            {sourceStats.slice(0, 3).map(s => (
              <div key={s.source ?? 'unknown'} className="flex justify-between text-xs">
                <span className="text-[var(--text-secondary)] truncate">{s.source ?? 'Chưa chọn'}</span>
                <span className="font-semibold text-[var(--text)]">{s._count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Source breakdown */}
      {sourceStats.length > 0 && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 mb-6">
          <h2 className="text-sm font-semibold text-[var(--text)] mb-3">Phân bổ nguồn truy cập</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {sourceStats.map(s => {
              const total = openCount + resolvedCount
              const pct = total > 0 ? Math.round((s._count / total) * 100) : 0
              return (
                <div key={s.source ?? 'unknown'} className="text-center p-3 rounded-xl bg-[var(--bg-secondary)]">
                  <div className="text-lg font-bold text-cyan-400">{s._count}</div>
                  <div className="text-xs text-[var(--text-secondary)]">{s.source ?? 'Chưa chọn'}</div>
                  <div className="mt-1 h-1 rounded-full bg-[var(--border)]">
                    <div className="h-1 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] mt-0.5">{pct}%</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Sessions list */}
      <FeedbackClient sessions={sessions as any} />
    </div>
  )
}
