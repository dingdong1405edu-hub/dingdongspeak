'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Mic, Brain, Trophy, Star, Zap, Target, Globe,
  ChevronRight, Play, CheckCircle, ArrowRight, Sparkles
} from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }
  }),
}

const features = [
  {
    icon: BookOpen, title: 'Beginner Path', color: 'from-emerald-500 to-cyan-500',
    desc: 'Học từ vựng, ngữ pháp rồi luyện nói theo chặng đường kiểu Duolingo với AI chấm điểm tức thì.',
  },
  {
    icon: Mic, title: 'IELTS Practice', color: 'from-cyan-500 to-violet-600',
    desc: 'Chọn topic, part, số câu. AI giám khảo đặt câu hỏi, bạn ghi âm, nhận điểm chuẩn IELTS tức thì.',
  },
  {
    icon: GraduationCap, title: 'Mock Test', color: 'from-violet-600 to-pink-500',
    desc: 'Thi thử như thật với AI đóng vai giám khảo. Chấm điểm nghiêm khắc đúng chuẩn band IELTS.',
  },
]

const stats = [
  { value: '10,000+', label: 'Học viên' },
  { value: '50+', label: 'Chủ đề IELTS' },
  { value: '9.0', label: 'Band cao nhất' },
  { value: '98%', label: 'Hài lòng' },
]

const steps = [
  { num: '01', title: 'Đăng ký miễn phí', desc: 'Tạo tài khoản trong 30 giây. Không cần thẻ tín dụng.' },
  { num: '02', title: 'Chọn bài luyện', desc: 'Luyện từ đầu với Beginner Path hoặc thẳng vào IELTS Practice.' },
  { num: '03', title: 'Ghi âm và nhận điểm', desc: 'AI chấm điểm tức thì theo chuẩn band IELTS. Nghiêm khắc và chính xác.' },
  { num: '04', title: 'Theo dõi tiến độ', desc: 'Dashboard heatmap, leaderboard và stats giúp bạn thấy sự tiến bộ rõ ràng.' },
]

const testimonials = [
  {
    name: 'Nguyễn Minh Anh', score: 'Band 7.0', avatar: 'M',
    text: 'Sau 2 tháng dùng DingDongSpeak, mình tăng từ band 5.5 lên 7.0. AI chấm nghiêm hơn thi thật nên khi thi thật thấy dễ hơn!'
  },
  {
    name: 'Trần Thị Hương', score: 'Band 6.5', avatar: 'H',
    text: 'Interface đẹp, dễ dùng. Đặc biệt phần lưu từ vựng và câu trả lời mẫu rất hữu ích cho việc ôn tập.',
  },
  {
    name: 'Lê Văn Đức', score: 'Band 8.0', avatar: 'D',
    text: 'Mock test giống thi thật đến mức mình không còn lo lắng khi bước vào phòng thi. Recommend 100%!',
  },
]

import { BookOpen, GraduationCap } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="grid-bg min-h-screen">

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-4 sm:px-6 relative overflow-hidden">
        {/* Ambient glows */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative">
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-dark text-cyan-400 text-sm font-medium mb-6 border border-cyan-400/20"
          >
            <Sparkles size={14} />
            Powered by Gemini AI + Deepgram
          </motion.div>

          <motion.h1 variants={fadeUp} initial="hidden" animate="visible" custom={1}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight"
          >
            Luyện IELTS Speaking<br />
            <span className="gradient-text text-glow">chuẩn band score</span>
          </motion.h1>

          <motion.p variants={fadeUp} initial="hidden" animate="visible" custom={2}
            className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto mb-10"
          >
            AI giám khảo nghiêm khắc chấm điểm thật — Fluency, Grammar, Vocabulary, Pronunciation.
            Luyện mỗi ngày, tăng band score mỗi tuần.
          </motion.p>

          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/register"
              className="group flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-600 text-white font-semibold text-lg hover:opacity-90 transition-all glow-cyan"
            >
              Bắt đầu miễn phí
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="#features"
              className="flex items-center gap-2 px-8 py-4 rounded-2xl glass-dark text-white/80 hover:text-white font-medium transition-all"
            >
              <Play size={18} />
              Xem demo
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={4}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto mt-16"
          >
            {stats.map((s) => (
              <div key={s.label} className="glass-dark rounded-2xl p-4">
                <div className="text-2xl font-bold gradient-text">{s.value}</div>
                <div className="text-white/50 text-sm mt-1">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              3 phần luyện tập toàn diện
            </h2>
            <p className="text-white/50 max-w-xl mx-auto">
              Từ người mới bắt đầu đến IELTS 8.0 — tất cả trong một nền tảng.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon
              return (
                <motion.div
                  key={f.title}
                  variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}
                  className="glass-dark rounded-2xl p-6 group hover:border-cyan-400/30 transition-all border border-white/8 card-hover"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon size={22} className="text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
                  <div className="mt-4">
                    <Link href={i === 0 ? '/learn' : i === 1 ? '/practice' : '/mock-test'}
                      className="flex items-center gap-1 text-cyan-400 text-sm font-medium hover:gap-2 transition-all"
                    >
                      Khám phá <ChevronRight size={14} />
                    </Link>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Bắt đầu chỉ trong 4 bước</h2>
          </motion.div>

          <div className="space-y-6">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}
                className="flex items-start gap-6 glass-dark rounded-2xl p-6 border border-white/8"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center text-white font-bold">
                  {step.num}
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg mb-1">{step.title}</h3>
                  <p className="text-white/50 text-sm">{step.desc}</p>
                </div>
                <CheckCircle size={20} className="text-emerald-400 flex-shrink-0 ml-auto self-center" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Premium Features */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="glass-dark rounded-3xl p-8 sm:p-12 border border-cyan-400/20 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 text-sm mb-6">
              <Star size={14} />
              Premium
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Không giới hạn với <span className="gradient-text">Premium</span>
            </h2>
            <p className="text-white/50 mb-8 max-w-xl mx-auto">
              Luyện không giới hạn, không cần chờ hồi mạng. Chỉ từ 100.000đ/tháng.
            </p>
            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              {[
                ['∞', 'Lượt luyện tập', 'Không giới hạn token'],
                ['∞', 'Mạng sống', 'Không bao giờ hết mạng'],
                ['PDF', 'Export', 'Xuất bài học đẹp'],
              ].map(([icon, title, desc]) => (
                <div key={title} className="bg-white/5 rounded-xl p-4">
                  <div className="text-2xl font-bold gradient-text mb-1">{icon}</div>
                  <div className="text-white font-medium text-sm">{title}</div>
                  <div className="text-white/40 text-xs">{desc}</div>
                </div>
              ))}
            </div>
            <Link href="/pricing"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold hover:opacity-90 transition-all"
            >
              Xem bảng giá <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-white mb-3">Học viên nói gì về chúng tôi</h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}
                className="glass-dark rounded-2xl p-6 border border-white/8"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-violet-600 flex items-center justify-center text-white font-bold">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm">{t.name}</div>
                    <div className="text-cyan-400 text-xs">{t.score}</div>
                  </div>
                  <div className="ml-auto flex">
                    {[...Array(5)].map((_, j) => <Star key={j} size={12} className="text-yellow-400 fill-yellow-400" />)}
                  </div>
                </div>
                <p className="text-white/60 text-sm leading-relaxed">{t.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Sẵn sàng luyện <span className="gradient-text">Speaking</span> chưa?
            </h2>
            <p className="text-white/50 text-lg mb-8">
              Bắt đầu miễn phí với 30 lượt luyện tập. Không cần thẻ tín dụng.
            </p>
            <Link href="/register"
              className="group inline-flex items-center gap-3 px-10 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-600 text-white font-bold text-lg hover:opacity-90 transition-all glow-cyan"
            >
              <Zap size={20} />
              Bắt đầu ngay — Miễn phí
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
