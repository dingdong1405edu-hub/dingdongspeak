import Groq from 'groq-sdk'
import { getLang, type LangCode } from '@/lib/languages'

// Web system: 100% Groq
// - llama-3.3-70b-versatile → accuracy tasks (scoring, questions, sample answers)
// - llama-3.1-8b-instant    → realtime/supplementary (beginner game, vocab hints, improve)
//
// Multi-language: every generator/scorer takes a `lang` (en|zh|ja|ko). Prompts are
// built from lib/languages.ts so the PRACTISED language + exam rubric change per
// language, while learner-facing feedback/glosses stay Vietnamese.

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

// CJK output is denser, and answers carry readings + Vietnamese glosses, so give
// non-English calls a little more headroom.
function tok(base: number, lang: LangCode | string): number {
  return getLang(lang).code === 'en' ? base : Math.round(base * 1.5)
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

// ─── Accuracy tasks → llama-3.3-70b-versatile ─────────────────────────────────

export async function scoreIELTSResponse(
  question: string,
  transcript: string,
  part: string,
  lang: LangCode | string = 'en',
): Promise<ScoreResult> {
  const L = getLang(lang)
  const fb = L.scoreScale === 9
    ? `{"overall":5.5,"fluency":5.5,"lexical":5.5,"grammar":5.5,"pronunciation":5.5,"feedback":"Không thể chấm điểm lúc này.","corrections":[]}`
    : `{"overall":60,"fluency":60,"lexical":60,"grammar":60,"pronunciation":60,"feedback":"Không thể chấm điểm lúc này.","corrections":[]}`
  const fallback: ScoreResult = JSON.parse(fb)

  const examiner = L.code === 'en'
    ? `Strict IELTS examiner. Vietnamese learners typically score 4.5-6.5. Never inflate. Use the 0-9 band scale.`
    : `Strict ${L.exam} ${L.aiName} speaking examiner. Score honestly on a 0-100 scale. The student is a Vietnamese learner of ${L.aiName}.`

  try {
    const result = await groqJSON<ScoreResult>(
      `${examiner}
The student is speaking ${L.aiName}. Question (${part}): "${question}"
Answer (transcribed): "${transcript}"
Rate four criteria — ${L.criteria.map(c => c.label).join(', ')} — each on the ${L.scoreScale === 9 ? '0-9 band' : '0-100'} scale, plus an overall ${L.scoreLabel.toLowerCase()}.
Find up to 3 concrete mistakes using the EXACT ${L.aiName} text from the answer (in "wrong"), with the corrected ${L.aiName} form (in "correct").
Return JSON: {"overall":${L.scoreScale === 9 ? '5.5' : '60'},"fluency":..,"lexical":..,"grammar":..,"pronunciation":..,"feedback":"1-2 câu nhận xét bằng tiếng Việt","corrections":[{"wrong":"exact ${L.aiName} phrase","correct":"fix in ${L.aiName}"}]}`,
      ACCURATE, tok(350, lang)
    )
    if (!result.corrections) result.corrections = []
    if (typeof result.overall !== 'number') return fallback
    return result
  } catch {
    return fallback
  }
}

export async function generateIELTSQuestions(
  topic: string,
  part: 'PART1' | 'PART2' | 'PART3' | 'FULL',
  count: number,
  lang: LangCode | string = 'en',
): Promise<IELTSQuestion[]> {
  const L = getLang(lang)
  const targetPart = part === 'FULL' ? 'PART1' : part
  const isPart2 = part === 'PART2'
  const wantCue = isPart2 && L.hasCueCard

  try {
    const data = await groqJSON<{ questions: IELTSQuestion[] }>(
      L.code === 'en'
        ? `Generate ${count} IELTS Speaking ${targetPart} questions about topic: "${topic}".
${wantCue ? 'For Part 2 include cueCard array with 3 bullet points.' : ''}
Return JSON: {"questions":[{"id":"q1","question":"...","part":"${targetPart}","hint":"short tip"${wantCue ? ',"cueCard":["...","...","..."]' : ''}}]}`
        : `Generate ${count} ${L.aiName} speaking-practice questions for a Vietnamese learner, about the topic: "${topic}" (topic given in Vietnamese).
Each "question" MUST be written in ${L.aiName} (natural, spoken style), at a beginner-to-intermediate level. Each "hint" is a short tip in Vietnamese.
Return JSON: {"questions":[{"id":"q1","question":"câu hỏi bằng ${L.aiName}","part":"${targetPart}","hint":"gợi ý tiếng Việt"}]}`,
      ACCURATE, tok(600, lang)
    )
    return data.questions ?? []
  } catch {
    return getDefaultQuestions(topic, part, count, lang)
  }
}

export async function generateSampleAnswer(
  question: string,
  part: string,
  band = 8,
  lang: LangCode | string = 'en',
): Promise<string> {
  const L = getLang(lang)
  const enLen: Record<string, string> = { PART1: '30-45 words', PART2: '230-280 words', PART3: '60-80 words' }
  const otherLen: Record<string, string> = { PART1: '2-3 sentences', PART2: '6-8 sentences', PART3: '3-4 sentences' }
  const len = (L.code === 'en' ? enLen : otherLen)[part] ?? (L.code === 'en' ? '60 words' : '3-4 sentences')

  try {
    const text = await groqText(
      L.code === 'en'
        ? `Write a Band ${band} IELTS Speaking ${part} model answer for: "${question}"
Length: ${len}. Use varied vocabulary, discourse markers, complex grammar, natural fillers.
Output the answer text only.`
        : `Write a strong model answer in ${L.aiName} for this ${L.aiName} speaking question: "${question}"
Length: ${len}. Use natural, level-appropriate ${L.aiName}.
Then on a new line add "(Dịch: ...)" with a Vietnamese translation.
Output the ${L.aiName} answer + the Vietnamese translation only.`,
      ACCURATE, tok(450, lang)
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
  topic: string,
  lang: LangCode | string = 'en',
): Promise<{ vocabulary: string[]; idioms: string[] }> {
  const L = getLang(lang)
  try {
    const res = await groqJSON<{ vocabulary: string[]; idioms: string[] }>(
      L.code === 'en'
        ? `IELTS topic "${topic}", question: "${question}". Give 5 vocabulary + 3 idioms, format "word — nghĩa Việt ngắn". Return JSON: {"vocabulary":["..."],"idioms":["..."]}`
        : `${L.aiName} topic "${topic}", question: "${question}". Give 5 useful ${L.aiName} vocabulary items + 3 ${L.idiomTerm}.
Format each as "${L.aiName}word (${L.readingLabel}) — nghĩa Việt ngắn". Return JSON: {"vocabulary":["..."],"idioms":["..."]}`,
      FAST, tok(200, lang)
    )
    return { vocabulary: res.vocabulary || [], idioms: res.idioms || [] }
  } catch {
    return { vocabulary: [], idioms: [] }
  }
}

export async function improveAnswer(
  transcript: string,
  question: string,
  part: string,
  lang: LangCode | string = 'en',
): Promise<string> {
  const L = getLang(lang)
  try {
    return await groqText(
      L.code === 'en'
        ? `Rewrite to IELTS Band 7. Keep ideas. Fix grammar, better vocab, add discourse markers.
Student (${part}): "${transcript}" | Q: "${question}"
Output improved answer only.`
        : `Rewrite this ${L.aiName} answer to a clearly better, natural ${L.aiName} version. Keep the ideas; fix grammar and use better vocabulary.
Student: "${transcript}" | Question: "${question}"
Output the improved ${L.aiName} answer only.`,
      FAST, tok(300, lang)
    )
  } catch {
    return transcript
  }
}

export async function scoreBeginnerSpeaking(
  question: string,
  transcript: string,
  lang: LangCode | string = 'en',
): Promise<{ score: number; feedback: string; corrections: string[] }> {
  const L = getLang(lang)
  try {
    return await groqJSON(
      `You are a strict, accurate ${L.aiName} speaking coach for beginners. The student is a Vietnamese learner speaking ${L.aiName}.
Question asked: "${question}"
Student's answer (transcribed): "${transcript}"
Scoring criteria: Accuracy/Relevance to question (40%) + Grammar (30%) + Fluency/Vocabulary (30%).
Score range: 0-100. Be honest - if the answer is off-topic or has major errors, score below 50.
Return JSON only: {"score": <number>, "feedback": "<2 sentences in Vietnamese: praise + main improvement>", "corrections": ["<specific ${L.aiName} correction 1>", "<specific ${L.aiName} correction 2>"]}`,
      ACCURATE, tok(200, lang)
    )
  } catch {
    return { score: 50, feedback: 'Không thể chấm điểm. Vui lòng thử lại.', corrections: [] }
  }
}

export async function getBeginnerSpeakingAssist(
  question: string,
  transcript: string,
  action: 'ideas' | 'sample' | 'vocab',
  lang: LangCode | string = 'en',
): Promise<string> {
  const L = getLang(lang)
  try {
    const prompts = {
      ideas: `Question (${L.aiName}): "${question}"\nStudent said: "${transcript}"\nGive 3-4 additional ideas/points in Vietnamese the student could add to improve their answer. Be specific and practical. Format as bullet points.`,
      sample: `Question (${L.aiName}): "${question}"\nWrite a natural, clear sample answer in ${L.aiName} (good but simple, correct ${L.aiName}). 3-5 sentences. Then provide a Vietnamese translation below.`,
      vocab: `Question (${L.aiName}): "${question}"\nStudent said: "${transcript}"\nList 5 useful ${L.aiName} vocabulary words or phrases relevant to this question. Format: ${L.aiName}word (${L.readingLabel}) - nghĩa tiếng Việt - example sentence in ${L.aiName}.`,
    }
    return await groqText(prompts[action], ACCURATE, tok(300, lang))
  } catch {
    return 'Không thể tải nội dung. Vui lòng thử lại.'
  }
}

export async function generateLessonCards(
  type: 'vocabulary' | 'grammar' | 'speaking',
  level: string,
  topic: string,
  count?: number,
  docText?: string,
  lang: LangCode | string = 'en',
): Promise<any[]> {
  const L = getLang(lang)
  const src = docText
    ? `Analyze this document and create the lesson from it:\n---\n${docText.slice(0, 8000)}\n---\nTopic: ${topic}`
    : `Topic: ${topic}`

  const defaults: Record<string, number> = { vocabulary: 10, grammar: 9, speaking: 8 }
  const n = count ?? defaults[type]
  const teacher = `${L.aiName} teacher. Vietnamese learners, level ${level}.`
  const reading = L.readingPrompt
  const arrangeNote = L.noWordSpacing
    ? `For ${L.aiName} (no spaces between words), "words" must be the meaningful tokens of the sentence in scrambled order, and "answer" must join them with NO spaces.`
    : `"words" are the scrambled words; "answer" is the correct sentence.`

  const prompts: Record<string, string> = {
    vocabulary: `${teacher} ${src}

Create ${n} vocabulary flashcard-quiz cards in ${L.aiName}. Return JSON: {"cards":[...]}
Format: {"type":"vocab","word":"${L.aiName} word/phrase","phonetic":"${reading}","pos":"n.|v.|adj.|adv.|phrase","meaning":"Nghĩa tiếng Việt","example":"Natural ${L.aiName} example sentence.","options":["Đúng","Sai1","Sai2","Sai3"],"answer":"Đúng"}
Rules: options exactly 4 (all Vietnamese meanings), answer matches one option exactly, "phonetic" is the ${L.readingLabel} reading.`,

    grammar: `${teacher} ${src}

Create ${n} ${L.aiName} grammar exercise cards with a MIX of 3 types (~equal ratio). Return JSON: {"cards":[...]}

Type 1 - MCQ explanation card:
{"type":"grammar","rule":"Rule name","explanation":"Giải thích rõ ràng bằng tiếng Việt","examples":["${L.aiName} example 1.","example 2.","example 3."],"tip":"Mẹo/lỗi hay gặp tiếng Việt","question":"Complete exercise sentence in ${L.aiName}?","options":["a","b","c","d"],"answer":"a"}

Type 2 - Fill in the blank (in ${L.aiName}):
{"type":"fill-blank","sentence":"${L.aiName} sentence with ___ blank.","answer":"correct token","options":["o1","o2","o3","o4"],"explanation":"Giải thích tiếng Việt"}

Type 3 - Word arrangement (in ${L.aiName}):
{"type":"arrange","words":["scrambled","tokens"],"answer":"correct ${L.aiName} sentence","hint":"Gợi ý tiếng Việt"}

Rules: options exactly 4, answers correct, ${arrangeNote} Cover the grammar topic thoroughly.`,

    speaking: `${teacher} ${src}

Create ${n} ${L.aiName} speaking practice cards. Return JSON: {"cards":[...]}
Format:
{"type":"speaking","prompt":"Natural ${L.aiName} speaking question?","hint":"Gợi ý 2-3 ý chính bằng tiếng Việt","samplePhrases":["${L.aiName} opening phrase","key phrase","linking phrase"],"ideas":["Ý tưởng 1 tiếng Việt","Ý tưởng 2","Ý tưởng 3","Ý tưởng 4"],"vocabulary":[{"word":"${L.aiName} word","meaning":"nghĩa tiếng Việt","example":"${L.aiName} example."},{"word":"word2","meaning":"nghĩa","example":"example."},{"word":"word3","meaning":"nghĩa","example":"example."}],"sampleAnswer":"Natural 3-4 sentence answer in ${L.aiName}.\\n\\n(Dịch: Bản dịch tiếng Việt tương ứng)"}
Rules: ideas has 3-4 items, vocabulary has 3-5 items per card, sampleAnswer is natural and level-appropriate.`,
  }

  const result = await groqJSON<{ cards?: any[] } | any[]>(prompts[type], ACCURATE, tok(4000, lang))
  const cards = Array.isArray(result) ? result : (result as any).cards ?? []
  if (!cards.length) throw new Error('AI không tạo được cards')
  return cards
}

export async function generateBatchVocabCards(
  words: string[],
  level: string,
  lang: LangCode | string = 'en',
): Promise<any[]> {
  const L = getLang(lang)
  const wordList = words.map((w, i) => `${i + 1}. ${w.trim()}`).join('\n')
  const prompt = `${L.aiName} teacher. Vietnamese learners, level ${level}.

Generate exactly ONE VocabCard for EACH of these ${words.length} ${L.aiName} words:
${wordList}

Return JSON: {"cards":[...]} with exactly ${words.length} cards in the same order.
Format per card: {"type":"vocab","word":"exact word from list","phonetic":"${L.readingPrompt}","pos":"n.|v.|adj.|adv.|phrase","meaning":"Nghĩa tiếng Việt ngắn gọn","example":"Natural ${L.aiName} example sentence.","options":["Nghĩa đúng","Sai1","Sai2","Sai3"],"answer":"Nghĩa đúng"}
Rules: options exactly 4 Vietnamese meanings, answer matches one option exactly, "phonetic" is the ${L.readingLabel} reading, example suits ${level} level.`

  const result = await groqJSON<{ cards?: any[] } | any[]>(prompt, ACCURATE, Math.min(tok(4000, lang), words.length * tok(200, lang) + 500))
  const cards = Array.isArray(result) ? result : (result as any).cards ?? []
  if (!cards.length) throw new Error('AI không tạo được cards')
  return cards
}

export async function extractContentFromImage(
  imageBase64: string,
  mimeType: string,
  lang: LangCode | string = 'en',
): Promise<string> {
  const L = getLang(lang)
  const langNote = L.code === 'en' ? '' : ` Preserve all ${L.aiName} characters/text EXACTLY as written (do not transliterate or translate the original-script text).`
  const res = await getGroq().chat.completions.create({
    model: 'llama-3.2-90b-vision-preview',
    messages: [{
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
        { type: 'text', text: `Extract ALL text and educational content from this image. Include vocabulary, phrases, grammar rules, exercises, topics, and any other learning material visible. Be thorough and precise.${langNote}` },
      ] as any,
    }],
    max_tokens: 2000,
    temperature: 0.1,
  })
  return res.choices[0].message.content?.trim() || ''
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function getDefaultQuestions(
  topic: string,
  part: string,
  count: number,
  lang: LangCode | string = 'en',
): IELTSQuestion[] {
  const L = getLang(lang)
  if (L.code !== 'en') {
    return L.fallbackQuestions
      .map((q, i) => ({ id: `q${i + 1}`, question: q, part: 'PART1' as const }))
      .slice(0, count)
  }
  return [
    { id: 'q1', question: `Tell me about your experience with ${topic}.`, part: 'PART1' as const },
    { id: 'q2', question: `How has ${topic} influenced your daily life?`, part: 'PART1' as const },
    { id: 'q3', question: `Do you think ${topic} is important in modern society?`, part: 'PART3' as const },
  ].slice(0, count)
}
