// ─────────────────────────────────────────────────────────────────────────────
// Multi-target-language registry — the single source of truth.
//
// DingDongSpeak lets a Vietnamese user practise SPEAKING in several target
// languages. The UI stays Vietnamese; only the *practised* language changes.
// Everything language-dependent (AI prompts, scoring scale, exam structure,
// STT/TTS, topics, levels, fonts, labels) is derived from this file.
//
// Adding a new language = add one entry here (plus DB content via admin).
// ─────────────────────────────────────────────────────────────────────────────

export type LangCode = 'en' | 'zh' | 'ja' | 'ko'

export const LANG_CODES: LangCode[] = ['en', 'zh', 'ja', 'ko']
export const DEFAULT_LANG: LangCode = 'en'

/** Cookie that stores the user's active learning language (client + SSR). */
export const LANG_COOKIE = 'dds_lang'

export interface ScoreCriterion {
  /** Stable slot key persisted in the score JSON. */
  key: 'fluency' | 'lexical' | 'grammar' | 'pronunciation'
  /** Vietnamese label shown in the UI. */
  label: string
}

export interface ExamSection {
  /** Reuses the IELTSPart enum slots so the DB schema is unchanged. */
  id: 'PART1' | 'PART2' | 'PART3'
  label: string
  desc: string
}

export interface LangConfig {
  code: LangCode
  /** Emoji flag for selectors. */
  flag: string
  /** Endonym, e.g. "中文". */
  nativeName: string
  /** Vietnamese name, e.g. "Tiếng Trung". */
  viName: string
  /** Vietnamese name used inline, e.g. "tiếng Trung" (for "nói bằng …"). */
  speakViName: string
  /** English name used inside AI prompts, e.g. "Mandarin Chinese". */
  aiName: string

  /** Exam brand: IELTS / HSK / JLPT / TOPIK. */
  exam: string
  examFull: string

  /** Proficiency levels for the beginner Learn path (low → high). */
  levels: string[]
  defaultLevel: string

  /** Score model. IELTS uses a 0–9 band; others use a normalised 0–100. */
  scoreScale: 9 | 100
  /** Short label for the overall score, e.g. "Band" or "Điểm". */
  scoreLabel: string
  /** Four scoring criteria (slot keys are fixed; labels are per language). */
  criteria: ScoreCriterion[]

  /** Speaking practice sections (generalised IELTS parts). */
  sections: ExamSection[]
  /** Whether this language uses an IELTS-style Part 2 cue card. */
  hasCueCard: boolean

  /** Pronunciation/reading aid label, e.g. "Pinyin" / "Furigana / Romaji". */
  readingLabel: string
  /** Prompt-side description of the reading system the AI should produce. */
  readingPrompt: string
  /** Native term for "idiom" (chengyu / yojijukugo / sokdam / idiom). */
  idiomTerm: string
  /** True for non-space-delimited scripts (zh, ja) — affects word-arrange cards. */
  noWordSpacing: boolean

  /** Deepgram STT config. */
  stt: { model: string; language: string }
  /** Deepgram TTS voice, or null when no server TTS exists for this language. */
  ttsVoice: string | null

  /** Practice topics (strings passed to the AI and shown in the picker). */
  topics: string[]
  /** Fallback questions (already in the target language) if the AI call fails. */
  fallbackQuestions: string[]

  /** CSS variable holding a script-appropriate web font (CJK), if any. */
  fontVar?: string
}

// Shared criteria builders ----------------------------------------------------

const enCriteria: ScoreCriterion[] = [
  { key: 'fluency', label: 'Trôi chảy' },
  { key: 'lexical', label: 'Từ vựng' },
  { key: 'grammar', label: 'Ngữ pháp' },
  { key: 'pronunciation', label: 'Phát âm' },
]

// ─── Registry ────────────────────────────────────────────────────────────────

export const LANGUAGES: Record<LangCode, LangConfig> = {
  en: {
    code: 'en',
    flag: '🇬🇧',
    nativeName: 'English',
    viName: 'Tiếng Anh',
    speakViName: 'tiếng Anh',
    aiName: 'English',
    exam: 'IELTS',
    examFull: 'IELTS Speaking',
    levels: ['A1', 'A2', 'B1', 'B2', 'C1'],
    defaultLevel: 'A1',
    scoreScale: 9,
    scoreLabel: 'Band',
    criteria: enCriteria,
    sections: [
      { id: 'PART1', label: 'Part 1', desc: 'Câu hỏi cá nhân (daily life, hobbies, family)' },
      { id: 'PART2', label: 'Part 2', desc: 'Cue card — nói 2 phút về chủ đề' },
      { id: 'PART3', label: 'Part 3', desc: 'Thảo luận & phân tích sâu hơn' },
    ],
    hasCueCard: true,
    readingLabel: 'Phiên âm (IPA)',
    readingPrompt: 'IPA phonetic transcription, e.g. /ˈfæmɪli/',
    idiomTerm: 'idiom',
    noWordSpacing: false,
    stt: { model: 'nova-3', language: 'en' },
    ttsVoice: 'aura-asteria-en',
    topics: [
      'Education', 'Technology', 'Environment', 'Health & Medicine',
      'Work & Career', 'Travel & Tourism', 'Food & Diet', 'Sports & Fitness',
      'Arts & Culture', 'Family & Relationships', 'Media & Advertising',
      'Crime & Punishment', 'Urban & Rural Life', 'Transport', 'Fashion & Clothing',
      'Science & Innovation', 'Social Media', 'Animal Rights', 'Globalization',
      'Volunteering & Community', 'Mental Health', 'Space Exploration',
      'Language Learning', 'Reading & Literature', 'Government & Politics',
    ],
    fallbackQuestions: [
      'Can you tell me about your hometown?',
      'What do you usually do in your free time?',
      'Do you think technology has changed the way we live? How?',
    ],
  },

  zh: {
    code: 'zh',
    flag: '🇨🇳',
    nativeName: '中文',
    viName: 'Tiếng Trung',
    speakViName: 'tiếng Trung',
    aiName: 'Mandarin Chinese',
    exam: 'HSK',
    examFull: 'HSK / HSKK Khẩu ngữ',
    levels: ['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6'],
    defaultLevel: 'HSK1',
    scoreScale: 100,
    scoreLabel: 'Điểm',
    criteria: [
      { key: 'fluency', label: 'Trôi chảy' },
      { key: 'lexical', label: 'Từ vựng & Hán tự' },
      { key: 'grammar', label: 'Ngữ pháp' },
      { key: 'pronunciation', label: 'Phát âm & thanh điệu' },
    ],
    sections: [
      { id: 'PART1', label: 'Cơ bản', desc: 'Trả lời câu hỏi đời thường (giới thiệu, gia đình, sở thích)' },
      { id: 'PART2', label: 'Mô tả', desc: 'Nhìn tranh/chủ đề và nói liên tục' },
      { id: 'PART3', label: 'Nâng cao', desc: 'Thảo luận, nêu quan điểm sâu hơn' },
    ],
    hasCueCard: false,
    readingLabel: 'Pinyin',
    readingPrompt: 'Hanyu Pinyin WITH tone marks, e.g. jiā / māma',
    idiomTerm: 'chengyu (thành ngữ 成语)',
    noWordSpacing: true,
    stt: { model: 'nova-2', language: 'zh' },
    ttsVoice: null,
    topics: [
      'Giới thiệu bản thân', 'Gia đình', 'Sở thích', 'Học tập', 'Công việc',
      'Ẩm thực Trung Hoa', 'Du lịch', 'Mua sắm', 'Thời tiết', 'Sức khỏe',
      'Giao thông', 'Lễ hội & văn hóa', 'Công nghệ', 'Môi trường', 'Thể thao',
      'Phim ảnh & âm nhạc', 'Thành phố & quê hương', 'Bạn bè', 'Kế hoạch tương lai', 'Mạng xã hội',
    ],
    fallbackQuestions: [
      '请你介绍一下你自己。',
      '你平时喜欢做什么？',
      '你觉得学习中文难吗？为什么？',
    ],
  },

  ja: {
    code: 'ja',
    flag: '🇯🇵',
    nativeName: '日本語',
    viName: 'Tiếng Nhật',
    speakViName: 'tiếng Nhật',
    aiName: 'Japanese',
    exam: 'JLPT',
    examFull: 'JLPT / Hội thoại',
    levels: ['N5', 'N4', 'N3', 'N2', 'N1'],
    defaultLevel: 'N5',
    scoreScale: 100,
    scoreLabel: 'Điểm',
    criteria: [
      { key: 'fluency', label: 'Trôi chảy' },
      { key: 'lexical', label: 'Từ vựng & Kanji' },
      { key: 'grammar', label: 'Ngữ pháp & trợ từ' },
      { key: 'pronunciation', label: 'Phát âm & ngữ điệu' },
    ],
    sections: [
      { id: 'PART1', label: 'Cơ bản', desc: 'Trả lời câu hỏi đời thường (giới thiệu, gia đình, sở thích)' },
      { id: 'PART2', label: 'Mô tả', desc: 'Nói liên tục về một chủ đề' },
      { id: 'PART3', label: 'Nâng cao', desc: 'Thảo luận, nêu quan điểm (敬語/lịch sự)' },
    ],
    hasCueCard: false,
    readingLabel: 'Furigana / Romaji',
    readingPrompt: 'the reading in hiragana furigana AND romaji, e.g. 家族（かぞく / kazoku）',
    idiomTerm: 'yojijukugo / kotowaza (thành ngữ)',
    noWordSpacing: true,
    stt: { model: 'nova-2', language: 'ja' },
    ttsVoice: null,
    topics: [
      'Giới thiệu bản thân', 'Gia đình', 'Sở thích', 'Học tập', 'Công việc',
      'Ẩm thực Nhật Bản', 'Du lịch', 'Mua sắm', 'Thời tiết', 'Sức khỏe',
      'Giao thông', 'Lễ hội & văn hóa', 'Anime & manga', 'Công nghệ', 'Thể thao',
      'Phim ảnh & âm nhạc', 'Thành phố & quê hương', 'Bạn bè', 'Kế hoạch tương lai', 'Mạng xã hội',
    ],
    fallbackQuestions: [
      '自己紹介をしてください。',
      '普段、休みの日に何をしますか？',
      '日本語を勉強するのはどうですか？',
    ],
  },

  ko: {
    code: 'ko',
    flag: '🇰🇷',
    nativeName: '한국어',
    viName: 'Tiếng Hàn',
    speakViName: 'tiếng Hàn',
    aiName: 'Korean',
    exam: 'TOPIK',
    examFull: 'TOPIK / Hội thoại',
    levels: ['TOPIK1', 'TOPIK2', 'TOPIK3', 'TOPIK4', 'TOPIK5', 'TOPIK6'],
    defaultLevel: 'TOPIK1',
    scoreScale: 100,
    scoreLabel: 'Điểm',
    criteria: [
      { key: 'fluency', label: 'Trôi chảy' },
      { key: 'lexical', label: 'Từ vựng' },
      { key: 'grammar', label: 'Ngữ pháp & kính ngữ' },
      { key: 'pronunciation', label: 'Phát âm & batchim' },
    ],
    sections: [
      { id: 'PART1', label: 'Cơ bản', desc: 'Trả lời câu hỏi đời thường (giới thiệu, gia đình, sở thích)' },
      { id: 'PART2', label: 'Mô tả', desc: 'Nói liên tục về một chủ đề' },
      { id: 'PART3', label: 'Nâng cao', desc: 'Thảo luận, nêu quan điểm (kính ngữ)' },
    ],
    hasCueCard: false,
    readingLabel: 'Romaja',
    readingPrompt: 'Revised Romanization, e.g. 가족 (gajok)',
    idiomTerm: 'sokdam (속담 — tục ngữ)',
    noWordSpacing: false,
    stt: { model: 'nova-2', language: 'ko' },
    ttsVoice: null,
    topics: [
      'Giới thiệu bản thân', 'Gia đình', 'Sở thích', 'Học tập', 'Công việc',
      'Ẩm thực Hàn Quốc', 'Du lịch', 'Mua sắm', 'Thời tiết', 'Sức khỏe',
      'Giao thông', 'Lễ hội & văn hóa', 'K-pop & phim Hàn', 'Công nghệ', 'Thể thao',
      'Phim ảnh & âm nhạc', 'Thành phố & quê hương', 'Bạn bè', 'Kế hoạch tương lai', 'Mạng xã hội',
    ],
    fallbackQuestions: [
      '자기소개를 해 주세요.',
      '평소에 시간이 있을 때 무엇을 해요?',
      '한국어 공부는 어때요?',
    ],
  },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function isLangCode(v: unknown): v is LangCode {
  return typeof v === 'string' && (LANG_CODES as string[]).includes(v)
}

/** Normalise any incoming value to a valid LangConfig (falls back to EN). */
export function getLang(code: unknown): LangConfig {
  return isLangCode(code) ? LANGUAGES[code] : LANGUAGES[DEFAULT_LANG]
}

/** Coerce any incoming value to a valid LangCode. */
export function toLangCode(code: unknown): LangCode {
  return isLangCode(code) ? code : DEFAULT_LANG
}

/** Format an overall/sub score for display according to the language scale. */
export function formatScore(value: number, code: unknown): string {
  const { scoreScale } = getLang(code)
  return scoreScale === 9 ? value.toFixed(1) : String(Math.round(value))
}

/** Map a score to a tailwind text color, normalised across scales (0..1). */
export function scoreToColor(value: number, code: unknown): string {
  const { scoreScale } = getLang(code)
  const r = value / scoreScale // 0..1
  if (r >= 0.85) return 'text-emerald-400'
  if (r >= 0.72) return 'text-cyan-400'
  if (r >= 0.6) return 'text-yellow-400'
  if (r >= 0.5) return 'text-orange-400'
  return 'text-red-400'
}

/** A normalised 0..1 ratio for threshold logic (e.g. pass marks, colors). */
export function scoreRatio(value: number, code: unknown): number {
  return value / getLang(code).scoreScale
}

export const LANG_LIST: LangConfig[] = LANG_CODES.map(c => LANGUAGES[c])
