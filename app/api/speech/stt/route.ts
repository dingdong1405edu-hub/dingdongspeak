import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { speechToText } from '@/lib/deepgram'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const audio = formData.get('audio') as File
  if (!audio) return NextResponse.json({ error: 'No audio file' }, { status: 400 })

  try {
    const buffer = Buffer.from(await audio.arrayBuffer())
    const transcript = await speechToText(buffer, audio.type || 'audio/webm')
    return NextResponse.json({ transcript })
  } catch (err) {
    console.error('STT error:', err)
    return NextResponse.json({ error: 'Transcription failed' }, { status: 500 })
  }
}
