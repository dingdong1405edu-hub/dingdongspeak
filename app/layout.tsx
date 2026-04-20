import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/shared/theme-provider'
import { Toaster } from 'sonner'
import { SessionProvider } from 'next-auth/react'
import { auth } from '@/auth'
import { ChatWidget } from '@/components/chat-widget/ChatWidget'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: { default: 'DingDongSpeak', template: '%s | DingDongSpeak' },
  description: 'Luyện nói tiếng Anh và IELTS Speaking với AI — chấm điểm thật, học thật.',
  keywords: ['IELTS', 'speaking', 'English', 'luyện nói', 'AI', 'band score'],
  openGraph: {
    title: 'DingDongSpeak — Luyện IELTS Speaking với AI',
    description: 'Luyện nói tiếng Anh và IELTS Speaking với AI chấm điểm chuẩn band score.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0A0F1E',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  return (
    <html lang="vi" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full antialiased">
        <SessionProvider session={session}>
          <ThemeProvider>
            {children}
            <ChatWidget />
            <Toaster position="top-right" richColors />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
