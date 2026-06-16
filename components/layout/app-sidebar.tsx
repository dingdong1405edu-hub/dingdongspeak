'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, BookOpen, Mic, GraduationCap,
  BookMarked, Crown, User, Trophy, History
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLang } from '@/components/shared/lang-provider'
import { LANG_LIST } from '@/lib/languages'

const bottomItems = [
  { href: '/premium', icon: Crown, label: 'Premium', className: 'text-yellow-400' },
  { href: '/profile', icon: User, label: 'Hồ sơ' },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { lang, config, setLang } = useLang()

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/learn', icon: BookOpen, label: 'Lộ trình cơ bản' },
    { href: '/practice', icon: Mic, label: `Luyện ${config.exam}` },
    { href: '/mock-test', icon: GraduationCap, label: 'Thi thử' },
    { href: '/review', icon: BookMarked, label: 'Ôn tập' },
    { href: '/leaderboard', icon: Trophy, label: 'Bảng vàng' },
    { href: '/history', icon: History, label: 'Lịch sử' },
  ]

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-16 bottom-0 w-60 border-r border-[var(--border)] bg-[var(--bg)] z-40">
      {/* Learning-language picker — always visible */}
      <div className="p-3 border-b border-[var(--border)]">
        <p className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-2 px-1">
          🌐 Ngôn ngữ đang học
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {LANG_LIST.map(l => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              title={`${l.viName} · ${l.exam}`}
              className={cn(
                'flex items-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium border transition-all',
                l.code === lang
                  ? 'bg-cyan-400/15 text-cyan-400 border-cyan-400/40'
                  : 'border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--bg-secondary)]'
              )}
            >
              <span className="text-base leading-none">{l.flag}</span>
              <span className="truncate">{l.nativeName}</span>
            </button>
          ))}
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                active
                  ? 'bg-cyan-400/15 text-cyan-400 border border-cyan-400/20'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--bg-secondary)]'
              )}
            >
              <Icon size={18} />
              {item.label}
              {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400" />}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-[var(--border)] space-y-1">
        {bottomItems.map(item => {
          const Icon = item.icon
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                item.className,
                active
                  ? 'bg-[var(--bg-secondary)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--bg-secondary)]',
                item.className && !active && item.className
              )}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          )
        })}
      </div>
    </aside>
  )
}
