import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { ProfileClient } from './profile-client'

export const metadata = { title: 'Hồ sơ' }

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const [user, referrals] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true, name: true, email: true, avatar: true,
        isPremium: true, premiumUntil: true, tokens: true,
        lives: true, referralCode: true, createdAt: true,
      },
    }),
    prisma.referral.findMany({
      where: { referrerId: session.user.id },
      select: { refereeId: true, hasUsedApp: true, rewardGiven: true },
    }),
  ])

  const validReferrals = referrals.filter(r => r.hasUsedApp).length
  const isPremiumActive = user?.isPremium && user?.premiumUntil && user.premiumUntil > new Date()

  return (
    <ProfileClient
      user={{ ...user!, isPremiumActive: !!isPremiumActive }}
      referralStats={{
        total: referrals.length,
        valid: validReferrals,
        progress: Math.min(validReferrals, 5),
        referralLink: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/register?ref=${user?.referralCode}`,
      }}
    />
  )
}
