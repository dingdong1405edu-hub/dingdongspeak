import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { GoogleGenerativeAI } from '@google/generative-ai'

type LessonType = 'vocabulary' | 'grammar' | 'speaking'

function buildPrompt(type: LessonType, level: string, topic: string, docText?: string): string {
  const context = docText
    ? `Phân tích tài liệu sau và tạo bài học từ nội dung đó:\n\n---\n${docText.slice(0, 8000)}\n---\n\nChủ đề/Topic: ${topic}`
    : `Chủ đề/Topic: ${topic}`

  if (type === 'vocabulary') {
    return `You are an English teacher creating a vocabulary lesson for Vietnamese learners at level ${level}.
${context}

Create exactly 10 vocabulary flashcard-quiz cards.

Return ONLY a valid JSON array (no markdown, no explanation):
[{
  "type": "vocab",
  "word": "English word or phrase",
  "phonetic": "/IPA phonetic/",
  "pos": "n. or v. or adj. or adv. or phrase",
  "meaning": "Nghĩa tiếng Việt ngắn gọn",
  "example": "A natural example sentence using this word.",
  "options": ["Nghĩa đúng tiếng Việt", "Nghĩa sai 1", "Nghĩa sai 2", "Nghĩa sai 3"],
  "answer": "Nghĩa đúng tiếng Việt"
}]

Rules:
- options: exactly 4 items, all in Vietnamese, answer must match one option exactly
- word: real, useful vocabulary appropriate for the level and topic
- example: natural sentence, not forced
- phonetic: real IPA notation`
  }

  if (type === 'grammar') {
    return `You are an English teacher creating a grammar lesson for Vietnamese learners at level ${level}.
${context}

Create exactly 8 grammar rule cards, each with explanation and exercise.

Return ONLY a valid JSON array (no markdown, no explanation):
[{
  "type": "grammar",
  "rule": "Rule name (e.g. 'Present Simple - Subject + V(s/es)')",
  "explanation": "Giải thích rõ ràng bằng tiếng Việt, dễ hiểu cho học viên Việt Nam",
  "examples": ["Example sentence 1.", "Example sentence 2.", "Example sentence 3."],
  "tip": "Mẹo học hoặc lỗi hay gặp (tiếng Việt)",
  "question": "Fill in the blank or choose the correct option: She ___ (go) to school every day.",
  "options": ["goes", "go", "going", "went"],
  "answer": "goes"
}]

Rules:
- options: exactly 4 items, answer must be one of them exactly
- explanation: Vietnamese, clear and educational
- examples: 3 natural sentences demonstrating the rule`
  }

  return `You are an English teacher creating IELTS Part 1 speaking practice for Vietnamese learners at level ${level}.
${context}

Create exactly 10 speaking practice cards.

Return ONLY a valid JSON array (no markdown, no explanation):
[{
  "type": "speaking",
  "prompt": "A natural IELTS Part 1 style question",
  "hint": "Gợi ý cách trả lời bằng tiếng Việt (2-3 ý chính cần đề cập)",
  "samplePhrases": [
    "Useful opening phrase...",
    "Key vocabulary phrase...",
    "Closing/linking phrase..."
  ]
}]

Rules:
- prompt: natural IELTS Part 1 question style
- hint: Vietnamese guide for answering
- samplePhrases: 3-5 useful phrases for answering this question`
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { type, level, topic, docText } = await req.json()

  if (!type || !level || !topic) {
    return NextResponse.json({ error: 'Thiếu thông tin: type, level, topic' }, { status: 400 })
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const prompt = buildPrompt(type as LessonType, level, topic, docText)
    const result = await model.generateContent(prompt)
    const text = result.response.text().trim()

    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('AI không trả về JSON hợp lệ')

    const cards = JSON.parse(jsonMatch[0])
    if (!Array.isArray(cards) || cards.length === 0) throw new Error('Không tạo được cards')

    return NextResponse.json({ cards })
  } catch (error: any) {
    console.error('AI generate error:', error)
    return NextResponse.json({ error: error?.message || 'AI tạo bài học thất bại' }, { status: 500 })
  }
}
