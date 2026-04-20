import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const stages = await prisma.stage.findMany({ orderBy: { order: 'asc' } })
  return NextResponse.json(stages)
}

export async function POST(req: Request) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { title, subtitle, icon, color, accentColor } = body
  if (!title?.trim() || !subtitle?.trim()) {
    return NextResponse.json({ error: 'title and subtitle required' }, { status: 400 })
  }

  const maxOrder = await prisma.stage.aggregate({ _max: { order: true } })
  const order = (maxOrder._max.order ?? -1) + 1

  const stage = await prisma.stage.create({
    data: {
      title: title.trim(),
      subtitle: subtitle.trim(),
      icon: icon ?? '📚',
      color: color ?? 'from-cyan-500 to-blue-600',
      accentColor: accentColor ?? 'cyan',
      order,
    },
  })
  return NextResponse.json(stage)
}
