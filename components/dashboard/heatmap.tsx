'use client'

import { useMemo } from 'react'
import { subDays, format, startOfWeek, addDays } from 'date-fns'
import { cn } from '@/lib/utils'

interface HeatmapProps {
  data: { date: string; practiced: boolean }[]
}

export function ContributionHeatmap({ data }: HeatmapProps) {
  const { weeks, months } = useMemo(() => {
    const now = new Date()
    const start = subDays(now, 364)
    const practicedDates = new Set(data.filter(d => d.practiced).map(d => d.date))

    // Build weeks array
    const days: { date: string; level: number }[] = []
    for (let i = 0; i <= 364; i++) {
      const d = format(subDays(now, 364 - i), 'yyyy-MM-dd')
      days.push({ date: d, level: practicedDates.has(d) ? 1 : 0 })
    }

    // Group into weeks
    const weeksArr: typeof days[] = []
    for (let i = 0; i < days.length; i += 7) {
      weeksArr.push(days.slice(i, i + 7))
    }

    // Month labels
    const monthLabels: { label: string; col: number }[] = []
    let lastMonth = ''
    weeksArr.forEach((week, col) => {
      const month = format(new Date(week[0].date), 'MMM')
      if (month !== lastMonth) {
        monthLabels.push({ label: month, col })
        lastMonth = month
      }
    })

    return { weeks: weeksArr, months: monthLabels }
  }, [data])

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="overflow-x-auto">
      <div className="inline-block">
        {/* Month labels */}
        <div className="flex mb-1 ml-7">
          {months.map(m => (
            <div
              key={`${m.label}-${m.col}`}
              className="text-[10px] text-[var(--text-secondary)] absolute"
              style={{ marginLeft: `${m.col * 14}px` }}
            >
              {m.label}
            </div>
          ))}
          <div className="h-4" />
        </div>

        <div className="flex gap-1">
          {/* Day labels */}
          <div className="flex flex-col gap-1 mr-1">
            {dayLabels.map((day, i) => (
              <div key={day} className="h-[10px] w-6 text-[9px] text-[var(--text-secondary)] flex items-center">
                {i % 2 === 1 ? day.slice(0, 1) : ''}
              </div>
            ))}
          </div>

          {/* Cells */}
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((day, di) => (
                <div
                  key={day.date}
                  title={`${day.date}: ${day.level ? 'Luyện tập' : 'Không luyện'}`}
                  className={cn(
                    'w-[10px] h-[10px] rounded-[2px] heatmap-cell cursor-pointer transition-all',
                    day.level === 0 && 'bg-[var(--border)]',
                    day.level === 1 && 'bg-cyan-500',
                  )}
                />
              ))}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 mt-3 justify-end">
          <span className="text-[10px] text-[var(--text-secondary)]">Ít</span>
          {['bg-[var(--border)]', 'bg-cyan-900', 'bg-cyan-600', 'bg-cyan-400'].map((bg, i) => (
            <div key={i} className={cn('w-[10px] h-[10px] rounded-[2px]', bg)} />
          ))}
          <span className="text-[10px] text-[var(--text-secondary)]">Nhiều</span>
        </div>
      </div>
    </div>
  )
}
