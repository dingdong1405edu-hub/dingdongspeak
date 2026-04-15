'use client'

import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Mic, Square, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface AudioRecorderProps {
  onComplete: (blob: Blob, transcript: string) => void
  onStart?: () => void
  disabled?: boolean
}

export function AudioRecorder({ onComplete, onStart, disabled }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [processing, setProcessing] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animFrameRef = useRef<number | undefined>(undefined)

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      // Audio level visualizer
      const ctx = new AudioContext()
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser

      const tick = () => {
        const data = new Uint8Array(analyser.frequencyBinCount)
        analyser.getByteFrequencyData(data)
        const avg = data.reduce((a, b) => a + b) / data.length
        setAudioLevel(avg / 128)
        animFrameRef.current = requestAnimationFrame(tick)
      }
      tick()

      mediaRecorder.ondataavailable = e => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        cancelAnimationFrame(animFrameRef.current!)
        setAudioLevel(0)
        stream.getTracks().forEach(t => t.stop())

        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setProcessing(true)

        try {
          const formData = new FormData()
          formData.append('audio', blob, 'recording.webm')

          const res = await fetch('/api/speech/stt', { method: 'POST', body: formData })
          const data = await res.json()

          if (!res.ok || !data.transcript) {
            toast.error('Không nhận diện được giọng nói. Vui lòng thử lại.')
            setProcessing(false)
            return
          }

          onComplete(blob, data.transcript)
        } catch {
          toast.error('Lỗi xử lý âm thanh. Vui lòng thử lại.')
          setProcessing(false)
        }
      }

      mediaRecorder.start(250)
      setIsRecording(true)
      onStart?.()
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'NotAllowedError') {
        toast.error('Cần quyền truy cập microphone để ghi âm.')
      } else {
        toast.error('Không mở được microphone. Kiểm tra lại thiết bị.')
      }
    }
  }, [onComplete, onStart])

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop()
    setIsRecording(false)
  }, [])

  if (processing) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3">
        <div className="w-16 h-16 rounded-full border-4 border-cyan-400/30 border-t-cyan-400 animate-spin" />
        <p className="text-[var(--text-secondary)] text-sm">Đang nhận dạng giọng nói...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 py-6">
      {/* Waveform visualizer */}
      {isRecording && (
        <div className="flex items-end gap-1 h-12">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="w-2 bg-cyan-400 rounded-full"
              animate={{
                height: `${Math.max(8, (audioLevel + Math.random() * 0.3) * 40 + Math.sin(Date.now() / 200 + i) * 10)}px`,
              }}
              transition={{ duration: 0.1 }}
            />
          ))}
        </div>
      )}

      {/* Record button */}
      <motion.button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={disabled}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          'w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg',
          isRecording
            ? 'bg-red-500 recording-pulse glow-violet'
            : 'bg-gradient-to-br from-cyan-500 to-violet-600 glow-cyan hover:opacity-90',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        {isRecording ? <Square size={28} className="text-white" /> : <Mic size={28} className="text-white" />}
      </motion.button>

      <p className="text-sm text-[var(--text-secondary)] text-center">
        {isRecording
          ? '🔴 Đang ghi âm... Nhấn để dừng khi trả lời xong'
          : 'Nhấn để bắt đầu ghi âm câu trả lời'
        }
      </p>

      {!isRecording && !disabled && (
        <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
          <AlertCircle size={12} />
          Đảm bảo cho phép quyền microphone
        </p>
      )}
    </div>
  )
}
