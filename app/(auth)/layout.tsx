import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen aurora-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl brand-gradient flex items-center justify-center shadow-soft">
              <span className="text-white font-bold">D</span>
            </div>
            <span className="text-[var(--text)] font-bold text-xl">DingDong<span className="gradient-text">Speak</span></span>
          </Link>
        </div>
        {children}
      </div>
    </div>
  )
}
