import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

export interface ScoreResult {
  overall: number
  fluency: number
  lexical: number
  grammar: number
  pronunciation: number
  feedback: string
  strengths: string[]
  improvements: string[]
}

export interface IELTSQuestion {
  id: string
  question: string
  part: 'PART1' | 'PART2' | 'PART3'
  hint?: string
  cueCard?: string[]
}

const SCORER_SYSTEM = `You are a certified IELTS examiner with 10+ years of experience.
Score strictly according to official IELTS Speaking Band Descriptors.
Score distribution: Band 9 (native-like, <1%), Band 7-8 (fluent, minor errors), Band 5-6 (communicates with noticeable errors), Band 4-5 (limited range).
DO NOT give band 8+ unless the response genuinely merits it. Be strict and honest.
Always respond with valid JSON only.`

export async function scoreIELTSResponse(
  question: string,
  transcript: string,
  part: string
): Promise<ScoreResult> {
  const prompt = `${SCORER_SYSTEM}

Question: "${question}"
Part: ${part}
Candidate response: "${transcript}"

Score this response. Return ONLY valid JSON:
{
  "overall": <number 0-9 in 0.5 increments>,
  "fluency": <number 0-9>,
  "lexical": <number 0-9>,
  "grammar": <number 0-9>,
  "pronunciation": <number 0-9>,
  "feedback": "<2-3 sentence overall feedback>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"]
}`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text().trim()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in response')
    return JSON.parse(jsonMatch[0]) as ScoreResult
  } catch {
    return await scoreWithGroq(question, transcript, part)
  }
}

export async function generateIELTSQuestions(
  topic: string,
  part: 'PART1' | 'PART2' | 'PART3' | 'FULL',
  count: number
): Promise<IELTSQuestion[]> {
  const partDesc = {
    PART1: 'personal and familiar topics (daily life, hobbies, family, work)',
    PART2: 'individual long turn with cue card (2 minutes speaking)',
    PART3: 'abstract discussion and analysis related to the topic',
    FULL: 'all three parts combined',
  }

  const prompt = `Generate ${count} IELTS Speaking ${part === 'FULL' ? 'Full Test' : part} questions about the topic: "${topic}".
${part === 'PART2' ? 'Include a cue card with 3-4 bullet points for the candidate to address.' : ''}
Questions must match official IELTS difficulty and style.
Return ONLY valid JSON array:
[{
  "id": "q1",
  "question": "<question text>",
  "part": "${part === 'FULL' ? 'PART1' : part}",
  "hint": "<optional speaking hint>"
  ${part === 'PART2' ? ', "cueCard": ["<bullet 1>", "<bullet 2>", "<bullet 3>"]' : ''}
}]`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text().trim()
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('No JSON array in response')
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
  const lengthGuide = {
    PART1: '2-3 sentences, 30-40 words',
    PART2: '2 minute speech, 250-300 words with clear structure',
    PART3: '3-5 sentences, 60-80 words with analysis',
  }

  const prompt = `Write a Band ${band}.0 IELTS Speaking sample answer for:
Question: "${question}"
Part: ${part}
Length: ${lengthGuide[part as keyof typeof lengthGuide] || '50-80 words'}

Requirements: varied vocabulary, discourse markers, complex grammar, natural fillers.
Respond with ONLY the sample answer text, no labels.`

  try {
    const result = await model.generateContent(prompt)
    return result.response.text().trim()
  } catch {
    return 'Sample answer not available. Please try again.'
  }
}

export async function generateVocabAndIdioms(
  question: string,
  topic: string
): Promise<{ vocabulary: string[]; idioms: string[] }> {
  const prompt = `For the IELTS Speaking topic "${topic}" and question "${question}", provide:
- 5 advanced vocabulary words/phrases with brief definitions
- 3 useful idioms or collocations

Return ONLY valid JSON:
{
  "vocabulary": ["word - definition", "word - definition", ...],
  "idioms": ["idiom - meaning", "idiom - meaning", "idiom - meaning"]
}`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text().trim()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON')
    return JSON.parse(jsonMatch[0])
  } catch {
    return { vocabulary: [], idioms: [] }
  }
}

export async function scoreBeginnerSpeaking(
  topic: string,
  transcript: string
): Promise<{ score: number; feedback: string; corrections: string[] }> {
  const prompt = `You are an English speaking coach for beginners.
Topic: "${topic}"
Student said: "${transcript}"

Rate this response for a beginner (1-100 score):
- Accuracy (pronunciation attempt, correct words): 40%
- Fluency (natural flow, minimal pausing): 30%
- Relevance (on-topic): 30%

Return ONLY valid JSON:
{
  "score": <number 0-100>,
  "feedback": "<encouraging 1-2 sentence feedback>",
  "corrections": ["<specific correction 1>", "<specific correction 2>"]
}`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text().trim()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON')
    return JSON.parse(jsonMatch[0])
  } catch {
    return { score: 70, feedback: 'Good effort! Keep practicing.', corrections: [] }
  }
}

// Fallback to Groq
async function scoreWithGroq(question: string, transcript: string, part: string): Promise<ScoreResult> {
  const { default: Groq } = await import('groq-sdk')
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{
      role: 'user',
      content: `Score IELTS Speaking response strictly. Q: "${question}" | Response: "${transcript}" | Part: ${part}
Return JSON: {"overall":6.0,"fluency":6.0,"lexical":6.0,"grammar":6.0,"pronunciation":6.0,"feedback":"...","strengths":["..."],"improvements":["..."]}`
    }],
    response_format: { type: 'json_object' },
  })

  return JSON.parse(completion.choices[0].message.content || '{}') as ScoreResult
}

function getDefaultQuestions(topic: string, part: string, count: number): IELTSQuestion[] {
  const defaults = [
    { id: 'q1', question: `Tell me about your experience with ${topic}.`, part: 'PART1' as const },
    { id: 'q2', question: `How has ${topic} influenced your daily life?`, part: 'PART1' as const },
    { id: 'q3', question: `Do you think ${topic} is important in modern society? Why?`, part: 'PART3' as const },
  ]
  return defaults.slice(0, count)
}
