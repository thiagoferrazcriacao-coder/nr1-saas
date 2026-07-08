export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'
import { PROGRAMS } from '@/lib/programs'

const patchSchema = z.object({
  title:       z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  trilha:      z.enum(['gestor', 'colaborador']).optional(),
  programNum:  z.number().int().min(1).max(13).optional(),
  order:       z.number().int().min(0).optional(),
  active:      z.boolean().optional(),
  videoUrl:    z.string().url().optional(),
  durationSec: z.number().int().min(0).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try { requireAdmin(req) } catch { return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 }) }
  try {
    const lesson = await prisma.lesson.findFirst({ where: { id: params.id, companyId: null }, select: { id: true } })
    if (!lesson) return NextResponse.json({ error: 'Aula não encontrada.' }, { status: 404 })
    const parsed = patchSchema.safeParse(await req.json())
    if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
    // Se mudou o fator, atualiza o nome do programa junto
    const data: Prisma.LessonUpdateInput = { ...parsed.data }
    if (parsed.data.programNum != null) {
      const program = PROGRAMS.find((p) => p.num === parsed.data.programNum)
      if (!program) return NextResponse.json({ error: 'Fator inválido.' }, { status: 400 })
      data.program = program.name
    }
    const updated = await prisma.lesson.update({ where: { id: params.id }, data })
    return NextResponse.json({ lesson: updated })
  } catch { return NextResponse.json({ error: 'Erro interno.' }, { status: 500 }) }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try { requireAdmin(req) } catch { return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 }) }
  try {
    const lesson = await prisma.lesson.findFirst({ where: { id: params.id, companyId: null }, select: { id: true } })
    if (!lesson) return NextResponse.json({ error: 'Aula não encontrada.' }, { status: 404 })
    await prisma.lesson.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch { return NextResponse.json({ error: 'Erro interno.' }, { status: 500 }) }
}
