import { prisma } from '@/lib/prisma'
import { FactorRisk } from '@/lib/sector-factors'
import { buildTrainingSchedule, releasedColabRefs, weeksSince, IntervCadence } from '@/lib/training-schedule'
import { isDemoCompany } from '@/lib/demo'

type PlanLayout = { order?: unknown }

// Achata as chaves dos meses (ex.: "7" ou "11-12") na ordem definida
// manualmente no Plano de Ação, para as duas trilhas seguirem a mesma sequência.
function factorOrderFromPlans(plans: { layout: unknown; baseline: unknown }[]): number[] {
  const ordered: number[] = []
  const add = (n: number) => { if (Number.isInteger(n) && n >= 1 && n <= 13 && !ordered.includes(n)) ordered.push(n) }

  for (const plan of plans) {
    const layout = (plan.layout ?? {}) as PlanLayout
    const order = Array.isArray(layout.order) ? layout.order : []
    for (const group of order) {
      if (typeof group !== 'string') continue
      for (const part of group.split('-')) add(Number(part))
    }
  }
  for (const plan of plans) {
    const baseline = Array.isArray(plan.baseline) ? plan.baseline : []
    for (const item of baseline) {
      if (item && typeof item === 'object' && 'topicNum' in item) add(Number((item as { topicNum: unknown }).topicNum))
    }
  }
  return ordered
}

// Monta os dados da área de membros: aulas da trilha do papel (gestor/colaborador) + progresso.
export async function buildMemberPayload(
  companyId: string,
  companyName: string,
  employee: { id: string; name: string | null },
  role: 'gestor' | 'colaborador' = 'colaborador'
) {
  // Cada pessoa vê APENAS a trilha do seu papel.
  const lessons = await prisma.lesson.findMany({
    where:   { companyId: null, active: true, trilha: role },
    orderBy: [{ programNum: 'asc' }, { order: 'asc' }],
  })

  const plans = await prisma.actionPlan.findMany({
    where: { companyId },
    select: { layout: true, baseline: true, createdAt: true, interventionCadence: true, horizonWeeks: true },
    orderBy: { createdAt: 'asc' },
  })
  const factorOrder = factorOrderFromPlans(plans)
  const factorRank = new Map(factorOrder.map((n, i) => [n, i]))

  // Liberação gradual: vale só para o COLABORADOR. O gestor/líder vê a trilha dele inteira.
  // Se a empresa já tem plano(s) de ação, os vídeos do colaborador vinculados ao Índice só
  // aparecem quando o cronograma libera aquela leva. Vídeos avulsos e empresas sem plano ficam livres.
  let releasedRefs: Set<string> | null = null
  if (role === 'colaborador' && plans.length > 0) {
    releasedRefs = new Set<string>()
    for (const p of plans) {
      const baseline: FactorRisk[] = Array.isArray(p.baseline) ? (p.baseline as unknown as FactorRisk[]) : []
      if (baseline.length === 0) continue
      const cad = (p.interventionCadence as IntervCadence) ?? 'mensal'
      const schedule = buildTrainingSchedule(baseline.map((b) => ({ topicNum: b.topicNum, factor: b.factor, riskLevel: b.riskLevel })), cad, p.horizonWeeks ?? 52)
      for (const key of releasedColabRefs(schedule, weeksSince(p.createdAt))) releasedRefs.add(key)
    }
  }
  const rr = releasedRefs
  const visibleLessons = rr
    ? lessons.filter((l) => !l.videoRef || rr.has(l.videoRef))
    : lessons

  visibleLessons.sort((a, b) => {
    const factorDiff = (factorRank.get(a.programNum) ?? 999) - (factorRank.get(b.programNum) ?? 999)
    if (factorDiff !== 0) return factorDiff
    const refA = a.videoRef ? Number(a.videoRef) : Number.POSITIVE_INFINITY
    const refB = b.videoRef ? Number(b.videoRef) : Number.POSITIVE_INFINITY
    return refA - refB || a.order - b.order
  })

  const progresses = await prisma.lessonProgress.findMany({ where: { employeeId: employee.id } })
  const progMap = new Map(progresses.map((p) => [p.lessonId, p]))

  // Materiais complementares: extras da empresa + ebooks oficiais da trilha do papel
  const materials = await prisma.material.findMany({
    where: {
      active: true,
      OR: [
        { companyId },                                    // extras da empresa
        { companyId: null, kind: 'ebook', trilha: role }, // ebooks oficiais da trilha
      ],
    },
    orderBy: [{ createdAt: 'desc' }],
  })
  const opens = await prisma.materialOpen.findMany({
    where: { viewerType: 'emp', viewerId: employee.id, materialId: { in: materials.map((m) => m.id) } },
  })
  const openMap = new Map(opens.map((o) => [o.materialId, o.percent]))

  const demoUnlocked = await isDemoCompany(companyId)

  return {
    companyName,
    role,
    factorOrder,
    demoUnlocked,
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
