const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY!
const DEEPGRAM_BASE = 'https://api.deepgram.com/v1'

export async function textToSpeech(text: string, voice: string = 'aura-asteria-en'): Promise<Buffer> {
  const response = await fetch(`${DEEPGRAM_BASE}/speak?model=${voice}&encoding=mp3&container=mp3`, {
    method: 'POST',
    headers: {
      Authorization: `Token ${DEEPGRAM_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Deepgram TTS error: ${response.status} - ${error}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

export async function speechToText(audioBuffer: Buffer, mimeType: string = 'audio/webm'): Promise<string> {
  const params = new URLSearchParams({
    model: 'nova-3',
    language: 'en',
    smart_format: 'true',
    punctuate: 'true',
  })

  const response = await fetch(`${DEEPGRAM_BASE}/listen?${params.toString()}`, {
    method: 'POST',
    headers: {
      Authorization: `Token ${DEEPGRAM_API_KEY}`,
      'Content-Type': mimeType,
    },
    body: audioBuffer as unknown as BodyInit,
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Deepgram STT error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  return data?.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? ''
}

export const EXAMINER_VOICES = [
  { id: 'aura-asteria-en', name: 'Asteria (Female)', accent: 'American' },
  { id: 'aura-orion-en', name: 'Orion (Male)', accent: 'American' },
  { id: 'aura-luna-en', name: 'Luna (Female)', accent: 'British' },
  { id: 'aura-zeus-en', name: 'Zeus (Male)', accent: 'British' },
]
