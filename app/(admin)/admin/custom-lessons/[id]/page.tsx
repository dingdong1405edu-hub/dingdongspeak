import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { CustomLessonEditor } from './custom-lesson-editor'
import { STAGES } from '@/lib/lessons-data'

export default async function CustomLessonEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const lesson = await prisma.customLesson.findUnique({ where: { id } })
  if (!lesson) notFound()

  const stage = STAGES.find(s => s.id === lesson.stageId)

  return (
    <CustomLessonEditor
      lesson={{ ...lesson, cards: lesson.cards as any[] }}
      stageTitle={stage ? `${stage.icon} ${stage.title}: ${stage.subtitle}` : lesson.stageId}
    />
  )
}
