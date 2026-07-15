// Cronograma de treinamentos do Plano de Ação — liga os vídeos do Índice de Vídeos
// às 52 semanas, na ordem de prioridade do DRPS (fator mais grave primeiro).
// Os vídeos da trilha do gestor ele assiste desde já; os da trilha do colaborador são
// LIBERADOS gradualmente (uma leva por fator, na semana em que o fator entra no plano).

import { slotsFor, FACTOR_NAMES } from './video-index'
import type { RiskLevel } from './action-plan-engine'

export type IntervCadence = 'semanal' | 'mensal' | 'bimestral'
const STEP: Record<IntervCadence, number> = { semanal: 1, mensal: 4, bimestral: 8 }
const SEV: Record<RiskLevel, number> = { critico: 0, alto: 1, moderado: 2, baixo: 3 }

export type SchedVideo = { key: string; title: string; author: string }
export type TrainingFactor = {
  factorNum: number
  factor: string
  riskLevel: RiskLevel
  releaseWeek: number            // semana em que os vídeos deste fator são liberados
  gestor: SchedVideo[]           // o gestor/líder assiste
  colaborador: SchedVideo[]      // liberado gradualmente para o time
}

/**
 * Monta o cronograma de treinamentos: fatores em ordem de gravidade (prioridade do DRPS),
 * cada um recebendo uma semana de liberação. O espaçamento segue o ritmo escolhido
 * (semanal/mensal/bimestral), mas é comprimido se necessário para caber nas 52 semanas.
 */
export function buildTrainingSchedule(
  factors: { topicNum: number; factor?: string; riskLevel: RiskLevel }[],
  intervention: IntervCadence = 'mensal',
  horizonWeeks = 52,
): TrainingFactor[] {
  const H = Math.max(2, Math.min(52, Math.round(horizonWeeks)))
  const ordered = [...factors].sort((a, b) => SEV[a.riskLevel] - SEV[b.riskLevel])
  const n = ordered.length
  const chosen = STEP[intervention]
  // garante que o último fator caiba dentro do horizonte (52 sem., ou menos se replanejou no meio)
  const maxStep = n > 1 ? Math.floor((H - 1) / (n - 1)) : chosen
  const step = Math.max(1, Math.min(chosen, maxStep))

  return ordered.map((f, i) => ({
    factorNum: f.topicNum,
    factor: f.factor ?? FACTOR_NAMES[f.topicNum] ?? `Fator ${f.topicNum}`,
    riskLevel: f.riskLevel,
    releaseWeek: Math.min(H, 1 + i * step),
    gestor: slotsFor(f.topicNum, 'gestor').map((s) => ({ key: s.key, title: s.title, author: s.author })),
    colaborador: slotsFor(f.topicNum, 'colaborador').map((s) => ({ key: s.key, title: s.title, author: s.author })),
  }))
}

/** Conjunto de vídeos (chaves) da trilha do colaborador já liberados até a semana informada. */
export function releasedColabRefs(schedule: TrainingFactor[], weeksElapsed: number): Set<string> {
  const set = new Set<string>()
  for (const f of schedule) if (weeksElapsed >= f.releaseWeek) f.colaborador.forEach((v) => set.add(v.key))
  return set
}

/** Quantas semanas se passaram desde o início do plano (0 se ainda não começou). */
export function weeksSince(start: Date | string | null | undefined): number {
  if (!start) return 0
  const t = new Date(start).getTime()
  if (!isFinite(t)) return 0
  return Math.max(0, Math.floor((Date.now() - t) / (7 * 24 * 60 * 60 * 1000)))
}
