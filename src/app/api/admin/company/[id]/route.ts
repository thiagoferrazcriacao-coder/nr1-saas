import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'
import { calcScore, buildRiskMatrix, type Probability } from '@/lib/scoring'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin(req)

    const company = await prisma.company.findUnique({
      where: { id: params.id },
      include: {
        sectors: {
          include: {
            responses: {
              include: { aiAnalysis: true },
              orderBy: { createdAt: 'desc' },
            },
            assessments: { orderBy: { topicNum: 'asc' } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!company) return NextResponse.json({ error: 'Empresa não encontrada.' }, { status: 404 })

    const questions = await prisma.question.findMany({
      select: { code: true, topic: true, topicNum: true, reverse: true },
    })

    const sectorsData = company.sectors.map((sector) => {
      if (sector.responses.length === 0) {
        return {
          id: sector.id,
          name: sector.name,
          totalResponses: 0,
          avgScore: null,
          riskLevel: null,
          byTopic: [],
          matrix: [],
          latestAi: null,
        }
      }

      const byCode = new Map<string, number[]>()
      for (const r of sector.responses) {
        for (const a of r.answers as { questionCode: string; value: number }[]) {
          if (!byCode.has(a.questionCode)) byCode.set(a.questionCode, [])
          byCode.get(a.questionCode)!.push(a.value)
        }
      }
      const avgAnswers = Array.from(byCode.entries()).map(([code, vals]) => ({
        questionCode: code,
        value: vals.reduce((s, v) => s + v, 0) / vals.length,
      }))

      const { total, riskLevel, byTopic } = calcScore(avgAnswers, questions)

      const fullAssessments = byTopic.map((t) => {
        const found = sector.assessments.find((a) => a.topicNum === t.topicNum)
        return { topicNum: t.topicNum, probability: (found?.probability ?? 'media') as Probability }
      })
      const matrix = buildRiskMatrix(byTopic, fullAssessments)

      const latestAi = sector.responses.find((r) => r.aiAnalysis?.classification)?.aiAnalysis ?? null

      return {
        id: sector.id,
        name: sector.name,
        totalResponses: sector.responses.length,
        avgScore: parseFloat(total.toFixed(2)),
        riskLevel,
        byTopic,
        matrix,
        latestAi: latestAi?.classification ?? null,
        assessedBy: sector.assessments[0]?.assessedBy ?? null,
      }
    })

    return NextResponse.json({
      company: {
        id:              company.id,
        name:            company.name,
        fantasyName:     company.fantasyName,
        cnpj:            company.cnpj,
        city:            company.city,
        state:           company.state,
        address:         company.address,
        responsible:     company.responsible,
        phone:           company.phone,
        employeeCount:   company.employeeCount,
        workModality:    company.workModality,
        drpsStatus:      company.drpsStatus,
        drpsValidatedAt: company.drpsValidatedAt,
        drpsValidatedBy: company.drpsValidatedBy,
        drpsNotes:       company.drpsNotes,
        termsAcceptedAt: company.termsAcceptedAt,
        createdAt:       company.createdAt,
      },
      sectors: sectorsData,
    })
  } catch (err) {
    if ((err as Error).message === 'Não autorizado') {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }
    console.error(err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
