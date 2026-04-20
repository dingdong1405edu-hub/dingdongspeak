// ─── Types ───────────────────────────────────────────────────────────────────

export interface VocabCard {
  type: 'vocab'
  word: string
  phonetic: string
  pos: string
  meaning: string
  example: string
  options: string[]
  answer: string
  audioBase64?: string
}

export interface GrammarCard {
  type: 'grammar'
  rule: string
  explanation: string
  examples: string[]
  tip: string
  question: string
  options: string[]
  answer: string
}

export interface FillBlankCard {
  type: 'fill-blank'
  sentence: string    // "She ___ to school every day."
  answer: string      // "goes"
  options: string[]   // ["go", "goes", "went", "going"]
  explanation: string // Vietnamese explanation
}

export interface ArrangeCard {
  type: 'arrange'
  words: string[]     // scrambled: ["school", "She", "to", "goes", "every", "day"]
  answer: string      // "She goes to school every day."
  hint?: string       // Vietnamese hint
}

export interface SpeakingCard {
  type: 'speaking'
  prompt: string
  hint: string
  samplePhrases: string[]
  vocabulary?: Array<{ word: string; meaning: string; example: string }>
  ideas?: string[]
  sampleAnswer?: string
}

export type LessonCard = VocabCard | GrammarCard | FillBlankCard | ArrangeCard | SpeakingCard

export interface LessonData {
  id: string
  stageId: string
  title: string
  type: 'vocabulary' | 'grammar' | 'speaking'
  topic: string
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1'
  description: string
  xp: number
  cards: LessonCard[]
}

export interface StageData {
  id: string
  title: string
  subtitle: string
  icon: string
  color: string
  accentColor: string
  lessons: LessonData[]
}

// ─── Data (managed from admin → all lessons are CustomLesson in DB) ───────────

export const STAGES: StageData[] = []

// ─── Helper functions ────────────────────────────────────────────────────────

export function getAllLessons(): LessonData[] {
  return STAGES.flatMap(stage => stage.lessons)
}

export function getLessonById(id: string): LessonData | undefined {
  return getAllLessons().find(l => l.id === id)
}

export function getStageByLessonId(id: string): StageData | undefined {
  return STAGES.find(stage => stage.lessons.some(l => l.id === id))
}
