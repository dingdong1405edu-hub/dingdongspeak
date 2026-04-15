import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/layout/navbar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <Navbar />
      <div className="flex pt-16">
        {/* Desktop sidebar */}
        <AppSidebar />
        {/* Main content */}
        <main className="flex-1 md:ml-60 min-h-screen p-4 sm:p-6 pb-24 md:pb-6">
          {children}
        </main>
      </div>
      {/* Mobile bottom nav */}
      <MobileBottomNav />
    </div>
  )
}
