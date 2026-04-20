import type { NextConfig } from 'next'

const allowedOrigins = ['localhost:3000']
if (process.env.NEXT_PUBLIC_APP_URL) {
  const url = process.env.NEXT_PUBLIC_APP_URL.replace(/^https?:\/\//, '')
  allowedOrigins.push(url)
}

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
