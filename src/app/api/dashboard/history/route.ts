export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { FactorRisk } from '@/lib/sector-factors'
import { RiskLevel } from '@/lib/action-plan-engine'

const sev: Record<RiskLevel, number> = { baixo: 0, moderado: 1, alto: 2, critico: 3 }

type ItemLite = { status?: string; evidences?: unknown[] }

// GET — lista os ciclos arquivados (DRPS + plano de ação encerrados) da empresa,
// para consulta e comprovação na fiscalização.
export async function GET(req: NextRequest) {
  try {
    const { companyId } = requireAuth(req)

    const archives = await prisma.actionPlanArchive.findMany({
      where: { companyId },
      orderBy: { archivedAt: 'desc' },
    })

    const list = archives.map((a) => {
      const items = (Array.isArray(a.items) ? a.items : []) as ItemLite[]
      const totalActions = items.length
      const doneActions = items.filter((i) => i.status === 'concluida').length
      const evidences = items.reduce((s, i) => s + (Array.isArray(i.evidences) ? i.evidences.length : 0), 0)

      const baseline = (Array.isArray(a.baseline) ? a.baseline : []) as unknown as FactorRisk[]
      const final = (Array.isArray(a.finalSnapshot) ? a.finalSnapshot : []) as unknown as FactorRisk[]
      const finalMap = new Map(final.map((f) => [f.topicNum, f]))
      let improved = 0, worsened = 0, stable = 0
      for (const b of baseline) {
        const c = finalMap.get(b.topicNum)
        if (!c) continue
        if (sev[c.riskLevel] < sev[b.riskLevel]) improved++
        else if (sev[c.riskLevel] > sev[b.riskLevel]) worsened++
        else stable++
      }

      return {
        id: a.id,
        sectorName: a.sectorName,
        startedAt: a.startedAt,
        archivedAt: a.archivedAt,
        horizonWeeks: a.horizonWeeks,
        interventionCadence: a.interventionCadence,
        totalActions, doneActions, evidences,
        reavaliada: final.length > 0,
        improved, worsened, stable,
      }
    })

    return NextResponse.json({ archives: list })
  } catch (err) {
    console.error('[HISTORY]', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }
}
