import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import Link from 'next/link'
import { AdminNav } from './admin-nav'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean)

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] flex">
      {/* ── Sidebar ── */}
      <aside className="w-56 shrink-0 border-r border-[var(--border)] bg-[var(--bg-card)] flex flex-col">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">A</span>
            </div>
            <div>
              <div className="text-sm font-bold text-[var(--text)]">Admin Panel</div>
              <div className="text-[10px] text-[var(--text-secondary)]">DingDongSpeak</div>
            </div>
          </div>
        </div>

        {/* Nav — client component for active highlighting */}
        <AdminNav />

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border)]">
          <div className="text-xs text-[var(--text-secondary)] truncate">{session.user.email}</div>
          <Link href="/" className="mt-1.5 flex items-center gap-1 text-xs text-cyan-400 hover:underline">
            ← Về App
          </Link>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
