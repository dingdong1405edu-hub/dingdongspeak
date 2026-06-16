import { Suspense } from 'react'
import { MockTestSession } from './mock-test-session'
import { getServerLangConfig } from '@/lib/lang-server'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata() {
  const config = await getServerLangConfig()
  return { title: `Thi thử ${config.examFull}` }
}

export default async function MockTestSessionPage({ params }: Props) {
  const { id } = await params

  return (
    <Suspense fallback={<div className="flex items-center justify-center h-96 text-[var(--text-secondary)]">Đang chuẩn bị đề thi...</div>}>
      <MockTestSession sessionId={id} />
    </Suspense>
  )
}
