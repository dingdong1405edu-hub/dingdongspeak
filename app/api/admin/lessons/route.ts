import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { STAGES, getAllLessons, type LessonData } from '@/lib/lessons-data'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean)

async function checkAdmin() {
  const session = await auth()
  if (!session?.user?.email) return false
  return ADMIN_EMAILS.includes(session.user.email)
}

export async function GET() {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const allLessons = getAllLessons()
  const dbOverrides = await prisma.lessonContent.findMany()
  const overrideMap = new Map(dbOverrides.map(o => [o.lessonId, o]))

  const lessons = STAGES.flatMap((stage, si) =>
    stage.lessons.map((lesson, li) => {
      const override = overrideMap.get(lesson.id)
      return {
        ...lesson,
        stageTitle: stage.subtitle,
        stageIcon: stage.icon,
        stageColor: stage.color,
        stageIndex: si,
        lessonIndex: li,
        hasOverride: !!override,
        overrideUpdatedAt: override?.updatedAt ?? null,
        overrideUpdatedBy: override?.updatedBy ?? null,
        // Merged cards (use override if exists)
        cards: override ? (override.data as unknown as LessonData).cards : lesson.cards,
      }
    })
  )

  return NextResponse.json({ lessons })
}
