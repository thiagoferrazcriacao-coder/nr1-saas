import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getEmployeeFromReq } from '@/lib/employee-auth'

export const dynamic = 'force-dynamic'

const schema = z.object({
  lessonId: z.string().uuid(),
  percent:  z.number().min(0).max(100),
})

// POST — registra o progresso (colaborador identificado pela sessão). Só sobe.
export async function POST(req: NextRequest) {
  const session = getEmployeeFromReq(req)
  if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  try {
    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })

    const { lessonId } = parsed.data
    const percent = Math.round(parsed.data.percent)
    const employeeId = session.employeeId

    // A aula precisa existir e ser da mesma empresa do colaborador
    const lesson = await prisma.lesson.findFirst({
      where: { id: lessonId, companyId: session.companyId },
      select: { id: true },
    })
    if (!lesson) return NextResponse.json({ error: 'Aula não encontrada.' }, { status: 404 })

    const existing = await prisma.lessonProgress.findUnique({
      where: { employeeId_lessonId: { employeeId, lessonId } },
    })
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
