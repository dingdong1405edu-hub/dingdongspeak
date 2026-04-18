import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getLessonById, type LessonData } from '@/lib/lessons-data'
import { getAdminRole } from '@/lib/admin-auth'

async function checkAdmin() {
  const role = await getAdminRole()
  if (!role) return null
  const session = await auth()
  return session?.user?.email ?? null
}

// GET single lesson (DB override or static)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const email = await checkAdmin()
  if (!email) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const dbContent = await prisma.lessonContent.findUnique({ where: { lessonId: id } })
  const staticLesson = getLessonById(id)

  if (!staticLesson && !dbContent) {
    return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
  }

  const lesson = dbContent ? (dbContent.data as unknown as LessonData) : staticLesson
  return NextResponse.json({
    lesson,
    hasOverride: !!dbContent,
    updatedAt: dbContent?.updatedAt ?? null,
    updatedBy: dbContent?.updatedBy ?? null,
    staticLesson,
  })
}

// PUT — save/update lesson override
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const email = await checkAdmin()
  if (!email) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await req.json()

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const lessonContent = await prisma.lessonContent.upsert({
    where: { lessonId: id },
    create: { lessonId: id, data: body, updatedBy: email },
    update: { data: body, updatedBy: email },
  })

  return NextResponse.json({ success: true, updatedAt: lessonContent.updatedAt })
}

// DELETE — remove override (revert to static data)
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const email = await checkAdmin()
  if (!email) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  await prisma.lessonContent.deleteMany({ where: { lessonId: id } })

  return NextResponse.json({ success: true })
}
