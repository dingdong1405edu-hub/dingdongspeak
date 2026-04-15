import Link from 'next/link'
import { Brain, Mic, Trophy, Users, Zap, Heart } from 'lucide-react'

export const metadata = { title: 'Về DingDongSpeak' }

const team = [
  { name: 'AI Examiner', role: 'Powered by Gemini 2.0 Flash', emoji: '🤖' },
  { name: 'Voice Engine', role: 'Deepgram Nova-3 + Aura TTS', emoji: '🎙️' },
  { name: 'Smart Scoring', role: 'IELTS Band 1–9 Calibrated', emoji: '📊' },
]

const stats = [
  { value: '50+', label: 'Chủ đề IELTS' },
  { value: '3', label: 'Module luyện tập' },
  { value: 'AI', label: 'Chấm điểm tức thì' },
  { value: '24/7', label: 'Luyện tập mọi lúc' },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen py-24 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-20">

        {/* Hero */}
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-[var(--text)] mb-4">
            Về DingDongSpeak
          </h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
            Nền tảng luyện nói tiếng Anh và IELTS Speaking bằng AI, được xây dựng dành riêng
            cho người học Việt Nam muốn đạt band score mục tiêu.
          </p>
        </div>

        {/* Mission */}
        <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-8 text-center">
          <Heart size={32} className="text-cyan-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[var(--text)] mb-3">Sứ mệnh của chúng tôi</h2>
          <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
            Giúp mọi người học Việt Nam tự tin nói tiếng Anh và chinh phục IELTS Speaking — không cần
            gia sư đắt tiền, không cần đến trung tâm, chỉ cần smartphone và kết nối internet.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {stats.map(s => (
            <div key={s.label} className="text-center rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
              <div className="text-3xl font-bold text-cyan-400 mb-1">{s.value}</div>
              <div className="text-sm text-[var(--text-secondary)]">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Features */}
        <div>
          <h2 className="text-2xl font-bold text-[var(--text)] mb-8 text-center">Tại sao chọn DingDongSpeak?</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                icon: Mic,
                color: 'from-cyan-500 to-blue-600',
                title: 'AI Nhận diện giọng nói',
                desc: 'Deepgram Nova-3 — độ chính xác cao nhất thị trường, nhận diện giọng Việt và phát âm không chuẩn.',
              },
              {
                icon: Brain,
                color: 'from-violet-500 to-purple-700',
                title: 'Chấm điểm IELTS chuẩn',
                desc: 'Gemini 2.0 Flash được calibrate theo IELTS Band Descriptors chính thức. Không inflate điểm.',
              },
              {
                icon: Trophy,
                color: 'from-yellow-500 to-orange-600',
                title: 'Gamification thông minh',
                desc: 'Lives system, streaks, leaderboard — giúp bạn duy trì thói quen luyện tập mỗi ngày.',
              },
              {
                icon: Zap,
                color: 'from-emerald-500 to-cyan-600',
                title: 'Feedback tức thì',
                desc: 'Sau mỗi câu trả lời, nhận ngay điểm số, nhận xét, và câu trả lời mẫu band 8.0.',
              },
              {
                icon: Users,
                color: 'from-pink-500 to-rose-600',
                title: 'Cộng đồng học tập',
                desc: 'Leaderboard tháng, hệ thống referral — học cùng bạn bè để có thêm động lực.',
              },
              {
                icon: Heart,
                color: 'from-indigo-500 to-violet-600',
                title: 'Made for Vietnam',
                desc: 'Giao diện tiếng Việt, giải thích bằng tiếng Việt, chủ đề phù hợp văn hóa Việt.',
              },
            ].map(f => (
              <div key={f.title} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 space-y-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center`}>
                  <f.icon size={20} className="text-white" />
                </div>
                <h3 className="font-semibold text-[var(--text)]">{f.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tech stack */}
        <div>
          <h2 className="text-2xl font-bold text-[var(--text)] mb-6 text-center">Công nghệ sử dụng</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {team.map(t => (
              <div key={t.name} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 text-center">
                <div className="text-3xl mb-2">{t.emoji}</div>
                <div className="font-semibold text-[var(--text)]">{t.name}</div>
                <div className="text-xs text-[var(--text-secondary)] mt-1">{t.role}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-[var(--text)]">Sẵn sàng bắt đầu?</h2>
          <p className="text-[var(--text-secondary)]">Miễn phí 30 lượt mỗi tháng. Không cần thẻ tín dụng.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/register"
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 text-white font-semibold hover:opacity-90 transition-all">
              Bắt đầu miễn phí
            </Link>
            <Link href="/pricing"
              className="px-8 py-3 rounded-xl border border-[var(--border)] text-[var(--text)] font-semibold hover:bg-[var(--bg-secondary)] transition-all">
              Xem bảng giá
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}
