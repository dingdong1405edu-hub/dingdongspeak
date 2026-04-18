import { NextRequest, NextResponse } from 'next/server'
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

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const { title, type, topic, level, description, xp, cards, stageId, published } = body

  const enrichedCards = cards !== undefined
    ? await enrichVocabAudio(cards, type ?? 'vocabulary')
    : undefined

  const lesson = await prisma.customLesson.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(type !== undefined && { type }),
      ...(topic !== undefined && { topic }),
      ...(level !== undefined && { level }),
      ...(description !== undefined && { description }),
      ...(xp !== undefined && { xp }),
      ...(enrichedCards !== undefined && { cards: enrichedCards }),
      ...(stageId !== undefined && { stageId }),
      ...(published !== undefined && { published }),
    },
  })

  return NextResponse.json({ lesson })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  await prisma.customLesson.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
