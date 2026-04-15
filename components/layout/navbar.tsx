'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession, signOut } from 'next-auth/react'
import {
  BookOpen, Mic, GraduationCap, LayoutDashboard,
  BookMarked, Crown, User, LogOut, Menu, X, Bell
} from 'lucide-react'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { cn } from '@/lib/utils'

const marketingLinks = [
  { href: '/#features', label: 'Tính năng' },
  { href: '/#how-it-works', label: 'Cách hoạt động' },
  { href: '/pricing', label: 'Bảng giá' },
  { href: '/about', label: 'Về chúng tôi' },
]

const appLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/learn', label: 'Beginner', icon: BookOpen },
  { href: '/practice', label: 'Luyện tập', icon: Mic },
  { href: '/mock-test', label: 'Thi thử', icon: GraduationCap },
  { href: '/review', label: 'Ôn tập', icon: BookMarked },
]

export function Navbar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const isApp = session?.user && !['/', '/pricing', '/login', '/register'].includes(pathname)
  const isMarketing = !session?.user || ['/', '/pricing'].includes(pathname)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => setMobileOpen(false), [pathname])

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled || isApp
          ? 'bg-[var(--bg)]/90 backdrop-blur-xl border-b border-[var(--border)] shadow-sm'
          : 'bg-transparent'
      )}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href={session?.user ? '/dashboard' : '/'} className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">D</span>
          </div>
          <span className={cn(
            'font-bold text-lg hidden sm:block',
            !isApp && !scrolled ? 'text-white' : 'text-[var(--text)]'
          )}>
            DingDong<span className="gradient-text">Speak</span>
          </span>
        </Link>

        {/* Desktop nav - marketing */}
        {isMarketing && (
          <div className="hidden md:flex items-center gap-6">
            {marketingLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-sm transition-colors',
                  !scrolled ? 'text-white/80 hover:text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}

        {/* Desktop nav - app */}
        {isApp && (
          <div className="hidden md:flex items-center gap-1">
            {appLinks.map(link => {
              const Icon = link.icon
              const active = pathname.startsWith(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all',
                    active
                      ? 'bg-cyan-400/15 text-cyan-400 font-medium'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--bg-secondary)]'
                  )}
                >
                  <Icon size={16} />
                  {link.label}
                </Link>
              )
            })}
          </div>
        )}

        {/* Right side */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {session?.user ? (
            <div className="hidden md:flex items-center gap-2">
              <Link
                href="/premium"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 text-yellow-400 text-xs font-medium hover:from-yellow-500/30 transition-all"
              >
                <Crown size={12} />
                Premium
              </Link>
              <Link href="/profile" className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] transition-all">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-violet-600 flex items-center justify-center text-white text-sm font-bold">
                  {session.user.name?.[0]?.toUpperCase() || session.user.email?.[0]?.toUpperCase() || 'U'}
                </div>
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="p-2 text-[var(--text-secondary)] hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                title="Đăng xuất"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link
                href="/login"
                className={cn('px-4 py-1.5 text-sm font-medium rounded-lg transition-all',
                  !scrolled ? 'text-white/80 hover:text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
                )}
              >
                Đăng nhập
              </Link>
              <Link
                href="/register"
                className="px-4 py-1.5 text-sm font-medium rounded-lg bg-gradient-to-r from-cyan-500 to-violet-600 text-white hover:opacity-90 transition-opacity"
              >
                Bắt đầu miễn phí
              </Link>
            </div>
          )}

          {/* Hamburger */}
          <button
            onClick={() => setMobileOpen(v => !v)}
            className={cn(
              'md:hidden p-2 rounded-lg transition-all',
              !scrolled && !isApp ? 'text-white hover:bg-white/10' : 'text-[var(--text)] hover:bg-[var(--bg-secondary)]'
            )}
            aria-label="Menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="md:hidden bg-[var(--bg)]/95 backdrop-blur-xl border-b border-[var(--border)] overflow-hidden"
          >
            <div className="px-4 py-4 space-y-1">
              {(isApp ? appLinks : marketingLinks.map(l => ({ ...l, icon: BookOpen }))).map((link) => {
                const Icon = 'icon' in link ? link.icon : BookOpen
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--text)] hover:bg-[var(--bg-secondary)] transition-all font-medium"
                  >
                    {isApp && <Icon size={18} className="text-cyan-400" />}
                    {link.label}
                  </Link>
                )
              })}
              <div className="pt-2 border-t border-[var(--border)]">
                {session?.user ? (
                  <div className="space-y-1">
                    <Link href="/premium" className="flex items-center gap-3 px-4 py-3 rounded-xl text-yellow-400 hover:bg-yellow-400/10 font-medium">
                      <Crown size={18} /> Premium
                    </Link>
                    <Link href="/profile" className="flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--text)] hover:bg-[var(--bg-secondary)]">
                      <User size={18} className="text-cyan-400" /> Hồ sơ
                    </Link>
                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-400/10"
                    >
                      <LogOut size={18} /> Đăng xuất
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link href="/login" className="block px-4 py-3 rounded-xl text-[var(--text)] hover:bg-[var(--bg-secondary)] font-medium text-center">
                      Đăng nhập
                    </Link>
                    <Link href="/register" className="block px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 text-white font-medium text-center">
                      Bắt đầu miễn phí
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
