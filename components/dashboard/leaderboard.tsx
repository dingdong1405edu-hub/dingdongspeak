import { cn } from '@/lib/utils'
import { Crown } from 'lucide-react'

interface LeaderboardEntry {
  userId: string
  name: string
  avatar?: string | null
  totalMinutes: number
  totalSessions: number
  rank: number
}

const rankStyles = [
  { bg: 'bg-yellow-500/20 border-yellow-500/30', text: 'text-yellow-400', badge: '👑' },
  { bg: 'bg-slate-400/10 border-slate-400/20', text: 'text-slate-400', badge: '🥈' },
  { bg: 'bg-orange-500/10 border-orange-500/20', text: 'text-orange-400', badge: '🥉' },
]

export function Leaderboard({ data, currentUserId }: { data: LeaderboardEntry[]; currentUserId: string }) {
  if (data.length === 0) {
    return (
      <p className="text-center text-[var(--text-secondary)] text-sm py-8">
        Chưa có dữ liệu tháng này. Hãy là người đầu tiên luyện tập! 🚀
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {data.map((entry) => {
        const style = rankStyles[entry.rank - 1] || { bg: '', text: 'text-[var(--text-secondary)]', badge: `#${entry.rank}` }
        const isMe = entry.userId === currentUserId

        return (
          <div
            key={entry.userId}
            className={cn(
              'flex items-center gap-3 p-3 rounded-xl border transition-all',
              style.bg || 'border-[var(--border)]',
              isMe && 'ring-2 ring-cyan-400/30'
            )}
          >
            {/* Rank */}
            <div className={cn('w-8 h-8 flex items-center justify-center font-bold text-sm', style.text)}>
              {typeof style.badge === 'string' && style.badge.length <= 2 ? style.badge : `#${entry.rank}`}
            </div>

            {/* Avatar */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-violet-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {entry.name[0]?.toUpperCase() || '?'}
            </div>

            {/* Name */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={cn('font-medium text-sm truncate', isMe ? 'text-cyan-400' : 'text-[var(--text)]')}>
                  {entry.name}
                  {isMe && <span className="text-xs text-cyan-400 ml-1">(bạn)</span>}
                </span>
              </div>
              <div className="text-xs text-[var(--text-secondary)]">{entry.totalSessions} bài luyện</div>
            </div>

            {/* Minutes */}
            <div className="text-right">
              <div className={cn('font-bold text-sm', style.text)}>{entry.totalMinutes}p</div>
              <div className="text-xs text-[var(--text-secondary)]">phút</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
