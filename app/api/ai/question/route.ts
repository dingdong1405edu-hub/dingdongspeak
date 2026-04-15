import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { generateIELTSQuestions } from '@/lib/gemini'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rl = rateLimit(`question:${session.user.id}`, { maxRequests: 10, windowMs: 60_000 })
  if (!rl.success) return NextResponse.json({ error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.' }, { status: 429 })

  const { topic, part, count } = await req.json()
  if (!topic || !part) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  const questions = await generateIELTSQuestions(topic, part, count || 5)
  return NextResponse.json({ questions })
}
