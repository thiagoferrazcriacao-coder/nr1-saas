import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { buildPlan, PlanItem, InterventionCadence } from '@/lib/action-plan-engine'
import { computeSectorFactors, FactorRisk } from '@/lib/sector-factors'
import { buildTrainingSchedule, weeksSince, IntervCadence } from '@/lib/training-schedule'
import { accessEndDate, horizonWeeksUntil } from '@/lib/access-window'

const CADENCES: InterventionCadence[] = ['semanal', 'mensal', 'bimestral']

export const dynamic = 'force-dynamic'

const evidenceSchema = z.object({
  url:  z.string().url(),
  name: z.string().optional(),
  note: z.string().optional(),
  at:   z.string(),
})

const itemSchema = z.object({
  id:           z.string(),
  topicNum:     z.number().int(),
  factor:       z.string(),
  riskLevel:    z.enum(['baixo', 'moderado', 'alto', 'critico']),
  level:        z.union([z.literal(1), z.literal(2), z.literal(3)]),
  title:        z.string(),
  how:          z.string(),
  who:          z.string(),
  startWeek:    z.number().int(),
  dueWeek:      z.number().int(),
  cadence:      z.enum(['semanal', 'quinzenal', 'mensal', 'bimestral', 'trimestral', 'continuo']),
  howMuch:      z.string().optional(),
  evidenceHint: z.string(),
  status:       z.enum(['pendente', 'em_andamento', 'concluida']),
  evidences:    z.array(evidenceSchema),
})

const schema = z.object({
  items: z.array(itemSchema),
  interventionCadence: z.enum(['semanal', 'mensal', 'bimestral']).optional(),
})

// GET — plano salvo, ou (se a empresa já escolheu a cadência) a sugestão gerada nesse ritmo
export async function GET(req: NextRequest, { params }: { params: { sectorId: string } }) {
  try {
    const { companyId } = requireAuth(req)

    const sector = await prisma.sector.findFirst({
      where: { id: params.sectorId, companyId },
      include: { company: { select: { createdAt: true } } },
    })
    if (!sector) return NextResponse.json({ error: 'Setor não encontrado.' }, { status: 404 })

    const accessEnd = accessEndDate(sector.company.createdAt)
    const accessEndISO = accessEnd.toISOString()
    // horizonte de um plano montado AGORA (até o vencimento do acesso de 1 ano)
    const newHorizon = horizonWeeksUntil(accessEnd)

    const plan = await prisma.actionPlan.findUnique({ where: { sectorId: params.sectorId } })

    // Só considera planos no formato NOVO (itens com topicNum e level). Planos antigos são ignorados → regera.
    const itemsArr = (plan?.items as unknown[]) ?? []
    const firstItem = itemsArr[0] as { topicNum?: number; level?: number } | undefined
    const isNewShape = itemsArr.length > 0 && firstItem?.topicNum != null && firstItem?.level != null

    // Já existe plano salvo (formato novo) → devolve direto
    if (plan && isNewShape) {
      const cad = (plan.interventionCadence as IntervCadence) ?? 'mensal'
      const horizon = plan.horizonWeeks ?? 52
      const baseline: FactorRisk[] = Array.isArray(plan.baseline) ? (plan.baseline as unknown as FactorRisk[]) : []
      const training = baseline.length
        ? buildTrainingSchedule(baseline.map((b) => ({ topicNum: b.topicNum, factor: b.factor, riskLevel: b.riskLevel })), cad, horizon)
        : []
      return NextResponse.json({
        plan: {
          items: plan.items as unknown as PlanItem[],
          updatedAt: plan.updatedAt,
          startDate: plan.createdAt,
          interventionCadence: plan.interventionCadence,
        },
        training,
        weeksElapsed: weeksSince(plan.createdAt),
        planStarted: true,
        horizonWeeks: horizon,
        accessEnd: accessEndISO,
        sectorName: sector.name,
      })
    }

    // Sem plano: precisa de respostas e da escolha da cadência
    const factors = await computeSectorFactors(params.sectorId)
    if (factors.length === 0) {
      return NextResponse.json({ plan: null, suggested: null, noData: true, accessEnd: accessEndISO, sectorName: sector.name })
    }

    const cadParam = new URL(req.url).searchParams.get('cadence') as InterventionCadence | null
    if (!cadParam || !CADENCES.includes(cadParam)) {
      return NextResponse.json({ plan: null, suggested: null, needsCadence: true, horizonWeeks: newHorizon, accessEnd: accessEndISO, sectorName: sector.name })
    }

    const suggested = buildPlan(factors.map((f) => ({ topicNum: f.topicNum, riskLevel: f.riskLevel })), cadParam, newHorizon)
    const training = buildTrainingSchedule(factors.map((f) => ({ topicNum: f.topicNum, factor: f.factor, riskLevel: f.riskLevel })), cadParam as IntervCadence, newHorizon)
    return NextResponse.json({ plan: null, suggested, training, weeksElapsed: 0, planStarted: false, horizonWeeks: newHorizon, accessEnd: accessEndISO, chosenCadence: cadParam, sectorName: sector.name })
  } catch (err) {
    console.error('[ACTION-PLAN GET]', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }
}

// POST — salva (upsert) o plano de ação rico
export async function POST(req: NextRequest, { params }: { params: { sectorId: string } }) {
  try {
    const { companyId } = requireAuth(req)

    const sector = await prisma.sector.findFirst({ where: { id: params.sectorId, companyId } })
    if (!sector) return NextResponse.json({ error: 'Setor não encontrado.' }, { status: 404 })

    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })

    // Na criação, grava o "baseline" (foto do risco no início) e o horizonte (até o vencimento do acesso)
    const existing = await prisma.actionPlan.findUnique({ where: { sectorId: params.sectorId }, select: { id: true } })
    let baseline: FactorRisk[] | undefined
    let horizonWeeks: number | undefined
    if (!existing) {
      baseline = await computeSectorFactors(params.sectorId)
      const company = await prisma.company.findUnique({ where: { id: companyId }, select: { createdAt: true } })
      horizonWeeks = company ? horizonWeeksUntil(accessEndDate(company.createdAt)) : 52
    }

    const plan = await prisma.actionPlan.upsert({
      where:  { sectorId: params.sectorId },
      create: { sectorId: params.sectorId, companyId, items: parsed.data.items, baseline, horizonWeeks, interventionCadence: parsed.data.interventionCadence },
      update: { items: parsed.data.items },
    })
    return NextResponse.json({ ok: true, updatedAt: plan.updatedAt })
  } catch (err) {
    console.error('[ACTION-PLAN POST]', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Não foi possível salvar.' }, { status: 500 })
  }
}

// DELETE — encerra o ciclo atual: ARQUIVA o plano (com evidências) e o DRPS do ciclo,
// depois remove o plano ativo para a empresa montar o próximo (mais curto, até o vencimento).
export async function DELETE(req: NextRequest, { params }: { params: { sectorId: string } }) {
  try {
    const { companyId } = requireAuth(req)
    const sector = await prisma.sector.findFirst({ where: { id: params.sectorId, companyId }, select: { id: true, name: true } })
    if (!sector) return NextResponse.json({ error: 'Setor não encontrado.' }, { status: 404 })

    const plan = await prisma.actionPlan.findUnique({ where: { sectorId: params.sectorId } })
    // Arquiva o ciclo antes de remover (só se for um plano de verdade, no formato novo)
    const arr = (plan?.items as unknown[]) ?? []
    const f0 = arr[0] as { topicNum?: number; level?: number } | undefined
    if (plan && arr.length > 0 && f0?.topicNum != null && f0?.level != null) {
      // foto do risco na reavaliação (respostas coletadas durante o ciclo que está encerrando)
      const finalSnapshot = await computeSectorFactors(params.sectorId, new Date(plan.createdAt))
      await prisma.actionPlanArchive.create({
        data: {
          companyId, sectorId: params.sectorId, sectorName: sector.name,
          items: (plan.items ?? []) as Prisma.InputJsonValue,
          baseline: plan.baseline == null ? Prisma.JsonNull : (plan.baseline as Prisma.InputJsonValue),
          finalSnapshot: finalSnapshot.length ? (finalSnapshot as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
          interventionCadence: plan.interventionCadence,
          horizonWeeks: plan.horizonWeeks,
          startedAt: plan.createdAt,
        },
      })
    }

    await prisma.actionPlan.deleteMany({ where: { sectorId: params.sectorId, companyId } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[ACTION-PLAN DELETE]', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Não foi possível excluir.' }, { status: 500 })
  }
}
