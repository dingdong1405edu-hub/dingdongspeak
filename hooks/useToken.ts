'use client'

import { useState, useCallback } from 'react'

export function useToken() {
  const [tokens, setTokens] = useState<number | null>(null)
  const [isPremium, setIsPremium] = useState(false)
  const [loading, setLoading] = useState(false)

  const fetchTokens = useCallback(async () => {
    try {
      const res = await fetch('/api/user')
      if (!res.ok) return
      const data = await res.json()
      setTokens(data.tokens ?? 0)
      setIsPremium(data.isPremiumActive ?? false)
    } catch {
      // ignore
    }
  }, [])

  const consumeToken = useCallback(async (): Promise<boolean> => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/score', {
        method: 'HEAD', // check only
      })
      if (res.status === 402) return false // paywall
      return true
    } finally {
      setLoading(false)
    }
  }, [])

  return { tokens, isPremium, loading, fetchTokens, consumeToken }
}
