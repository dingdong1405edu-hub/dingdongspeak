import Groq from 'groq-sdk'

// Web system: 100% Groq
// - llama-3.3-70b-versatile → accuracy tasks (scoring, questions, sample answers)
// - llama-3.1-8b-instant    → realtime/supplementary (beginner game, vocab hints, improve)

let _groq: Groq | null = null
function getGroq(): Groq {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
  return _groq
}

async function groqJSON<T>(content: string, model: string, maxTokens: number): Promise<T> {
  const res = await getGroq().chat.completions.create({
    model,
    messages: [{ role: 'user', content }],
    response_format: { type: 'json_object' },
    max_tokens: maxTokens,
    temperature: 0.3,
  })
  return JSON.parse(res.choices[0].message.content || '{}')
}

async function groqText(content: string, model: string, maxTokens: number): Promise<string> {
  const res = await getGroq().chat.completions.create({
    model,
    messages: [{ role: 'user', content }],
    max_tokens: maxTokens,
    temperature: 0.7,
  })
  return res.choices[0].message.content?.trim() || ''
}

const ACCURATE = 'llama-3.3-70b-versatile'  // accuracy tasks
const FAST = 'llama-3.1-8b-instant'          // realtime / supplementary

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

// ─── Accuracy tasks → llama-3.3-70b-versatile ─────────────────────────────────

export async function scoreIELTSResponse(
  question: string,
  transcript: string,
  part: string
): Promise<ScoreResult> {
  try {
    const result = await groqJSON<ScoreResult>(
      `Strict IELTS examiner. Vietnamese learners typically score 4.5-6.5. Never inflate.
Q(${part}): "${question}"
Answer: "${transcript}"
Find max 3 errors using exact words from the answer.
Return JSON: {"overall":5.5,"fluency":5.5,"lexical":5.5,"grammar":5.5,"pronunciation":5.5,"feedback":"1-2 câu nhận xét tiếng Việt","corrections":[{"wrong":"exact phrase","correct":"fix"}]}`,
      ACCURATE, 350
    )
    if (!result.corrections) result.corrections = []
    return result
  } catch {
    return { overall: 5.5, fluency: 5.5, lexical: 5.5, grammar: 5.5, pronunciation: 5.5, feedback: 'Không thể chấm điểm lúc này.', corrections: [] }
  }
}

export async function generateIELTSQuestions(
  topic: string,
  part: 'PART1' | 'PART2' | 'PART3' | 'FULL',
  count: number
): Promise<IELTSQuestion[]> {
  const targetPart = part === 'FULL' ? 'PART1' : part
  const isPart2 = part === 'PART2'

  try {
    const data = await groqJSON<{ questions: IELTSQuestion[] }>(
      `Generate ${count} IELTS Speaking ${targetPart} questions about topic: "${topic}".
${isPart2 ? 'For Part 2 include cueCard array with 3 bullet points.' : ''}
Return JSON: {"questions":[{"id":"q1","question":"...","part":"${targetPart}","hint":"short tip"${isPart2 ? ',"cueCard":["...","...","..."]' : ''}}]}`,
      ACCURATE, 600
    )
    return data.questions ?? []
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
  try {
    const text = await groqText(
      `Write a Band ${band} IELTS Speaking ${part} model answer for: "${question}"
Length: ${len[part] ?? '60 words'}. Use varied vocabulary, discourse markers, complex grammar, natural fillers.
Output the answer text only.`,
      ACCURATE, 450
    )
    if (!text) throw new Error('empty')
    return text
  } catch {
    return 'Sample answer unavailable. Please try again.'
  }
}

// ─── Realtime / supplementary → llama-3.1-8b-instant ─────────────────────────

export async function generateVocabAndIdioms(
  question: string,
  topic: string
): Promise<{ vocabulary: string[]; idioms: string[] }> {
  try {
    const res = await groqJSON<{ vocabulary: string[]; idioms: string[] }>(
      `IELTS topic "${topic}", question: "${question}". Give 5 vocabulary + 3 idioms, format "word — nghĩa Việt ngắn". Return JSON: {"vocabulary":["..."],"idioms":["..."]}`,
      FAST, 200
    )
    return { vocabulary: res.vocabulary || [], idioms: res.idioms || [] }
  } catch {
    return { vocabulary: [], idioms: [] }
  }
}

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
      FAST, 300
    )
  } catch {
    return transcript
  }
}

export async function scoreBeginnerSpeaking(
  question: string,
  transcript: string
): Promise<{ score: number; feedback: string; corrections: string[] }> {
  try {
    return await groqJSON(
      `You are an English speaking coach for beginners. Score this response strictly and accurately.
Question asked: "${question}"
Student's answer: "${transcript}"
Scoring criteria: Accuracy/Relevance to question (40%) + Grammar (30%) + Fluency/Vocabulary (30%).
Score range: 0-100. Be honest - if the answer is off-topic or has major errors, score below 50.
Return JSON only: {"score": <number>, "feedback": "<2 sentences in Vietnamese: praise + main improvement>", "corrections": ["<specific correction 1>", "<specific correction 2>"]}`,
      ACCURATE, 200
    )
  } catch {
    return { score: 50, feedback: 'Không thể chấm điểm. Vui lòng thử lại.', corrections: [] }
  }
}

export async function getBeginnerSpeakingAssist(
  question: string,
  transcript: string,
  action: 'ideas' | 'sample' | 'vocab'
): Promise<string> {
  try {
    const prompts = {
      ideas: `Question: "${question}"\nStudent said: "${transcript}"\nGive 3-4 additional ideas/points in Vietnamese the student could add to improve their answer. Be specific and practical. Format as bullet points.`,
      sample: `Question: "${question}"\nWrite a natural, clear sample answer (band 7+ level) for this beginner speaking question. Use simple but correct English. 3-5 sentences. Then provide a Vietnamese translation below.`,
      vocab: `Question: "${question}"\nStudent said: "${transcript}"\nList 5 useful vocabulary words or phrases relevant to this question that the student should know. Format: word/phrase - Vietnamese meaning - example sentence.`,
    }
    return await groqText(prompts[action], ACCURATE, 300)
  } catch {
    return 'Không thể tải nội dung. Vui lòng thử lại.'
  }
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function getDefaultQuestions(topic: string, part: string, count: number): IELTSQuestion[] {
  return [
    { id: 'q1', question: `Tell me about your experience with ${topic}.`, part: 'PART1' as const },
    { id: 'q2', question: `How has ${topic} influenced your daily life?`, part: 'PART1' as const },
    { id: 'q3', question: `Do you think ${topic} is important in modern society?`, part: 'PART3' as const },
  ].slice(0, count)
}
