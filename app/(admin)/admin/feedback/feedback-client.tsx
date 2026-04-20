'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, CheckCircle2, Clock, User, Calendar } from 'lucide-react'
import { toast } from 'sonner'

interface ChatSession {
  id: string
  userId: string | null
  userName: string | null
  source: string | null
  messages: Array<{ role: 'bot' | 'user'; content: string; ts: number }>
  status: string
  createdAt: string
}

export function FeedbackClient({ sessions: initial }: { sessions: ChatSession[] }) {
  const [sessions, setSessions] = useState(initial)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'RESOLVED'>('ALL')

  const filtered = filter === 'ALL' ? sessions : sessions.filter(s => s.status === filter)

  async function toggleStatus(id: string, current: string) {
    const next = current === 'OPEN' ? 'RESOLVED' : 'OPEN'
    try {
      await fetch('/api/admin/chat-feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: next }),
      })
      setSessions(prev => prev.map(s => s.id === id ? { ...s, status: next } : s))
      toast.success(next === 'RESOLVED' ? 'Đã đánh dấu xử lý xong' : 'Đã mở lại')
    } catch {
      toast.error('Lỗi cập nhật')
    }
  }

  const userMessages = (session: ChatSession) =>
    session.messages.filter(m => m.role === 'user' && !['Facebook','TikTok','Instagram','YouTube','Google Search','Bạn bè / Người quen','Khác'].includes(m.content))

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {(['ALL', 'OPEN', 'RESOLVED'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'text-[var(--text-secondary)] hover:text-[var(--text)] border border-transparent'
            }`}
          >
            {f === 'ALL' ? 'Tất cả' : f === 'OPEN' ? 'Chờ xử lý' : 'Đã xử lý'}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[var(--border)] p-10 text-center text-[var(--text-secondary)] text-sm">
          Không có session nào
        </div>
      )}

      <div className="space-y-3">
        {filtered.map(session => {
          const userMsgs = userMessages(session)
          const isExpanded = expanded === session.id
          const date = new Date(session.createdAt)

          return (
            <div
              key={session.id}
              className={`rounded-2xl border bg-[var(--bg-card)] overflow-hidden transition-colors ${
                session.status === 'OPEN'
                  ? 'border-orange-500/30'
                  : 'border-[var(--border)]'
              }`}
            >
              {/* Session header */}
              <div className="flex items-center gap-3 p-4">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${session.status === 'OPEN' ? 'bg-orange-400' : 'bg-emerald-400'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-[var(--text)] flex items-center gap-1">
                      <User size={13} className="text-[var(--text-secondary)]" />
                      {session.userName ?? 'Khách'}
                    </span>
                    {session.source && (
                      <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs">
                        {session.source}
                      </span>
                    )}
                    {userMsgs.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs">
                        {userMsgs.length} tin nhắn
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] mt-0.5 flex items-center gap-1">
                    <Calendar size={11} />
                    {date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => toggleStatus(session.id, session.status)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      session.status === 'OPEN'
                        ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
                        : 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/20'
                    }`}
                  >
                    {session.status === 'OPEN' ? <><CheckCircle2 size={12} /> Xử lý xong</> : <><Clock size={12} /> Mở lại</>}
                  </button>
                  {session.messages.length > 0 && (
                    <button
                      onClick={() => setExpanded(isExpanded ? null : session.id)}
                      className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] transition-colors"
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded conversation */}
              {isExpanded && (
                <div className="border-t border-[var(--border)] p-4 bg-[var(--bg-secondary)] space-y-2 max-h-80 overflow-y-auto">
                  {session.messages.map((msg, i) => (
                    <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.role === 'bot' && <span className="text-sm">🤖</span>}
                      <div
                        className={`max-w-[75%] px-3 py-1.5 rounded-xl text-sm ${
                          msg.role === 'bot'
                            ? 'bg-[var(--bg-card)] text-[var(--text-secondary)]'
                            : 'bg-cyan-500/20 text-cyan-300'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
