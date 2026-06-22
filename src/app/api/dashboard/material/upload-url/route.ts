export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { requireOwner } from '@/lib/auth'
import { getR2Client, r2Configured, R2_BUCKET, R2_PUBLIC_URL } from '@/lib/r2'

const schema = z.object({
  filename:    z.string().trim().min(1).max(200),
  contentType: z.string().trim().min(1).max(120),
})

// POST — gera um link temporário para o navegador enviar o arquivo direto ao R2
export async function POST(req: NextRequest) {
  try {
    requireOwner(req)
  } catch {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    if (!r2Configured()) {
      return NextResponse.json(
        { error: 'O armazenamento de vídeos ainda não foi configurado.' },
        { status: 503 }
      )
    }

    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })

    const safe = parsed.data.filename.normalize('NFD').replace(/[^\w.\-]+/g, '_')
    const key = `videos/global/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}`

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET, Key: key, ContentType: parsed.data.contentType,
    })
    const uploadUrl = await getSignedUrl(getR2Client(), command, { expiresIn: 3600 })
    const publicUrl = `${R2_PUBLIC_URL}/${key}`

    return NextResponse.json({ uploadUrl, publicUrl, key })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Não foi possível preparar o upload.' }, { status: 500 })
  }
}
