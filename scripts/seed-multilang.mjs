/**
 * Seed Chinese (zh), Japanese (ja) and Korean (ko) Learn-path content.
 *
 * Plain ESM JavaScript so it runs with bare `node` (no tsx / no extra deps) —
 * suitable for Railway preDeployCommand. Reads the curriculum + pre-generated,
 * native-reviewed cards from scripts/seed-data/ and upserts language-scoped
 * Stage + CustomLesson rows. Idempotent (safe to re-run on every deploy).
 *
 * Prereq: DATABASE_URL set and the `language` column present
 * (the deploy runs `prisma db push` first).
 *
 * Run:  node scripts/seed-multilang.mjs           (zh + ja + ko)
 *       node scripts/seed-multilang.mjs zh         (one language)
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { PrismaClient } from '@prisma/client'

// ── Minimal .env loader (no dotenv dependency; no-op when vars already set) ─────
function loadEnv(file) {
  if (!existsSync(file)) return
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
    if (!m) continue
    let v = m[2].trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    if (!(m[1] in process.env)) process.env[m[1]] = v
  }
}
loadEnv('.env.local')
loadEnv('.env')

const prisma = new PrismaClient()
const DATA_DIR = join(process.cwd(), 'scripts', 'seed-data')
const XP_BY_TYPE = { vocabulary: 40, grammar: 60, speaking: 50 }

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'))
}

async function seedLanguage(lang) {
  const curriculumPath = join(DATA_DIR, `curriculum-${lang}.json`)
  if (!existsSync(curriculumPath)) {
    console.log(`⚠️  No curriculum for "${lang}" (${curriculumPath}) — skipping.`)
    return
  }
  const curriculum = readJson(curriculumPath)
  console.log(`\n🌏 Seeding ${lang.toUpperCase()} — ${curriculum.stages.length} stages, ${curriculum.lessons.length} lessons`)

  // 1) Upsert stages, build stageKey → stage.id map
  const stageId = new Map()
  let stageOrder = 0
  for (const s of curriculum.stages) {
    let stage = await prisma.stage.findFirst({ where: { language: lang, title: s.title } })
    const data = {
      subtitle: s.subtitle, icon: s.icon, color: s.color,
      accentColor: s.accentColor, order: stageOrder, published: true,
    }
    if (!stage) {
      stage = await prisma.stage.create({ data: { language: lang, title: s.title, ...data } })
      console.log(`  ✅ stage created: ${s.title}`)
    } else {
      await prisma.stage.update({ where: { id: stage.id }, data })
      console.log(`  ♻️  stage updated: ${s.title}`)
    }
    stageId.set(s.key, stage.id)
    stageOrder++
  }

  // 2) Upsert lessons (read pre-generated cards per lesson)
  let created = 0, updated = 0, missing = 0, lessonOrder = 0
  for (const lesson of curriculum.lessons) {
    const sId = stageId.get(lesson.stageKey)
    if (!sId) {
      console.log(`  ⚠️  lesson ${lesson.key}: unknown stageKey "${lesson.stageKey}" — skipping.`)
      continue
    }
    const cardsPath = join(DATA_DIR, lang, `${lesson.key}.json`)
    if (!existsSync(cardsPath)) {
      console.log(`  ⏭️  lesson ${lesson.key}: cards file not found — skipping.`)
      missing++
      continue
    }
    const cardFile = readJson(cardsPath)
    const cards = cardFile.cards ?? []
    if (!cards.length) {
      console.log(`  ⏭️  lesson ${lesson.key}: 0 cards — skipping.`)
      missing++
      continue
    }

    const data = {
      stageId: sId,
      language: lang,
      title: lesson.title,
      type: lesson.type,
      topic: lesson.topic,
      level: lesson.level,
      description: lesson.description,
      xp: XP_BY_TYPE[lesson.type] ?? 50,
      cards,
      order: lessonOrder,
      published: true,
    }

    const existing = await prisma.customLesson.findFirst({
      where: { language: lang, stageId: sId, title: lesson.title },
    })
    if (existing) {
      await prisma.customLesson.update({ where: { id: existing.id }, data })
      updated++
      console.log(`  ♻️  lesson updated: ${lesson.title} (${cards.length} cards)`)
    } else {
      await prisma.customLesson.create({ data })
      created++
      console.log(`  ✅ lesson created: ${lesson.title} (${cards.length} cards)`)
    }
    lessonOrder++
  }

  console.log(`  📚 ${lang.toUpperCase()} done — created ${created}, updated ${updated}, missing/skipped ${missing}`)
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL not set (check .env)')
  const arg = process.argv[2]
  const langs = arg ? [arg] : ['zh', 'ja', 'ko']
  console.log(`🚀 Seeding multilingual lessons: ${langs.join(', ')}`)

  for (const lang of langs) await seedLanguage(lang)

  for (const lang of langs) {
    const stages = await prisma.stage.count({ where: { language: lang } })
    const lessons = await prisma.customLesson.count({ where: { language: lang } })
    console.log(`\n📊 ${lang.toUpperCase()}: ${stages} stages, ${lessons} lessons in DB`)
  }
  console.log('\n🎉 Done.')
}

main()
  .catch(e => { console.error('\n💥 Fatal error:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
