import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'

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

  const lesson = await prisma.customLesson.create({
    data: {
      stageId,
      title,
      type,
      topic,
      level,
      description: description ?? '',
      xp: xp ?? 50,
      cards,
      published: false,
      createdById: user?.id ?? null,
    },
  })

  return NextResponse.json({ lesson })
}
