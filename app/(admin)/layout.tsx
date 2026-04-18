import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { AdminNav } from './admin-nav'
import Link from 'next/link'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean)

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.email) redirect('/')

  const isOwner = ADMIN_EMAILS.includes(session.user.email)
  let dbRole = 'USER'

  if (!isOwner) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    })
    dbRole = user?.role ?? 'USER'
    if (dbRole !== 'STAFF' && dbRole !== 'ADMIN') redirect('/')
  }

  const role = isOwner ? 'OWNER' : dbRole

  return (
    <div className="min-h-screen bg-[var(--bg)] flex">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r border-[var(--border)] bg-[var(--bg-card)] flex flex-col">
        {/* Logo */}
        <div className="px-5 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center shrink-0">
              <span className="text-white text-sm font-bold">A</span>
            </div>
            <div>
              <div className="text-sm font-bold text-[var(--text)]">Admin Panel</div>
              <div className="text-[10px] text-[var(--text-secondary)]">DingDongSpeak</div>
            </div>
          </div>
        </div>

        <AdminNav role={role} />

        {/* User info */}
        <div className="p-4 border-t border-[var(--border)] space-y-2">
          <div className="flex items-center gap-2">
            <div className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
              role === 'OWNER' ? 'bg-yellow-500/15 text-yellow-400' :
              role === 'ADMIN' ? 'bg-violet-500/15 text-violet-400' :
              'bg-cyan-500/15 text-cyan-400'
            }`}>
              {role === 'OWNER' ? '👑 OWNER' : role === 'ADMIN' ? '⚡ ADMIN' : '✏️ STAFF'}
            </div>
          </div>
          <div className="text-xs text-[var(--text-secondary)] truncate">{session.user.email}</div>
          <Link href="/" className="flex items-center gap-1 text-xs text-cyan-400 hover:underline">
            ← Về App
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
