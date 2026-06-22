import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET — relatório de presença: cada colaborador e quanto assistiu de cada vídeo
export async function GET(req: NextRequest) {
  try {
    const { companyId } = requireAuth(req)

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { slug: true },
    })
    if (!company) return NextResponse.json({ error: 'Empresa não encontrada.' }, { status: 404 })

    const lessons = await prisma.lesson.findMany({
      where:   { companyId: null, active: true },
      orderBy: [{ programNum: 'asc' }, { order: 'asc' }],
      select:  { id: true, title: true, program: true, programNum: true },
    })
    const totalLessons = lessons.length

    const employees = await prisma.employee.findMany({
      where:   { companyId },
      orderBy: { createdAt: 'asc' },
      include: { progresses: true },
    })

    const rows = employees.map((e) => {
      const progMap = new Map(e.progresses.map((p) => [p.lessonId, p]))
      const perLesson = lessons.map((l) => ({
        lessonId:  l.id,
        title:     l.title,
        program:   l.program,
        percent:   progMap.get(l.id)?.percent ?? 0,
        completed: progMap.get(l.id)?.completed ?? false,
      }))
      const somaPercent = perLesson.reduce((s, p) => s + p.percent, 0)
      const avgPercent = totalLessons ? Math.round(somaPercent / totalLessons) : 0
      const completedCount = perLesson.filter((p) => p.completed).length
      return {
        email:     e.email,
        name:      e.name,
        avgPercent,
        completedCount,
        perLesson,
      }
    })

    return NextResponse.json({
      slug:         company.slug,
      totalLessons,
      lessons:      lessons.map((l) => ({ id: l.id, title: l.title, program: l.program })),
      employees:    rows,
    })
  } catch {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }
}
