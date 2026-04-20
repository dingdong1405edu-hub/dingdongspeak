import { prisma } from '@/lib/prisma'
import { StagesClient } from './stages-client'

export const metadata = { title: 'Quản lý Stages — Admin' }

export default async function StagesPage() {
  const [stages, lessonCounts] = await Promise.all([
    prisma.stage.findMany({ orderBy: { order: 'asc' } }).catch(() => []),
    prisma.customLesson.groupBy({ by: ['stageId'], _count: { id: true } }).catch(() => []),
  ])

  const countMap: Record<string, number> = {}
  for (const r of lessonCounts) countMap[r.stageId] = r._count.id

  return <StagesClient initialStages={stages} lessonCounts={countMap} />
}
