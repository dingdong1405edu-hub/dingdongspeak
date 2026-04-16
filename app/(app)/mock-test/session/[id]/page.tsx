import { Suspense } from 'react'
import { MockTestSession } from './mock-test-session'

interface Props {
  params: Promise<{ id: string }>
}

export const metadata = { title: 'Thi thử IELTS Speaking' }

export default async function MockTestSessionPage({ params }: Props) {
  const { id } = await params

  return (
    <Suspense fallback={<div className="flex items-center justify-center h-96 text-[var(--text-secondary)]">Đang chuẩn bị đề thi...</div>}>
      <MockTestSession sessionId={id} />
    </Suspense>
  )
}
