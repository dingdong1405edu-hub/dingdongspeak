'use client'

import { useState, useEffect, useCallback } from 'react'

const MAX_LIVES = 5
const REGEN_INTERVAL_MS = 30 * 60 * 1000 // 30 minutes

export function useLives(initialLives: number, isPremium: boolean) {
  const [lives, setLives] = useState(initialLives)
  const [regenMinutes, setRegenMinutes] = useState<number | null>(null)

  useEffect(() => {
    if (isPremium || lives >= MAX_LIVES) {
      setRegenMinutes(null)
      return
    }

    // Poll regen countdown every minute
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/user')
        if (!res.ok) return
        const data = await res.json()
        setLives(data.lives ?? lives)
        setRegenMinutes(data.nextRegenMinutes ?? null)
      } catch {
        // ignore
      }
    }, 60_000)

    return () => clearInterval(interval)
  }, [lives, isPremium])

  const loseLife = useCallback(() => {
    setLives(l => Math.max(0, l - 1))
  }, [])

  const hasLives = isPremium || lives > 0

  return { lives: isPremium ? MAX_LIVES : lives, hasLives, regenMinutes, loseLife }
}
