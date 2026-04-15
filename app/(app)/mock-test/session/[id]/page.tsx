import { Suspense } from 'react'
import { MockTestSession } from './mock-test-session'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ topic?: string }>
}

export const metadata = { title: 'IELTS Mock Test' }

export default async function MockTestSessionPage({ params, searchParams }: Props) {
  const { id } = await params
  const { topic = 'Education' } = await searchParams

  return (
    <Suspense fallback={<div className="flex items-center justify-center h-96 text-[var(--text-secondary)]">Đang chuẩn bị đề thi...</div>}>
      <MockTestSession sessionId={id} topic={topic} />
    </Suspense>
  )
}
