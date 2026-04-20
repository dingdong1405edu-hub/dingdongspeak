import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getBeginnerSpeakingAssist } from '@/lib/gemini'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rl = rateLimit(`assist:${session.user.id}`, { maxRequests: 30, windowMs: 60_000 })
  if (!rl.success) return NextResponse.json({ error: 'Quá nhiều yêu cầu' }, { status: 429 })

  const { question, transcript, action } = await req.json()
  if (!question || !action) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const result = await getBeginnerSpeakingAssist(question, transcript ?? '', action)
  return NextResponse.json({ result })
}
