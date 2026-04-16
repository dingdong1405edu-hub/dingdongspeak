import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getLessonById, getStageByLessonId } from '@/lib/lessons-data'
import type { LessonData } from '@/lib/lessons-data'
import { LessonEditor } from './lesson-editor'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const lesson = getLessonById(id)
  return { title: lesson ? `Chỉnh sửa: ${lesson.title}` : 'Lesson Editor' }
}

export default async function AdminLessonEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const staticLesson = getLessonById(id)
  if (!staticLesson) redirect('/admin/lessons')

  const dbContent = await prisma.lessonContent.findUnique({ where: { lessonId: id } })
  const currentLesson: LessonData = dbContent ? (dbContent.data as unknown as LessonData) : staticLesson
  const stage = getStageByLessonId(id)

  return (
    <LessonEditor
      lessonId={id}
      initialLesson={currentLesson}
      staticLesson={staticLesson}
      hasOverride={!!dbContent}
      overrideUpdatedAt={dbContent?.updatedAt?.toISOString() ?? null}
      overrideUpdatedBy={dbContent?.updatedBy ?? null}
      stageTitle={stage ? `${stage.title}: ${stage.subtitle}` : ''}
      stageColor={stage?.color ?? 'from-cyan-500 to-violet-600'}
    />
  )
}
