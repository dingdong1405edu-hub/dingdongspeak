import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { toLangCode, isLangCode } from '@/lib/languages'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { type, topic, part, questions, scores, duration, language } = await req.json()

  const record = await prisma.practiceSession.create({
    data: {
      userId: session.user.id,
      type,
      language: toLangCode(language),
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
  const langParam = searchParams.get('lang')
  const where = {
    userId: session.user.id,
    ...(isLangCode(langParam) ? { language: langParam } : {}),
  }

  const [sessions, total] = await Promise.all([
    prisma.practiceSession.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.practiceSession.count({ where }),
  ])

  return NextResponse.json({ sessions, total })
}
