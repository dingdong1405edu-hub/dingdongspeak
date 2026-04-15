import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { lessonId, score } = await req.json()
  if (!lessonId) return NextResponse.json({ error: 'Missing lessonId' }, { status: 400 })

  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId: session.user.id, lessonId } },
    update: { completed: true, score, completedAt: new Date() },
    create: { userId: session.user.id, lessonId, completed: true, score, completedAt: new Date() },
  })

  // Record streak
  await prisma.streak.upsert({
    where: { userId_date: { userId: session.user.id, date: new Date(new Date().toDateString()) } },
    update: { practiced: true },
    create: { userId: session.user.id, date: new Date(new Date().toDateString()), practiced: true },
  })

  // Mark referral as used (first session)
  await prisma.referral.updateMany({
    where: { refereeId: session.user.id, hasUsedApp: false },
    data: { hasUsedApp: true },
  })

  return NextResponse.json({ success: true })
}
