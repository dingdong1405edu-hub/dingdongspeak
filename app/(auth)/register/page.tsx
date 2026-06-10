'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const params = useSearchParams()
  const ref = params.get('ref')

  useEffect(() => {
    // Register = login with Google, redirect with ref param preserved
    const url = ref ? `/login?ref=${ref}` : '/login'
    router.replace(url)
  }, [router, ref])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="soft-card rounded-3xl p-10 text-center"
    >
      <Loader2 size={32} className="text-[var(--brand)] animate-spin mx-auto mb-4" />
      <p className="text-[var(--text-secondary)] text-sm">Đang chuyển hướng...</p>
    </motion.div>
  )
}
