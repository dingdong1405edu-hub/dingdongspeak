import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { generateLessonCards, extractContentFromImage } from '@/lib/gemini'

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { type, level, topic, count, docText, imageBase64, imageMimeType, pdfBase64 } = await req.json()

  if (!type || !level || !topic) {
    return NextResponse.json({ error: 'Thiếu type, level, hoặc topic' }, { status: 400 })
  }

  try {
    let effectiveDocText: string | undefined = docText

    if (imageBase64 && imageMimeType) {
      effectiveDocText = await extractContentFromImage(imageBase64, imageMimeType)
    } else if (pdfBase64) {
      // Use lib path directly to avoid pdf-parse v1 test file auto-loading
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse/lib/pdf-parse.js')
      const buffer = Buffer.from(pdfBase64, 'base64')
      const pdfData = await pdfParse(buffer)
      effectiveDocText = pdfData.text
    }

    const cards = await generateLessonCards(type, level, topic, count ? Number(count) : undefined, effectiveDocText)
    return NextResponse.json({ cards })
  } catch (error: any) {
    console.error('Admin AI generate error:', error?.message)
    return NextResponse.json({ error: error?.message || 'AI tạo bài học thất bại' }, { status: 500 })
  }
}
