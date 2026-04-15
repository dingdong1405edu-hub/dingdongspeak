import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { checkReferralReward } from '@/lib/tokens'

// GET /api/share — Get referral stats
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { referralCode: true },
  })

  const referrals = await prisma.referral.findMany({
    where: { referrerId: session.user.id },
    select: { refereeId: true, hasUsedApp: true, rewardGiven: true, createdAt: true },
  })

  const rewardEligible = referrals.filter(r => r.hasUsedApp && !r.rewardGiven).length
  const totalValid = referrals.filter(r => r.hasUsedApp).length

  return NextResponse.json({
    referralCode: user?.referralCode,
    referralLink: `${process.env.NEXT_PUBLIC_APP_URL}/register?ref=${user?.referralCode}`,
    total: referrals.length,
    totalValid,
    rewardEligible,
    progress: Math.min(totalValid, 5),
    nextReward: Math.max(0, 5 - totalValid),
  })
}

// POST /api/share/use — Mark referral as used (called after first session)
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Mark this user's referral as used
  await prisma.referral.updateMany({
    where: { refereeId: session.user.id, hasUsedApp: false },
    data: { hasUsedApp: true },
  })

  // Check if referrer gets reward
  const referral = await prisma.referral.findFirst({
    where: { refereeId: session.user.id },
  })
  if (referral) {
    await checkReferralReward(referral.referrerId)
  }

  return NextResponse.json({ success: true })
}
