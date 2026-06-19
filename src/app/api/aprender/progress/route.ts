import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const schema = z.object({
  employeeId: z.string().uuid(),
  lessonId:   z.string().uuid(),
  percent:    z.number().min(0).max(100),
})

// POST — registra o progresso de assistir. Só sobe (guarda o maior % alcançado).
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
    }
    const { employeeId, lessonId } = parsed.data
    const percent = Math.round(parsed.data.percent)

    // Valida existência do colaborador e do vídeo
    const [employee, lesson] = await Promise.all([
      prisma.employee.findUnique({ where: { id: employeeId }, select: { id: true } }),
      prisma.lesson.findUnique({ where: { id: lessonId }, select: { id: true } }),
    ])
    if (!employee || !lesson) {
      return NextResponse.json({ error: 'Registro não encontrado.' }, { status: 404 })
    }

    const existing = await prisma.lessonProgress.findUnique({
      where: { employeeId_lessonId: { employeeId, lessonId } },
    })

    // Só atualiza se o novo % for maior que o já registrado
    const newPercent = Math.max(percent, existing?.percent ?? 0)
    const completed = newPercent >= 90

    const saved = await prisma.lessonProgress.upsert({
      where:  { employeeId_lessonId: { employeeId, lessonId } },
      create: { employeeId, lessonId, percent: newPercent, completed },
      update: { percent: newPercent, completed },
    })

    return NextResponse.json({ percent: saved.percent, completed: saved.completed })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erro ao salvar progresso.' }, { status: 500 })
  }
}
