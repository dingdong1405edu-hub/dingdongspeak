'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, CheckCircle2, Clock, User, Calendar, Mail, Send, Reply } from 'lucide-react'
import { toast } from 'sonner'

interface ChatSession {
  id: string
  userId: string | null
  userName: string | null
  userEmail: string | null
  source: string | null
  messages: Array<{ role: 'bot' | 'user'; content: string; ts: number }>
  adminReply: string | null
  repliedAt: string | null
  status: string
  createdAt: string
}

const SOURCE_CHOICES = ['Facebook','TikTok','Instagram','YouTube','Google Search','Bạn bè / Người quen','Khác']

export function FeedbackClient({ sessions: initial }: { sessions: ChatSession[] }) {
  const [sessions, setSessions] = useState(initial)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'RESOLVED'>('ALL')
  const [replyText, setReplyText] = useState<Record<string, string>>({})
  const [replying, setReplying] = useState<string | null>(null)

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

  async function sendReply(id: string) {
    const text = (replyText[id] ?? '').trim()
    if (!text) return
    setReplying(id)
    try {
      await fetch('/api/admin/chat-feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, adminReply: text }),
      })
      setSessions(prev => prev.map(s =>
        s.id === id ? { ...s, adminReply: text, repliedAt: new Date().toISOString(), status: 'RESOLVED' } : s
      ))
      setReplyText(prev => ({ ...prev, [id]: '' }))
      toast.success('Đã gửi phản hồi tới user')
    } catch {
      toast.error('Lỗi gửi phản hồi')
    } finally {
      setReplying(null)
    }
  }

  const userMessages = (session: ChatSession) =>
    session.messages.filter(m => m.role === 'user' && !SOURCE_CHOICES.includes(m.content))

  return (
    <div>
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
          const hasUserMsg = userMsgs.length > 0

          return (
            <div
              key={session.id}
              className={`rounded-2xl border bg-[var(--bg-card)] overflow-hidden transition-colors ${
                session.status === 'OPEN' && hasUserMsg
                  ? 'border-orange-500/40'
                  : session.status === 'OPEN'
                  ? 'border-[var(--border)]'
                  : 'border-[var(--border)] opacity-80'
              }`}
            >
              {/* Header */}
              <div className="flex items-start gap-3 p-4">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${
                  session.status === 'OPEN' && hasUserMsg ? 'bg-orange-400' : session.status === 'OPEN' ? 'bg-blue-400' : 'bg-emerald-400'
                }`} />

                <div className="flex-1 min-w-0">
                  {/* Name + source */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-[var(--text)] flex items-center gap-1">
                      <User size={13} className="text-[var(--text-secondary)]" />
                      {session.userName ?? 'Khách'}
                    </span>
                    {session.source && (
                      <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs">
                        {session.source}
                      </span>
                    )}
                    {hasUserMsg && (
                      <span className="px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs">
                        {userMsgs.length} tin nhắn
                      </span>
                    )}
                    {session.adminReply && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-1">
                        <Reply size={10} /> Đã phản hồi
                      </span>
                    )}
                  </div>

                  {/* Email */}
                  {session.userEmail && (
                    <div className="flex items-center gap-1 mt-1">
                      <Mail size={11} className="text-[var(--text-secondary)]" />
                      <span className="text-xs text-cyan-400 font-medium">{session.userEmail}</span>
                    </div>
                  )}

                  {/* Date */}
                  <div className="text-xs text-[var(--text-secondary)] mt-0.5 flex items-center gap-1">
                    <Calendar size={11} />
                    {date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>

                  {/* Preview first user message */}
                  {!isExpanded && userMsgs[0] && (
                    <p className="text-xs text-[var(--text-secondary)] mt-1.5 truncate italic">
                      "{userMsgs[0].content}"
                    </p>
                  )}
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
                  <button
                    onClick={() => setExpanded(isExpanded ? null : session.id)}
                    className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] transition-colors"
                  >
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
              </div>

              {/* Expanded */}
              {isExpanded && (
                <div className="border-t border-[var(--border)]">
                  {/* Conversation */}
                  <div className="p-4 bg-[var(--bg-secondary)] space-y-2 max-h-72 overflow-y-auto">
                    {session.messages.map((msg, i) => (
                      <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'bot' && <span className="text-sm mt-0.5">🤖</span>}
                        <div className={`max-w-[75%] px-3 py-1.5 rounded-xl text-sm ${
                          msg.role === 'bot'
                            ? 'bg-[var(--bg-card)] text-[var(--text-secondary)]'
                            : 'bg-cyan-500/20 text-[var(--text)] font-medium'
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    ))}

                    {/* Existing admin reply */}
                    {session.adminReply && (
                      <div className="flex gap-2 justify-start">
                        <span className="text-sm mt-0.5">👤</span>
                        <div className="max-w-[75%]">
                          <div className="text-xs text-emerald-400 mb-1">Admin · {session.repliedAt ? new Date(session.repliedAt).toLocaleString('vi-VN') : ''}</div>
                          <div className="px-3 py-2 rounded-xl text-sm bg-emerald-500/10 border border-emerald-500/20 text-[var(--text)] whitespace-pre-wrap">
                            {session.adminReply}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Reply box */}
                  {hasUserMsg && (
                    <div className="p-4 border-t border-[var(--border)] bg-[var(--bg-card)]">
                      <div className="text-xs font-semibold text-[var(--text-secondary)] mb-2 flex items-center gap-1">
                        <Reply size={12} />
                        {session.adminReply ? 'Cập nhật phản hồi' : 'Phản hồi tới user'}
                      </div>
                      <div className="flex gap-2">
                        <textarea
                          rows={2}
                          value={replyText[session.id] ?? ''}
                          onChange={e => setReplyText(prev => ({ ...prev, [session.id]: e.target.value }))}
                          placeholder={session.adminReply ?? 'Nhập nội dung phản hồi...'}
                          className="flex-1 px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text)] text-sm placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-cyan-400/60 transition-colors resize-none"
                        />
                        <button
                          onClick={() => sendReply(session.id)}
                          disabled={!replyText[session.id]?.trim() || replying === session.id}
                          className="w-10 h-10 self-end rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center disabled:opacity-40 hover:opacity-90 transition-opacity flex-shrink-0"
                        >
                          <Send size={15} className="text-white" />
                        </button>
                      </div>
                      {session.userEmail && (
                        <p className="text-xs text-[var(--text-secondary)] mt-2">
                          User sẽ thấy phản hồi này khi mở lại chat widget · <span className="text-cyan-400">{session.userEmail}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
