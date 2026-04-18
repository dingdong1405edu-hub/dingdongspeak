import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'

async function generateWordAudio(word: string): Promise<string | null> {
  if (!process.env.DEEPGRAM_API_KEY || !word.trim()) return null
  try {
    const res = await fetch('https://api.deepgram.com/v1/speak?model=aura-asteria-en&encoding=mp3', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.DEEPGRAM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: word }),
    })
    if (!res.ok) return null
    const buffer = await res.arrayBuffer()
    return Buffer.from(buffer).toString('base64')
  } catch {
    return null
  }
}

async function enrichVocabAudio(cards: any[], type: string): Promise<any[]> {
  if (type !== 'vocabulary') return cards
  return Promise.all(
    cards.map(async (card) => {
      if (card.type === 'vocab' && card.word && !card.audioBase64) {
        card.audioBase64 = await generateWordAudio(card.word)
      }
      return card
    })
  )
}

export async function GET() {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const lessons = await prisma.customLesson.findMany({
    orderBy: [{ stageId: 'asc' }, { order: 'asc' }, { createdAt: 'asc' }],
    include: { createdBy: { select: { name: true, email: true } } },
  })

  return NextResponse.json({ lessons })
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const session = await auth()
  const body = await req.json()
  const { stageId, title, type, topic, level, description, xp, cards } = body

  if (!stageId || !title || !type || !topic || !level || !cards?.length) {
    return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 })
  }

  const user = session?.user?.email
    ? await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } })
    : null

  const enrichedCards = await enrichVocabAudio(cards, type)

  const lesson = await prisma.customLesson.create({
    data: {
      stageId,
      title,
      type,
      topic,
      level,
      description: description ?? '',
      xp: xp ?? 50,
      cards: enrichedCards,
      published: false,
      createdById: user?.id ?? null,
    },
  })

  return NextResponse.json({ lesson })
}
