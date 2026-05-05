import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

const createSchema = z.object({
  name: z.string().min(1).max(100),
})

export async function GET(req: NextRequest) {
  try {
    const { companyId } = requireAuth(req)

    const sectors = await prisma.sector.findMany({
      where: { companyId },
      include: {
        responses: {
          select: { riskScore: true, riskLevel: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

    const result = sectors.map((sector) => {
      const responses = sector.responses
      const withScore = responses.filter((r) => r.riskScore !== null)
      const avg = withScore.length
        ? withScore.reduce((s, r) => s + (r.riskScore ?? 0), 0) / withScore.length
        : null

      const riskCounts: Record<string, number> = {}
      for (const r of withScore) {
        if (r.riskLevel) riskCounts[r.riskLevel] = (riskCounts[r.riskLevel] ?? 0) + 1
      }
      const dominantRisk = withScore.length
        ? Object.entries(riskCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
        : null

      return {
        id: sector.id,
        name: sector.name,
        linkToken: sector.linkToken,
        shareUrl: `${appUrl}/r/${sector.linkToken}`,
        totalResponses: responses.length,
        avgRiskScore: avg !== null ? parseFloat(avg.toFixed(2)) : null,
        riskLevel: dominantRisk,
      }
    })

    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { companyId } = requireAuth(req)
    const body = await req.json()
    const parsed = createSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Nome inválido.' }, { status: 400 })
    }

    const sector = await prisma.sector.create({
      data: { companyId, name: parsed.data.name },
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

    return NextResponse.json({
      id: sector.id,
      name: sector.name,
      linkToken: sector.linkToken,
      shareUrl: `${appUrl}/r/${sector.linkToken}`,
    }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }
}
