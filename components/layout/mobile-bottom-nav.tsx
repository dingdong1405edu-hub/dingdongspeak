'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, BookOpen, Mic, GraduationCap, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'

const items = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { href: '/learn', icon: BookOpen, label: 'Learn' },
  { href: '/practice', icon: Mic, label: 'Practice' },
  { href: '/mock-test', icon: GraduationCap, label: 'Test' },
  { href: '/leaderboard', icon: Trophy, label: 'Bảng vàng' },
]

export function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--bg)]/95 backdrop-blur-xl border-t border-[var(--border)] safe-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {items.map(item => {
          const Icon = item.icon
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-0',
                active ? 'text-cyan-400' : 'text-[var(--text-secondary)]'
              )}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{item.label}</span>
              {active && <div className="w-1 h-1 rounded-full bg-cyan-400" />}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
