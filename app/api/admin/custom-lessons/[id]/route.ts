import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const { title, type, topic, level, description, xp, cards, stageId, published } = body

  const lesson = await prisma.customLesson.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(type !== undefined && { type }),
      ...(topic !== undefined && { topic }),
      ...(level !== undefined && { level }),
      ...(description !== undefined && { description }),
      ...(xp !== undefined && { xp }),
      ...(cards !== undefined && { cards }),
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
