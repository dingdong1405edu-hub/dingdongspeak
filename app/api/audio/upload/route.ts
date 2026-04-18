import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { cloudinary, isCloudinaryConfigured } from '@/lib/cloudinary'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!isCloudinaryConfigured()) {
    return NextResponse.json({ error: 'Audio storage not configured' }, { status: 503 })
  }

  const formData = await req.formData()
  const audio = formData.get('audio') as File | null
  if (!audio) return NextResponse.json({ error: 'No audio file' }, { status: 400 })

  const buffer = Buffer.from(await audio.arrayBuffer())

  const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        resource_type: 'video',
        folder: 'dingdong-audio',
        format: 'webm',
        public_id: `${session.user!.id}-${Date.now()}`,
      },
      (error, result) => {
        if (error || !result) reject(error)
        else resolve(result as { secure_url: string })
      }
    ).end(buffer)
  })

  return NextResponse.json({ url: result.secure_url })
}
