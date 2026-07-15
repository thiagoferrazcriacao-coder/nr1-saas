import { ACTION_LIBRARY, ControlLevel } from './action-library'

export type RiskLevel = 'baixo' | 'moderado' | 'alto' | 'critico'
export type Cadence = 'semanal' | 'quinzenal' | 'mensal' | 'bimestral' | 'trimestral' | 'continuo'
export type ItemStatus = 'pendente' | 'em_andamento' | 'concluida'

// Ritmo de intervenção escolhido pela empresa antes de montar o plano
export type InterventionCadence = 'semanal' | 'mensal' | 'bimestral'
// Intervalo (em semanas) entre uma ação e a seguinte, conforme o ritmo escolhido
const INTERVAL_WEEKS: Record<InterventionCadence, number> = { semanal: 1, mensal: 4, bimestral: 8 }

export type Evidence = { url: string; name?: string; note?: string; at: string }

export type PlanItem = {
  id: string
  topicNum: number
  factor: string
  riskLevel: RiskLevel
  level: ControlLevel
  title: string
  how: string
  who: string          // responsável (editável pelo gestor)
  startWeek: number
  dueWeek: number      // 0 = contínuo
  cadence: Cadence
  howMuch?: string
  evidenceHint: string // exemplo do que anexar
  status: ItemStatus
  evidences: Evidence[]
}

export function cadenceLabel(c: Cadence): string {
  const map: Record<Cadence, string> = {
    semanal: 'Semanal', quinzenal: 'Quinzenal', mensal: 'Mensal', bimestral: 'Bimestral', trimestral: 'Trimestral', continuo: 'Contínuo',
  }
  return map[c]
}

export function riskLabel(r: RiskLevel): string {
  const map: Record<RiskLevel, string> = { critico: 'Crítico', alto: 'Alto', moderado: 'Médio', baixo: 'Baixo' }
  return map[r]
}

/**
 * Monta o Plano de Ação Vivo (52 semanas) a partir do risco de cada fator do setor
 * e do RITMO DE INTERVENÇÃO escolhido pela empresa (semanal/mensal/bimestral).
 * - Médio/Alto/Crítico: puxa todas as ações da biblioteca (níveis 1, 2 e 3).
 * - Baixo: gera um item único de monitoramento/confirmação.
 * As ações são espaçadas conforme o ritmo escolhido (1, 4 ou 8 semanas entre cada uma).
 */
export function buildPlan(
  factors: { topicNum: number; riskLevel: RiskLevel }[],
  intervention: InterventionCadence = 'mensal',
  horizonWeeks = 52,
): PlanItem[] {
  const items: PlanItem[] = []
  const H = Math.max(2, Math.min(52, Math.round(horizonWeeks)))
  // ritmo escolhido, comprimido se o horizonte for menor que um ano (replanejamento no meio do acesso)
  const step = Math.max(1, Math.min(INTERVAL_WEEKS[intervention], Math.floor(H / 4) || 1))

  for (const f of factors) {
    const lib = ACTION_LIBRARY.find((l) => l.topicNum === f.topicNum)
    if (!lib) continue

    if (f.riskLevel === 'baixo') {
      items.push({
        id: `${f.topicNum}-mon`,
        topicNum: f.topicNum,
        factor: lib.name,
        riskLevel: 'baixo',
        level: 1,
        title: `Monitorar e confirmar — ${lib.name}`,
        how: 'Manter as boas práticas atuais e reavaliar o fator no próximo ciclo para confirmar que o risco segue baixo.',
        who: 'Gestor + RH',
        startWeek: 1,
        dueWeek: H,
        cadence: intervention,
        evidenceHint: 'Registro de reavaliação do fator.',
        status: 'pendente',
        evidences: [],
      })
      continue
    }

    // Espaça as ações do fator no ritmo escolhido, dentro do horizonte
    let slot = 0
    for (const a of lib.actions) {
      const continuo = a.dueWeek === 0
      const startWeek = continuo ? 1 : Math.min(H, 1 + slot * step)
      const dueWeek = continuo ? 0 : Math.min(H, startWeek + Math.max(step, 2))
      if (!continuo) slot++
      items.push({
        id: `${f.topicNum}-${a.key}`,
        topicNum: f.topicNum,
        factor: lib.name,
        riskLevel: f.riskLevel,
        level: a.level,
        title: a.title,
        how: a.how,
        who: a.who,
        startWeek,
        dueWeek,
        cadence: continuo ? 'continuo' : intervention,
        howMuch: a.howMuch,
        evidenceHint: a.evidence,
        status: 'pendente',
        evidences: [],
      })
    }
  }

  // Prioriza por gravidade e depois por semana de início
  const sev: Record<RiskLevel, number> = { critico: 0, alto: 1, moderado: 2, baixo: 3 }
  items.sort((a, b) => sev[a.riskLevel] - sev[b.riskLevel] || a.startWeek - b.startWeek)
  return items
}

/** Percentual de conclusão do plano (itens concluídos / total) */
export function planProgress(items: PlanItem[]): number {
  if (!items.length) return 0
  const done = items.filter((i) => i.status === 'concluida').length
  return Math.round((done / items.length) * 100)
}
