export type Answer = {
  questionCode: string
  value: number // 0-4
}

export type QuestionMeta = {
  code: string
  topic: string
  topicNum: number
  reverse: boolean
}

export type TopicScore = {
  topicNum: number
  topic: string
  score: number       // 0.0–4.0
  riskLevel: RiskLevel
}

export type ScoreResult = {
  total: number       // 0.0–4.0
  riskLevel: RiskLevel
  byTopic: TopicScore[]
}

export type RiskLevel = 'baixo' | 'moderado' | 'alto' | 'critico'
export type Probability = 'baixa' | 'media' | 'alta'

// Classificação de Gravidade conforme DRPS NR-1 (score 0–4)
export type Severity = 'baixa' | 'media' | 'alta'

export type MatrixResult = {
  topicNum: number
  topic: string
  gravidade: Severity        // calculada do questionário
  gravScore: number          // score numérico 0–4
  probabilidade: Probability // informada pelo avaliador
  riskFinal: RiskLevel       // cruzamento na matriz NR-1
}

/** Converte score numérico (0–4) para nível de risco */
export function getRiskLevel(score: number): RiskLevel {
  if (score <= 1.0) return 'baixo'
  if (score <= 2.0) return 'moderado'
  if (score <= 3.0) return 'alto'
  return 'critico'
}

/** Converte score (0–4) para classificação de Gravidade do DRPS (Baixa/Média/Alta) */
export function getSeverity(score: number): Severity {
  if (score <= 1.0) return 'baixa'
  if (score <= 2.0) return 'media'
  return 'alta'
}

/**
 * Matriz de Risco NR-1: cruza Gravidade (automática) × Probabilidade (manual).
 *
 *              | Baixa Grav | Média Grav | Alta Grav |
 * Prob Alta    | moderado   | alto       | critico   |
 * Prob Média   | baixo      | moderado   | alto      |
 * Prob Baixa   | baixo      | baixo      | moderado  |
 */
export function calcMatrix(severity: Severity, probability: Probability): RiskLevel {
  const matrix: Record<Probability, Record<Severity, RiskLevel>> = {
    alta:  { baixa: 'moderado', media: 'alto',     alta: 'critico'  },
    media: { baixa: 'baixo',    media: 'moderado', alta: 'alto'     },
    baixa: { baixa: 'baixo',    media: 'baixo',    alta: 'moderado' },
  }
  return matrix[probability][severity]
}

/** Gera a matriz completa para todos os tópicos de um setor */
export function buildRiskMatrix(
  byTopic: TopicScore[],
  assessments: { topicNum: number; probability: Probability }[]
): MatrixResult[] {
  const probMap = new Map(assessments.map((a) => [a.topicNum, a.probability]))

  return byTopic.map((t) => {
    const probability = probMap.get(t.topicNum) ?? 'media'
    const gravidade = getSeverity(t.score)
    return {
      topicNum: t.topicNum,
      topic: t.topic,
      gravidade,
      gravScore: t.score,
      probabilidade: probability,
      riskFinal: calcMatrix(gravidade, probability),
    }
  })
}

/** Cor CSS correspondente ao nível de risco */
export function getRiskColor(level: RiskLevel): string {
  const colors: Record<RiskLevel, string> = {
    baixo: '#16a34a',    // verde
    moderado: '#ca8a04', // amarelo
    alto: '#ea580c',     // laranja
    critico: '#dc2626',  // vermelho
  }
  return colors[level]
}

/**
 * Calcula scores de risco a partir das respostas do questionário.
 * Questões reversas: riskScore = 4 - valor (maior resposta = menor risco).
 * Questões normais: riskScore = valor (maior resposta = maior risco).
 */
export function calcScore(
  answers: Answer[],
  questions: QuestionMeta[]
): ScoreResult {
  const questionMap = new Map(questions.map((q) => [q.code, q]))

  // Agrupa scores por tópico
  const topicMap = new Map<number, { topic: string; scores: number[] }>()

  for (const answer of answers) {
    const meta = questionMap.get(answer.questionCode)
    if (!meta) continue

    const riskScore = meta.reverse ? 4 - answer.value : answer.value

    if (!topicMap.has(meta.topicNum)) {
      topicMap.set(meta.topicNum, { topic: meta.topic, scores: [] })
    }
    topicMap.get(meta.topicNum)!.scores.push(riskScore)
  }

  const byTopic: TopicScore[] = Array.from(topicMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([topicNum, { topic, scores }]) => {
      const score = scores.reduce((sum, s) => sum + s, 0) / scores.length
      return {
        topicNum,
        topic,
        score: parseFloat(score.toFixed(2)),
        riskLevel: getRiskLevel(score),
      }
    })

  const allScores = byTopic.map((t) => t.score)
  const total = allScores.reduce((sum, s) => sum + s, 0) / allScores.length

  return {
    total: parseFloat(total.toFixed(2)),
    riskLevel: getRiskLevel(total),
    byTopic,
  }
}
