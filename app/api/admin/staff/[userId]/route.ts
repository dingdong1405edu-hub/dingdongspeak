import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireOwnerOrAdmin } from '@/lib/admin-auth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    await requireOwnerOrAdmin()
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { userId } = await params
  const { role } = await req.json()
  if (!['STAFF', 'ADMIN', 'USER'].includes(role)) {
    return NextResponse.json({ error: 'Role không hợp lệ' }, { status: 400 })
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, name: true, email: true, role: true },
  })

  return NextResponse.json({ user: updated })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    await requireOwnerOrAdmin()
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { userId } = await params
  await prisma.user.update({ where: { id: userId }, data: { role: 'USER' } })
  return NextResponse.json({ success: true })
}
