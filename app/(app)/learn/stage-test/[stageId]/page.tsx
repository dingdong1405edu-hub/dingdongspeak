import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { STAGES } from '@/lib/lessons-data'
import type { LessonData } from '@/lib/lessons-data'
import { StageTestClient } from './stage-test-client'

export interface TestQuestion {
  id: string
  type: 'vocab' | 'grammar'
  question: string
  hint: string
  options: string[]
  answer: string
  lessonTitle: string
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildTestQuestions(lessons: LessonData[]): TestQuestion[] {
  const questions: TestQuestion[] = []
  for (const lesson of lessons) {
    for (const card of lesson.cards as any[]) {
      if (card.type === 'vocab' && card.options?.length && card.answer) {
        questions.push({
          id: `vocab-${lesson.id}-${card.word}`,
          type: 'vocab',
          question: `Từ "${card.word}" có nghĩa là gì?`,
          hint: card.phonetic ?? '',
          options: card.options,
          answer: card.answer,
          lessonTitle: lesson.title,
        })
      } else if (card.type === 'grammar' && card.options?.length && card.answer) {
        questions.push({
          id: `grammar-${lesson.id}-${card.rule}`,
          type: 'grammar',
          question: card.question,
          hint: card.rule ?? '',
          options: card.options,
          answer: card.answer,
          lessonTitle: lesson.title,
        })
      }
    }
  }
  return shuffle(questions).slice(0, 15)
}

export default async function StageTestPage({ params }: { params: Promise<{ stageId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { stageId } = await params
  const stage = STAGES.find(s => s.id === stageId)
  if (!stage) redirect('/learn')

  const [customLessons, existingResult] = await Promise.all([
    prisma.customLesson.findMany({
      where: { stageId, published: true },
      select: { id: true, stageId: true, title: true, type: true, topic: true, level: true, description: true, xp: true, cards: true },
    }),
    prisma.stageTestResult.findUnique({
      where: { userId_stageId: { userId: session.user.id, stageId } },
    }),
  ])

  const allLessons: LessonData[] = [
    ...stage.lessons,
    ...customLessons.map(cl => ({
      id: cl.id,
      stageId: cl.stageId,
      title: cl.title,
      type: cl.type as LessonData['type'],
      topic: cl.topic,
      level: cl.level as LessonData['level'],
      description: cl.description,
      xp: cl.xp,
      cards: cl.cards as any[],
    })),
  ]

  const questions = buildTestQuestions(allLessons)

  return (
    <StageTestClient
      stageId={stageId}
      stageName={stage.subtitle}
      stageIcon={stage.icon}
      stageColor={stage.color}
      questions={questions}
      alreadyPassed={existingResult?.passed ?? false}
      previousScore={existingResult?.score ?? undefined}
    />
  )
}
