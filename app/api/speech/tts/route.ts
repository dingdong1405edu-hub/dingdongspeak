import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getTtsVoice } from '@/lib/deepgram'

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { text, voice, lang = 'en' } = await req.json()
  if (!text) return NextResponse.json({ error: 'No text provided' }, { status: 400 })

  // Resolve the voice from the target language unless one is explicitly given.
  // Languages without server TTS (zh/ja/ko) return 204 — the client shows the
  // question as text instead of playing audio.
  const resolvedVoice = voice || getTtsVoice(lang)
  if (!resolvedVoice) {
    return new NextResponse(null, { status: 204 })
  }

  if (!DEEPGRAM_API_KEY) {
    return NextResponse.json({ error: 'TTS not configured' }, { status: 503 })
  }

  try {
    const response = await fetch(
      `https://api.deepgram.com/v1/speak?model=${resolvedVoice}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Token ${DEEPGRAM_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: text.slice(0, 2000) }),
      }
    )

    if (!response.ok) {
      const errText = await response.text()
      console.error('Deepgram TTS error:', response.status, errText)
      return NextResponse.json({ error: 'TTS upstream failed' }, { status: 502 })
    }

    const arrayBuffer = await response.arrayBuffer()
    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': String(arrayBuffer.byteLength),
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('TTS error:', err)
    return NextResponse.json({ error: 'TTS failed' }, { status: 500 })
  }
}
