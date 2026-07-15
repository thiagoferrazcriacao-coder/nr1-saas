export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { computeSectorFactors, FactorRisk } from '@/lib/sector-factors'
import { RiskLevel } from '@/lib/action-plan-engine'

const sev: Record<RiskLevel, number> = { baixo: 0, moderado: 1, alto: 2, critico: 3 }

type AttentionItem = { sectorId: string; sectorName: string; topicNum: number; factor: string; riskLevel: RiskLevel; score: number }
type Trend = 'melhorou' | 'estavel' | 'piorou' | 'sem_dados'
type FactorCmp = { topicNum: number; factor: string; baseline: RiskLevel; baselineScore: number; current: RiskLevel | null; currentScore: number | null; trend: Trend }
type SectorEvolution = { sectorId: string; name: string; reavaliada: boolean; improved: number; worsened: number; stable: number; comparison: FactorCmp[] }

// GET — consolida, para o dashboard: (1) fatores que precisam de atenção (alto/crítico) em
// todos os setores e (2) a evolução (início × reavaliação) de cada setor com plano.
export async function GET(req: NextRequest) {
  try {
    const { companyId } = requireAuth(req)

    const sectors = await prisma.sector.findMany({
      where: { companyId },
      select: { id: true, name: true },
    })

    const attention: AttentionItem[] = []
    const evolution: SectorEvolution[] = []
    let hasAnyPlan = false
    let hasAnyReaval = false

    for (const s of sectors) {
      const current = await computeSectorFactors(s.id)
      if (current.length === 0) continue

      // fatores que precisam de atenção: alto e crítico
      for (const f of current) {
        if (f.riskLevel === 'alto' || f.riskLevel === 'critico') {
          attention.push({ sectorId: s.id, sectorName: s.name, topicNum: f.topicNum, factor: f.factor, riskLevel: f.riskLevel, score: f.score })
        }
      }

      // evolução: só se houver plano (baseline gravado)
      const plan = await prisma.actionPlan.findUnique({ where: { sectorId: s.id }, select: { createdAt: true, baseline: true } })
      if (!plan) continue
      hasAnyPlan = true

      const baseline: FactorRisk[] = Array.isArray(plan.baseline) && plan.baseline.length
        ? (plan.baseline as unknown as FactorRisk[])
        : current
      const reEval = await computeSectorFactors(s.id, new Date(plan.createdAt))
      const reMap = new Map(reEval.map((f) => [f.topicNum, f]))
      const reavaliada = reEval.length > 0
      if (reavaliada) hasAnyReaval = true

      let improved = 0, worsened = 0, stable = 0
      const comparison: FactorCmp[] = baseline.map((b) => {
        const cur = reMap.get(b.topicNum)
        let trend: Trend = 'sem_dados'
        if (cur) {
          if (sev[cur.riskLevel] < sev[b.riskLevel]) { trend = 'melhorou'; improved++ }
          else if (sev[cur.riskLevel] > sev[b.riskLevel]) { trend = 'piorou'; worsened++ }
          else { trend = 'estavel'; stable++ }
        }
        return { topicNum: b.topicNum, factor: b.factor, baseline: b.riskLevel, baselineScore: b.score, current: cur?.riskLevel ?? null, currentScore: cur?.score ?? null, trend }
      })

      evolution.push({ sectorId: s.id, name: s.name, reavaliada, improved, worsened, stable, comparison })
    }

    // prioriza: crítico antes de alto; dentro do mesmo nível, maior score primeiro
    attention.sort((a, b) => sev[b.riskLevel] - sev[a.riskLevel] || b.score - a.score)

    return NextResponse.json({ attention, evolution, hasAnyPlan, hasAnyReaval })
  } catch (err) {
    console.error('[DASHBOARD OVERVIEW]', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }
}
