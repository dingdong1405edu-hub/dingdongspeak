import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { auth } from '@/auth'
import { isLangCode } from '@/lib/languages'

// POST /api/user — Register
export async function POST(req: NextRequest) {
  try {
    const { name, email, password, ref } = await req.json()

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email đã được sử dụng' }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const referralCode = Math.random().toString(36).substring(2, 10).toUpperCase()

    // Find referrer
    let referrerId: string | undefined
    if (ref) {
      const referrer = await prisma.user.findFirst({ where: { referralCode: ref } })
      if (referrer) referrerId = referrer.id
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        referralCode,
        referredBy: referrerId,
      },
    })

    // Create referral record
    if (referrerId) {
      await prisma.referral.create({
        data: { referrerId, refereeId: user.id },
      })
    }

    return NextResponse.json({ id: user.id, email: user.email }, { status: 201 })
  } catch (err) {
    console.error('Register error:', err)
    return NextResponse.json({ error: 'Đăng ký thất bại' }, { status: 500 })
  }
}

// GET /api/user — Get current user stats
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, name: true, email: true, avatar: true,
      isPremium: true, premiumUntil: true, tokens: true,
      lives: true, livesLastRegen: true, referralCode: true,
      learningLanguage: true,
      createdAt: true,
    },
  })

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Calculate regen
  const minutesSince = (Date.now() - user.livesLastRegen.getTime()) / 60000
  const livesRegened = Math.floor(minutesSince / 5)
  const actualLives = Math.min(user.lives + livesRegened, 5)
  const nextRegenMinutes = Math.ceil(5 - (minutesSince % 5))

  const isPremiumActive = user.isPremium && user.premiumUntil && user.premiumUntil > new Date()

  return NextResponse.json({
    ...user,
    lives: isPremiumActive ? 999 : actualLives,
    tokens: isPremiumActive ? 999 : user.tokens,
    isPremiumActive,
    nextRegenMinutes,
  })
}

// PATCH /api/user — update profile preferences (currently: learningLanguage)
export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const data: { learningLanguage?: string } = {}

  if (body.learningLanguage !== undefined) {
    if (!isLangCode(body.learningLanguage)) {
      return NextResponse.json({ error: 'Ngôn ngữ không hợp lệ' }, { status: 400 })
    }
    data.learningLanguage = body.learningLanguage
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Không có thay đổi' }, { status: 400 })
  }

  await prisma.user.update({ where: { id: session.user.id }, data })
  return NextResponse.json({ ok: true, ...data })
}
