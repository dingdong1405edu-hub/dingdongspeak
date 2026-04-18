import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireOwnerOrAdmin } from '@/lib/admin-auth'

export async function GET() {
  try {
    await requireOwnerOrAdmin()
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const staff = await prisma.user.findMany({
    where: { role: { in: ['STAFF', 'ADMIN'] } },
    select: { id: true, name: true, email: true, avatar: true, role: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({ staff })
}

export async function POST(req: NextRequest) {
  try {
    await requireOwnerOrAdmin()
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { email, role } = await req.json()
  if (!email || !['STAFF', 'ADMIN'].includes(role)) {
    return NextResponse.json({ error: 'Email và role không hợp lệ' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return NextResponse.json({ error: 'Không tìm thấy tài khoản với email này. Người dùng phải đăng nhập ít nhất 1 lần.' }, { status: 404 })
  }

  const updated = await prisma.user.update({
    where: { email },
    data: { role },
    select: { id: true, name: true, email: true, avatar: true, role: true },
  })

  return NextResponse.json({ user: updated })
}
