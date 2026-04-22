/**
 * Seed: Family & Relationships vocabulary — 3 lessons (A1 → B2)
 * Run: npx tsx scripts/seed-family-vocab.ts
 */

import { config } from 'dotenv'
config({ path: '.env.local' })
config()

import { PrismaClient } from '@prisma/client'
import Groq from 'groq-sdk'

const prisma = new PrismaClient()
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })

const STAGE = {
  title: 'Family & Daily Life',
  subtitle: 'Từ vựng cuộc sống hàng ngày — Gia đình, nhà cửa, thói quen',
  icon: '🏠',
  color: 'from-rose-500 to-orange-500',
  accentColor: 'rose',
}

const LESSONS = [
  {
    title: 'Family Members — Các thành viên gia đình',
    description: 'Từ vựng cơ bản về các thành viên trong gia đình',
    level: 'A1',
    xp: 40,
    words: [
      'family', 'mother', 'father', 'sister', 'brother',
      'grandmother', 'grandfather', 'son', 'daughter', 'baby',
      'husband', 'wife', 'parent', 'child', 'twin',
    ],
  },
  {
    title: 'Extended Family — Họ hàng & Quan hệ gia đình',
    description: 'Từ vựng về họ hàng và các mối quan hệ gia đình mở rộng',
    level: 'A2',
    xp: 50,
    words: [
      'uncle', 'aunt', 'cousin', 'nephew', 'niece',
      'relative', 'sibling', 'spouse', 'fiancé', 'in-laws',
      'stepparent', 'stepbrother', 'stepsister', 'newborn', 'generation',
    ],
  },
  {
    title: 'Family Life & Values — Cuộc sống & Giá trị gia đình',
    description: 'Từ vựng nâng cao về cuộc sống, sự kiện và giá trị trong gia đình',
    level: 'B1',
    xp: 70,
    words: [
      'upbringing', 'household', 'breadwinner', 'caregiver', 'reunion',
      'divorce', 'custody', 'inheritance', 'heritage', 'ancestry',
      'nurture', 'bond', 'kinship', 'guardian', 'estranged',
    ],
  },
]

async function generateVocabCards(words: string[], level: string): Promise<any[]> {
  const wordList = words.map((w, i) => `${i + 1}. ${w}`).join('\n')
  const prompt = `You are an English teacher creating vocabulary flashcard-quiz cards for Vietnamese learners at ${level} level.

Generate exactly ONE VocabCard for EACH of these ${words.length} words in ORDER:
${wordList}

Return JSON: {"cards":[...]} with exactly ${words.length} cards.
Each card format:
{"type":"vocab","word":"exact word","phonetic":"/IPA/","pos":"n.|v.|adj.|adv.|phrase","meaning":"Nghĩa tiếng Việt ngắn gọn","example":"Natural English sentence using this word.","options":["Nghĩa đúng tiếng Việt","Nghĩa sai 1","Nghĩa sai 2","Nghĩa sai 3"],"answer":"Nghĩa đúng tiếng Việt"}

Rules:
- options: exactly 4 Vietnamese meanings, all plausible but only ONE correct
- answer: must match one of the 4 options EXACTLY (copy-paste)
- phonetic: real IPA (e.g. /ˈfæmɪli/)
- example: simple, natural sentence appropriate for ${level} level
- meaning: concise Vietnamese translation`

  const res = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    max_tokens: words.length * 200 + 500,
    temperature: 0.3,
  })

  const data = JSON.parse(res.choices[0].message.content || '{}')
  const cards = Array.isArray(data) ? data : data.cards ?? []
  if (!cards.length) throw new Error('No cards returned')
  return cards
}

async function main() {
  console.log('🚀 Seeding Family & Relationships vocabulary...\n')

  if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY not set')
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL not set')

  // 1. Find or create stage
  let stage = await prisma.stage.findFirst({ where: { title: STAGE.title } })
  if (!stage) {
    const maxOrder = await prisma.stage.aggregate({ _max: { order: true } })
    stage = await prisma.stage.create({
      data: { ...STAGE, order: (maxOrder._max.order ?? -1) + 1, published: true },
    })
    console.log(`✅ Created stage: "${stage.title}" (${stage.id})\n`)
  } else {
    console.log(`♻️  Using existing stage: "${stage.title}" (${stage.id})\n`)
  }

  // 2. Get next lesson order
  const maxOrder = await prisma.customLesson.aggregate({
    where: { stageId: stage.id },
    _max: { order: true },
  })
  let nextOrder = (maxOrder._max.order ?? -1) + 1

  // 3. Generate and save each lesson
  for (const lesson of LESSONS) {
    const exists = await prisma.customLesson.findFirst({
      where: { stageId: stage.id, title: lesson.title },
    })
    if (exists) {
      console.log(`⏭️  Skipping (exists): ${lesson.title}`)
      continue
    }

    process.stdout.write(`⏳ Generating [${lesson.level}] ${lesson.title} (${lesson.words.length} words)... `)

    let cards: any[] = []
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        cards = await generateVocabCards(lesson.words, lesson.level)
        break
      } catch (err: any) {
        if (attempt === 3) { console.log(`\n❌ Failed: ${err.message}`); break }
        process.stdout.write(`retry(${attempt})... `)
        await new Promise(r => setTimeout(r, 2000))
      }
    }

    if (!cards.length) continue

    await prisma.customLesson.create({
      data: {
        stageId: stage.id,
        title: lesson.title,
        type: 'vocabulary',
        topic: 'Family',
        level: lesson.level as any,
        description: lesson.description,
        xp: lesson.xp,
        cards: cards as any,
        order: nextOrder++,
        published: true,
      },
    })

    console.log(`✅ Created (${cards.length} cards)`)
    await new Promise(r => setTimeout(r, 1000))
  }

  console.log('\n🎉 Done! Family vocabulary lessons are live.')
  await prisma.$disconnect()
}

main().catch(async e => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})
