import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { generateSampleAnswer, generateVocabAndIdioms, improveAnswer } from '@/lib/gemini'
import { rateLimit } from '@/lib/rate-limit'
import { toLangCode } from '@/lib/languages'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rl = rateLimit(`sample:${session.user.id}`, { maxRequests: 15, windowMs: 60_000 })
  if (!rl.success) return NextResponse.json({ error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.' }, { status: 429 })

  const { question, part, type, topic, transcript, lang } = await req.json()
  const L = toLangCode(lang)

  if (type === 'improve') {
    const improved = await improveAnswer(transcript || '', question, part || 'PART1', L)
    return NextResponse.json({ improved })
  }

  if (type === 'vocab') {
    const data = await generateVocabAndIdioms(question, topic || '', L)
    return NextResponse.json(data)
  }

  const answer = await generateSampleAnswer(question, part || 'PART1', 8, L)
  return NextResponse.json({ answer })
}
