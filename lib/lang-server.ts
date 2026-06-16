import { cookies } from 'next/headers'
import { DEFAULT_LANG, LANG_COOKIE, getLang, toLangCode, type LangCode, type LangConfig } from '@/lib/languages'

/** Active learning language for server components / route handlers (from cookie). */
export async function getServerLang(): Promise<LangCode> {
  try {
    const c = await cookies()
    return toLangCode(c.get(LANG_COOKIE)?.value)
  } catch {
    return DEFAULT_LANG
  }
}

/** Active learning language config for server components. */
export async function getServerLangConfig(): Promise<LangConfig> {
  return getLang(await getServerLang())
}
