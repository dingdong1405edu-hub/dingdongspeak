// Simple in-memory rate limiter (per IP)
// For production, use Upstash Redis or similar

const map = new Map<string, { count: number; reset: number }>()

interface RateLimitOptions {
  maxRequests: number
  windowMs: number
}

export function rateLimit(identifier: string, options: RateLimitOptions): { success: boolean; remaining: number } {
  const now = Date.now()
  const entry = map.get(identifier)

  if (!entry || now > entry.reset) {
    map.set(identifier, { count: 1, reset: now + options.windowMs })
    return { success: true, remaining: options.maxRequests - 1 }
  }

  if (entry.count >= options.maxRequests) {
    return { success: false, remaining: 0 }
  }

  entry.count++
  return { success: true, remaining: options.maxRequests - entry.count }
}

// Cleanup old entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, val] of map.entries()) {
      if (now > val.reset) map.delete(key)
    }
  }, 5 * 60 * 1000)
}
