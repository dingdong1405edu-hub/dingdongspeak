import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { type, topic, part, questions, scores, duration } = await req.json()

  const record = await prisma.practiceSession.create({
    data: {
      userId: session.user.id,
      type,
      topic,
      part: part ?? null,
      questions,
      scores,
      duration: duration ?? 0,
    },
  })

  return NextResponse.json({ id: record.id })
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 50)
  const offset = parseInt(searchParams.get('offset') ?? '0')

  const [sessions, total] = await Promise.all([
    prisma.practiceSession.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.practiceSession.count({ where: { userId: session.user.id } }),
  ])

  return NextResponse.json({ sessions, total })
}
