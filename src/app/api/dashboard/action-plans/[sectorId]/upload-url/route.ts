export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { getR2Client, r2Configured, R2_BUCKET, R2_PUBLIC_URL } from '@/lib/r2'

const schema = z.object({
  filename:    z.string().trim().min(1).max(200),
  contentType: z.string().trim().min(1).max(120),
})

// POST — gera URL assinada para o gestor anexar uma evidência do plano de ação
export async function POST(req: NextRequest, { params }: { params: { sectorId: string } }) {
  try {
    const { companyId } = requireAuth(req)
    const sector = await prisma.sector.findFirst({ where: { id: params.sectorId, companyId }, select: { id: true } })
    if (!sector) return NextResponse.json({ error: 'Setor não encontrado.' }, { status: 404 })
    if (!r2Configured()) return NextResponse.json({ error: 'Armazenamento não configurado.' }, { status: 503 })

    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })

    const safe = parsed.data.filename.normalize('NFD').replace(/[^\w.\-]+/g, '_')
    const key = `evidencias/${companyId}/${params.sectorId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}`
    const command = new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, ContentType: parsed.data.contentType })
    const uploadUrl = await getSignedUrl(getR2Client(), command, { expiresIn: 3600 })
    return NextResponse.json({ uploadUrl, publicUrl: `${R2_PUBLIC_URL}/${key}` })
  } catch (err) {
    console.error('[EVIDENCE UPLOAD]', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Não foi possível preparar o upload.' }, { status: 500 })
  }
}
