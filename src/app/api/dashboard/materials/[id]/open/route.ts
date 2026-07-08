export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

const schema = z.object({ percent: z.number().int().min(1).max(100).optional() })

// POST — registra que o gestor abriu/leu um material (comprovação).
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId, companyId } = requireAuth(req)
    const parsed = schema.safeParse(await req.json().catch(() => ({})))
    const percent = parsed.success && parsed.data.percent ? parsed.data.percent : 100

    // Confirma que o material é visível para esta empresa (extra dela ou ebook oficial)
    const material = await prisma.material.findFirst({
      where: { id: params.id, OR: [{ companyId }, { companyId: null, kind: 'ebook' }] },
      select: { id: true },
    })
    if (!material) return NextResponse.json({ error: 'Material não encontrado.' }, { status: 404 })

    const existing = await prisma.materialOpen.findUnique({
      where: { materialId_viewerType_viewerId: { materialId: params.id, viewerType: 'gestor', viewerId: userId } },
      select: { percent: true },
    })
    const best = Math.max(existing?.percent ?? 0, percent)
    await prisma.materialOpen.upsert({
      where:  { materialId_viewerType_viewerId: { materialId: params.id, viewerType: 'gestor', viewerId: userId } },
      create: { materialId: params.id, viewerType: 'gestor', viewerId: userId, percent: best },
      update: { percent: best },
    })
    return NextResponse.json({ ok: true, percent: best })
  } catch {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }
}
