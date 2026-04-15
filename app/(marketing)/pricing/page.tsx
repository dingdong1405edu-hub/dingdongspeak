import Link from 'next/link'
import { Crown, CheckCircle, Zap, Heart, Star, Gift } from 'lucide-react'
import { PREMIUM_PLANS } from '@/types'
import { cn } from '@/lib/utils'

export const metadata = { title: 'Bảng giá' }

const allFeatures = [
  { label: 'Luyện tập IELTS Practice', free: '30 lượt/tháng', premium: 'Không giới hạn' },
  { label: 'IELTS Mock Test', free: '5 lượt/tháng', premium: 'Không giới hạn' },
  { label: 'Beginner Path', free: '5 mạng', premium: 'Không giới hạn' },
  { label: 'AI chấm điểm IELTS', free: '✓', premium: '✓ Ưu tiên' },
  { label: 'Câu trả lời mẫu Band 8', free: '✓', premium: '✓' },
  { label: 'Lưu từ vựng & Idioms', free: '✓', premium: '✓ Không giới hạn' },
  { label: 'Export PDF', free: '✗', premium: '✓' },
  { label: 'Analytics chi tiết', free: '✗', premium: '✓' },
  { label: 'Badge Premium', free: '✗', premium: '✓' },
  { label: 'Hỗ trợ ưu tiên', free: '✗', premium: '✓' },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen py-24 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-[var(--text)] mb-4">
            Giá cả đơn giản, minh bạch
          </h1>
          <p className="text-[var(--text-secondary)] max-w-xl mx-auto">
            Bắt đầu miễn phí với 30 lượt. Nâng cấp để luyện không giới hạn.
          </p>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-6 mb-16 max-w-3xl mx-auto">
          {/* Free */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-8">
            <div className="mb-6">
              <div className="text-sm font-medium text-[var(--text-secondary)] uppercase mb-2">Miễn phí</div>
              <div className="text-4xl font-bold text-[var(--text)]">0đ <span className="text-base font-normal text-[var(--text-secondary)]">/tháng</span></div>
            </div>
            <ul className="space-y-3 mb-8">
              {['30 token/tháng', '5 mạng sống (hồi sau 30 phút)', 'Tất cả tính năng cơ bản', 'Giới hạn mock test'].map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <CheckCircle size={16} className="text-emerald-400 flex-shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <Link href="/register" className="block w-full py-3 rounded-xl border border-[var(--border)] text-center text-sm font-semibold text-[var(--text)] hover:bg-[var(--bg-secondary)] transition-all">
              Bắt đầu miễn phí
            </Link>
          </div>

          {/* Premium */}
          <div className="rounded-2xl border-2 border-yellow-500/50 bg-gradient-to-b from-yellow-500/10 to-transparent p-8 relative">
            <div className="absolute -top-3 right-6">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                Tiết kiệm nhất
              </span>
            </div>
            <div className="mb-6">
              <div className="flex items-center gap-2 text-sm font-medium text-yellow-400 uppercase mb-2">
                <Crown size={14} /> Premium
              </div>
              <div className="space-y-1">
                {PREMIUM_PLANS.map(plan => (
                  <div key={plan.months} className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-[var(--text)]">
                      {(plan.price / 1000).toFixed(0)}k
                    </span>
                    <span className="text-[var(--text-secondary)] text-sm">/{plan.label}</span>
                    {plan.discount > 0 && (
                      <span className="text-xs text-emerald-400">(-{plan.discount}%)</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <ul className="space-y-3 mb-8">
              {['Không giới hạn luyện tập', 'Không giới hạn mạng sống', 'Export PDF đẹp', 'Analytics nâng cao', 'Hỗ trợ ưu tiên', 'Badge Premium'].map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-[var(--text)]">
                  <CheckCircle size={16} className="text-yellow-400 flex-shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <Link href="/premium" className="block w-full py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-center text-sm font-semibold text-white hover:opacity-90 transition-all">
              <Crown size={16} className="inline mr-2" />
              Nâng cấp Premium
            </Link>
          </div>
        </div>

        {/* Feature comparison */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-bold text-[var(--text)] mb-6 text-center">So sánh tính năng</h2>
          <div className="rounded-2xl border border-[var(--border)] overflow-hidden">
            <div className="grid grid-cols-3 bg-[var(--bg-secondary)] px-4 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase">
              <span>Tính năng</span>
              <span className="text-center">Miễn phí</span>
              <span className="text-center text-yellow-400">Premium</span>
            </div>
            {allFeatures.map((f, i) => (
              <div key={f.label} className={cn(
                'grid grid-cols-3 px-4 py-3 text-sm border-t border-[var(--border)]',
                i % 2 === 0 ? 'bg-[var(--bg-card)]' : 'bg-[var(--bg-secondary)]'
              )}>
                <span className="text-[var(--text)]">{f.label}</span>
                <span className={cn('text-center', f.free === '✗' ? 'text-red-400' : 'text-[var(--text-secondary)]')}>
                  {f.free}
                </span>
                <span className="text-center text-yellow-400">{f.premium}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Free tier note */}
        <div className="mt-12 text-center rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-6 max-w-2xl mx-auto">
          <Gift size={24} className="text-cyan-400 mx-auto mb-2" />
          <h3 className="font-bold text-[var(--text)] mb-1">Nhận Premium miễn phí!</h3>
          <p className="text-sm text-[var(--text-secondary)]">
            Giới thiệu 5 bạn bè và họ hoàn thành bài luyện đầu tiên → nhận <strong className="text-cyan-400">15 ngày Premium miễn phí</strong>.
          </p>
        </div>
      </div>
    </div>
  )
}
