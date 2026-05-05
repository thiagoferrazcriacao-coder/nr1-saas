export type RiskLevel = 'baixo' | 'moderado' | 'alto' | 'critico'
export type ConformityLevel = 'conforme' | 'atencao' | 'nao_conforme'
export type InterventionPriority = 'baixa' | 'media' | 'alta' | 'urgente'

export type QuestionPublic = {
  code: string
  topic: string
  topicNum: number
  text: string
  hint: string | null
  order: number
}

export type AnswerInput = {
  questionCode: string
  value: number // 0-4
}

export type TopicScore = {
  topicNum: number
  topic: string
  score: number
  riskLevel: RiskLevel
}

export type AiClassification = {
  diagnostico: string
  topicos_criticos: string[]
  acoes_imediatas: string[]
  acoes_preventivas: string[]
  adequacao_nr1: {
    nivel_conformidade: ConformityLevel
    justificativa: string
  }
  prioridade_intervencao: InterventionPriority
}

export type SectorSummary = {
  id: string
  name: string
  linkToken: string
  shareUrl: string
  totalResponses: number
  avgRiskScore: number | null
  riskLevel: RiskLevel | null
}

export type SectorReport = {
  sector: { name: string }
  totalResponses: number
  avgScore: number
  riskLevel: RiskLevel
  byTopic: TopicScore[]
  timeline: { date: string; avgScore: number }[]
  aiRecommendations: AiClassification | null
}
