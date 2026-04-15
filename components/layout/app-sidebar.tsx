'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, BookOpen, Mic, GraduationCap,
  BookMarked, Crown, User, Settings, Gift
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/learn', icon: BookOpen, label: 'Beginner Path' },
  { href: '/practice', icon: Mic, label: 'Luyện IELTS' },
  { href: '/mock-test', icon: GraduationCap, label: 'Thi thử' },
  { href: '/review', icon: BookMarked, label: 'Ôn tập' },
]

const bottomItems = [
  { href: '/premium', icon: Crown, label: 'Premium', className: 'text-yellow-400' },
  { href: '/profile', icon: User, label: 'Hồ sơ' },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-16 bottom-0 w-60 border-r border-[var(--border)] bg-[var(--bg)] z-40">
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
