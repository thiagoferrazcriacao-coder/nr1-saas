export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'
import { r2Configured } from '@/lib/r2'
import { PROGRAMS } from '@/lib/programs'

// GET — biblioteca global de vídeos
export async function GET(req: NextRequest) {
  try {
    requireAdmin(req)
    const lessons = await prisma.lesson.findMany({
      where: { companyId: null },
      orderBy: [{ programNum: 'asc' }, { order: 'asc' }],
    })
    return NextResponse.json({ lessons, r2Configured: r2Configured() })
  } catch (err) {
    if ((err as Error).message === 'Não autorizado') return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    console.error(err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}

const createSchema = z.object({
  programNum:  z.number().int().min(1).max(13),
  title:       z.string().trim().min(1).max(200),
  description: z.string().trim().max(1000).optional(),
  videoUrl:    z.string().url(),
  durationSec: z.number().int().min(0).optional(),
})

// POST — cria aula na biblioteca global
export async function POST(req: NextRequest) {
  try {
    requireAdmin(req)
  } catch {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }
  try {
    const parsed = createSchema.safeParse(await req.json())
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Dados inválidos.' }, { status: 400 })
    const program = PROGRAMS.find((p) => p.num === parsed.data.programNum)
    if (!program) return NextResponse.json({ error: 'Categoria inválida.' }, { status: 400 })

    const last = await prisma.lesson.findFirst({
      where: { companyId: null, programNum: parsed.data.programNum },
      orderBy: { order: 'desc' }, select: { order: true },
    })
    const lesson = await prisma.lesson.create({
      data: {
        companyId: null, programNum: parsed.data.programNum, program: program.name,
        title: parsed.data.title, description: parsed.data.description ?? null,
        videoUrl: parsed.data.videoUrl, durationSec: parsed.data.durationSec ?? 0,
        order: (last?.order ?? -1) + 1,
      },
    })
    return NextResponse.json({ lesson })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
