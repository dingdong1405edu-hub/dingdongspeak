import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { stageId, score, livesLeft } = await req.json()
  if (!stageId || score === undefined || livesLeft === undefined) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const passed = livesLeft > 0

  await prisma.stageTestResult.upsert({
    where: { userId_stageId: { userId: session.user.id, stageId } },
    update: { passed, score, livesLeft },
    create: { userId: session.user.id, stageId, passed, score, livesLeft },
  })

  return NextResponse.json({ success: true })
}
