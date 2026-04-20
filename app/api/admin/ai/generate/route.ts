import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { generateLessonCards } from '@/lib/gemini'

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { type, level, topic, docText } = await req.json()

  if (!type || !level || !topic) {
    return NextResponse.json({ error: 'Thiếu type, level, hoặc topic' }, { status: 400 })
  }

  try {
    const cards = await generateLessonCards(type, level, topic, docText)
    return NextResponse.json({ cards })
  } catch (error: any) {
    console.error('Admin AI generate error:', error?.message)
    return NextResponse.json({ error: error?.message || 'AI tạo bài học thất bại' }, { status: 500 })
  }
}
