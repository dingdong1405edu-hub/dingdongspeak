import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await auth()
  const { source, messages } = await req.json()

  if (!source && (!messages || messages.length === 0)) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  await prisma.chatWidgetSession.create({
    data: {
      userId: session?.user?.id ?? null,
      userName: session?.user?.name ?? null,
      source: source ?? null,
      messages: messages ?? [],
      status: 'OPEN',
    },
  })

  return NextResponse.json({ ok: true })
}
