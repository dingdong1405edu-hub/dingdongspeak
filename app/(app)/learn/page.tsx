import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { STAGES } from '@/lib/lessons-data'
import { LearnPathClient } from './learn-path-client'

export const metadata = { title: 'Beginner Path — DingDongSpeak' }

export default async function LearnPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const [progress, user] = await Promise.all([
    prisma.lessonProgress.findMany({
      where: { userId: session.user.id },
      select: { lessonId: true, completed: true, score: true },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { lives: true, tokens: true, isPremium: true, premiumUntil: true },
    }),
  ])

  const completedSet = new Set(progress.filter(p => p.completed).map(p => p.lessonId))

  // Calculate total XP earned from completed lessons
  const allLessons = STAGES.flatMap(s => s.lessons)
  const totalXP = allLessons
    .filter(l => completedSet.has(l.id))
    .reduce((sum, l) => sum + l.xp, 0)

  return (
    <LearnPathClient
      stages={STAGES}
      completedIds={completedSet}
      user={user}
      totalXP={totalXP}
    />
  )
}
