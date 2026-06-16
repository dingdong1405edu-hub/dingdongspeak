import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/shared/theme-provider'
import { LangProvider } from '@/components/shared/lang-provider'
import { Toaster } from 'sonner'
import { SessionProvider } from 'next-auth/react'
import { auth } from '@/auth'
import { getServerLang } from '@/lib/lang-server'
import { ChatWidget } from '@/components/chat-widget/ChatWidget'

const inter = Inter({ subsets: ['latin', 'vietnamese'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: { default: 'DingDongSpeak', template: '%s | DingDongSpeak' },
  description: 'Luyện nói ngoại ngữ với AI chấm điểm thật — tiếng Anh, tiếng Trung, tiếng Nhật, tiếng Hàn.',
  keywords: ['luyện nói', 'speaking', 'AI', 'IELTS', 'HSK', 'JLPT', 'TOPIK', 'tiếng Anh', 'tiếng Trung', 'tiếng Nhật', 'tiếng Hàn'],
  openGraph: {
    title: 'DingDongSpeak — Luyện nói ngoại ngữ với AI',
    description: 'Luyện nói tiếng Anh, Trung, Nhật, Hàn với AI chấm điểm thật.',
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
  const lang = await getServerLang()
  return (
    <html lang="vi" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* CJK fonts for Chinese / Japanese / Korean learning content. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&family=Noto+Sans+JP:wght@400;500;700&family=Noto+Sans+KR:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full antialiased" data-lang={lang}>
        <SessionProvider session={session}>
          <ThemeProvider>
            <LangProvider initialLang={lang}>
              {children}
              <ChatWidget />
              <Toaster position="top-right" richColors />
            </LangProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
