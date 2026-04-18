import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { payos } from '@/lib/payos'
import { PREMIUM_PLANS } from '@/types'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { months } = await req.json()
  const plan = PREMIUM_PLANS.find(p => p.months === months)
  if (!plan) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

  // Use unix timestamp (seconds) as order code — unique enough at this scale
  const orderCode = Math.floor(Date.now() / 1000)

  await prisma.paymentOrder.create({
    data: { orderCode, userId: session.user.id, months: plan.months },
  })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const paymentLink = await payos.createPaymentLink({
    orderCode,
    amount: plan.price,
    description: `Premium ${plan.months}th`,
    returnUrl: `${appUrl}/premium/success?orderCode=${orderCode}`,
    cancelUrl: `${appUrl}/premium`,
  })

  return NextResponse.json({ checkoutUrl: paymentLink.checkoutUrl })
}
