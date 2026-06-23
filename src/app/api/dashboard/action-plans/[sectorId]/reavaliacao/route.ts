export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { computeSectorFactors, countResponsesSince, FactorRisk } from '@/lib/sector-factors'
import { RiskLevel } from '@/lib/action-plan-engine'

const sev: Record<RiskLevel, number> = { baixo: 0, moderado: 1, alto: 2, critico: 3 }

function addMonths(d: Date, m: number): Date {
  const x = new Date(d)
  x.setMonth(x.getMonth() + m)
  return x
}

// GET — status da reavaliação: marcos (3/6/12 meses) e comparação fator a fator (início × agora)
export async function GET(req: NextRequest, { params }: { params: { sectorId: string } }) {
  try {
    const { companyId } = requireAuth(req)
    const sector = await prisma.sector.findFirst({ where: { id: params.sectorId, companyId }, select: { id: true, linkToken: true } })
    if (!sector) return NextResponse.json({ error: 'Setor não encontrado.' }, { status: 404 })

    const plan = await prisma.actionPlan.findUnique({ where: { sectorId: params.sectorId }, select: { createdAt: true, baseline: true } })
    if (!plan) return NextResponse.json({ hasPlan: false })

    const start = new Date(plan.createdAt)
    const now = new Date()

    // baseline: foto gravada no início (fallback: recalcula tudo, caso plano antigo sem baseline)
    const baseline: FactorRisk[] = Array.isArray(plan.baseline) && plan.baseline.length
      ? (plan.baseline as unknown as FactorRisk[])
      : await computeSectorFactors(params.sectorId)

    // reavaliação: respostas DEPOIS do início do plano
    const reEval = await computeSectorFactors(params.sectorId, start)
    const reEvalMap = new Map(reEval.map((f) => [f.topicNum, f]))
    const novasRespostas = await countResponsesSince(params.sectorId, start)

    // comparação fator a fator
    const comparison = baseline.map((b) => {
      const cur = reEvalMap.get(b.topicNum)
      let trend: 'melhorou' | 'estavel' | 'piorou' | 'sem_dados' = 'sem_dados'
      if (cur) {
        if (sev[cur.riskLevel] < sev[b.riskLevel]) trend = 'melhorou'
        else if (sev[cur.riskLevel] > sev[b.riskLevel]) trend = 'piorou'
        else trend = 'estavel'
      }
      return {
        topicNum: b.topicNum,
        factor: b.factor,
        baseline: b.riskLevel,
        baselineScore: b.score,
        current: cur?.riskLevel ?? null,
        currentScore: cur?.score ?? null,
        trend,
      }
    })

    const milestones = [3, 6, 12].map((month) => {
      const date = addMonths(start, month)
      const respostasAposMarco = reEval.length > 0 && now >= date // simplificação: se já houve reavaliação e a data chegou
      let status: 'futura' | 'pendente' | 'feita'
      if (now < date) status = 'futura'
      else status = respostasAposMarco ? 'feita' : 'pendente'
      return { month, date: date.toISOString(), status }
    })

    return NextResponse.json({
      hasPlan: true,
      startDate: start.toISOString(),
      novasRespostas,
      reavaliada: reEval.length > 0,
      milestones,
      comparison,
      linkToken: sector.linkToken,
    })
  } catch (err) {
    console.error('[REAVALIACAO]', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }
}
