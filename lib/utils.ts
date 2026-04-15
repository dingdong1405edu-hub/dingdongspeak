import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function bandToColor(band: number): string {
  if (band >= 8) return 'text-emerald-400'
  if (band >= 7) return 'text-cyan-400'
  if (band >= 6) return 'text-yellow-400'
  if (band >= 5) return 'text-orange-400'
  return 'text-red-400'
}

export function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}
