import type { NextConfig } from 'next'

const allowedOrigins = ['localhost:3000']
if (process.env.NEXT_PUBLIC_APP_URL) {
  const url = process.env.NEXT_PUBLIC_APP_URL.replace(/^https?:\/\//, '')
  allowedOrigins.push(url)
}

// Multi-Zones: the Japanese (/ja) and Chinese (/zh) apps are independent Next.js
// deployments mounted under path prefixes of dingdongspeak.com via rewrites.
// Override with env vars if the child deployment URLs ever change.
const JA_ZONE = process.env.JA_ZONE_URL || 'https://web-production-53710.up.railway.app'
const ZH_ZONE = process.env.ZH_ZONE_URL || 'https://zestful-victory-production-6f4f.up.railway.app'

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
  async rewrites() {
    return {
      beforeFiles: [
        { source: '/ja', destination: `${JA_ZONE}/ja` },
        { source: '/ja/:path*', destination: `${JA_ZONE}/ja/:path*` },
        { source: '/zh', destination: `${ZH_ZONE}/zh` },
        { source: '/zh/:path*', destination: `${ZH_ZONE}/zh/:path*` },
      ],
    }
  },
}

export default nextConfig
