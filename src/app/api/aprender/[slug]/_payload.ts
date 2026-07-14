import { prisma } from '@/lib/prisma'
import { FactorRisk } from '@/lib/sector-factors'
import { buildTrainingSchedule, releasedColabRefs, weeksSince, IntervCadence } from '@/lib/training-schedule'

// Monta os dados da área de membros do colaborador: aulas da empresa + progresso dele.
export async function buildMemberPayload(
  companyId: string,
  companyName: string,
  employee: { id: string; name: string | null }
) {
  // O colaborador vê APENAS a Trilha do Colaborador.
  const lessons = await prisma.lesson.findMany({
    where:   { companyId: null, active: true, trilha: 'colaborador' },
    orderBy: [{ programNum: 'asc' }, { order: 'asc' }],
  })

  // Liberação gradual: se a empresa já tem plano(s) de ação, os vídeos vinculados ao
  // Índice de Vídeos só aparecem quando o cronograma libera aquela leva. Vídeos avulsos
  // (sem videoRef) e empresas sem plano continuam com tudo liberado.
  const plans = await prisma.actionPlan.findMany({ where: { companyId } })
  let releasedRefs: Set<string> | null = null
  if (plans.length > 0) {
    releasedRefs = new Set<string>()
    for (const p of plans) {
      const baseline: FactorRisk[] = Array.isArray(p.baseline) ? (p.baseline as unknown as FactorRisk[]) : []
      if (baseline.length === 0) continue
      const cad = (p.interventionCadence as IntervCadence) ?? 'mensal'
      const schedule = buildTrainingSchedule(baseline.map((b) => ({ topicNum: b.topicNum, factor: b.factor, riskLevel: b.riskLevel })), cad)
      for (const key of releasedColabRefs(schedule, weeksSince(p.createdAt))) releasedRefs.add(key)
    }
  }
  const rr = releasedRefs
  const visibleLessons = rr
    ? lessons.filter((l) => !l.videoRef || rr.has(l.videoRef))
    : lessons

  const progresses = await prisma.lessonProgress.findMany({ where: { employeeId: employee.id } })
  const progMap = new Map(progresses.map((p) => [p.lessonId, p]))

  // Materiais complementares: extras da empresa + ebooks oficiais (trilha do colaborador)
  const materials = await prisma.material.findMany({
    where: {
      active: true,
      OR: [
        { companyId },                                          // extras da empresa
        { companyId: null, kind: 'ebook', trilha: 'colaborador' }, // ebooks oficiais do colaborador
      ],
    },
    orderBy: [{ createdAt: 'desc' }],
  })
  const opens = await prisma.materialOpen.findMany({
    where: { viewerType: 'emp', viewerId: employee.id, materialId: { in: materials.map((m) => m.id) } },
  })
  const openMap = new Map(opens.map((o) => [o.materialId, o.percent]))

  return {
    companyName,
    employeeId:   employee.id,
    employeeName: employee.name,
    lessons: visibleLessons.map((l) => ({
      id:          l.id,
      programNum:  l.programNum,
      program:     l.program,
      trilha:      l.trilha,
      videoRef:    l.videoRef,
      title:       l.title,
      description: l.description,
      videoUrl:    l.videoUrl,
      percent:     progMap.get(l.id)?.percent ?? 0,
      completed:   progMap.get(l.id)?.completed ?? false,
    })),
    materials: materials.map((m) => ({
      id:          m.id,
      kind:        m.kind,
      title:       m.title,
      description: m.description,
      url:         m.url,
      opened:      (openMap.get(m.id) ?? 0) > 0,
    })),
  }
}
