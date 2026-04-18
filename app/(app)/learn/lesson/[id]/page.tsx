import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getLessonById, getStageByLessonId, STAGES } from '@/lib/lessons-data'
import type { LessonData } from '@/lib/lessons-data'
import { LessonClient } from './lesson-client'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const lesson = getLessonById(id)
  return { title: lesson ? `${lesson.title} — DingDongSpeak` : 'Lesson' }
}

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // 1. Check if it's a custom (DB) lesson first
  const customLesson = await prisma.customLesson.findUnique({
    where: { id, published: true },
  })

  if (customLesson) {
    const stage = STAGES.find(s => s.id === customLesson.stageId)
    return (
      <LessonClient
        lesson={{ ...customLesson, cards: customLesson.cards as any[] } as LessonData}
        lessonId={id}
        stageColor={stage?.color ?? 'from-cyan-500 to-violet-600'}
      />
    )
  }

  // 2. Static lesson — check for admin override first
  const dbContent = await prisma.lessonContent.findUnique({ where: { lessonId: id } })
  const lesson: LessonData | undefined = dbContent
    ? (dbContent.data as unknown as LessonData)
    : getLessonById(id)

  if (!lesson) redirect('/learn')

  const stage = getStageByLessonId(id)

  return <LessonClient lesson={lesson} lessonId={id} stageColor={stage?.color ?? 'from-cyan-500 to-violet-600'} />
}
