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
  strengths: string[]
  improvements: string[]
  corrections: Array<{ wrong: string; correct: string; note?: string }>
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

Score this response. Also find ALL grammar, vocabulary, and spelling errors in the candidate response.
For each error, provide the exact wrong word/phrase as it appears, the corrected version, and a very brief note.
Only include real errors — do not invent errors that are not present.

Return ONLY valid JSON:
{
  "overall": <number 0-9 in 0.5 increments>,
  "fluency": <number 0-9>,
  "lexical": <number 0-9>,
  "grammar": <number 0-9>,
  "pronunciation": <number 0-9>,
  "feedback": "<2-3 sentence overall feedback in English>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
  "corrections": [
    {"wrong": "<exact wrong word/phrase from response>", "correct": "<corrected version>", "note": "<brief grammar/spelling note>"}
  ]
}`

  try {
    const result = await getModel().generateContent(prompt)
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
    const result = await getModel().generateContent(prompt)
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
    PART1: '2-3 sentences, 30-45 words',
    PART2: '2-minute speech, 230-280 words, clear intro-body-conclusion',
    PART3: '3-5 sentences, 60-80 words with opinion + reason + example',
  }

  const prompt = `Write a Band ${band}.0 IELTS Speaking model answer for this exact question:
"${question}"
Part: ${part}
Target length: ${lengthGuide[part as keyof typeof lengthGuide] || '50-80 words'}

Requirements:
- Answer ONLY based on the question above, do NOT reference any previous student response
- Use varied academic vocabulary, natural discourse markers, complex sentence structures
- Include natural spoken fillers (well, actually, to be honest...)
- Sound fluent and natural, like a high-scoring IELTS candidate

Output the sample answer text ONLY, no labels, no preamble.`

  try {
    const result = await getModel().generateContent(prompt)
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
- 5 useful vocabulary words/phrases relevant to this topic
- 3 natural idioms or collocations that fit this topic

Rules:
- Each entry must be SHORT: "word — nghĩa tiếng Việt" (Vietnamese meaning only, max 5 words)
- No long English definitions
- Choose words a Vietnamese IELTS learner would actually use

Return ONLY valid JSON:
{
  "vocabulary": ["word — nghĩa TV", "phrase — nghĩa TV", ...],
  "idioms": ["idiom — nghĩa TV", "idiom — nghĩa TV", "idiom — nghĩa TV"]
}`

  try {
    const result = await getModel().generateContent(prompt)
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
    const result = await getModel().generateContent(prompt)
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
      content: `Score this IELTS Speaking response strictly. Q: "${question}" | Response: "${transcript}" | Part: ${part}
Find grammar/spelling errors in the response and list them.
Return JSON: {"overall":6.0,"fluency":6.0,"lexical":6.0,"grammar":6.0,"pronunciation":6.0,"feedback":"...","strengths":["..."],"improvements":["..."],"corrections":[{"wrong":"...","correct":"...","note":"..."}]}`
    }],
    response_format: { type: 'json_object' },
  })

  const result = JSON.parse(completion.choices[0].message.content || '{}') as ScoreResult
  if (!result.corrections) result.corrections = []
  return result
}

function getDefaultQuestions(topic: string, part: string, count: number): IELTSQuestion[] {
  const defaults = [
    { id: 'q1', question: `Tell me about your experience with ${topic}.`, part: 'PART1' as const },
    { id: 'q2', question: `How has ${topic} influenced your daily life?`, part: 'PART1' as const },
    { id: 'q3', question: `Do you think ${topic} is important in modern society? Why?`, part: 'PART3' as const },
  ]
  return defaults.slice(0, count)
}
