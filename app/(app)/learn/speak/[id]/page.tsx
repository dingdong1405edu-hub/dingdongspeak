'use client'

import { useState, use } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Mic, Trophy, ChevronRight, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { AudioRecorder } from '@/components/practice/audio-recorder'
import { cn } from '@/lib/utils'
import { useLang } from '@/components/shared/lang-provider'
import { type LangCode } from '@/lib/languages'

interface SpeakTopic {
  title: string
  description: string
  /** Index into config.levels (0 = easiest) so badges adapt per language. */
  levelIdx: number
  prompts: Array<{ prompt: string; hint: string }>
}

// Per-language speaking topics. Prompts are in the TARGET language (authored as
// natural beginner questions); hints stay Vietnamese. Keyed by LangCode → topic id.
const SPEAK_TOPICS: Record<LangCode, Record<string, SpeakTopic>> = {
  en: {
    s1: {
      title: 'Giới thiệu bản thân',
      description: 'Học cách nói về tên, tuổi, nghề nghiệp và quê quán',
      levelIdx: 0,
      prompts: [
        { prompt: 'Tell me your name and where you are from.', hint: 'My name is... I am from...' },
        { prompt: 'What do you do? Are you a student or do you work?', hint: 'I am a student / I work as a...' },
        { prompt: 'How old are you and what are your hobbies?', hint: 'I am... years old. My hobbies are...' },
      ],
    },
    s2: {
      title: 'Gia đình & Bạn bè',
      description: 'Nói về người thân và mô tả tính cách',
      levelIdx: 1,
      prompts: [
        { prompt: 'Describe your family. How many people are in your family?', hint: 'My family has... members. My father is... My mother is...' },
        { prompt: 'Tell me about your best friend. What is he/she like?', hint: 'My best friend is... He/She is very...' },
        { prompt: 'What do you usually do with your family on weekends?', hint: 'On weekends, we usually... We enjoy...' },
      ],
    },
    s3: {
      title: 'Sở thích & Thời gian rảnh',
      description: 'Diễn đạt sở thích và hoạt động giải trí',
      levelIdx: 1,
      prompts: [
        { prompt: 'What are your hobbies? Why do you enjoy them?', hint: 'I love... because it helps me...' },
        { prompt: 'Do you prefer watching movies or reading books? Why?', hint: 'I prefer... because...' },
        { prompt: 'Tell me about a sport or activity you enjoy doing.', hint: 'I enjoy... I usually... It is...' },
      ],
    },
    s4: {
      title: 'Trường học & Học tập',
      description: 'Nói về trường lớp, môn học yêu thích',
      levelIdx: 2,
      prompts: [
        { prompt: 'Describe your school or university. What is it like?', hint: 'My school is located in... It has... students...' },
        { prompt: 'What is your favorite subject and why?', hint: 'My favorite subject is... because it...' },
        { prompt: 'How do you usually study? Do you study alone or in groups?', hint: 'I usually study... I prefer studying...' },
      ],
    },
    s5: {
      title: 'Công việc & Nghề nghiệp',
      description: 'Mô tả công việc và kế hoạch nghề nghiệp',
      levelIdx: 2,
      prompts: [
        { prompt: 'Describe your job or your dream job.', hint: 'I work as... / I dream of becoming... because...' },
        { prompt: 'What skills are important for your job or career?', hint: 'For this job, you need... I think the most important skill is...' },
        { prompt: 'Where do you see yourself in 5 years?', hint: 'In 5 years, I hope to... I plan to...' },
      ],
    },
  },

  zh: {
    s1: {
      title: 'Giới thiệu bản thân',
      description: 'Học cách nói về tên, tuổi, nghề nghiệp và quê quán',
      levelIdx: 0,
      prompts: [
        { prompt: '请你介绍一下你自己，你叫什么名字？你是哪里人？', hint: '我叫… 我是… 人。' },
        { prompt: '你是学生还是工作了？你做什么工作？', hint: '我是学生。/ 我是… (nghề nghiệp)。' },
        { prompt: '你今年多大了？你有什么爱好？', hint: '我今年…岁。我喜欢…' },
      ],
    },
    s2: {
      title: 'Gia đình & Bạn bè',
      description: 'Nói về người thân và mô tả tính cách',
      levelIdx: 1,
      prompts: [
        { prompt: '请介绍一下你的家庭，你家有几口人？', hint: '我家有…口人。我爸爸是… 我妈妈是…' },
        { prompt: '说说你最好的朋友，他/她是什么样的人？', hint: '我最好的朋友是… 他/她很…' },
        { prompt: '周末你常常和家人一起做什么？', hint: '周末我们常常… 我们喜欢…' },
      ],
    },
    s3: {
      title: 'Sở thích & Thời gian rảnh',
      description: 'Diễn đạt sở thích và hoạt động giải trí',
      levelIdx: 1,
      prompts: [
        { prompt: '你有什么爱好？为什么喜欢？', hint: '我喜欢… 因为…' },
        { prompt: '你喜欢看电影还是看书？为什么？', hint: '我比较喜欢… 因为…' },
        { prompt: '说说一个你喜欢的运动或活动。', hint: '我喜欢… 我常常… 它很…' },
      ],
    },
    s4: {
      title: 'Trường học & Học tập',
      description: 'Nói về trường lớp, môn học yêu thích',
      levelIdx: 2,
      prompts: [
        { prompt: '请介绍一下你的学校，它怎么样？', hint: '我的学校在… 有…个学生…' },
        { prompt: '你最喜欢的科目是什么？为什么？', hint: '我最喜欢… 因为它…' },
        { prompt: '你平时怎么学习？喜欢一个人学还是一起学？', hint: '我平时… 我比较喜欢…学习。' },
      ],
    },
    s5: {
      title: 'Công việc & Nghề nghiệp',
      description: 'Mô tả công việc và kế hoạch nghề nghiệp',
      levelIdx: 2,
      prompts: [
        { prompt: '说说你的工作或者你理想的工作。', hint: '我的工作是… / 我想当… 因为…' },
        { prompt: '做这个工作需要什么能力？', hint: '做这个工作需要… 我觉得最重要的是…' },
        { prompt: '五年以后你想做什么？', hint: '五年以后，我希望… 我打算…' },
      ],
    },
  },

  ja: {
    s1: {
      title: 'Giới thiệu bản thân',
      description: 'Học cách nói về tên, tuổi, nghề nghiệp và quê quán',
      levelIdx: 0,
      prompts: [
        { prompt: '自己紹介をしてください。お名前と出身はどこですか？', hint: '私の名前は…です。…から来ました。' },
        { prompt: '学生ですか、働いていますか？何をしていますか？', hint: '私は学生です。/ 私は…をしています。' },
        { prompt: '何歳ですか？趣味は何ですか？', hint: '私は…歳です。趣味は…です。' },
      ],
    },
    s2: {
      title: 'Gia đình & Bạn bè',
      description: 'Nói về người thân và mô tả tính cách',
      levelIdx: 1,
      prompts: [
        { prompt: 'あなたの家族について話してください。何人家族ですか？', hint: '…人家族です。父は… 母は…' },
        { prompt: '一番仲のいい友達はどんな人ですか？', hint: '私の親友は… とても…な人です。' },
        { prompt: '週末は家族とよく何をしますか？', hint: '週末はよく… 私たちは…のが好きです。' },
      ],
    },
    s3: {
      title: 'Sở thích & Thời gian rảnh',
      description: 'Diễn đạt sở thích và hoạt động giải trí',
      levelIdx: 1,
      prompts: [
        { prompt: '趣味は何ですか？どうしてそれが好きですか？', hint: '私は…が好きです。なぜなら…' },
        { prompt: '映画を見るのと本を読むの、どちらが好きですか？', hint: '私は…のほうが好きです。理由は…' },
        { prompt: '好きなスポーツや活動について話してください。', hint: '私は…が好きです。よく… それは…' },
      ],
    },
    s4: {
      title: 'Trường học & Học tập',
      description: 'Nói về trường lớp, môn học yêu thích',
      levelIdx: 2,
      prompts: [
        { prompt: 'あなたの学校はどんな学校ですか？', hint: '私の学校は…にあります。学生は…人います。' },
        { prompt: '一番好きな科目は何ですか？どうしてですか？', hint: '一番好きな科目は…です。なぜなら…' },
        { prompt: 'いつもどうやって勉強しますか？一人ですか、みんなとですか？', hint: '私はいつも… 一人で/みんなで勉強するのが好きです。' },
      ],
    },
    s5: {
      title: 'Công việc & Nghề nghiệp',
      description: 'Mô tả công việc và kế hoạch nghề nghiệp',
      levelIdx: 2,
      prompts: [
        { prompt: 'あなたの仕事、または夢の仕事について話してください。', hint: '私は…をしています。/ 私は…になりたいです。なぜなら…' },
        { prompt: 'その仕事にはどんなスキルが大切ですか？', hint: 'この仕事には…が必要です。一番大切なのは…' },
        { prompt: '五年後、あなたは何をしていたいですか？', hint: '五年後、私は…たいです。…するつもりです。' },
      ],
    },
  },

  ko: {
    s1: {
      title: 'Giới thiệu bản thân',
      description: 'Học cách nói về tên, tuổi, nghề nghiệp và quê quán',
      levelIdx: 0,
      prompts: [
        { prompt: '자기소개를 해 주세요. 이름이 뭐예요? 어디에서 왔어요?', hint: '제 이름은 …이에요/예요. 저는 …에서 왔어요.' },
        { prompt: '학생이에요, 아니면 일을 해요? 무슨 일을 해요?', hint: '저는 학생이에요. / 저는 …이에요/예요.' },
        { prompt: '몇 살이에요? 취미가 뭐예요?', hint: '저는 …살이에요. 제 취미는 …이에요/예요.' },
      ],
    },
    s2: {
      title: 'Gia đình & Bạn bè',
      description: 'Nói về người thân và mô tả tính cách',
      levelIdx: 1,
      prompts: [
        { prompt: '가족을 소개해 주세요. 가족이 몇 명이에요?', hint: '우리 가족은 …명이에요. 아버지는… 어머니는…' },
        { prompt: '제일 친한 친구는 어떤 사람이에요?', hint: '제 친한 친구는… 아주 …해요.' },
        { prompt: '주말에 가족이랑 보통 뭐 해요?', hint: '주말에 우리는 보통… 우리는 …는 걸 좋아해요.' },
      ],
    },
    s3: {
      title: 'Sở thích & Thời gian rảnh',
      description: 'Diễn đạt sở thích và hoạt động giải trí',
      levelIdx: 1,
      prompts: [
        { prompt: '취미가 뭐예요? 왜 그것을 좋아해요?', hint: '저는 …을/를 좋아해요. 왜냐하면…' },
        { prompt: '영화 보는 거랑 책 읽는 거 중에 뭘 더 좋아해요?', hint: '저는 …을/를 더 좋아해요. 왜냐하면…' },
        { prompt: '좋아하는 운동이나 활동에 대해 말해 주세요.', hint: '저는 …을/를 좋아해요. 보통… 그것은…' },
      ],
    },
    s4: {
      title: 'Trường học & Học tập',
      description: 'Nói về trường lớp, môn học yêu thích',
      levelIdx: 2,
      prompts: [
        { prompt: '학교가 어때요? 학교를 소개해 주세요.', hint: '제 학교는 …에 있어요. 학생이 …명 있어요.' },
        { prompt: '제일 좋아하는 과목이 뭐예요? 왜요?', hint: '제일 좋아하는 과목은 …이에요/예요. 왜냐하면…' },
        { prompt: '보통 어떻게 공부해요? 혼자 해요, 같이 해요?', hint: '저는 보통… 혼자/같이 공부하는 걸 좋아해요.' },
      ],
    },
    s5: {
      title: 'Công việc & Nghề nghiệp',
      description: 'Mô tả công việc và kế hoạch nghề nghiệp',
      levelIdx: 2,
      prompts: [
        { prompt: '하는 일이나 꿈의 직업에 대해 말해 주세요.', hint: '저는 …일을 해요. / 저는 …이/가 되고 싶어요. 왜냐하면…' },
        { prompt: '그 일에는 어떤 능력이 중요해요?', hint: '이 일에는 …이/가 필요해요. 제일 중요한 건…' },
        { prompt: '5년 후에 뭘 하고 싶어요?', hint: '5년 후에 저는 …고 싶어요. …을/를 계획하고 있어요.' },
      ],
    },
  },
}

const FALLBACK_TOPIC: Record<LangCode, SpeakTopic> = {
  en: {
    title: 'Luyện nói tự do',
    description: 'Luyện nói tự do về bất kỳ chủ đề nào',
    levelIdx: 2,
    prompts: [
      { prompt: 'Tell me something interesting about yourself.', hint: 'Điều gì đó đặc biệt hoặc đáng nhớ về bạn' },
      { prompt: 'Describe your hometown or city.', hint: 'Nơi đó như thế nào? Bạn thích điều gì ở đó?' },
      { prompt: 'What are your plans for the future?', hint: 'Mục tiêu ngắn hạn và dài hạn' },
    ],
  },
  zh: {
    title: 'Luyện nói tự do',
    description: 'Luyện nói tự do về bất kỳ chủ đề nào',
    levelIdx: 2,
    prompts: [
      { prompt: '请说一件关于你自己有意思的事。', hint: 'Điều gì đó đặc biệt hoặc đáng nhớ về bạn' },
      { prompt: '请介绍一下你的家乡或者你住的城市。', hint: 'Nơi đó như thế nào? Bạn thích điều gì ở đó?' },
      { prompt: '你对未来有什么计划？', hint: 'Mục tiêu ngắn hạn và dài hạn' },
    ],
  },
  ja: {
    title: 'Luyện nói tự do',
    description: 'Luyện nói tự do về bất kỳ chủ đề nào',
    levelIdx: 2,
    prompts: [
      { prompt: '自分について面白いことを話してください。', hint: 'Điều gì đó đặc biệt hoặc đáng nhớ về bạn' },
      { prompt: 'あなたの故郷や住んでいる町について話してください。', hint: 'Nơi đó như thế nào? Bạn thích điều gì ở đó?' },
      { prompt: '将来の計画は何ですか？', hint: 'Mục tiêu ngắn hạn và dài hạn' },
    ],
  },
  ko: {
    title: 'Luyện nói tự do',
    description: 'Luyện nói tự do về bất kỳ chủ đề nào',
    levelIdx: 2,
    prompts: [
      { prompt: '자신에 대해 재미있는 것을 이야기해 주세요.', hint: 'Điều gì đó đặc biệt hoặc đáng nhớ về bạn' },
      { prompt: '고향이나 살고 있는 도시를 소개해 주세요.', hint: 'Nơi đó như thế nào? Bạn thích điều gì ở đó?' },
      { prompt: '앞으로의 계획이 뭐예요?', hint: 'Mục tiêu ngắn hạn và dài hạn' },
    ],
  },
}

function getTopic(id: string, lang: LangCode): SpeakTopic {
  return SPEAK_TOPICS[lang]?.[id] ?? FALLBACK_TOPIC[lang]
}

export default function SpeakPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { lang, config } = useLang()
  const topic = getTopic(id, lang)
  const levelLabel = config.levels[topic.levelIdx] ?? config.levels[0] ?? config.defaultLevel

  const [promptIdx, setPromptIdx] = useState(0)
  const [scores, setScores] = useState<number[]>([])
  const [currentScore, setCurrentScore] = useState<{ score: number; feedback: string } | null>(null)
  const [completed, setCompleted] = useState(false)
  const [loading, setLoading] = useState(false)

  const prompt = topic.prompts[promptIdx]
  const progress = (promptIdx / topic.prompts.length) * 100

  async function handleSpeakingComplete(_: Blob, transcript: string) {
    if (!transcript.trim()) {
      toast.error('Không nhận diện được giọng nói. Vui lòng thử lại.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/ai/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: prompt.prompt,
          transcript,
          type: 'BEGINNER',
          topic: topic.title,
          lang,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Chấm điểm thất bại')
        return
      }

      const score = data.score?.score ?? 70
      const feedback = data.score?.feedback ?? 'Câu trả lời của bạn khá tốt!'
      setCurrentScore({ score, feedback })
      setScores(prev => [...prev, score])
    } catch {
      toast.error('Lỗi kết nối. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  function handleNext() {
    setCurrentScore(null)
    if (promptIdx + 1 >= topic.prompts.length) {
      saveProgress()
      setCompleted(true)
    } else {
      setPromptIdx(i => i + 1)
    }
  }

  async function saveProgress() {
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b) / scores.length) : 70
    await fetch('/api/learn/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId: `speak_${id}`, score: avgScore }),
    })
  }

  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b) / scores.length) : 0

  if (completed) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 space-y-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}>
          <Trophy size={64} className="text-yellow-400 mx-auto mb-4" />
        </motion.div>
        <h2 className="text-2xl font-bold text-[var(--text)]">Hoàn thành bài nói!</h2>
        <p className="text-[var(--text-secondary)]">Chủ đề: {topic.title}</p>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
          <div className={cn('text-5xl font-bold mb-2', avgScore >= 75 ? 'text-emerald-400' : avgScore >= 55 ? 'text-yellow-400' : 'text-orange-400')}>
            {avgScore}%
          </div>
          <p className="text-[var(--text-secondary)] text-sm">Điểm trung bình {scores.length} câu hỏi</p>
        </div>

        <div className="flex gap-3 justify-center">
          <Button variant="secondary" onClick={() => { setCompleted(false); setPromptIdx(0); setScores([]); setCurrentScore(null) }}>
            <RotateCcw size={16} /> Làm lại
          </Button>
          <Button variant="gradient" onClick={() => router.push('/learn')}>
            Tiếp tục <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/learn')} className="p-2 rounded-xl hover:bg-[var(--bg-secondary)] transition-all text-[var(--text-secondary)]">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-1">
            <span>{topic.title}</span>
            <span>{promptIdx + 1}/{topic.prompts.length}</span>
          </div>
          <div className="h-2 rounded-full bg-[var(--border)]">
            <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* Level badge */}
      <div className="flex items-center gap-2">
        <span className={cn(
          'px-2.5 py-1 rounded-full text-xs font-bold',
          topic.levelIdx <= 0 ? 'bg-emerald-500/15 text-emerald-400' :
          topic.levelIdx === 1 ? 'bg-cyan-500/15 text-cyan-400' :
          'bg-violet-500/15 text-violet-400'
        )}>
          {levelLabel}
        </span>
        <span className="text-sm text-[var(--text-secondary)]">{topic.description}</span>
      </div>

      {/* Question card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={promptIdx}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 space-y-3"
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-violet-500/15 flex items-center justify-center flex-shrink-0">
              <Mic size={16} className="text-violet-400" />
            </div>
            <div>
              <p className="font-semibold text-[var(--text)] text-lg leading-relaxed">{prompt.prompt}</p>
              <p className="text-sm text-[var(--text-secondary)] mt-1 italic">💡 Gợi ý: {prompt.hint}</p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Score display */}
      <AnimatePresence>
        {currentScore && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={cn(
              'rounded-2xl border p-5 space-y-3',
              currentScore.score >= 75 ? 'border-emerald-400/30 bg-emerald-500/5' :
              currentScore.score >= 55 ? 'border-yellow-400/30 bg-yellow-500/5' :
              'border-orange-400/30 bg-orange-500/5'
            )}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[var(--text)]">Kết quả</span>
              <span className={cn(
                'text-3xl font-bold',
                currentScore.score >= 75 ? 'text-emerald-400' :
                currentScore.score >= 55 ? 'text-yellow-400' : 'text-orange-400'
              )}>
                {currentScore.score}%
              </span>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">{currentScore.feedback}</p>
            <Button variant="gradient" className="w-full" onClick={handleNext}>
              {promptIdx + 1 >= topic.prompts.length ? 'Hoàn thành' : 'Câu tiếp theo'}
              <ChevronRight size={16} />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recorder */}
      {!currentScore && (
        loading ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <div className="w-16 h-16 rounded-full border-4 border-cyan-400/30 border-t-cyan-400 animate-spin" />
            <p className="text-[var(--text-secondary)] text-sm">Đang chấm điểm...</p>
          </div>
        ) : (
          <AudioRecorder
            onComplete={handleSpeakingComplete}
            onStart={() => {}}
            lang={lang}
          />
        )
      )}
    </div>
  )
}
