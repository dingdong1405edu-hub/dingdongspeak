import { GoogleGenerativeAI } from '@google/generative-ai'

// Lazy init — tránh crash khi build (GEMINI_API_KEY chưa có)
let _genAI: GoogleGenerativeAI | null = null
function getModel() {
  if (!_genAI) _genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  return _genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
}

export interface ScoreResult {
  overall: number
  fluency: number
  lexical: number
  grammar: number
  pronunciation: number
  feedback: string
  corrections: Array<{ wrong: string; correct: string; note?: string }>
}

export interface IELTSQuestion {
  id: string
  question: string
  part: 'PART1' | 'PART2' | 'PART3'
  hint?: string
  cueCard?: string[]
}

const SCORER_PROMPT = (question: string, transcript: string, part: string) =>
  `You are a strict IELTS examiner. Score according to official Band Descriptors.
Band guide: 9=native-like, 7-8=fluent minor errors, 5-6=communicates with errors, 4-5=limited.
Do NOT inflate scores.

Question: "${question}"
Part: ${part}
Response: "${transcript}"

Find ALL grammar/spelling/vocabulary errors. Use exact words from the response.

Return ONLY this JSON (no markdown, no extra text):
{"overall":<0-9 step 0.5>,"fluency":<0-9>,"lexical":<0-9>,"grammar":<0-9>,"pronunciation":<0-9>,"feedback":"<2 sentences>","corrections":[{"wrong":"<exact text>","correct":"<fix>","note":"<reason>"}]}`

export async function scoreIELTSResponse(
  question: string,
  transcript: string,
  part: string
): Promise<ScoreResult> {
  try {
    const result = await getModel().generateContent(SCORER_PROMPT(question, transcript, part))
    const text = result.response.text().trim()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON')
    const parsed = JSON.parse(jsonMatch[0]) as ScoreResult
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
  const prompt = `Generate ${count} IELTS Speaking ${part === 'FULL' ? 'Full Test' : part} questions about: "${topic}".
${part === 'PART2' ? 'Include cue card with 3-4 bullet points.' : ''}
Match official IELTS difficulty and style.
Return ONLY valid JSON array:
[{"id":"q1","question":"<text>","part":"${part === 'FULL' ? 'PART1' : part}","hint":"<short tip>"${part === 'PART2' ? ',"cueCard":["<bullet>","<bullet>","<bullet>"]' : ''}}]`

  try {
    const result = await getModel().generateContent(prompt)
    const text = result.response.text().trim()
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('No JSON array')
    return JSON.parse(jsonMatch[0]) as IELTSQuestion[]
  } catch {
    return getDefaultQuestions(topic, part, count)
  }
}

export async function generateSampleAnswer(
  question: string,
  part: string,
  band: number = 8
): Promise<string> {
  const lengthGuide: Record<string, string> = {
    PART1: '2-3 sentences, 30-45 words',
    PART2: '230-280 words, clear intro-body-conclusion',
    PART3: '3-5 sentences, 60-80 words, opinion + reason + example',
  }

  const prompt = `Write a Band ${band}.0 IELTS Speaking model answer for:
"${question}" (${part})
Length: ${lengthGuide[part] ?? '50-80 words'}
Use varied vocabulary, discourse markers, complex grammar, natural fillers.
Output ONLY the answer text.`

  try {
    const result = await getModel().generateContent(prompt)
    const text = result.response.text().trim()
    if (!text) throw new Error('Empty response')
    return text
  } catch {
    return generateSampleAnswerWithGroq(question, part, band)
  }
}

export async function generateVocabAndIdioms(
  question: string,
  topic: string
): Promise<{ vocabulary: string[]; idioms: string[] }> {
  const prompt = `IELTS topic: "${topic}", question: "${question}"
Give 5 vocabulary + 3 idioms/collocations. Format: "word — nghĩa tiếng Việt" (max 5 words Vietnamese).
Return ONLY JSON: {"vocabulary":["..."],"idioms":["..."]}`

  try {
    const result = await getModel().generateContent(prompt)
    const text = result.response.text().trim()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON')
    const parsed = JSON.parse(jsonMatch[0])
    if (!parsed.vocabulary?.length && !parsed.idioms?.length) throw new Error('Empty result')
    return parsed
  } catch {
    return generateVocabWithGroq(question, topic)
  }
}

export async function scoreBeginnerSpeaking(
  topic: string,
  transcript: string
): Promise<{ score: number; feedback: string; corrections: string[] }> {
  const prompt = `English coach for beginners.
Topic: "${topic}"
Student: "${transcript}"
Score 1-100: Accuracy 40% + Fluency 30% + Relevance 30%.
Return ONLY JSON: {"score":<0-100>,"feedback":"<1-2 encouraging sentences>","corrections":["<fix1>","<fix2>"]}`

  try {
    const result = await getModel().generateContent(prompt)
    const text = result.response.text().trim()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON')
    return JSON.parse(jsonMatch[0])
  } catch {
    return { score: 70, feedback: 'Good effort! Keep practicing.', corrections: [] }
  }
}

// ─── Groq fallbacks ────────────────────────────────────────────────────────

async function getGroq() {
  const { default: Groq } = await import('groq-sdk')
  return new Groq({ apiKey: process.env.GROQ_API_KEY })
}

async function scoreWithGroq(question: string, transcript: string, part: string): Promise<ScoreResult> {
  const groq = await getGroq()
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{
      role: 'user',
      content: `Score IELTS Speaking strictly. Q: "${question}" | Response: "${transcript}" | Part: ${part}
Find grammar/spelling errors. Return JSON: {"overall":6.0,"fluency":6.0,"lexical":6.0,"grammar":6.0,"pronunciation":6.0,"feedback":"...","corrections":[{"wrong":"...","correct":"...","note":"..."}]}`,
    }],
    response_format: { type: 'json_object' },
  })
  const result = JSON.parse(completion.choices[0].message.content || '{}') as ScoreResult
  if (!result.corrections) result.corrections = []
  return result
}

async function generateSampleAnswerWithGroq(question: string, part: string, band: number): Promise<string> {
  const groq = await getGroq()
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{
      role: 'user',
      content: `Write a Band ${band}.0 IELTS Speaking answer for: "${question}" (${part}). Natural, academic, fluent. Output answer text only.`,
    }],
    max_tokens: 400,
  })
  return completion.choices[0].message.content?.trim() || ''
}

async function generateVocabWithGroq(question: string, topic: string): Promise<{ vocabulary: string[]; idioms: string[] }> {
  const groq = await getGroq()
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{
      role: 'user',
      content: `IELTS topic "${topic}", question "${question}": give 5 vocabulary + 3 idioms. Format: "word — nghĩa tiếng Việt". Return JSON: {"vocabulary":["..."],"idioms":["..."]}`,
    }],
    response_format: { type: 'json_object' },
  })
  const parsed = JSON.parse(completion.choices[0].message.content || '{}')
  return { vocabulary: parsed.vocabulary || [], idioms: parsed.idioms || [] }
}

function getDefaultQuestions(topic: string, part: string, count: number): IELTSQuestion[] {
  const defaults = [
    { id: 'q1', question: `Tell me about your experience with ${topic}.`, part: 'PART1' as const },
    { id: 'q2', question: `How has ${topic} influenced your daily life?`, part: 'PART1' as const },
    { id: 'q3', question: `Do you think ${topic} is important in modern society? Why?`, part: 'PART3' as const },
  ]
  return defaults.slice(0, count)
}
