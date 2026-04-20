import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id) return null
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } })
  if (!user || !['ADMIN', 'OWNER', 'STAFF'].includes(user.role)) return null
  return session
}

export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const stages = await prisma.stage.findMany({ orderBy: { order: 'asc' } })
  return NextResponse.json(stages)
}

export async function POST(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
