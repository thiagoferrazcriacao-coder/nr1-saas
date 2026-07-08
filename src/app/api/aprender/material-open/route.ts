export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getEmployeeFromReq } from '@/lib/employee-auth'

const schema = z.object({
  materialId: z.string().min(1),
  percent:    z.number().int().min(1).max(100).optional(),
})

// POST — registra que o colaborador abriu/leu um material complementar (comprovação).
export async function POST(req: NextRequest) {
  const session = getEmployeeFromReq(req)
  if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  try {
    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
    const percent = parsed.data.percent ?? 100

    // Confirma que o material é visível para a empresa do colaborador
    const material = await prisma.material.findFirst({
      where: {
        id: parsed.data.materialId,
        OR: [{ companyId: session.companyId }, { companyId: null, kind: 'ebook', trilha: 'colaborador' }],
      },
      select: { id: true },
    })
    if (!material) return NextResponse.json({ error: 'Material não encontrado.' }, { status: 404 })

    const key = { materialId: material.id, viewerType: 'emp', viewerId: session.employeeId }
    const existing = await prisma.materialOpen.findUnique({
      where: { materialId_viewerType_viewerId: key }, select: { percent: true },
    })
    const best = Math.max(existing?.percent ?? 0, percent)
    await prisma.materialOpen.upsert({
      where:  { materialId_viewerType_viewerId: key },
      create: { ...key, percent: best },
      update: { percent: best },
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
