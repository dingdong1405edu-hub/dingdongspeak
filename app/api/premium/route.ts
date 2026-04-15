import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { activatePremium } from '@/lib/tokens'

// POST /api/premium — Activate premium (simplified - in production integrate with payment gateway)
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { months, transactionId } = await req.json()
  if (![1, 2, 3].includes(months)) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  // In production: verify payment with MoMo/VNPay webhook
  // For now: activate directly (demo mode)
  await activatePremium(session.user.id, months)

  return NextResponse.json({ success: true, months })
}
