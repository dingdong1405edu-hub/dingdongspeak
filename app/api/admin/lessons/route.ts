import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { STAGES, getAllLessons, type LessonData } from '@/lib/lessons-data'
import { getAdminRole } from '@/lib/admin-auth'

export async function GET() {
  if (!(await getAdminRole())) {
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
