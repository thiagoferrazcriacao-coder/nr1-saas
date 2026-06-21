export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'
import { r2Configured } from '@/lib/r2'
import { PROGRAMS } from '@/lib/lessons-seed'

// GET — lista todas as aulas (biblioteca global)
export async function GET(req: NextRequest) {
  try {
    requireAdmin(req)
    const lessons = await prisma.lesson.findMany({ orderBy: [{ programNum: 'asc' }, { order: 'asc' }] })
    return NextResponse.json({ lessons, r2Configured: r2Configured() })
  } catch (err) {
    if ((err as Error).message === 'Não autorizado') {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }
    console.error(err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}

const createSchema = z.object({
  programNum:  z.number().int().min(1).max(10),
  title:       z.string().trim().min(1).max(200),
  description: z.string().trim().max(1000).optional(),
  videoUrl:    z.string().url(),
  durationSec: z.number().int().min(0).optional(),
})

// POST — cria a aula após o upload do vídeo
export async function POST(req: NextRequest) {
  try {
    requireAdmin(req)
    const parsed = createSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Dados inválidos.' }, { status: 400 })
    }
    const program = PROGRAMS.find((p) => p.num === parsed.data.programNum)
    if (!program) return NextResponse.json({ error: 'Programa inválido.' }, { status: 400 })

    // Próxima ordem dentro do programa
    const last = await prisma.lesson.findFirst({
      where: { programNum: parsed.data.programNum },
      orderBy: { order: 'desc' },
      select: { order: true },
    })

    const lesson = await prisma.lesson.create({
      data: {
        programNum:  parsed.data.programNum,
        program:     program.name,
        title:       parsed.data.title,
        description: parsed.data.description ?? null,
        videoUrl:    parsed.data.videoUrl,
        durationSec: parsed.data.durationSec ?? 0,
        order:       (last?.order ?? -1) + 1,
      },
    })
    return NextResponse.json({ lesson })
  } catch (err) {
    if ((err as Error).message === 'Não autorizado') {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }
    console.error(err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
