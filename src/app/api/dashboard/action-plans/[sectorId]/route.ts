import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { buildPlan, PlanItem, InterventionCadence } from '@/lib/action-plan-engine'
import { computeSectorFactors, FactorRisk } from '@/lib/sector-factors'
import { buildTrainingSchedule, weeksSince, IntervCadence } from '@/lib/training-schedule'

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

    const sector = await prisma.sector.findFirst({ where: { id: params.sectorId, companyId } })
    if (!sector) return NextResponse.json({ error: 'Setor não encontrado.' }, { status: 404 })

    const plan = await prisma.actionPlan.findUnique({ where: { sectorId: params.sectorId } })

    // Só considera planos no formato NOVO (itens com topicNum e level). Planos antigos são ignorados → regera.
    const itemsArr = (plan?.items as unknown[]) ?? []
    const firstItem = itemsArr[0] as { topicNum?: number; level?: number } | undefined
    const isNewShape = itemsArr.length > 0 && firstItem?.topicNum != null && firstItem?.level != null

    // Já existe plano salvo (formato novo) → devolve direto
    if (plan && isNewShape) {
      const cad = (plan.interventionCadence as IntervCadence) ?? 'mensal'
      const baseline: FactorRisk[] = Array.isArray(plan.baseline) ? (plan.baseline as unknown as FactorRisk[]) : []
      const training = baseline.length
        ? buildTrainingSchedule(baseline.map((b) => ({ topicNum: b.topicNum, factor: b.factor, riskLevel: b.riskLevel })), cad)
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
        sectorName: sector.name,
      })
    }

    // Sem plano: precisa de respostas e da escolha da cadência
    const factors = await computeSectorFactors(params.sectorId)
    if (factors.length === 0) {
      return NextResponse.json({ plan: null, suggested: null, noData: true, sectorName: sector.name })
    }

    const cadParam = new URL(req.url).searchParams.get('cadence') as InterventionCadence | null
    if (!cadParam || !CADENCES.includes(cadParam)) {
      return NextResponse.json({ plan: null, suggested: null, needsCadence: true, sectorName: sector.name })
    }

    const suggested = buildPlan(factors.map((f) => ({ topicNum: f.topicNum, riskLevel: f.riskLevel })), cadParam)
    const training = buildTrainingSchedule(factors.map((f) => ({ topicNum: f.topicNum, factor: f.factor, riskLevel: f.riskLevel })), cadParam as IntervCadence)
    return NextResponse.json({ plan: null, suggested, training, weeksElapsed: 0, planStarted: false, chosenCadence: cadParam, sectorName: sector.name })
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

    // Na criação, grava o "baseline": foto do risco por fator no início (para comparar na reavaliação)
    const existing = await prisma.actionPlan.findUnique({ where: { sectorId: params.sectorId }, select: { id: true } })
    const baseline = existing ? undefined : await computeSectorFactors(params.sectorId)

    const plan = await prisma.actionPlan.upsert({
      where:  { sectorId: params.sectorId },
      create: { sectorId: params.sectorId, companyId, items: parsed.data.items, baseline, interventionCadence: parsed.data.interventionCadence },
      update: { items: parsed.data.items },
    })
    return NextResponse.json({ ok: true, updatedAt: plan.updatedAt })
  } catch (err) {
    console.error('[ACTION-PLAN POST]', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Não foi possível salvar.' }, { status: 500 })
  }
}

// DELETE — apaga o plano do setor para recomeçar do zero
export async function DELETE(req: NextRequest, { params }: { params: { sectorId: string } }) {
  try {
    const { companyId } = requireAuth(req)
    const sector = await prisma.sector.findFirst({ where: { id: params.sectorId, companyId }, select: { id: true } })
    if (!sector) return NextResponse.json({ error: 'Setor não encontrado.' }, { status: 404 })

    await prisma.actionPlan.deleteMany({ where: { sectorId: params.sectorId, companyId } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[ACTION-PLAN DELETE]', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Não foi possível excluir.' }, { status: 500 })
  }
}
