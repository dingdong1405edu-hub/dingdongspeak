'use client'

import { useState, useRef, useCallback } from 'react'

export interface RecorderState {
  isRecording: boolean
  audioLevel: number
  processing: boolean
  error: string | null
}

export function useRecorder(onComplete: (blob: Blob, transcript: string) => void) {
  const [state, setState] = useState<RecorderState>({
    isRecording: false,
    audioLevel: 0,
    processing: false,
    error: null,
  })

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animFrameRef = useRef<number | undefined>(undefined)

  const startRecording = useCallback(async () => {
    try {
      setState(s => ({ ...s, error: null }))
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

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
        setState(s => ({ ...s, audioLevel: avg / 128 }))
        animFrameRef.current = requestAnimationFrame(tick)
      }
      tick()

      mediaRecorder.ondataavailable = e => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
        setState(s => ({ ...s, audioLevel: 0, processing: true }))
        stream.getTracks().forEach(t => t.stop())

        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })

        try {
          const formData = new FormData()
          formData.append('audio', blob, 'recording.webm')

          const res = await fetch('/api/speech/stt', { method: 'POST', body: formData })
          const data = await res.json()

          if (!res.ok || !data.transcript) {
            setState(s => ({ ...s, processing: false, error: 'Không nhận diện được giọng nói' }))
            return
          }

          onComplete(blob, data.transcript)
          setState(s => ({ ...s, processing: false }))
        } catch {
          setState(s => ({ ...s, processing: false, error: 'Lỗi xử lý âm thanh' }))
        }
      }

      mediaRecorder.start(250)
      setState(s => ({ ...s, isRecording: true }))
    } catch (err: unknown) {
      const msg = err instanceof Error && err.name === 'NotAllowedError'
        ? 'Cần quyền truy cập microphone'
        : 'Không mở được microphone'
      setState(s => ({ ...s, error: msg }))
    }
  }, [onComplete])

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop()
    setState(s => ({ ...s, isRecording: false }))
  }, [])

  return { state, startRecording, stopRecording }
}
