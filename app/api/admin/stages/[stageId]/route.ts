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

export async function PATCH(req: Request, { params }: { params: Promise<{ stageId: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { stageId } = await params
  const body = await req.json()
  const { title, subtitle, icon, color, accentColor, published, order } = body

  const stage = await prisma.stage.update({
    where: { id: stageId },
    data: {
      ...(title !== undefined && { title }),
      ...(subtitle !== undefined && { subtitle }),
      ...(icon !== undefined && { icon }),
      ...(color !== undefined && { color }),
      ...(accentColor !== undefined && { accentColor }),
      ...(published !== undefined && { published }),
      ...(order !== undefined && { order }),
    },
  })
  return NextResponse.json(stage)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ stageId: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { stageId } = await params

  const lessonCount = await prisma.customLesson.count({ where: { stageId } })
  if (lessonCount > 0) {
    return NextResponse.json({ error: `Stage còn ${lessonCount} bài học. Xóa bài học trước.` }, { status: 400 })
  }

  await prisma.stage.delete({ where: { id: stageId } })
  return NextResponse.json({ ok: true })
}
