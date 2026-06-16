'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronDown, Globe } from 'lucide-react'
import { useLang } from '@/components/shared/lang-provider'
import { LANG_LIST } from '@/lib/languages'
import { cn } from '@/lib/utils'

/**
 * Switches the active *learning* language (en/zh/ja/ko). The app UI stays
 * Vietnamese — only the practised language changes.
 */
export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { lang, config, setLang } = useLang()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          'flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] font-medium text-[var(--text)] transition-all hover:border-cyan-400/40',
          compact ? 'px-2 py-1.5 text-sm' : 'px-3 py-2 text-sm'
        )}
        aria-label="Chọn ngôn ngữ học"
        title="Ngôn ngữ đang học"
      >
        <span className="text-base leading-none">{config.flag}</span>
        {!compact && <span className="hidden sm:inline">{config.nativeName}</span>}
        <ChevronDown size={14} className="text-[var(--text-secondary)]" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-60 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-1.5 shadow-soft-lg z-50"
          >
            <div className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[var(--text-secondary)]">
              <Globe size={13} /> Ngôn ngữ đang học
            </div>
            {LANG_LIST.map(l => {
              const active = l.code === lang
              return (
                <button
                  key={l.code}
                  onClick={() => { setLang(l.code); setOpen(false) }}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all',
                    active ? 'bg-cyan-400/15 text-cyan-400' : 'text-[var(--text)] hover:bg-[var(--bg-secondary)]'
                  )}
                >
                  <span className="text-xl leading-none">{l.flag}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold leading-tight">{l.nativeName}</span>
                    <span className="block text-xs text-[var(--text-secondary)]">{l.viName} · {l.exam}</span>
                  </span>
                  {active && <Check size={16} className="shrink-0 text-cyan-400" />}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
