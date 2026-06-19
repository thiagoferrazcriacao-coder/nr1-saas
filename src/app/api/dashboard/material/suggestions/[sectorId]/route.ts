import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { calcScore, buildRiskMatrix, type Probability, type RiskLevel } from '@/lib/scoring'
import { ensureLessons, FACTOR_TO_PROGRAM } from '@/lib/lessons-seed'

export const dynamic = 'force-dynamic'

const riskOrder: Record<RiskLevel, number> = { critico: 3, alto: 2, moderado: 1, baixo: 0 }

// GET — sugere os vídeos que este setor precisa assistir, a partir do resultado da avaliação
export async function GET(
  req: NextRequest,
  { params }: { params: { sectorId: string } }
) {
  try {
    const { companyId } = requireAuth(req)

    const sector = await prisma.sector.findFirst({
      where: { id: params.sectorId, companyId },
      include: { company: { select: { slug: true } } },
    })
    if (!sector) return NextResponse.json({ error: 'Setor não encontrado.' }, { status: 404 })

    const [responses, assessments] = await Promise.all([
      prisma.response.findMany({ where: { sectorId: params.sectorId }, select: { answers: true } }),
      prisma.topicAssessment.findMany({ where: { sectorId: params.sectorId } }),
    ])

    if (responses.length === 0) {
      return NextResponse.json({ slug: sector.company.slug, recommended: [] })
    }

    const questions = await prisma.question.findMany({
      select: { code: true, topic: true, topicNum: true, reverse: true },
    })

    // Média por questão → score por tópico (gravidade)
    const byCode = new Map<string, number[]>()
    for (const r of responses) {
      for (const a of r.answers as { questionCode: string; value: number }[]) {
        if (!byCode.has(a.questionCode)) byCode.set(a.questionCode, [])
        byCode.get(a.questionCode)!.push(a.value)
      }
    }
    const avgAnswers = Array.from(byCode.entries()).map(([code, vals]) => ({
      questionCode: code,
      value: vals.reduce((s, v) => s + v, 0) / vals.length,
    }))

    const { byTopic } = calcScore(avgAnswers, questions)

    const fullAssessments = byTopic.map((t) => {
      const found = assessments.find((a) => a.topicNum === t.topicNum)
      return { topicNum: t.topicNum, probability: (found?.probability as Probability) ?? 'media' }
    })

    const matrix = buildRiskMatrix(byTopic, fullAssessments)

    // Fatores que merecem treinamento (acima de "Baixo"), agrupados por programa de vídeo
    type Group = { programNum: number; priority: RiskLevel; factors: { topic: string; risk: RiskLevel }[] }
    const groups = new Map<number, Group>()
    for (const m of matrix) {
      if (m.riskFinal === 'baixo') continue
      const programNum = FACTOR_TO_PROGRAM[m.topicNum]
      if (!programNum) continue
      const g = groups.get(programNum) ?? { programNum, priority: 'baixo', factors: [] }
      g.factors.push({ topic: m.topic, risk: m.riskFinal })
      if (riskOrder[m.riskFinal] > riskOrder[g.priority]) g.priority = m.riskFinal
      groups.set(programNum, g)
    }

    if (groups.size === 0) {
      return NextResponse.json({ slug: sector.company.slug, recommended: [] })
    }

    await ensureLessons()
    const lessons = await prisma.lesson.findMany({
      where:   { active: true, programNum: { in: Array.from(groups.keys()) } },
      orderBy: { order: 'asc' },
      select:  { id: true, programNum: true, program: true, title: true },
    })

    const recommended = Array.from(groups.values())
      .sort((a, b) => riskOrder[b.priority] - riskOrder[a.priority])
      .map((g) => {
        const ls = lessons.filter((l) => l.programNum === g.programNum)
        return {
          programNum: g.programNum,
          program:    ls[0]?.program ?? `Programa ${g.programNum}`,
          priority:   g.priority,
          factors:    g.factors,
          lessons:    ls.map((l) => ({ id: l.id, title: l.title })),
        }
      })

    return NextResponse.json({ slug: sector.company.slug, recommended })
  } catch {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }
}
