import { Suspense } from 'react'
import { PracticeSession } from './practice-session'
import { getServerLang } from '@/lib/lang-server'
import { getLang, toLangCode } from '@/lib/languages'

export const metadata = { title: 'Luyện nói' }

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ topic?: string; part?: string; count?: string; lang?: string }>
}

export default async function PracticeSessionPage({ params, searchParams }: Props) {
  const { id } = await params
  const sp = await searchParams
  const lang = toLangCode(sp.lang ?? (await getServerLang()))
  const { part = 'PART1', count = '5' } = sp
  const topic = sp.topic ?? getLang(lang).topics[0]

  return (
    <Suspense fallback={<div className="flex items-center justify-center h-96 text-[var(--text-secondary)]">Đang tải...</div>}>
      <PracticeSession
        sessionId={id}
        topic={topic}
        part={part as 'PART1' | 'PART2' | 'PART3'}
        count={parseInt(count)}
        lang={lang}
      />
    </Suspense>
  )
}
