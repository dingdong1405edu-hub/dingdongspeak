import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { ReviewClient } from './review-client'
import { getServerLang } from '@/lib/lang-server'

export const metadata = { title: 'Ôn tập' }

export default async function ReviewPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const lang = await getServerLang()
  const items = await prisma.savedItem.findMany({
    where: { userId: session.user.id, language: lang },
    orderBy: { createdAt: 'desc' },
    select: { id: true, type: true, content: true, context: true, topic: true, createdAt: true },
  })

  return <ReviewClient items={items} />
}
