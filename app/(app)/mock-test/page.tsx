'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { GraduationCap, Clock, AlertTriangle, Play, Target, Shuffle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function MockTestPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  function startTest() {
    setLoading(true)
    const sessionId = Math.random().toString(36).substring(2, 12)
    router.push(`/mock-test/session/${sessionId}`)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)] flex items-center gap-2">
          <GraduationCap className="text-violet-400" size={26} />
          Thi thử IELTS Speaking
        </h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">
          AI ra đề ngẫu nhiên như thi thật — đa dạng chủ đề, đầy đủ Part 1, 2, 3. Chấm điểm tổng thể sau khi hoàn thành.
        </p>
      </div>

      {/* Warning */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
        <AlertTriangle size={18} className="text-yellow-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-yellow-400 mb-1">Lưu ý quan trọng</p>
          <p className="text-xs text-[var(--text-secondary)]">
            AI sẽ ra đề ngẫu nhiên như thi IELTS thật — bạn không được chọn chủ đề.
            Trả lời xong tất cả câu hỏi, AI mới chấm điểm tổng thể. Điểm số là ước tính, không phải kết quả chính thức.
          </p>
        </div>
      </div>

      {/* Test info */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { icon: Clock, label: '11–14 phút', desc: 'Giống thời gian thi thật' },
          { icon: Target, label: '3 Parts', desc: 'Part 1 + 2 + 3 đầy đủ' },
          { icon: Shuffle, label: 'Ngẫu nhiên', desc: 'AI ra đề đa dạng chủ đề' },
        ].map(item => {
          const Icon = item.icon
          return (
            <Card key={item.label} className="text-center py-4">
              <Icon size={22} className="text-violet-400 mx-auto mb-2" />
              <div className="font-semibold text-[var(--text)] text-sm">{item.label}</div>
              <div className="text-xs text-[var(--text-secondary)]">{item.desc}</div>
            </Card>
          )
        })}
      </div>

      {/* Flow explanation */}
      <Card>
        <h2 className="font-semibold text-[var(--text)] mb-4">Quy trình thi</h2>
        <div className="space-y-3">
          {[
            { step: '1', label: 'AI ra đề', desc: 'Hệ thống tự chọn chủ đề và tạo câu hỏi ngẫu nhiên từ kho 50+ chủ đề IELTS' },
            { step: '2', label: 'Trả lời toàn bộ', desc: 'Lần lượt trả lời Part 1 (4 câu), Part 2 (1 cue card), Part 3 (4 câu). Không xem điểm giữa chừng' },
            { step: '3', label: 'AI chấm tổng thể', desc: 'Sau khi hoàn thành, AI phân tích toàn bộ và cho điểm band score ước tính' },
          ].map(item => (
            <div key={item.step} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-violet-500/20 text-violet-400 text-sm font-bold flex items-center justify-center shrink-0">
                {item.step}
              </div>
              <div>
                <div className="text-sm font-semibold text-[var(--text)]">{item.label}</div>
                <div className="text-xs text-[var(--text-secondary)] mt-0.5">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
        <Button
          variant="gradient"
          size="lg"
          className="w-full"
          onClick={startTest}
          loading={loading}
        >
          <Play size={20} />
          Bắt đầu thi thử ngay
        </Button>
      </motion.div>
    </div>
  )
}
