import { NextRequest, NextResponse } from 'next/server'
import { payos } from '@/lib/payos'
import { prisma } from '@/lib/prisma'
import { activatePremium } from '@/lib/tokens'

// PayOS verifies webhook URL with a GET request
export async function GET() {
  return NextResponse.json({ success: true })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const webhookData = payos.verifyPaymentWebhookData(body)

    if (webhookData.code === '00') {
      const { orderCode } = webhookData.data
      const order = await prisma.paymentOrder.findUnique({ where: { orderCode } })

      if (order && order.status === 'PENDING') {
        await activatePremium(order.userId, order.months)
        await prisma.paymentOrder.update({
          where: { orderCode },
          data: { status: 'PAID' },
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('PayOS webhook error:', error)
    return NextResponse.json({ error: 'Webhook failed' }, { status: 400 })
  }
}
