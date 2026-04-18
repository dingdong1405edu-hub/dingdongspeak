import { GoogleGenerativeAI } from '@google/generative-ai'

let _genAI: GoogleGenerativeAI | null = null
let _groq: any = null

function getGemini() {
  if (!_genAI) _genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  return _genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
}

async function getGroq() {
  if (!_groq) {
    const { default: Groq } = await import('groq-sdk')
    _groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
  }
  return _groq
}

// Gemini with forced JSON output — no regex needed, saves output tokens
async function geminiJSON<T>(prompt: string): Promise<T> {
  const result = await getGemini().generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json' } as any,
  })
  return JSON.parse(result.response.text())
}

async function geminiText(prompt: string): Promise<string> {
  const result = await getGemini().generateContent(prompt)
  return result.response.text().trim()
}

async function groqJSON<T>(content: string, maxTokens = 300): Promise<T> {
  const groq = await getGroq()
  const res = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content }],
    response_format: { type: 'json_object' },
    max_tokens: maxTokens,
  })
  return JSON.parse(res.choices[0].message.content || '{}')
}

async function groqText(content: string, maxTokens = 300): Promise<string> {
  const groq = await getGroq()
  const res = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content }],
    max_tokens: maxTokens,
  })
  return res.choices[0].message.content?.trim() || ''
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ScoreResult {
  overall: number
  fluency: number
  lexical: number
  grammar: number
  pronunciation: number
  feedback: string
  corrections: Array<{ wrong: string; correct: string }>
}

export interface IELTSQuestion {
  id: string
  question: string
  part: 'PART1' | 'PART2' | 'PART3'
  hint?: string
  cueCard?: string[]
}

// ─── ACCURACY tasks → Gemini ──────────────────────────────────────────────────

export async function scoreIELTSResponse(
  question: string,
  transcript: string,
  part: string
): Promise<ScoreResult> {
  const prompt = `Strict IELTS examiner. Vietnamese learners typically 4.5-6.5. Never inflate.
Q(${part}): "${question}"
Answer: "${transcript}"
Find max 3 errors using exact words from the answer.
JSON: {"overall":5.5,"fluency":5.5,"lexical":5.5,"grammar":5.5,"pronunciation":5.5,"feedback":"1-2 câu tiếng Việt","corrections":[{"wrong":"exact phrase","correct":"fix"}]}`

  try {
    const parsed = await geminiJSON<ScoreResult>(prompt)
    if (!parsed.corrections) parsed.corrections = []
    return parsed
  } catch {
    return scoreWithGroq(question, transcript, part)
  }
}

export async function generateIELTSQuestions(
  topic: string,
  part: 'PART1' | 'PART2' | 'PART3' | 'FULL',
  count: number
): Promise<IELTSQuestion[]> {
  const isPart2 = part === 'PART2'
  const prompt = `${count} IELTS Speaking ${part === 'FULL' ? 'Part 1' : part} questions, topic: "${topic}".
${isPart2 ? 'Include cueCard array (3 bullet points).' : ''}
JSON array: [{"id":"q1","question":"...","part":"${part === 'FULL' ? 'PART1' : part}","hint":"short tip"${isPart2 ? ',"cueCard":["...","...","..."]' : ''}}]`

  try {
    return await geminiJSON<IELTSQuestion[]>(prompt)
  } catch {
    return getDefaultQuestions(topic, part, count)
  }
}

export async function generateSampleAnswer(
  question: string,
  part: string,
  band = 8
): Promise<string> {
  const len: Record<string, string> = {
    PART1: '30-45 words',
    PART2: '230-280 words',
    PART3: '60-80 words',
  }
  const prompt = `Band ${band} IELTS ${part} answer: "${question}"
${len[part] ?? '60 words'}. Varied vocab, discourse markers, natural flow.
Output answer text only.`

  try {
    const text = await geminiText(prompt)
    if (!text) throw new Error('empty')
    return text
  } catch {
    return generateSampleAnswerWithGroq(question, part, band)
  }
}

// ─── REALTIME / SUPPLEMENTARY tasks → Groq ────────────────────────────────────

// Vocab/idiom suggestions shown after scoring — speed matters
export async function generateVocabAndIdioms(
  question: string,
  topic: string
): Promise<{ vocabulary: string[]; idioms: string[] }> {
  try {
    const res = await groqJSON<{ vocabulary: string[]; idioms: string[] }>(
      `IELTS topic "${topic}", Q: "${question}". Give 5 vocab + 3 idioms, format "word — nghĩa Việt ngắn". JSON: {"vocabulary":["..."],"idioms":["..."]}`,
      200
    )
    return { vocabulary: res.vocabulary || [], idioms: res.idioms || [] }
  } catch {
    return { vocabulary: [], idioms: [] }
  }
}

// Inline answer improvement — user wants instant feedback
export async function improveAnswer(
  transcript: string,
  question: string,
  part: string
): Promise<string> {
  try {
    return await groqText(
      `Rewrite to IELTS Band 7. Keep ideas. Fix grammar, better vocab, add discourse markers.
Student (${part}): "${transcript}" | Q: "${question}"
Output improved answer only.`,
      300
    )
  } catch {
    return transcript
  }
}

// Beginner game scoring — realtime after each card
export async function scoreBeginnerSpeaking(
  topic: string,
  transcript: string
): Promise<{ score: number; feedback: string; corrections: string[] }> {
  try {
    return await groqJSON(
      `English coach for beginners. Topic: "${topic}". Student: "${transcript}".
Score 0-100 (Accuracy 40%+Fluency 30%+Relevance 30%). JSON: {"score":70,"feedback":"1 encouraging sentence","corrections":["fix1"]}`,
      150
    )
  } catch {
    return { score: 70, feedback: 'Good effort! Keep practicing.', corrections: [] }
  }
}

// ─── Groq fallbacks for Gemini tasks ─────────────────────────────────────────

async function scoreWithGroq(question: string, transcript: string, part: string): Promise<ScoreResult> {
  const result = await groqJSON<ScoreResult>(
    `Strict IELTS examiner. Vietnamese typically 4.5-6.5. Don't inflate.
Q(${part}): "${question}" | Answer: "${transcript}"
JSON: {"overall":5.5,"fluency":5.5,"lexical":5.5,"grammar":5.5,"pronunciation":5.5,"feedback":"1-2 câu tiếng Việt","corrections":[{"wrong":"...","correct":"..."}]}`,
    400
  )
  if (!result.corrections) result.corrections = []
  return result
}

async function generateSampleAnswerWithGroq(question: string, part: string, band: number): Promise<string> {
  return groqText(
    `Band ${band} IELTS ${part} answer for: "${question}". Natural, academic. Output text only.`,
    400
  )
}

function getDefaultQuestions(topic: string, part: string, count: number): IELTSQuestion[] {
  return [
    { id: 'q1', question: `Tell me about your experience with ${topic}.`, part: 'PART1' as const },
    { id: 'q2', question: `How has ${topic} influenced your daily life?`, part: 'PART1' as const },
    { id: 'q3', question: `Do you think ${topic} is important in modern society? Why?`, part: 'PART3' as const },
  ].slice(0, count)
}
