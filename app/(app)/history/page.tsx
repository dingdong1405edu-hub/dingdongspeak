import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Clock, Mic, BookOpen, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'

export const metadata = { title: 'Lịch sử luyện tập — DingDongSpeak' }

function bandColor(b: number) {
  if (b >= 7) return 'text-emerald-400'
  if (b >= 6) return 'text-cyan-400'
  if (b >= 5) return 'text-yellow-400'
  return 'text-orange-400'
}

const TYPE_LABELS: Record<string, string> = {
  PRACTICE: 'Luyện IELTS',
  MOCK_TEST: 'Thi thử',
  BEGINNER: 'Beginner',
}

const PART_LABELS: Record<string, string> = {
  PART1: 'Part 1', PART2: 'Part 2', PART3: 'Part 3', FULL: 'Full Test',
}

export default async function HistoryPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const sessions = await prisma.practiceSession.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text)]">Lịch sử luyện tập</h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">{sessions.length} buổi gần nhất</p>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-16 text-[var(--text-secondary)]">
          <Mic size={40} className="mx-auto mb-3 opacity-30" />
          <p>Chưa có buổi luyện tập nào.</p>
          <Link href="/practice" className="text-cyan-400 text-sm mt-2 inline-block">Bắt đầu luyện tập →</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => {
            const scores = s.scores as Array<{ overall: number }>
            const avg = scores.length > 0
              ? (scores.reduce((acc, sc) => acc + (sc.overall ?? 0), 0) / scores.length).toFixed(1)
              : null
            const minutes = Math.round((s.duration ?? 0) / 60)

            return (
              <div key={s.id} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-medium">
                        {TYPE_LABELS[s.type] ?? s.type}
                      </span>
                      {s.part && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 font-medium">
                          {PART_LABELS[s.part] ?? s.part}
                        </span>
                      )}
                    </div>
                    <div className="font-medium text-[var(--text)] truncate">{s.topic}</div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-[var(--text-secondary)]">
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {minutes > 0 ? `${minutes} phút` : '< 1 phút'}
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen size={11} />
                        {scores.length} câu
                      </span>
                      <span>{new Date(s.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>

                  {avg && (
                    <div className="text-right shrink-0">
                      <div className={cn('text-2xl font-bold', bandColor(parseFloat(avg)))}>{avg}</div>
                      <div className="text-xs text-[var(--text-secondary)]">Band TB</div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
