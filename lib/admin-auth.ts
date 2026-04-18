import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean)

export type AdminRole = 'OWNER' | 'ADMIN' | 'STAFF' | null

export async function getAdminRole(): Promise<AdminRole> {
  const session = await auth()
  if (!session?.user?.email) return null

  // Owner: email in env var — full access, cannot be revoked via UI
  if (ADMIN_EMAILS.includes(session.user.email)) return 'OWNER'

  // DB-granted roles
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true },
  })
  if (user?.role === 'ADMIN') return 'ADMIN'
  if (user?.role === 'STAFF') return 'STAFF'
  return null
}

export async function requireAdmin() {
  const role = await getAdminRole()
  if (!role) throw new Error('Forbidden')
  return role
}

export async function requireOwnerOrAdmin() {
  const role = await getAdminRole()
  if (role !== 'OWNER' && role !== 'ADMIN') throw new Error('Forbidden')
  return role
}
