export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'
import { r2Configured } from '@/lib/r2'

// GET — ebooks oficiais (globais)
export async function GET(req: NextRequest) {
  try {
    requireAdmin(req)
    const materials = await prisma.material.findMany({
      where: { companyId: null },
      orderBy: [{ createdAt: 'desc' }],
    })
    return NextResponse.json({ materials, r2Configured: r2Configured() })
  } catch {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }
}

const createSchema = z.object({
  kind:        z.enum(['ebook', 'file', 'link']).default('ebook'),
  trilha:      z.enum(['gestor', 'colaborador']).default('colaborador'),
  title:       z.string().trim().min(1).max(200),
  description: z.string().trim().max(1000).optional(),
  url:         z.string().url(),
})

// POST — cria um ebook oficial (global)
export async function POST(req: NextRequest) {
  try { requireAdmin(req) } catch { return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 }) }
  try {
    const parsed = createSchema.safeParse(await req.json())
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Dados inválidos.' }, { status: 400 })
    const material = await prisma.material.create({
      data: {
        companyId:   null,
        kind:        parsed.data.kind,
        trilha:      parsed.data.trilha,
        title:       parsed.data.title,
        description: parsed.data.description ?? null,
        url:         parsed.data.url,
      },
    })
    return NextResponse.json({ material })
  } catch {
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
