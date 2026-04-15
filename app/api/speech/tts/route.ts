import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { textToSpeech } from '@/lib/deepgram'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { text, voice } = await req.json()
  if (!text) return NextResponse.json({ error: 'No text provided' }, { status: 400 })

  try {
    const audioBuffer = await textToSpeech(text.slice(0, 2000), voice)
    return new NextResponse(audioBuffer.buffer as ArrayBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': String(audioBuffer.length),
      },
    })
  } catch (err) {
    console.error('TTS error:', err)
    return NextResponse.json({ error: 'TTS failed' }, { status: 500 })
  }
}
