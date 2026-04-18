import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { GoogleGenerativeAI } from '@google/generative-ai'

type LessonType = 'vocabulary' | 'grammar' | 'speaking'

let _genAI: GoogleGenerativeAI | null = null
function getModel() {
  if (!_genAI) _genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  // gemini-2.5-flash: best accuracy for admin lesson creation (paid tier)
  return _genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
}

async function generateWithGemini(prompt: string): Promise<any[]> {
  const result = await getModel().generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json' } as any,
  })
  const data = JSON.parse(result.response.text())
  return Array.isArray(data) ? data : data.cards ?? []
}

function buildPrompt(type: LessonType, level: string, topic: string, docText?: string): string {
  const src = docText
    ? `Analyze this document and create the lesson from it:\n---\n${docText.slice(0, 8000)}\n---\nTopic: ${topic}`
    : `Topic: ${topic}`

  if (type === 'vocabulary') {
    return `English teacher. Vietnamese learners, level ${level}. ${src}

Create 10 vocabulary flashcard-quiz cards. JSON array:
[{"type":"vocab","word":"word/phrase","phonetic":"/IPA/","pos":"n.|v.|adj.|adv.|phrase","meaning":"Nghĩa tiếng Việt","example":"Natural example sentence.","options":["Đúng","Sai1","Sai2","Sai3"],"answer":"Đúng"}]

Rules: options exactly 4 (all Vietnamese), answer must match one option exactly, word fits level+topic, real IPA.`
  }

  if (type === 'grammar') {
    return `English teacher. Vietnamese learners, level ${level}. ${src}

Create 8 grammar cards. JSON array:
[{"type":"grammar","rule":"Rule name","explanation":"Giải thích tiếng Việt rõ ràng","examples":["Sentence1.","Sentence2.","Sentence3."],"tip":"Mẹo/lỗi hay gặp tiếng Việt","question":"Fill-in or MCQ exercise","options":["a","b","c","d"],"answer":"a"}]

Rules: options exactly 4, answer is one of them exactly, explanation in Vietnamese.`
  }

  return `English teacher. Vietnamese learners, level ${level}. ${src}

Create 10 IELTS Part 1 speaking practice cards. JSON array:
[{"type":"speaking","prompt":"Natural IELTS Part 1 question","hint":"Gợi ý trả lời tiếng Việt (2-3 ý)","samplePhrases":["Opening phrase","Key vocab phrase","Linking phrase"]}]

Rules: prompt matches IELTS Part 1 style, hint in Vietnamese, 3-5 samplePhrases.`
}

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
    const prompt = buildPrompt(type as LessonType, level, topic, docText)
    const cards = await generateWithGemini(prompt)
    if (!cards.length) throw new Error('AI không tạo được cards')
    return NextResponse.json({ cards })
  } catch (error: any) {
    console.error('Admin AI generate error:', error?.message)
    return NextResponse.json({ error: error?.message || 'AI tạo bài học thất bại' }, { status: 500 })
  }
}
