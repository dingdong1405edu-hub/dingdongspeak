export interface Correction {
  wrong: string
  correct: string
  note?: string
}

export interface ScoreBreakdown {
  overall: number
  fluency: number
  lexical: number
  grammar: number
  pronunciation: number
  feedback: string
  corrections?: Correction[]
}

export interface IELTSQuestion {
  id: string
  question: string
  part: 'PART1' | 'PART2' | 'PART3'
  hint?: string
  cueCard?: string[]
}

export interface QARecord {
  question: IELTSQuestion
  transcript: string
  score: ScoreBreakdown
  audioUrl?: string
  sampleAnswer?: string
  savedVocab?: string[]
  savedIdioms?: string[]
}

export interface LessonData {
  id: string
  title: string
  topic: string
  stage: number
  order: number
  type: 'vocabulary' | 'grammar' | 'speaking'
  content: VocabItem[] | GrammarItem[] | SpeakingPrompt[]
  xpReward: number
}

export interface VocabItem {
  word: string
  phonetic: string
  meaning: string
  example: string
  type: 'noun' | 'verb' | 'adjective' | 'adverb' | 'phrase'
}

export interface GrammarItem {
  rule: string
  explanation: string
  examples: string[]
  exercise: GrammarExercise
}

export interface GrammarExercise {
  question: string
  options: string[]
  correct: number
  explanation: string
}

export interface SpeakingPrompt {
  topic: string
  prompt: string
  hints: string[]
  level: 'A1' | 'A2' | 'B1' | 'B2'
}

export interface UserStats {
  totalSessions: number
  totalMinutes: number
  currentStreak: number
  longestStreak: number
  avgBandScore: number
  weeklyMinutes: number
  tokens: number
  lives: number
  isPremium: boolean
  nextRegenMinutes?: number
}

export interface LeaderboardEntry {
  userId: string
  name: string
  avatar?: string
  totalMinutes: number
  totalSessions: number
  rank: number
}

export const IELTS_TOPICS = [
  'Education', 'Technology', 'Environment', 'Health & Medicine',
  'Work & Career', 'Travel & Tourism', 'Food & Diet', 'Sports & Fitness',
  'Arts & Culture', 'Family & Relationships', 'Media & Advertising',
  'Crime & Punishment', 'Urban & Rural Life', 'Transport', 'Fashion & Clothing',
  'Science & Innovation', 'Social Media', 'Animal Rights', 'Globalization',
  'Volunteering & Community', 'Mental Health', 'Space Exploration',
  'Language Learning', 'Reading & Literature', 'Government & Politics',
]

export const PREMIUM_PLANS = [
  { months: 1, price: 100000, label: '1 tháng', discount: 0, popular: false },
  { months: 2, price: 180000, label: '2 tháng', discount: 10, popular: true },
  { months: 3, price: 240000, label: '3 tháng', discount: 20, popular: false },
]
