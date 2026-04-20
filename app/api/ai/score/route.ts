import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { scoreIELTSResponse, scoreBeginnerSpeaking } from '@/lib/gemini'
import { consumeToken, consumeLife } from '@/lib/tokens'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Rate limit: 20 score requests per minute per user
  const rl = rateLimit(`score:${session.user.id}`, { maxRequests: 20, windowMs: 60_000 })
  if (!rl.success) return NextResponse.json({ error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.' }, { status: 429 })

  const { question, transcript, part, type, topic, sessionId } = await req.json()

  if (!transcript || transcript.trim().length < 5) {
    return NextResponse.json({ error: 'Câu trả lời quá ngắn' }, { status: 400 })
  }

  // Consume token for IELTS scoring
  if (type === 'PRACTICE' || type === 'MOCK_TEST') {
    const result = await consumeToken(session.user.id)
    if (!result.success) return NextResponse.json({ error: result.reason }, { status: 402 })
  }
  if (type === 'BEGINNER') {
    const result = await consumeLife(session.user.id)
    if (!result.success) return NextResponse.json({ error: result.reason }, { status: 402 })
  }

  // Score
  let score
  if (type === 'BEGINNER') {
    score = await scoreBeginnerSpeaking(question, transcript)
  } else {
    score = await scoreIELTSResponse(question, transcript, part)
  }

  // Record today's streak
  await prisma.streak.upsert({
    where: { userId_date: { userId: session.user.id, date: new Date(new Date().toDateString()) } },
    update: { practiced: true },
    create: { userId: session.user.id, date: new Date(new Date().toDateString()), practiced: true },
  })

  return NextResponse.json({ score })
}
