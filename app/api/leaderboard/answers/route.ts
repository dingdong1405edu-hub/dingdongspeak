import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const minBand = parseFloat(searchParams.get('minBand') ?? '0')
  const maxBand = parseFloat(searchParams.get('maxBand') ?? '9')
  const part = searchParams.get('part') ?? undefined
  const topic = searchParams.get('topic') ?? undefined
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 50)
  const offset = parseInt(searchParams.get('offset') ?? '0')

  const where = {
    band: { gte: minBand, lte: maxBand },
    ...(part ? { part: part as 'PART1' | 'PART2' | 'PART3' | 'FULL' } : {}),
    ...(topic ? { topic } : {}),
  }

  const [answers, total] = await Promise.all([
    prisma.sharedAnswer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        user: { select: { name: true, avatar: true } },
      },
    }),
    prisma.sharedAnswer.count({ where }),
  ])

  const masked = answers.map(a => ({
    id: a.id,
    question: a.question,
    transcript: a.transcript,
    score: a.score,
    band: a.band,
    topic: a.topic,
    part: a.part,
    createdAt: a.createdAt,
    likes: a.likes,
    displayName: a.isAnonymous
      ? 'Ẩn danh'
      : a.user.name
        ? a.user.name.split(' ').map((w, i) => i === 0 ? w[0] + '***' : w).join(' ')
        : 'Ẩn danh',
    avatar: a.isAnonymous ? null : a.user.avatar,
  }))

  return NextResponse.json({ answers: masked, total })
}
