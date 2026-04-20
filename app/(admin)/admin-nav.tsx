'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, LayoutDashboard, Plus, Users, Layers, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const BASE_NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true, exclude: undefined },
  { href: '/admin/stages', label: 'Stages', icon: Layers, exact: false, exclude: undefined },
  { href: '/admin/lessons', label: 'Bài học', icon: BookOpen, exact: false, exclude: '/admin/lessons/new' },
  { href: '/admin/lessons/new', label: 'Tạo bài học', icon: Plus, exact: false, exclude: undefined },
  { href: '/admin/feedback', label: 'Chat Feedback', icon: MessageCircle, exact: false, exclude: undefined },
]

const OWNER_NAV = [
  { href: '/admin/staff', label: 'Nhân viên', icon: Users, exact: false, exclude: undefined },
]

export function AdminNav({ role }: { role: string }) {
  const pathname = usePathname()

  const items = role === 'OWNER' || role === 'ADMIN'
    ? [...BASE_NAV, ...OWNER_NAV]
    : BASE_NAV

  return (
    <nav className="flex-1 p-3 space-y-0.5">
      {items.map(({ href, label, icon: Icon, exact, exclude }) => {
        const active = exclude
          ? pathname.startsWith(href) && !pathname.startsWith(exclude)
          : exact ? pathname === href : pathname.startsWith(href)

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
              active
                ? 'bg-cyan-500/15 text-cyan-400'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text)]'
            )}
          >
            <Icon size={16} />
            {label}
            {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400" />}
          </Link>
        )
      })}
    </nav>
  )
}
