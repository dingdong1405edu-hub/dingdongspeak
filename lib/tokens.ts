import { prisma } from './prisma'

const LIVES_REGEN_MINUTES = 5
const MAX_LIVES = 5
const FREE_TOKENS = 30
const LIVES_PER_STREAK_BONUS = 1

export async function getUserTokenState(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      tokens: true,
      lives: true,
      livesLastRegen: true,
      isPremium: true,
      premiumUntil: true,
    },
  })
  if (!user) throw new Error('User not found')

  const isPremiumActive = user.isPremium && user.premiumUntil && user.premiumUntil > new Date()

  // Calculate regenerated lives
  const now = new Date()
  const minutesSinceRegen = (now.getTime() - user.livesLastRegen.getTime()) / 60000
  const livesRegened = Math.floor(minutesSinceRegen / LIVES_REGEN_MINUTES)
  const actualLives = Math.min(user.lives + livesRegened, MAX_LIVES)
  const nextRegenMinutes = LIVES_REGEN_MINUTES - (minutesSinceRegen % LIVES_REGEN_MINUTES)

  // Update lives in DB if changed
  if (livesRegened > 0 && user.lives < MAX_LIVES) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        lives: actualLives,
        livesLastRegen: livesRegened > 0 ? new Date(user.livesLastRegen.getTime() + livesRegened * LIVES_REGEN_MINUTES * 60000) : user.livesLastRegen,
      },
    })
  }

  return {
    tokens: isPremiumActive ? Infinity : user.tokens,
    lives: isPremiumActive ? Infinity : actualLives,
    isPremium: isPremiumActive,
    nextRegenMinutes: Math.ceil(nextRegenMinutes),
  }
}

export async function consumeToken(userId: string): Promise<{ success: boolean; reason?: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tokens: true, isPremium: true, premiumUntil: true },
  })
  if (!user) return { success: false, reason: 'User not found' }

  const isPremiumActive = user.isPremium && user.premiumUntil && user.premiumUntil > new Date()
  if (isPremiumActive) return { success: true }

  if (user.tokens <= 0) return { success: false, reason: 'Hết lượt! Nạp Premium để tiếp tục.' }

  await prisma.user.update({
    where: { id: userId },
    data: { tokens: { decrement: 1 } },
  })
  return { success: true }
}

export async function consumeLife(userId: string): Promise<{ success: boolean; reason?: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lives: true, livesLastRegen: true, isPremium: true, premiumUntil: true },
  })
  if (!user) return { success: false, reason: 'User not found' }

  const isPremiumActive = user.isPremium && user.premiumUntil && user.premiumUntil > new Date()
  if (isPremiumActive) return { success: true }

  if (user.lives <= 0) {
    const minutesSince = (Date.now() - user.livesLastRegen.getTime()) / 60000
    const nextRegen = Math.ceil(LIVES_REGEN_MINUTES - (minutesSince % LIVES_REGEN_MINUTES))
    return { success: false, reason: `Hết mạng! Còn ${nextRegen} phút để hồi 1 mạng.` }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { lives: { decrement: 1 } },
  })
  return { success: true }
}

export async function activatePremium(userId: string, months: number) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { premiumUntil: true } })
  const base = user?.premiumUntil && user.premiumUntil > new Date() ? user.premiumUntil : new Date()
  const premiumUntil = new Date(base)
  premiumUntil.setMonth(premiumUntil.getMonth() + months)

  await prisma.user.update({
    where: { id: userId },
    data: { isPremium: true, premiumUntil, tokens: FREE_TOKENS },
  })
}

export async function checkReferralReward(userId: string) {
  const referrals = await prisma.referral.findMany({
    where: { referrerId: userId, hasUsedApp: true, rewardGiven: false },
  })

  if (referrals.length >= 5) {
    // Give 15 days premium
    const rewardIds = referrals.slice(0, 5).map(r => r.id)
    await prisma.$transaction([
      prisma.referral.updateMany({
        where: { id: { in: rewardIds } },
        data: { rewardGiven: true },
      }),
      prisma.user.update({
        where: { id: userId },
        data: {
          isPremium: true,
          premiumUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        },
      }),
    ])
    return true
  }
  return false
}
