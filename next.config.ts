import type { NextConfig } from 'next'

const allowedOrigins = ['localhost:3000']
if (process.env.NEXT_PUBLIC_APP_URL) {
  const url = process.env.NEXT_PUBLIC_APP_URL.replace(/^https?:\/\//, '')
  allowedOrigins.push(url)
}

// DingDongSpeak is now a single consolidated app: all target languages
// (en/zh/ja/ko) are handled in-app via the dds_lang cookie, so the previous
// Multi-Zones rewrites to separate /ja and /zh deployments are no longer needed.

const nextConfig: NextConfig = {
  experimental: {
    serverActions: { allowedOrigins },
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.googleusercontent.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: '**.railway.app' },
    ],
  },
}

export default nextConfig
