import { prisma } from './prisma'
import { calcScore } from './scoring'
import { RiskLevel } from './action-plan-engine'

export type FactorRisk = { topicNum: number; factor: string; riskLevel: RiskLevel; score: number }

/**
 * Calcula o risco por fator (tópico) de um setor a partir das respostas.
 * `since` (opcional) limita às respostas criadas DEPOIS dessa data — usado na reavaliação.
 */
export async function computeSectorFactors(sectorId: string, since?: Date): Promise<FactorRisk[]> {
  const responses = await prisma.response.findMany({
    where: since ? { sectorId, createdAt: { gt: since } } : { sectorId },
    select: { answers: true },
  })
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
  return byTopic.map((t) => ({ topicNum: t.topicNum, factor: t.topic, riskLevel: t.riskLevel as RiskLevel, score: t.score }))
}

/** Quantas respostas o setor teve depois de uma data (para saber se houve reavaliação) */
export async function countResponsesSince(sectorId: string, since: Date): Promise<number> {
  return prisma.response.count({ where: { sectorId, createdAt: { gt: since } } })
}
