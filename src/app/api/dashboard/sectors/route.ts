export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { calcScore } from '@/lib/scoring'

const createSchema = z.object({
  name: z.string().min(1).max(100),
})

const GENERAL_SECTOR_NAMES = new Set(['geral', 'empresa inteira', 'empresa toda'])
function isGeneralSector(name: string): boolean {
  return GENERAL_SECTOR_NAMES.has(name.trim().toLocaleLowerCase('pt-BR'))
}

export async function GET(req: NextRequest) {
  try {
    const { companyId } = requireAuth(req)

    const questions = await prisma.question.findMany({ select: { code: true, topic: true, topicNum: true, reverse: true } })
    const sectors = await prisma.sector.findMany({
      where: { companyId },
      include: {
        responses: {
          select: { riskScore: true, riskLevel: true, answers: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

    const result = sectors.map((sector) => {
      const responses = sector.responses
      const scored = responses.map((r) => {
        if (r.riskScore !== null) return r
        const calculated = calcScore(r.answers as { questionCode: string; value: number }[], questions)
        return { ...r, riskScore: calculated.total, riskLevel: calculated.riskLevel }
      })
      const withScore = scored.filter((r) => r.riskScore !== null)
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

    const existing = await prisma.sector.findMany({
      where: { companyId },
      select: { name: true },
    })
    const requestedGeneral = isGeneralSector(parsed.data.name)
    const alreadyGeneral = existing.some((sector) => isGeneralSector(sector.name))

    if (requestedGeneral && existing.length > 0) {
      return NextResponse.json({ error: 'O setor Empresa inteira deve ser o único setor da empresa.' }, { status: 409 })
    }
    if (!requestedGeneral && alreadyGeneral) {
      return NextResponse.json({ error: 'A empresa já usa o link geral. Remova-o antes de criar setores separados.' }, { status: 409 })
    }

    const sector = await prisma.sector.create({
      data: { companyId, name: requestedGeneral ? 'Empresa inteira' : parsed.data.name.trim() },
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
