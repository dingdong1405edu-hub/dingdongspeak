import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { STAGES } from '@/lib/lessons-data'
import { LearnPathClient } from './learn-path-client'
import type { StageData, LessonData } from '@/lib/lessons-data'

export const metadata = { title: 'Beginner Path — DingDongSpeak' }

export default async function LearnPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const [progress, user, customLessons, stageTestResults] = await Promise.all([
    prisma.lessonProgress.findMany({
      where: { userId: session.user.id },
      select: { lessonId: true, completed: true, score: true },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { lives: true, tokens: true, isPremium: true, premiumUntil: true },
    }),
    prisma.customLesson.findMany({
      where: { published: true },
      orderBy: { order: 'asc' },
      select: { id: true, stageId: true, title: true, type: true, topic: true, level: true, description: true, xp: true, cards: true },
    }),
    prisma.stageTestResult.findMany({
      where: { userId: session.user.id, passed: true },
      select: { stageId: true },
    }),
  ])

  const completedSet = new Set(progress.filter(p => p.completed).map(p => p.lessonId))
  const passedStageTests = new Set(stageTestResults.map(r => r.stageId))

  // Merge published custom lessons into each stage
  const mergedStages: StageData[] = STAGES.map(stage => ({
    ...stage,
    lessons: [
      ...stage.lessons,
      ...customLessons
        .filter(cl => cl.stageId === stage.id)
        .map(cl => ({
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
    ],
  }))

  const allLessons = mergedStages.flatMap(s => s.lessons)
  const totalXP = allLessons
    .filter(l => completedSet.has(l.id))
    .reduce((sum, l) => sum + l.xp, 0)

  return (
    <LearnPathClient
      stages={mergedStages}
      completedIds={completedSet}
      user={user}
      totalXP={totalXP}
      passedStageTests={passedStageTests}
    />
  )
}
