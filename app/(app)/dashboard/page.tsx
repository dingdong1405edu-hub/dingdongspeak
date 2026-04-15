import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { DashboardClient } from './dashboard-client'
import { subDays, startOfMonth, format } from 'date-fns'

export const metadata = { title: 'Dashboard' }

async function getDashboardData(userId: string) {
  const now = new Date()
  const yearAgo = subDays(now, 365)
  const monthStart = startOfMonth(now)

  const [user, streaks, sessions, leaderboard] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true, tokens: true, lives: true, isPremium: true,
        premiumUntil: true, livesLastRegen: true, referralCode: true,
      },
    }),
    prisma.streak.findMany({
      where: { userId, date: { gte: yearAgo } },
      select: { date: true, practiced: true },
    }),
    prisma.practiceSession.findMany({
      where: { userId },
      select: { createdAt: true, duration: true, scores: true, type: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    prisma.practiceSession.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: monthStart } },
      _sum: { duration: true },
      _count: { id: true },
      orderBy: { _sum: { duration: 'desc' } },
      take: 10,
    }),
  ])

  // Calculate streak
  let currentStreak = 0
  let longestStreak = 0
  let temp = 0
  const streakDates = new Set(streaks.filter(s => s.practiced).map(s => format(new Date(s.date), 'yyyy-MM-dd')))
  for (let i = 0; i <= 365; i++) {
    const d = format(subDays(now, i), 'yyyy-MM-dd')
    if (streakDates.has(d)) {
      if (i === 0 || i === 1) currentStreak = (currentStreak || 0) + 1
      temp++
      longestStreak = Math.max(longestStreak, temp)
    } else {
      if (i > 1 && currentStreak > 0) break
      temp = 0
    }
  }

  // Avg band score
  const ieltsScores = sessions
    .filter(s => s.type !== 'BEGINNER')
    .map(s => (s.scores as { overall?: number })?.overall || 0)
    .filter(s => s > 0)
  const avgBand = ieltsScores.length
    ? (ieltsScores.reduce((a, b) => a + b, 0) / ieltsScores.length).toFixed(1)
    : null

  // Weekly minutes
  const weekStart = subDays(now, 7)
  const weeklyMinutes = sessions
    .filter(s => new Date(s.createdAt) >= weekStart)
    .reduce((sum, s) => sum + Math.floor(s.duration / 60), 0)

  // Lives regen
  const minutesSince = (now.getTime() - (user?.livesLastRegen?.getTime() || 0)) / 60000
  const livesRegened = Math.floor(minutesSince / 30)
  const isPremiumActive = user?.isPremium && user?.premiumUntil && user.premiumUntil > now
  const actualLives = isPremiumActive ? 999 : Math.min((user?.lives || 0) + livesRegened, 5)
  const nextRegenMinutes = Math.ceil(30 - (minutesSince % 30))

  // Get leaderboard with names
  const leaderboardWithNames = await Promise.all(
    leaderboard.map(async (entry, i) => {
      const u = await prisma.user.findUnique({
        where: { id: entry.userId },
        select: { name: true, avatar: true },
      })
      return {
        userId: entry.userId,
        name: u?.name || 'Anonymous',
        avatar: u?.avatar,
        totalMinutes: Math.floor((entry._sum.duration || 0) / 60),
        totalSessions: entry._count.id,
        rank: i + 1,
      }
    })
  )

  return {
    user: {
      ...user,
      lives: actualLives,
      tokens: isPremiumActive ? 999 : (user?.tokens || 0),
      isPremiumActive,
      nextRegenMinutes,
    },
    streakData: streaks.map(s => ({ date: format(new Date(s.date), 'yyyy-MM-dd'), practiced: s.practiced })),
    currentStreak,
    longestStreak,
    totalSessions: sessions.length,
    weeklyMinutes,
    avgBand,
    leaderboard: leaderboardWithNames,
    recentSessions: sessions.slice(0, 5),
  }
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const data = await getDashboardData(session.user.id)
  return <DashboardClient data={data} userId={session.user.id} />
}
