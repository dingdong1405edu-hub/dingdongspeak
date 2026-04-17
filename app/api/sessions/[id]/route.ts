import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { questions, scores, duration } = await req.json()

  const record = await prisma.practiceSession.update({
    where: { id, userId: session.user.id },
    data: { questions, scores, duration: duration ?? 0 },
  })

  return NextResponse.json({ id: record.id })
}
