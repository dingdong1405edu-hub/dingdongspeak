import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Mic } from 'lucide-react'
import { SessionCard } from './_components/session-card'

export const metadata = { title: 'Lịch sử luyện tập — DingDongSpeak' }

export default async function HistoryPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const sessions = await prisma.practiceSession.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
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
          {sessions.map(s => (
            <SessionCard key={s.id} session={s as any} />
          ))}
        </div>
      )}
    </div>
  )
}
