import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!DEEPGRAM_API_KEY) {
    return NextResponse.json({ error: 'STT not configured' }, { status: 503 })
  }

  let audioBuffer: ArrayBuffer
  let mimeType: string

  try {
    const formData = await req.formData()
    const audio = formData.get('audio') as File | null
    if (!audio) return NextResponse.json({ error: 'No audio file' }, { status: 400 })

    audioBuffer = await audio.arrayBuffer()
    mimeType = audio.type || 'audio/webm'
  } catch (err) {
    console.error('STT formdata error:', err)
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  try {
    const params = new URLSearchParams({
      model: 'nova-3',
      language: 'en',
      smart_format: 'true',
      punctuate: 'true',
    })

    const response = await fetch(`https://api.deepgram.com/v1/listen?${params}`, {
      method: 'POST',
      headers: {
        Authorization: `Token ${DEEPGRAM_API_KEY}`,
        'Content-Type': mimeType,
      },
      body: audioBuffer,
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('Deepgram STT error:', response.status, errText)
      return NextResponse.json({ error: 'STT upstream failed' }, { status: 502 })
    }

    const data = await response.json()
    const transcript = data?.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? ''

    if (!transcript) {
      return NextResponse.json({ error: 'No speech detected', transcript: '' }, { status: 200 })
    }

    return NextResponse.json({ transcript })
  } catch (err) {
    console.error('STT error:', err)
    return NextResponse.json({ error: 'Transcription failed' }, { status: 500 })
  }
}
