import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await auth()
  const { source, messages, userEmail: bodyEmail } = await req.json()

  const email = session?.user?.email ?? bodyEmail ?? null

  const record = await prisma.chatWidgetSession.create({
    data: {
      userId: session?.user?.id ?? null,
      userName: session?.user?.name ?? null,
      userEmail: email,
      source: source ?? null,
      messages: messages ?? [],
      status: 'OPEN',
    },
  })

  return NextResponse.json({ ok: true, id: record.id })
}

// Widget polls this to check for admin reply
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ adminReply: null })

  const record = await prisma.chatWidgetSession.findUnique({
    where: { id },
    select: { adminReply: true, repliedAt: true },
  })

  return NextResponse.json({ adminReply: record?.adminReply ?? null, repliedAt: record?.repliedAt ?? null })
}
