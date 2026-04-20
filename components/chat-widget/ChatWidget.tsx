'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send } from 'lucide-react'
import { useSession } from 'next-auth/react'

type Role = 'bot' | 'user' | 'admin'
interface Message {
  role: Role
  content: string
  ts: number
  options?: string[]
  isChoice?: boolean
}

type Phase = 'idle' | 'greeting' | 'source' | 'chat' | 'done'

const SOURCE_OPTIONS = [
  { label: 'Facebook', icon: '📘' },
  { label: 'TikTok', icon: '🎵' },
  { label: 'Instagram', icon: '📸' },
  { label: 'YouTube', icon: '▶️' },
  { label: 'Google Search', icon: '🔍' },
  { label: 'Bạn bè / Người quen', icon: '👥' },
  { label: 'Khác', icon: '💬' },
]

const GREETING_DELAY = 2000
const STORAGE_KEY = 'dds_chat_seen'
const SID_KEY = 'dds_chat_sid'
const REPLY_KEY = 'dds_chat_replied'

function botMsg(content: string, options?: string[]): Message {
  return { role: 'bot', content, ts: Date.now(), options }
}

export function ChatWidget() {
  const { data: userSession } = useSession()
  const [open, setOpen] = useState(false)
  const [phase, setPhase] = useState<Phase>('idle')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [source, setSource] = useState<string | null>(null)
  const [typing, setTyping] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [hasNewMsg, setHasNewMsg] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-open greeting once per browser session
  useEffect(() => {
    const seen = sessionStorage.getItem(STORAGE_KEY)
    if (seen) return
    const t = setTimeout(() => {
      setOpen(true)
      setPhase('greeting')
      sessionStorage.setItem(STORAGE_KEY, '1')
    }, GREETING_DELAY)
    return () => clearTimeout(t)
  }, [])

  // Check for admin reply when user opens widget
  useEffect(() => {
    if (!open) return
    const sid = localStorage.getItem(SID_KEY)
    const alreadyShown = localStorage.getItem(REPLY_KEY)
    if (!sid || alreadyShown === sid) return

    fetch(`/api/chat-widget?id=${sid}`)
      .then(r => r.json())
      .then(data => {
        if (data.adminReply) {
          setMessages(prev => [
            ...prev,
            { role: 'admin', content: `📩 **Phản hồi từ đội ngũ hỗ trợ:**\n${data.adminReply}`, ts: Date.now() },
          ])
          localStorage.setItem(REPLY_KEY, sid)
          setHasNewMsg(false)
          setPhase('chat')
        }
      })
      .catch(() => {})
  }, [open])

  // Badge: check reply when widget is closed
  useEffect(() => {
    const sid = localStorage.getItem(SID_KEY)
    const alreadyShown = localStorage.getItem(REPLY_KEY)
    if (!sid || alreadyShown === sid) return

    const checkReply = () => {
      fetch(`/api/chat-widget?id=${sid}`)
        .then(r => r.json())
        .then(data => { if (data.adminReply) setHasNewMsg(true) })
        .catch(() => {})
    }

    checkReply()
    const interval = setInterval(checkReply, 60_000)
    return () => clearInterval(interval)
  }, [])

  // Greeting sequence
  useEffect(() => {
    if (phase !== 'greeting') return
    const lines = [
      'Xin chào! 👋 Chào mừng bạn đến với **DingDongSpeak**!',
      '💻 Để có trải nghiệm tốt nhất, bạn nên dùng trên **máy tính** nhé!',
      '📱 App **Android** của chúng tôi đang sắp ra mắt — hãy đón chờ!',
    ]
    let delay = 400
    lines.forEach((line, i) => {
      setTimeout(() => {
        setMessages(prev => [...prev, botMsg(line)])
        if (i === lines.length - 1) {
          setTimeout(() => {
            setMessages(prev => [
              ...prev,
              botMsg('Bạn biết đến DingDongSpeak qua đâu? 🤔', SOURCE_OPTIONS.map(o => o.label)),
            ])
            setPhase('source')
          }, 800)
        }
      }, delay)
      delay += 700
    })
  }, [phase])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  function handleOpen() {
    setOpen(true)
    setHasNewMsg(false)
    if (phase === 'idle') {
      setPhase('greeting')
      sessionStorage.setItem(STORAGE_KEY, '1')
    }
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  function handleClose() {
    setOpen(false)
    if (source && !submitted) saveSession()
  }

  function handleSourceSelect(label: string) {
    setSource(label)
    const userMsg: Message = { role: 'user', content: label, ts: Date.now(), isChoice: true }
    setMessages(prev => [...prev, userMsg])
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      setMessages(prev => [
        ...prev,
        botMsg('Cảm ơn bạn! 😊 Nếu có bất kỳ thắc mắc hay góp ý nào, cứ nhắn mình nhé. Mình luôn sẵn sàng hỗ trợ!'),
      ])
      setPhase('chat')
      setTimeout(() => inputRef.current?.focus(), 100)
    }, 800)
  }

  function handleSend() {
    const text = input.trim()
    if (!text) return
    const userMsg: Message = { role: 'user', content: text, ts: Date.now() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      setMessages(prev => [
        ...prev,
        botMsg('Mình đã nhận được tin nhắn của bạn! 📩 Đội ngũ hỗ trợ sẽ phản hồi sớm nhất có thể nhé.'),
      ])
      saveSession([...messages, userMsg])
      setSubmitted(true)
    }, 900)
  }

  async function saveSession(msgs?: Message[]) {
    const toSave = msgs ?? messages
    try {
      const res = await fetch('/api/chat-widget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source,
          messages: toSave,
          userEmail: userSession?.user?.email ?? null,
        }),
      })
      const data = await res.json()
      if (data.id) {
        localStorage.setItem(SID_KEY, data.id)
        setSessionId(data.id)
      }
    } catch {}
  }

  function renderContent(text: string) {
    const parts = text.split(/\*\*(.+?)\*\*/g)
    return parts.map((p, i) =>
      i % 2 === 1 ? <strong key={i}>{p}</strong> : p
    )
  }

  return (
    <>
      {!open && (
        <button
          onClick={handleOpen}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-violet-600 shadow-lg shadow-cyan-500/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
          aria-label="Mở chat hỗ trợ"
        >
          <MessageCircle size={24} className="text-white" />
          {hasNewMsg && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
          )}
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[340px] max-h-[520px] flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-2xl shadow-black/40 overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-cyan-500 to-violet-600">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-lg">🤖</div>
            <div className="flex-1">
              <div className="font-semibold text-white text-sm">Trợ lý DingDongSpeak</div>
              <div className="text-white/70 text-xs flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" />
                Đang hoạt động
              </div>
            </div>
            <button onClick={handleClose} className="text-white/80 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 max-h-[360px]">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}>
                {(msg.role === 'bot' || msg.role === 'admin') && (
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5 ${
                    msg.role === 'admin'
                      ? 'bg-gradient-to-br from-emerald-500 to-cyan-600'
                      : 'bg-gradient-to-br from-cyan-500 to-violet-600'
                  }`}>
                    {msg.role === 'admin' ? '👤' : '🤖'}
                  </div>
                )}
                <div className="max-w-[80%] space-y-2">
                  {msg.role === 'admin' && (
                    <div className="text-xs text-emerald-400 font-medium">Hỗ trợ viên</div>
                  )}
                  <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'bot'
                      ? 'bg-[var(--bg-secondary)] text-[var(--text)] rounded-tl-sm'
                      : msg.role === 'admin'
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-[var(--text)] rounded-tl-sm'
                      : 'bg-gradient-to-r from-cyan-500 to-violet-600 text-white rounded-tr-sm'
                  }`}>
                    {renderContent(msg.content)}
                  </div>
                  {msg.options && phase === 'source' && !source && (
                    <div className="grid grid-cols-2 gap-1.5 mt-2">
                      {SOURCE_OPTIONS.map(opt => (
                        <button
                          key={opt.label}
                          onClick={() => handleSourceSelect(opt.label)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] hover:border-cyan-400/60 hover:bg-cyan-500/10 text-[var(--text)] text-xs font-medium transition-all text-left"
                        >
                          <span>{opt.icon}</span>
                          <span className="truncate">{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {typing && (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center text-xs">🤖</div>
                <div className="px-3 py-2 rounded-2xl rounded-tl-sm bg-[var(--bg-secondary)] flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-[var(--text-secondary)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-[var(--text-secondary)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-[var(--text-secondary)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          {phase === 'chat' && (
            <div className="px-3 py-3 border-t border-[var(--border)] flex gap-2 items-center">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Nhắn tin hỗ trợ..."
                className="flex-1 px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text)] text-sm placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-cyan-400/60 transition-colors"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center disabled:opacity-40 hover:opacity-90 transition-opacity flex-shrink-0"
              >
                <Send size={15} className="text-white" />
              </button>
            </div>
          )}

          {(phase === 'idle' || phase === 'greeting' || phase === 'source') && (
            <div className="px-4 py-2 border-t border-[var(--border)]">
              <p className="text-xs text-[var(--text-secondary)] text-center">DingDongSpeak · Hỗ trợ 24/7</p>
            </div>
          )}
        </div>
      )}
    </>
  )
}
