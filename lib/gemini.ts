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

export async function generateLessonCards(
  type: 'vocabulary' | 'grammar' | 'speaking',
  level: string,
  topic: string,
  count?: number,
  docText?: string,
): Promise<any[]> {
  const src = docText
    ? `Analyze this document and create the lesson from it:\n---\n${docText.slice(0, 8000)}\n---\nTopic: ${topic}`
    : `Topic: ${topic}`

  const defaults: Record<string, number> = { vocabulary: 10, grammar: 9, speaking: 8 }
  const n = count ?? defaults[type]

  const prompts: Record<string, string> = {
    vocabulary: `English teacher. Vietnamese learners, level ${level}. ${src}

Create ${n} vocabulary flashcard-quiz cards. Return JSON: {"cards":[...]}
Format: {"type":"vocab","word":"word/phrase","phonetic":"/IPA/","pos":"n.|v.|adj.|adv.|phrase","meaning":"Nghĩa tiếng Việt","example":"Natural example sentence.","options":["Đúng","Sai1","Sai2","Sai3"],"answer":"Đúng"}
Rules: options exactly 4 (all Vietnamese meanings), answer matches one option exactly, real IPA phonetic.`,

    grammar: `English teacher. Vietnamese learners, level ${level}. ${src}

Create ${n} grammar exercise cards with a MIX of 3 types (~equal ratio). Return JSON: {"cards":[...]}

Type 1 - MCQ explanation card:
{"type":"grammar","rule":"Rule name","explanation":"Giải thích rõ ràng bằng tiếng Việt","examples":["Example 1.","Example 2.","Example 3."],"tip":"Mẹo/lỗi hay gặp tiếng Việt","question":"Complete exercise sentence?","options":["a","b","c","d"],"answer":"a"}

Type 2 - Fill in the blank:
{"type":"fill-blank","sentence":"She ___ to school every day.","answer":"goes","options":["go","goes","went","going"],"explanation":"Giải thích tại sao đây là đáp án đúng (tiếng Việt)"}

Type 3 - Word arrangement:
{"type":"arrange","words":["school","She","to","goes","every","day"],"answer":"She goes to school every day.","hint":"Câu về thói quen hàng ngày (tiếng Việt)"}

Rules: options exactly 4, answers correct, words in arrange are scrambled (NOT in sentence order), cover grammar topic thoroughly.`,

    speaking: `English teacher. Vietnamese learners, level ${level}. ${src}

Create ${n} IELTS Part 1 speaking practice cards. Return JSON: {"cards":[...]}
Format:
{"type":"speaking","prompt":"Natural IELTS Part 1 question?","hint":"Gợi ý 2-3 ý chính bằng tiếng Việt","samplePhrases":["Opening phrase","Key phrase","Linking phrase"],"ideas":["Ý tưởng 1 tiếng Việt","Ý tưởng 2","Ý tưởng 3","Ý tưởng 4"],"vocabulary":[{"word":"useful word","meaning":"nghĩa tiếng Việt","example":"Example sentence."},{"word":"word2","meaning":"nghĩa","example":"Example."},{"word":"word3","meaning":"nghĩa","example":"Example."}],"sampleAnswer":"Natural 3-4 sentence answer in English showing good vocabulary usage.\n\n(Dịch: Bản dịch tiếng Việt tương ứng)"}
Rules: ideas has 3-4 items, vocabulary has 3-5 items per card, sampleAnswer is natural band 6-7 level.`,
  }

  const result = await groqJSON<{ cards?: any[] } | any[]>(prompts[type], ACCURATE, 4000)
  const cards = Array.isArray(result) ? result : (result as any).cards ?? []
  if (!cards.length) throw new Error('AI không tạo được cards')
  return cards
}

export async function generateBatchVocabCards(words: string[], level: string): Promise<any[]> {
  const wordList = words.map((w, i) => `${i + 1}. ${w.trim()}`).join('\n')
  const prompt = `English teacher. Vietnamese learners, level ${level}.

Generate exactly ONE VocabCard for EACH of these ${words.length} words:
${wordList}

Return JSON: {"cards":[...]} with exactly ${words.length} cards in the same order.
Format per card: {"type":"vocab","word":"exact word from list","phonetic":"/IPA/","pos":"n.|v.|adj.|adv.|phrase","meaning":"Nghĩa tiếng Việt ngắn gọn","example":"Natural example sentence.","options":["Nghĩa đúng","Sai1","Sai2","Sai3"],"answer":"Nghĩa đúng"}
Rules: options exactly 4 Vietnamese meanings, answer matches one option exactly, real IPA phonetic, example suits ${level} level.`

  const result = await groqJSON<{ cards?: any[] } | any[]>(prompt, ACCURATE, Math.min(4000, words.length * 200 + 500))
  const cards = Array.isArray(result) ? result : (result as any).cards ?? []
  if (!cards.length) throw new Error('AI không tạo được cards')
  return cards
}

export async function extractContentFromImage(imageBase64: string, mimeType: string): Promise<string> {
  const res = await getGroq().chat.completions.create({
    model: 'llama-3.2-90b-vision-preview',
    messages: [{
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
        { type: 'text', text: 'Extract ALL text and educational content from this image. Include vocabulary, phrases, grammar rules, exercises, topics, and any other learning material visible. Be thorough and precise.' },
      ] as any,
    }],
    max_tokens: 2000,
    temperature: 0.1,
  })
  return res.choices[0].message.content?.trim() || ''
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function getDefaultQuestions(topic: string, part: string, count: number): IELTSQuestion[] {
  return [
    { id: 'q1', question: `Tell me about your experience with ${topic}.`, part: 'PART1' as const },
    { id: 'q2', question: `How has ${topic} influenced your daily life?`, part: 'PART1' as const },
    { id: 'q3', question: `Do you think ${topic} is important in modern society?`, part: 'PART3' as const },
  ].slice(0, count)
}
