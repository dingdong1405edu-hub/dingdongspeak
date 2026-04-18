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

    // Seconds-based timestamp fits INT4 (max ~2.1B, current ~1.77B)
    const orderCode = Math.floor(Date.now() / 1000)

    await prisma.paymentOrder.create({
      data: { orderCode, userId: session.user.id, months: plan.months },
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
      || 'https://web-production-4a953.up.railway.app'

    // PayOS v2: paymentRequests.create()
    const result = await getPayOS().paymentRequests.create({
      orderCode,
      amount: plan.price,
      description: `Premium ${plan.months}th`,
      returnUrl: `${appUrl}/premium/success?orderCode=${orderCode}`,
      cancelUrl: `${appUrl}/premium`,
    })

    return NextResponse.json({
      checkoutUrl: result.checkoutUrl,
      qrCode: result.qrCode ?? null,
      orderCode,
    })
  } catch (error: any) {
    console.error('create-link error:', error)
    const message = error?.message || 'Tạo link thanh toán thất bại'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
