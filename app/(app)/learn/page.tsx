import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { LearnPathClient } from './learn-path-client'

export const metadata = { title: 'Beginner Path' }

const STAGES = [
  {
    id: 'stage-1', title: 'Stage 1: Cơ bản', color: 'from-emerald-500 to-cyan-500',
    lessons: [
      { id: 'l1', title: 'Chào hỏi & Giới thiệu bản thân', type: 'vocabulary' as const, xp: 50 },
      { id: 'l2', title: 'Thì hiện tại đơn', type: 'grammar' as const, xp: 50 },
      { id: 'l3', title: 'Nói về bản thân', type: 'speaking' as const, xp: 100 },
    ]
  },
  {
    id: 'stage-2', title: 'Stage 2: Gia đình & Bạn bè', color: 'from-cyan-500 to-blue-500',
    lessons: [
      { id: 'l4', title: 'Từ vựng gia đình', type: 'vocabulary' as const, xp: 50 },
      { id: 'l5', title: 'Thì hiện tại tiếp diễn', type: 'grammar' as const, xp: 50 },
      { id: 'l6', title: 'Mô tả gia đình', type: 'speaking' as const, xp: 100 },
    ]
  },
  {
    id: 'stage-3', title: 'Stage 3: Công việc & Học tập', color: 'from-violet-500 to-pink-500',
    lessons: [
      { id: 'l7', title: 'Từ vựng nghề nghiệp', type: 'vocabulary' as const, xp: 50 },
      { id: 'l8', title: 'Thì quá khứ đơn', type: 'grammar' as const, xp: 50 },
      { id: 'l9', title: 'Nói về công việc', type: 'speaking' as const, xp: 100 },
    ]
  },
  {
    id: 'stage-4', title: 'Stage 4: Du lịch & Địa điểm', color: 'from-orange-500 to-yellow-500',
    lessons: [
      { id: 'l10', title: 'Từ vựng du lịch', type: 'vocabulary' as const, xp: 50 },
      { id: 'l11', title: 'Câu điều kiện', type: 'grammar' as const, xp: 50 },
      { id: 'l12', title: 'Mô tả địa điểm', type: 'speaking' as const, xp: 100 },
    ]
  },
  {
    id: 'stage-5', title: 'Stage 5: IELTS Ready', color: 'from-red-500 to-violet-600',
    lessons: [
      { id: 'l13', title: 'Advanced Vocabulary', type: 'vocabulary' as const, xp: 75 },
      { id: 'l14', title: 'Complex Sentences', type: 'grammar' as const, xp: 75 },
      { id: 'l15', title: 'IELTS Speaking Part 1', type: 'speaking' as const, xp: 150 },
    ]
  },
]

export default async function LearnPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const progress = await prisma.lessonProgress.findMany({
    where: { userId: session.user.id },
    select: { lessonId: true, completed: true, score: true },
  })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { lives: true, tokens: true, isPremium: true, premiumUntil: true },
  })

  const completedIds = new Set(progress.filter(p => p.completed).map(p => p.lessonId))

  return <LearnPathClient stages={STAGES} completedIds={completedIds} user={user} />
}
