export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

const KINDS = ['video', 'youtube', 'ebook', 'image', 'file', 'link'] as const

const createSchema = z.object({
  kind:        z.enum(KINDS),
  title:       z.string().trim().min(1).max(200),
  description: z.string().trim().max(1000).optional(),
  url:         z.string().url(),
  programNum:  z.number().int().min(1).max(13).optional(),
})

// GET — materiais que o gestor vê: extras da própria empresa + ebooks oficiais,
// com o status de abertura do próprio gestor.
export async function GET(req: NextRequest) {
  try {
    const { userId, companyId } = requireAuth(req)
    const materials = await prisma.material.findMany({
      where: {
        active: true,
        OR: [
          { companyId },                          // extras da empresa
          { companyId: null, kind: 'ebook' },     // ebooks oficiais
        ],
      },
      orderBy: [{ createdAt: 'desc' }],
    })
    const opens = await prisma.materialOpen.findMany({
      where: { viewerType: 'gestor', viewerId: userId, materialId: { in: materials.map((m) => m.id) } },
    })
    const openMap: Record<string, number> = {}
    for (const o of opens) openMap[o.materialId] = o.percent
    return NextResponse.json({
      materials: materials.map((m) => ({ ...m, opened: (openMap[m.id] ?? 0) > 0, openPercent: openMap[m.id] ?? 0 })),
    })
  } catch {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }
}

// POST — gestor cria um material extra da própria empresa (compartilhado com a equipe)
export async function POST(req: NextRequest) {
  try {
    const { userId, companyId } = requireAuth(req)
    const parsed = createSchema.safeParse(await req.json())
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Dados inválidos.' }, { status: 400 })

    const material = await prisma.material.create({
      data: {
        companyId,
        createdByUser: userId,
        kind:          parsed.data.kind,
        trilha:        'colaborador',
        programNum:    parsed.data.programNum ?? null,
        title:         parsed.data.title,
        description:   parsed.data.description ?? null,
        url:           parsed.data.url,
      },
    })
    return NextResponse.json({ material })
  } catch {
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
