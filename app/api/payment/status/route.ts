import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const orderCode = parseInt(searchParams.get('orderCode') ?? '0')
  if (!orderCode) return NextResponse.json({ status: 'NOT_FOUND' })

  const order = await prisma.paymentOrder.findUnique({
    where: { orderCode, userId: session.user.id },
    select: { status: true },
  })

  return NextResponse.json({ status: order?.status ?? 'NOT_FOUND' })
}
