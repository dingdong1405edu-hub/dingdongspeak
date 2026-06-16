'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DEFAULT_LANG, LANG_COOKIE, getLang, toLangCode, type LangCode, type LangConfig } from '@/lib/languages'

interface LangContextValue {
  lang: LangCode
  config: LangConfig
  setLang: (code: LangCode) => void
}

const LangContext = createContext<LangContextValue | null>(null)

function writeCookie(code: LangCode) {
  // 1 year, root path so SSR can read it everywhere.
  document.cookie = `${LANG_COOKIE}=${code}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
}

export function LangProvider({
  initialLang = DEFAULT_LANG,
  children,
}: {
  initialLang?: LangCode
  children: React.ReactNode
}) {
  const router = useRouter()
  const [lang, setLangState] = useState<LangCode>(toLangCode(initialLang))

  // Keep <body data-lang> in sync so CSS can pick the right CJK font.
  useEffect(() => {
    document.body.dataset.lang = lang
  }, [lang])

  const setLang = useCallback((code: LangCode) => {
    const next = toLangCode(code)
    setLangState(next)
    writeCookie(next)
    document.body.dataset.lang = next
    // Persist to the user profile (best effort — ignore when logged out).
    fetch('/api/user', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ learningLanguage: next }),
    }).catch(() => {})
    // Re-run server components so language-scoped queries reload.
    router.refresh()
  }, [router])

  const value = useMemo<LangContextValue>(
    () => ({ lang, config: getLang(lang), setLang }),
    [lang, setLang]
  )

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

/** Active learning language (client components). */
export function useLang(): LangContextValue {
  const ctx = useContext(LangContext)
  if (!ctx) {
    // Safe fallback so components never crash outside the provider.
    return { lang: DEFAULT_LANG, config: getLang(DEFAULT_LANG), setLang: () => {} }
  }
  return ctx
}
