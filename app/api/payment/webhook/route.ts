import { NextRequest, NextResponse } from 'next/server'
import { getPayOS } from '@/lib/payos'
import { prisma } from '@/lib/prisma'
import { activatePremium } from '@/lib/tokens'

// PayOS verifies webhook URL with a GET request
export async function GET() {
  return NextResponse.json({ success: true })
}

export async function POST(req: NextRequest) {
  // Always return 200 — PayOS requires 200 even for test/ping requests
  try {
    const body = await req.json()

    try {
      // PayOS v2: webhooks.verify() — throws WebhookError if signature invalid
      const verified = await getPayOS().webhooks.verify(body)

      if (verified?.code === '00' || verified?.data?.orderCode) {
        const orderCode = verified?.data?.orderCode ?? verified?.orderCode
        if (orderCode) {
          const order = await prisma.paymentOrder.findUnique({ where: { orderCode } })
          if (order && order.status === 'PENDING') {
            await activatePremium(order.userId, order.months)
            await prisma.paymentOrder.update({
              where: { orderCode },
              data: { status: 'PAID' },
            })
          }
        }
      }
    } catch {
      // Signature invalid or test ping — still return 200
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: true })
  }
}
