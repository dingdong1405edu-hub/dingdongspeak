import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getPayOS } from '@/lib/payos'
import { PREMIUM_PLANS } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Bạn chưa đăng nhập' }, { status: 401 })
    }

    const { months } = await req.json()
    const plan = PREMIUM_PLANS.find(p => p.months === months)
    if (!plan) {
      return NextResponse.json({ error: 'Gói không hợp lệ' }, { status: 400 })
    }

    // Millisecond timestamp to avoid collisions
    const orderCode = Date.now()

    await prisma.paymentOrder.create({
      data: { orderCode, userId: session.user.id, months: plan.months },
    })

    // Always use the production Railway domain for returnUrl
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
      || 'https://web-production-4a953.up.railway.app'

    const paymentLink = await getPayOS().createPaymentLink({
      orderCode,
      amount: plan.price,
      description: `Premium ${plan.months}th`,
      returnUrl: `${appUrl}/premium/success?orderCode=${orderCode}`,
      cancelUrl: `${appUrl}/premium`,
    })

    return NextResponse.json({ checkoutUrl: paymentLink.checkoutUrl })
  } catch (error: any) {
    console.error('create-link error:', error)
    const message = error?.response?.data?.desc
      || error?.message
      || 'Tạo link thanh toán thất bại'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
