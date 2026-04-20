import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = 20

  const where = status ? { status } : {}

  const [sessions, total] = await Promise.all([
    prisma.chatWidgetSession.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.chatWidgetSession.count({ where }),
  ])

  const sourceStats = await prisma.chatWidgetSession.groupBy({
    by: ['source'],
    _count: true,
    orderBy: { _count: { source: 'desc' } },
  })

  return NextResponse.json({ sessions, total, page, limit, sourceStats })
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id, status } = await req.json()
  await prisma.chatWidgetSession.update({ where: { id }, data: { status } })
  return NextResponse.json({ ok: true })
}
