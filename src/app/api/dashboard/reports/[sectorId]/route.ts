import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { calcScore } from '@/lib/scoring'

export async function GET(
  req: NextRequest,
  { params }: { params: { sectorId: string } }
) {
  try {
    const { companyId } = requireAuth(req)

    const sector = await prisma.sector.findFirst({
      where: { id: params.sectorId, companyId },
    })

    if (!sector) {
      return NextResponse.json({ error: 'Setor não encontrado.' }, { status: 404 })
    }

    const responses = await prisma.response.findMany({
      where: { sectorId: params.sectorId },
      include: { aiAnalysis: true },
      orderBy: { createdAt: 'asc' },
    })

    if (responses.length === 0) {
      return NextResponse.json({ error: 'Sem respostas.' }, { status: 404 })
    }

    const questions = await prisma.question.findMany({
      select: { code: true, topic: true, topicNum: true, reverse: true },
    })

    // Agrega scores de todas as respostas
    const allAnswers: { questionCode: string; value: number }[] = []
    for (const response of responses) {
      const answers = response.answers as { questionCode: string; value: number }[]
      allAnswers.push(...answers)
    }

    // Média por questão (agrupa por código e calcula média)
    const byCode = new Map<string, number[]>()
    for (const a of allAnswers) {
      if (!byCode.has(a.questionCode)) byCode.set(a.questionCode, [])
      byCode.get(a.questionCode)!.push(a.value)
    }

    const avgAnswers = Array.from(byCode.entries()).map(([code, values]) => ({
      questionCode: code,
      value: values.reduce((s, v) => s + v, 0) / values.length,
    }))

    const { total, riskLevel, byTopic } = calcScore(avgAnswers, questions)

    // Timeline: agrupa por semana
    const weekMap = new Map<string, number[]>()
    for (const r of responses) {
      const date = new Date(r.createdAt)
      const week = `${date.getFullYear()}-W${Math.ceil(date.getDate() / 7)}`
      if (!weekMap.has(week)) weekMap.set(week, [])
      if (r.riskScore !== null) weekMap.get(week)!.push(r.riskScore)
    }

    const timeline = Array.from(weekMap.entries()).map(([date, scores]) => ({
      date,
      avgScore: parseFloat((scores.reduce((s, v) => s + v, 0) / scores.length).toFixed(2)),
    }))

    // Pega a análise IA mais recente com sucesso
    const latestAi = responses
      .filter((r) => r.aiAnalysis?.classification)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
      ?.aiAnalysis

    return NextResponse.json({
      sector: { name: sector.name },
      totalResponses: responses.length,
      avgScore: parseFloat(total.toFixed(2)),
      riskLevel,
      byTopic,
      timeline,
      aiRecommendations: latestAi?.classification ?? null,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }
}
