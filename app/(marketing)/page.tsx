'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Mic, Star, Zap, ChevronRight, Play, CheckCircle,
  ArrowRight, Sparkles, BookOpen, GraduationCap, ShieldCheck
} from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }
  }),
}

const features = [
  {
    icon: BookOpen, title: 'Beginner Path', color: 'from-emerald-500 to-teal-500',
    desc: 'Học từ vựng, ngữ pháp rồi luyện nói theo chặng đường kiểu Duolingo với AI chấm điểm tức thì.',
    href: '/learn',
  },
  {
    icon: Mic, title: 'IELTS Practice', color: 'from-blue-600 to-indigo-600',
    desc: 'Chọn topic, part, số câu. AI giám khảo đặt câu hỏi, bạn ghi âm, nhận điểm chuẩn IELTS tức thì.',
    href: '/practice',
  },
  {
    icon: GraduationCap, title: 'Mock Test', color: 'from-violet-600 to-fuchsia-500',
    desc: 'Thi thử như thật với AI đóng vai giám khảo. Chấm điểm nghiêm khắc đúng chuẩn band IELTS.',
    href: '/mock-test',
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

export default function HomePage() {
  return (
    <div className="aurora-bg min-h-screen overflow-hidden">

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 relative">
        <div className="max-w-5xl mx-auto text-center relative">
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-light text-[var(--brand)] text-sm font-medium mb-6 shadow-soft"
          >
            <Sparkles size={14} />
            Powered by Gemini AI + Deepgram
          </motion.div>

          <motion.h1 variants={fadeUp} initial="hidden" animate="visible" custom={1}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-[var(--text)] mb-6 leading-[1.1] tracking-tight"
          >
            Luyện IELTS Speaking<br />
            <span className="gradient-text">chuẩn band score</span>
          </motion.h1>

          <motion.p variants={fadeUp} initial="hidden" animate="visible" custom={2}
            className="text-lg sm:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            AI giám khảo nghiêm khắc chấm điểm thật — Fluency, Grammar, Vocabulary, Pronunciation.
            Luyện mỗi ngày, tăng band score mỗi tuần.
          </motion.p>

          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/register"
              className="group flex items-center gap-2 px-8 py-4 rounded-2xl brand-gradient text-white font-semibold text-lg hover:opacity-95 transition-all shadow-brand"
            >
              Bắt đầu miễn phí
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="#features"
              className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-[var(--text)] font-medium border border-[var(--border)] hover:border-[var(--brand)]/40 hover:shadow-soft transition-all"
            >
              <Play size={18} className="text-[var(--brand)]" />
              Xem demo
            </Link>
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={4}
            className="flex items-center justify-center gap-2 mt-6 text-sm text-[var(--text-secondary)]"
          >
            <ShieldCheck size={16} className="text-emerald-500" />
            Miễn phí 30 lượt — không cần thẻ tín dụng
          </motion.div>

          {/* Stats */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={5}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto mt-16"
          >
            {stats.map((s) => (
              <div key={s.label} className="soft-card rounded-2xl p-4">
                <div className="text-2xl font-bold gradient-text">{s.value}</div>
                <div className="text-[var(--text-secondary)] text-sm mt-1">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Language selector — multi-language platform (Multi-Zones) */}
      <section className="px-4 sm:px-6 relative z-10">
        <div className="max-w-3xl mx-auto">
          <p className="text-center text-[var(--text-secondary)] text-sm mb-4">Chọn ngôn ngữ bạn muốn học</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <a href="/" className="soft-card rounded-2xl p-5 ring-2 ring-[var(--brand)]/50 text-center hover:ring-[var(--brand)] transition-all">
              <div className="text-3xl mb-1">🇬🇧</div>
              <div className="text-[var(--text)] font-semibold">Tiếng Anh</div>
              <div className="text-[var(--brand)] text-xs mt-1">IELTS Speaking · đang xem</div>
            </a>
            <a href="/ja" className="soft-card rounded-2xl p-5 text-center hover:ring-2 hover:ring-pink-400/60 transition-all">
              <div className="text-3xl mb-1">🇯🇵</div>
              <div className="text-[var(--text)] font-semibold">Tiếng Nhật</div>
              <div className="text-[var(--text-secondary)] text-xs mt-1">JLPT N5–N1</div>
            </a>
            <a href="/zh" className="soft-card rounded-2xl p-5 text-center hover:ring-2 hover:ring-red-400/60 transition-all">
              <div className="text-3xl mb-1">🇨🇳</div>
              <div className="text-[var(--text)] font-semibold">Tiếng Trung</div>
              <div className="text-[var(--text-secondary)] text-xs mt-1">HSK 1–6</div>
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text)] mb-4 tracking-tight">
              3 phần luyện tập toàn diện
            </h2>
            <p className="text-[var(--text-secondary)] max-w-xl mx-auto">
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
                  className="soft-card rounded-2xl p-6 group card-hover"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-soft`}>
                    <Icon size={22} className="text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-[var(--text)] mb-2">{f.title}</h3>
                  <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{f.desc}</p>
                  <div className="mt-4">
                    <Link href={f.href}
                      className="flex items-center gap-1 text-[var(--brand)] text-sm font-semibold hover:gap-2 transition-all"
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
      <section id="how-it-works" className="py-24 px-4 sm:px-6 light-grid">
        <div className="max-w-4xl mx-auto">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text)] mb-4 tracking-tight">Bắt đầu chỉ trong 4 bước</h2>
          </motion.div>

          <div className="space-y-5">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}
                className="flex items-start gap-6 soft-card rounded-2xl p-6"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-xl brand-gradient flex items-center justify-center text-white font-bold">
                  {step.num}
                </div>
                <div>
                  <h3 className="text-[var(--text)] font-semibold text-lg mb-1">{step.title}</h3>
                  <p className="text-[var(--text-secondary)] text-sm">{step.desc}</p>
                </div>
                <CheckCircle size={20} className="text-emerald-500 flex-shrink-0 ml-auto self-center" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Premium Features */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="relative rounded-3xl p-8 sm:p-12 text-center overflow-hidden brand-gradient shadow-soft-lg">
            <div className="absolute inset-0 dot-grid opacity-30 pointer-events-none" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 border border-white/25 text-white text-sm mb-6">
                <Star size={14} />
                Premium
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
                Không giới hạn với Premium
              </h2>
              <p className="text-white/80 mb-8 max-w-xl mx-auto">
                Luyện không giới hạn, không cần chờ hồi mạng. Chỉ từ 100.000đ/tháng.
              </p>
              <div className="grid sm:grid-cols-3 gap-4 mb-8">
                {[
                  ['∞', 'Lượt luyện tập', 'Không giới hạn token'],
                  ['∞', 'Mạng sống', 'Không bao giờ hết mạng'],
                  ['PDF', 'Export', 'Xuất bài học đẹp'],
                ].map(([icon, title, desc]) => (
                  <div key={title} className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/15">
                    <div className="text-2xl font-bold text-white mb-1">{icon}</div>
                    <div className="text-white font-medium text-sm">{title}</div>
                    <div className="text-white/70 text-xs">{desc}</div>
                  </div>
                ))}
              </div>
              <Link href="/pricing"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-white text-[var(--brand)] font-semibold hover:bg-white/90 transition-all shadow-soft"
              >
                Xem bảng giá <ChevronRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-[var(--text)] mb-3 tracking-tight">Học viên nói gì về chúng tôi</h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}
                className="soft-card rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full brand-gradient flex items-center justify-center text-white font-bold">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-[var(--text)] font-medium text-sm">{t.name}</div>
                    <div className="text-[var(--brand)] text-xs font-medium">{t.score}</div>
                  </div>
                  <div className="ml-auto flex">
                    {[...Array(5)].map((_, j) => <Star key={j} size={12} className="text-amber-400 fill-amber-400" />)}
                  </div>
                </div>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{t.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <h2 className="text-4xl sm:text-5xl font-bold text-[var(--text)] mb-6 tracking-tight">
              Sẵn sàng luyện <span className="gradient-text">Speaking</span> chưa?
            </h2>
            <p className="text-[var(--text-secondary)] text-lg mb-8">
              Bắt đầu miễn phí với 30 lượt luyện tập. Không cần thẻ tín dụng.
            </p>
            <Link href="/register"
              className="group inline-flex items-center gap-3 px-10 py-4 rounded-2xl brand-gradient text-white font-bold text-lg hover:opacity-95 transition-all shadow-brand"
            >
              <Zap size={20} />
              Bắt đầu ngay — Miễn phí
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Floating support button */}
      <a
        href="https://www.facebook.com/dong.ding.junior"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#1877F2] text-white font-semibold text-sm shadow-lg hover:bg-[#166FE5] transition-all hover:scale-105 active:scale-95"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
        Hỗ trợ / Phản hồi
      </a>
    </div>
  )
}
