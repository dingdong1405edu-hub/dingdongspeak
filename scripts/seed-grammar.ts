/**
 * Seed script: generate 37 English grammar lessons (based on English Grammar in Use)
 * Run: npx tsx scripts/seed-grammar.ts
 */

import { config } from 'dotenv'
config({ path: '.env.local' })
config()

import { PrismaClient } from '@prisma/client'
import Groq from 'groq-sdk'

const prisma = new PrismaClient()
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })

// ── Stage to create/reuse ──────────────────────────────────────────────────────
const STAGE = {
  title: 'English Grammar',
  subtitle: 'Ngữ pháp tiếng Anh A2 → B2 (English Grammar in Use)',
  icon: '📘',
  color: 'from-blue-500 to-indigo-600',
  accentColor: 'blue',
}

// ── 37 Grammar lessons ────────────────────────────────────────────────────────
const LESSONS = [
  {
    num: 1, level: 'A2',
    title: 'Present continuous (I am doing)',
    description: 'Hành động đang xảy ra tại thời điểm nói',
    note: 'Focus: am/is/are + verb-ing for actions happening NOW or around now (temporary situations). Contrast: I am working (now) vs I work (habit). Signal words: now, at the moment, today, this week.',
  },
  {
    num: 2, level: 'A2',
    title: 'Present simple (I do)',
    description: 'Thói quen, sự thật và trạng thái chung',
    note: 'Focus: do/does + base verb for habits, facts, states. Third person -s rule. Signal words: always, usually, often, never, every day. State verbs: know, like, want, believe cannot use continuous.',
  },
  {
    num: 3, level: 'A2',
    title: 'Present continuous and present simple 1',
    description: 'Phân biệt thì hiện tại tiếp diễn và hiện tại đơn',
    note: 'Focus: choosing between present continuous (happening now/temporary) and present simple (habit/fact). Key: "I am living in Paris" (temporary) vs "I live in Paris" (permanent). Action verbs vs state verbs.',
  },
  {
    num: 4, level: 'B1',
    title: 'Present continuous and present simple 2',
    description: 'Phân biệt nâng cao: thì hiện tại tiếp diễn và đơn',
    note: 'Focus: always + continuous for annoying habits ("She is always losing her keys"). Think/have/look as action vs state meaning. I think (believe, state) vs I am thinking (considering, action).',
  },
  {
    num: 5, level: 'A2',
    title: 'Past simple (I did)',
    description: 'Hành động đã hoàn thành trong quá khứ',
    note: 'Focus: regular (-ed) and irregular past forms. Completed actions at a specific past time. Signal words: yesterday, last week, ago, in 2010. Questions with did. Negatives with did not/did not.',
  },
  {
    num: 6, level: 'B1',
    title: 'Past continuous (I was doing)',
    description: 'Hành động đang diễn ra tại một thời điểm quá khứ',
    note: 'Focus: was/were + verb-ing for background actions in past. Often used with past simple: "I was watching TV when she called." Describes interrupted actions or parallel actions (while).',
  },
  {
    num: 7, level: 'B1',
    title: 'Present perfect 1 (I have done)',
    description: 'Hành động quá khứ có liên hệ với hiện tại',
    note: 'Focus: have/has + past participle. Use when: past action affects present, recent events (just, recently), with today/this week/this year. Do NOT use with finished time (yesterday, last year). Irregular past participles.',
  },
  {
    num: 8, level: 'B1',
    title: 'Present perfect 2 (I have done)',
    description: 'Kinh nghiệm và kết quả hiện tại',
    note: 'Focus: already (positive), yet (negative/question), just (very recently). "Have you ever...?" for life experience. "This is the first time I have..." Never vs ever. Been to vs gone to.',
  },
  {
    num: 9, level: 'B1',
    title: 'Present perfect continuous (I have been doing)',
    description: 'Hoạt động liên tục từ quá khứ đến hiện tại',
    note: 'Focus: have/has been + verb-ing. For activities that started in the past and continue now (or just stopped). Often with for/since. Shows duration and that the activity has been happening repeatedly.',
  },
  {
    num: 10, level: 'B1',
    title: 'Present perfect continuous and simple',
    description: 'So sánh present perfect continuous và simple',
    note: 'Focus: continuous (I have been painting - activity ongoing, result visible) vs simple (I have painted 3 rooms - completed result). Some verbs not used in continuous: know, like. Duration with "for" prefers continuous.',
  },
  {
    num: 11, level: 'B1',
    title: 'how long have you (been) ... ?',
    description: 'Hỏi về thời gian với present perfect',
    note: 'Focus: "How long have you been + verb-ing?" vs "How long have you + past participle?". Live/work/study prefer continuous. Have/know/own use simple. Answers use for (duration) or since (starting point).',
  },
  {
    num: 12, level: 'B1',
    title: 'for and since; when...? and how long...?',
    description: 'Dùng for và since để nói về thời gian',
    note: 'Focus: for + duration (for 3 years, for a long time). Since + starting point (since Monday, since I was a child). "When did you start?" vs "How long have you been...?" Note: in some languages for=since but not English.',
  },
  {
    num: 13, level: 'B1',
    title: 'Present perfect and past 1',
    description: 'Phân biệt present perfect và past simple',
    note: 'Focus: present perfect (unfinished time: today, this week, ever) vs past simple (finished time: yesterday, last year, in 2010). "Have you seen Tom today?" (today not finished) vs "Did you see Tom yesterday?" (finished).',
  },
  {
    num: 14, level: 'B1',
    title: 'Present perfect and past 2',
    description: 'So sánh nâng cao: present perfect và past simple',
    note: 'Focus: news/recent events first in present perfect, then details in past simple. "There has been an accident. It happened on the motorway." Also: it is/has been the first time + present perfect.',
  },
  {
    num: 15, level: 'B2',
    title: 'Past perfect (I had done)',
    description: 'Hành động xảy ra trước một thời điểm quá khứ',
    note: 'Focus: had + past participle for events before another past event. "When I arrived, the movie had already started." Often with: already, just, never, before, after, when, because. Contrast with past simple for sequence.',
  },
  {
    num: 16, level: 'B2',
    title: 'Past perfect continuous (I had been doing)',
    description: 'Hoạt động liên tục trước một thời điểm quá khứ',
    note: 'Focus: had been + verb-ing for duration of activity before a past moment. "She was tired because she had been working all day." Shows the cause/reason for a past state. With for/since/how long.',
  },
  {
    num: 17, level: 'A2',
    title: 'have and have got',
    description: 'Dùng have và have got',
    note: 'Focus: have got = have for possession/relationships/illnesses (British English). Questions: Have you got...? / Do you have...? Negatives: I have not got / I do not have. Have got only for states, not actions (I had breakfast, not I had got).',
  },
  {
    num: 18, level: 'B1',
    title: 'used to (do)',
    description: 'Thói quen và trạng thái trong quá khứ không còn nữa',
    note: 'Focus: used to + base verb for past habits/states that no longer exist. "I used to smoke." No present form—use present simple instead. Question: Did you use to...? Negative: did not use to. Not the same as "be used to" (accustomed to).',
  },
  {
    num: 19, level: 'B1',
    title: 'Present tenses for the future',
    description: 'Dùng thì hiện tại để nói về tương lai',
    note: 'Focus: present continuous for personal arrangements/plans ("I am meeting Jane tomorrow"). Present simple for timetables/schedules ("The train leaves at 8"). NOT for distant future predictions—use will instead.',
  },
  {
    num: 20, level: 'A2',
    title: "I'm going to (do)",
    description: 'Ý định và dự đoán dựa trên bằng chứng hiện tại',
    note: 'Focus: be going to + base verb for (1) future intentions/plans already decided, (2) predictions based on present evidence ("Look at those clouds—it is going to rain"). Contrast with will for spontaneous decisions.',
  },
  {
    num: 21, level: 'B1',
    title: 'will and shall 1',
    description: 'Quyết định tức thì, đề nghị và lời hứa',
    note: 'Focus: will for (1) spontaneous decisions at moment of speaking, (2) offers ("I will help you"), (3) promises. Shall I/we for offers and suggestions (British English). Contractions: I will = I will, I will not = I will not.',
  },
  {
    num: 22, level: 'B1',
    title: 'will and shall 2',
    description: 'Dự đoán tương lai và giả định',
    note: 'Focus: will for predictions about the future ("I think it will rain"). Phrases: I think/expect/hope/am sure + will. Will you...? for requests. Shall we...? for suggestions. I do not think he will... (not I think he will not)',
  },
  {
    num: 23, level: 'B1',
    title: 'I will and I\'m going to',
    description: 'Phân biệt will và going to',
    note: 'Focus: will = spontaneous decision/reaction at moment of speaking. Going to = plan already decided before speaking. "The phone is ringing—I will answer it." vs "I am going to call her at 6." Both can predict but going to = evidence now.',
  },
  {
    num: 24, level: 'B2',
    title: 'will be doing and will have done',
    description: 'Future continuous và future perfect',
    note: 'Focus: will be doing (future continuous) = action in progress at future time ("At 8pm I will be watching the game"). Will have done (future perfect) = action completed by future time ("By Friday I will have finished"). By + time expression.',
  },
  {
    num: 25, level: 'B1',
    title: 'when I do and when I\'ve done; if and when',
    description: 'Mệnh đề thời gian và điều kiện',
    note: 'Focus: use present simple (not will) in time clauses after when/before/after/until/as soon as. "I will call you when I arrive." Use present perfect in time clauses when action must complete first: "I will tell you when I have spoken to her."',
  },
  {
    num: 26, level: 'B1',
    title: 'can, could and (be) able to',
    description: 'Diễn đạt khả năng hiện tại và quá khứ',
    note: 'Focus: can (present ability/possibility/permission), could (past ability, more polite requests). Be able to used where can has no form (will be able to, have been able to, to be able to). Could = general past ability, was/were able to = specific achievement.',
  },
  {
    num: 27, level: 'B2',
    title: 'could (do) and could have (done)',
    description: 'Could trong tình huống giả định và quá khứ',
    note: 'Focus: could do = hypothetical present/future ability ("We could go to the cinema tonight"). Could have done = hypothetical past, missed opportunity, criticism ("You could have told me!" = you had the chance but did not). Contrast with was able to (actual achievement).',
  },
  {
    num: 28, level: 'B1',
    title: 'must and can\'t',
    description: 'Suy luận chắc chắn về hiện tại',
    note: 'Focus: must = logical deduction (positive): "She must be tired" (I am sure she is). Can\'t = logical deduction (negative): "That can\'t be right" (I am sure it is not). NOT the same as obligation must. Cannot use must not for deduction—use cannot/can\'t.',
  },
  {
    num: 29, level: 'B1',
    title: 'may and might 1',
    description: 'Khả năng có thể xảy ra (hiện tại và tương lai)',
    note: 'Focus: may/might = possibility (maybe true, maybe not). "She may be at home" = perhaps she is. Might = slightly less certain than may in practice, but often interchangeable. May not / might not for negative possibility. Questions: do not normally use may in questions for possibility.',
  },
  {
    num: 30, level: 'B2',
    title: 'may and might 2',
    description: 'May và might trong quá khứ và tình huống phức tạp',
    note: 'Focus: might have done / may have done = past possibility ("She might have forgotten"). Might as well (may as well) = no better alternative. May/might + be doing (continuous) for possible ongoing action. Might for suggestions.',
  },
  {
    num: 31, level: 'B1',
    title: 'have to and must',
    description: 'Nghĩa vụ và sự cần thiết',
    note: 'Focus: must = speaker imposes obligation ("You must stop smoking"). Have to = external obligation, rules ("I have to wear a uniform at work"). In past: had to (both). Negative: must not (prohibited) vs do not have to (not necessary, different meaning!).',
  },
  {
    num: 32, level: 'B1',
    title: "must, mustn't, needn't",
    description: 'Bắt buộc, cấm đoán và không cần thiết',
    note: 'Focus: must = obligation/necessity. Must not = prohibition (NOT allowed). Need not / do not need to = no obligation (allowed but not necessary). "You must not smoke here" (forbidden) vs "You need not hurry" (no need, you can take your time). Needn\'t have done = did but it was not necessary.',
  },
  {
    num: 33, level: 'B1',
    title: 'should 1',
    description: 'Lời khuyên và gợi ý',
    note: 'Focus: should (ought to) for advice, recommendation, opinion. "You should see a doctor." "Should I call him?" for asking advice. "I think you should..." Should not = inadvisable. Milder than must. Also: expectation ("The package should arrive tomorrow").',
  },
  {
    num: 34, level: 'B2',
    title: 'should 2',
    description: 'Should nâng cao và should have done',
    note: 'Focus: should have done = past regret or criticism ("You should have told me" = you did not, but it would have been better). Ought to have done = same meaning. Should for surprise or that something is unexpected ("It is strange that she should say that"). After "in case" and reporting.',
  },
  {
    num: 35, level: 'B1',
    title: "I'd better ...; it's time ...",
    description: 'Lời khuyên mạnh và đề xuất hành động',
    note: 'Focus: had better (\'d better) + base verb for strong advice/warning about a specific situation ("You\'d better hurry or you\'ll be late"). It\'s time + past tense for "this should happen now" ("It\'s time we left" = we should leave now). It\'s time + to-infinitive.',
  },
  {
    num: 36, level: 'B1',
    title: 'would',
    description: 'Các cách dùng của would',
    note: 'Focus: would for (1) hypothetical/conditional ("I would buy it if I had money"), (2) past habits ("We would often visit grandma"), (3) polite requests ("Would you mind?"), (4) preferences ("I would rather stay"). Would not = refused/was not willing (past).',
  },
  {
    num: 37, level: 'B1',
    title: 'can/could/would you...? (Requests, offers, permission)',
    description: 'Yêu cầu, đề nghị và xin phép lịch sự',
    note: 'Focus: Can I/you (informal request/permission). Could I/you (more polite). Would you mind + verb-ing? (polite request). May I (formal permission). Shall I (offer). Shall we / what about / why do not we (suggestions). Responding to offers: Yes please / No thank you / That would be lovely.',
  },
]

// ── Groq generation ───────────────────────────────────────────────────────────
async function generateCards(lesson: typeof LESSONS[0]): Promise<any[]> {
  const prompt = `You are an English grammar teacher creating exercises for Vietnamese learners (adults, intermediate level).

Grammar topic: "${lesson.title}"
Level: ${lesson.level}
Grammar focus: ${lesson.note}

Create exactly 10 grammar exercise cards: 4 MCQ + 3 fill-in-blank + 3 word-arrangement.
All hints/explanations must be in Vietnamese. Use everyday English contexts (work, travel, daily life, relationships).

Return ONLY valid JSON: {"cards":[...]}

Card formats:

MCQ (type "grammar") - 4 cards:
{"type":"grammar","rule":"<short rule name>","explanation":"<clear Vietnamese explanation of the grammar point>","examples":["<natural example 1>","<natural example 2>","<natural example 3>"],"tip":"<common mistake Vietnamese learners make, in Vietnamese>","question":"<exercise sentence or question>","options":["<option A>","<option B>","<option C>","<option D>"],"answer":"<exact text of correct option>"}

Fill-in-blank (type "fill-blank") - 3 cards:
{"type":"fill-blank","sentence":"<sentence with ___ for the blank>","answer":"<correct word/phrase>","options":["<correct>","<wrong1>","<wrong2>","<wrong3>"],"explanation":"<why this is correct, in Vietnamese>"}

Word arrangement (type "arrange") - 3 cards:
{"type":"arrange","words":["<word1>","<word2>","<word3>","<word4>","<word5>","<word6>"],"answer":"<correct full sentence>","hint":"<Vietnamese hint about the sentence meaning or structure>"}

Rules:
- options must be exactly 4, answer must exactly match one option
- arrange words must be shuffled (NOT in sentence order) and form a 6-8 word sentence
- exercises must directly test the grammar focus, not just vocabulary
- vary difficulty: some easy, some requiring careful thinking
- make exercises practical and relevant to everyday situations`

  const res = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    max_tokens: 3500,
    temperature: 0.4,
  })

  const raw = res.choices[0].message.content || '{}'
  const parsed = JSON.parse(raw)
  const cards = Array.isArray(parsed) ? parsed : (parsed.cards ?? [])
  if (!cards.length) throw new Error('Empty cards array')
  return cards
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 Starting grammar lesson seed...\n')

  if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY not set')
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL not set')

  // 1. Create or find the Grammar stage
  let stage = await prisma.stage.findFirst({ where: { title: STAGE.title } })
  if (!stage) {
    const maxOrder = await prisma.stage.aggregate({ _max: { order: true } })
    stage = await prisma.stage.create({
      data: { ...STAGE, order: (maxOrder._max.order ?? -1) + 1, published: true },
    })
    console.log(`✅ Created stage: ${stage.title} (${stage.id})\n`)
  } else {
    console.log(`♻️  Using existing stage: ${stage.title} (${stage.id})\n`)
  }

  // 2. Get max lesson order in this stage
  const maxLessonOrder = await prisma.customLesson.aggregate({
    where: { stageId: stage.id },
    _max: { order: true },
  })
  let nextOrder = (maxLessonOrder._max.order ?? -1) + 1

  // 3. Generate and save each lesson
  let created = 0
  let skipped = 0

  for (const lesson of LESSONS) {
    const existingLesson = await prisma.customLesson.findFirst({
      where: { stageId: stage.id, title: lesson.title },
    })

    if (existingLesson) {
      console.log(`⏭️  [${lesson.num}/37] Skipping (exists): ${lesson.title}`)
      skipped++
      continue
    }

    process.stdout.write(`⏳ [${lesson.num}/37] Generating: ${lesson.title} ... `)

    let cards: any[] = []
    let attempts = 0
    while (attempts < 3) {
      try {
        cards = await generateCards(lesson)
        break
      } catch (err: any) {
        attempts++
        if (attempts >= 3) {
          console.log(`\n❌ Failed after 3 attempts: ${err.message}`)
          break
        }
        process.stdout.write(`retry(${attempts})... `)
        await new Promise(r => setTimeout(r, 2000))
      }
    }

    if (!cards.length) {
      console.log('Skipping due to generation failure.')
      continue
    }

    await prisma.customLesson.create({
      data: {
        stageId: stage.id,
        title: lesson.title,
        type: 'grammar',
        topic: lesson.title,
        level: lesson.level,
        description: lesson.description,
        xp: lesson.level === 'A2' ? 40 : lesson.level === 'B1' ? 60 : 80,
        cards: cards as any,
        published: true,
        order: nextOrder++,
      },
    })

    console.log(`✅ ${cards.length} cards`)
    created++

    // Rate limit: 1.5s between calls
    await new Promise(r => setTimeout(r, 1500))
  }

  console.log(`\n🎉 Done! Created: ${created}, Skipped (already existed): ${skipped}`)
  console.log(`📚 Total lessons in stage: ${await prisma.customLesson.count({ where: { stageId: stage.id } })}`)
}

main()
  .catch(e => { console.error('\n💥 Fatal error:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
