import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { ensureLearnCode } from '@/lib/learn-code'

export const dynamic = 'force-dynamic'

// GET — relatório de presença por período
// query params opcionais: from=ISO8601 & to=ISO8601
export async function GET(req: NextRequest) {
  try {
    const { companyId } = requireAuth(req)

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { slug: true },
    })
    if (!company) return NextResponse.json({ error: 'Empresa não encontrada.' }, { status: 404 })

    const learnCode = await ensureLearnCode(companyId)

    const { searchParams } = new URL(req.url)
    const fromParam = searchParams.get('from')
    const toParam   = searchParams.get('to')
    const from = fromParam ? new Date(fromParam) : null
    const to   = toParam   ? new Date(toParam)   : null

    const lessons = await prisma.lesson.findMany({
      where:   { companyId: null, active: true },
      orderBy: [{ programNum: 'asc' }, { order: 'asc' }],
      select:  { id: true, title: true, program: true, programNum: true },
    })
    const totalLessons = lessons.length

    // Filtro de data no LessonProgress: usa updatedAt (quando o colaborador assistiu pela última vez)
    const progressWhere: Record<string, unknown> = {}
    if (from || to) {
      progressWhere.updatedAt = {
        ...(from ? { gte: from } : {}),
        ...(to   ? { lte: to   } : {}),
      }
    }

    const employees = await prisma.employee.findMany({
      where:   { companyId },
      orderBy: { createdAt: 'asc' },
      include: {
        progresses: {
          where: progressWhere,
        },
      },
    })

    const rows = employees.map((e) => {
      const progMap = new Map(e.progresses.map((p) => [p.lessonId, p]))
      const perLesson = lessons.map((l) => ({
        lessonId:   l.id,
        title:      l.title,
        program:    l.program,
        programNum: l.programNum,
        percent:    progMap.get(l.id)?.percent ?? 0,
        completed:  progMap.get(l.id)?.completed ?? false,
        updatedAt:  progMap.get(l.id)?.updatedAt?.toISOString() ?? null,
      }))
      // Para cálculos de período: só contar aulas que tiveram atividade no período
      const activeInPeriod = perLesson.filter((p) => p.percent > 0)
      const somaPercent = perLesson.reduce((s, p) => s + p.percent, 0)
      const avgPercent = totalLessons ? Math.round(somaPercent / totalLessons) : 0
      const completedCount = perLesson.filter((p) => p.completed).length
      const activeCount = activeInPeriod.length
      return {
        email:          e.email,
        name:           e.name,
        avgPercent,
        completedCount,
        activeCount,
        perLesson,
      }
    })

    return NextResponse.json({
      slug:         learnCode,
      totalLessons,
      lessons:      lessons.map((l) => ({ id: l.id, title: l.title, program: l.program, programNum: l.programNum })),
      employees:    rows,
      period:       { from: from?.toISOString() ?? null, to: to?.toISOString() ?? null },
    })
  } catch {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }
}
