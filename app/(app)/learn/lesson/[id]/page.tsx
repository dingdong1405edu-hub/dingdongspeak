import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getLessonById, getStageByLessonId } from '@/lib/lessons-data'
import type { LessonData } from '@/lib/lessons-data'
import { LessonClient } from './lesson-client'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const lesson = getLessonById(id)
  return { title: lesson ? `${lesson.title} — DingDongSpeak` : 'Lesson' }
}

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Check DB for admin overrides first
  const dbContent = await prisma.lessonContent.findUnique({ where: { lessonId: id } })

  // Fall back to static data
  const lesson: LessonData | undefined = dbContent
    ? (dbContent.data as unknown as LessonData)
    : getLessonById(id)

  if (!lesson) redirect('/learn')

  const stage = getStageByLessonId(id)

  return <LessonClient lesson={lesson} lessonId={id} stageColor={stage?.color ?? 'from-cyan-500 to-violet-600'} />
}
