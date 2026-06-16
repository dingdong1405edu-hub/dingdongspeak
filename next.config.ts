import type { NextConfig } from 'next'

// Allow server actions from the production domain regardless of env config.
const allowedOrigins = ['localhost:3000', 'dingdongspeak.com', 'www.dingdongspeak.com']
for (const envUrl of [process.env.NEXT_PUBLIC_APP_URL, process.env.RAILWAY_PUBLIC_DOMAIN]) {
  if (envUrl) {
    const host = envUrl.replace(/^https?:\/\//, '')
    if (!allowedOrigins.includes(host)) allowedOrigins.push(host)
  }
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
