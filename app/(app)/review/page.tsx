import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { ReviewClient } from './review-client'

export const metadata = { title: 'Ôn tập' }

export default async function ReviewPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const items = await prisma.savedItem.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    select: { id: true, type: true, content: true, context: true, topic: true, createdAt: true },
  })

  return <ReviewClient items={items} />
}
