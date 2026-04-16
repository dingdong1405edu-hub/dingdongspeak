'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, LayoutDashboard } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/lessons', label: 'Bài học', icon: BookOpen, exact: false },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="flex-1 p-3 space-y-1">
      {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
              active
                ? 'bg-cyan-500/15 text-cyan-400 font-semibold'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text)]'
            )}
          >
            <Icon size={16} className={active ? 'text-cyan-400' : ''} />
            {label}
            {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400" />}
          </Link>
        )
      })}
    </nav>
  )
}
