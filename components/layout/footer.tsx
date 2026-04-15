import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--bg-secondary)] py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">D</span>
              </div>
              <span className="font-bold text-lg text-[var(--text)]">DingDongSpeak</span>
            </div>
            <p className="text-sm text-[var(--text-secondary)] max-w-xs">
              Luyện nói tiếng Anh và IELTS Speaking với AI chấm điểm thật, học thật.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-[var(--text)] mb-3 text-sm">Sản phẩm</h4>
            <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
              <li><Link href="/learn" className="hover:text-cyan-400 transition-colors">Beginner Path</Link></li>
              <li><Link href="/practice" className="hover:text-cyan-400 transition-colors">IELTS Practice</Link></li>
              <li><Link href="/mock-test" className="hover:text-cyan-400 transition-colors">Mock Test</Link></li>
              <li><Link href="/pricing" className="hover:text-cyan-400 transition-colors">Bảng giá</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-[var(--text)] mb-3 text-sm">Hỗ trợ</h4>
            <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
              <li><a href="mailto:support@dingdongspeak.com" className="hover:text-cyan-400 transition-colors">Liên hệ</a></li>
              <li><Link href="/" className="hover:text-cyan-400 transition-colors">Điều khoản</Link></li>
              <li><Link href="/" className="hover:text-cyan-400 transition-colors">Bảo mật</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-[var(--text)] mb-3 text-sm">Kết nối</h4>
            <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
              <li><a href="#" className="hover:text-cyan-400 transition-colors">Facebook</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition-colors">TikTok</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition-colors">YouTube</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[var(--border)] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[var(--text-secondary)]">
          <p>© 2025 DingDongSpeak. All rights reserved.</p>
          <p>Made with ❤️ for IELTS learners in Vietnam</p>
        </div>
      </div>
    </footer>
  )
}
