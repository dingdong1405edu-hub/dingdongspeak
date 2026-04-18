import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { question, transcript, score, topic, part, isAnonymous, audioUrl } = await req.json()

  if (!question || !transcript || !score || !topic || !part) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const shared = await prisma.sharedAnswer.create({
    data: {
      userId: session.user.id,
      question,
      transcript,
      audioUrl: audioUrl ?? null,
      score,
      band: score.overall,
      topic,
      part,
      isAnonymous: isAnonymous ?? false,
    },
  })

  return NextResponse.json({ id: shared.id })
}
