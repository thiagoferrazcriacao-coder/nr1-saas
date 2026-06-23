import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { calcScore } from '@/lib/scoring'
import { buildPlan, PlanItem, RiskLevel } from '@/lib/action-plan-engine'

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
  cadence:      z.enum(['semanal', 'quinzenal', 'mensal', 'trimestral', 'continuo']),
  howMuch:      z.string().optional(),
  evidenceHint: z.string(),
  status:       z.enum(['pendente', 'em_andamento', 'concluida']),
  evidences:    z.array(evidenceSchema),
})

const schema = z.object({ items: z.array(itemSchema) })

// Recalcula o risco por fator do setor a partir das respostas
async function computeFactors(sectorId: string): Promise<{ topicNum: number; riskLevel: RiskLevel }[]> {
  const responses = await prisma.response.findMany({ where: { sectorId }, select: { answers: true } })
  if (responses.length === 0) return []

  const questions = await prisma.question.findMany({ select: { code: true, topic: true, topicNum: true, reverse: true } })

  const byCode = new Map<string, number[]>()
  for (const r of responses) {
    const answers = r.answers as { questionCode: string; value: number }[]
    for (const a of answers) {
      if (!byCode.has(a.questionCode)) byCode.set(a.questionCode, [])
      byCode.get(a.questionCode)!.push(a.value)
    }
  }
  const avgAnswers = Array.from(byCode.entries()).map(([code, values]) => ({
    questionCode: code,
    value: values.reduce((s, v) => s + v, 0) / values.length,
  }))

  const { byTopic } = calcScore(avgAnswers, questions)
  return byTopic.map((t) => ({ topicNum: t.topicNum, riskLevel: t.riskLevel as RiskLevel }))
}

// GET — plano de ação do setor (salvo) ou sugestão gerada automaticamente
export async function GET(req: NextRequest, { params }: { params: { sectorId: string } }) {
  try {
    const { companyId } = requireAuth(req)

    const sector = await prisma.sector.findFirst({ where: { id: params.sectorId, companyId } })
    if (!sector) return NextResponse.json({ error: 'Setor não encontrado.' }, { status: 404 })

    const plan = await prisma.actionPlan.findUnique({ where: { sectorId: params.sectorId } })
    const factors = await computeFactors(params.sectorId)
    const suggested = buildPlan(factors)

    if (plan && Array.isArray(plan.items) && (plan.items as unknown[]).length > 0) {
      return NextResponse.json({
        plan: { items: plan.items as unknown as PlanItem[], updatedAt: plan.updatedAt, startDate: plan.createdAt },
        suggested,
        sectorName: sector.name,
      })
    }
    return NextResponse.json({ plan: null, suggested, sectorName: sector.name })
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

    const plan = await prisma.actionPlan.upsert({
      where:  { sectorId: params.sectorId },
      create: { sectorId: params.sectorId, companyId, items: parsed.data.items },
      update: { items: parsed.data.items },
    })
    return NextResponse.json({ ok: true, updatedAt: plan.updatedAt })
  } catch (err) {
    console.error('[ACTION-PLAN POST]', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Não foi possível salvar.' }, { status: 500 })
  }
}
