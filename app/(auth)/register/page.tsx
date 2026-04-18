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
      className="glass-dark rounded-3xl p-10 border border-white/10 text-center"
    >
      <Loader2 size={32} className="text-cyan-400 animate-spin mx-auto mb-4" />
      <p className="text-white/50 text-sm">Đang chuyển hướng...</p>
    </motion.div>
  )
}
