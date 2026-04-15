import { Suspense } from 'react'
import { PracticeSession } from './practice-session'

export const metadata = { title: 'Luyện tập IELTS Speaking' }

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ topic?: string; part?: string; count?: string }>
}

export default async function PracticeSessionPage({ params, searchParams }: Props) {
  const { id } = await params
  const { topic = 'Education', part = 'PART1', count = '5' } = await searchParams

  return (
    <Suspense fallback={<div className="flex items-center justify-center h-96 text-[var(--text-secondary)]">Đang tải...</div>}>
      <PracticeSession
        sessionId={id}
        topic={topic}
        part={part as 'PART1' | 'PART2' | 'PART3'}
        count={parseInt(count)}
      />
    </Suspense>
  )
}
