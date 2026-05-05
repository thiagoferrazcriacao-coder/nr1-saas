import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const { companyId } = requireAuth(req)

    const sectors = await prisma.sector.findMany({
      where: { companyId },
      include: {
        responses: {
          select: { riskScore: true, riskLevel: true, createdAt: true },
        },
      },
    })

    const overview = sectors.map((sector) => {
      const responses = sector.responses.filter((r) => r.riskScore !== null)
      const avg = responses.length
        ? responses.reduce((s, r) => s + (r.riskScore ?? 0), 0) / responses.length
        : null

      return {
        id: sector.id,
        name: sector.name,
        totalResponses: sector.responses.length,
        avgRiskScore: avg !== null ? parseFloat(avg.toFixed(2)) : null,
        riskLevel:
          avg === null ? null
          : avg <= 1 ? 'baixo'
          : avg <= 2 ? 'moderado'
          : avg <= 3 ? 'alto'
          : 'critico',
      }
    })

    const allScores = overview.filter((s) => s.avgRiskScore !== null).map((s) => s.avgRiskScore!)
    const companyAvg = allScores.length
      ? allScores.reduce((s, v) => s + v, 0) / allScores.length
      : null

    return NextResponse.json({
      sectors: overview,
      companyAvgScore: companyAvg !== null ? parseFloat(companyAvg.toFixed(2)) : null,
      totalResponses: sectors.reduce((s, sec) => s + sec.responses.length, 0),
    })
  } catch {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }
}
