// Motor do Plano de Ação por 12 MESES / 13 FATORES.
// Implementa a SPEC (docs/SPEC-plano-acao-12-meses.md):
//  - Régua de ordenação em 4 critérios (item 3)
//  - Regra do mês duplo (item 4)
//  - Regra do crítico (item 5) — mês 1 + medida extra do assédio
//  - Ritual mensal + ação simples curada do banco (itens 6 e "ação simples")
//  - Mês 12 = último fator do ranking + reaplicação do DRPS (item 10)

import { ACTION_LIBRARY } from './action-library'
import { FACTOR_NAMES, slotsFor } from './video-index'

export type RiskLevel = 'baixo' | 'moderado' | 'alto' | 'critico'
export type FactorInput = { topicNum: number; riskLevel: RiskLevel; score: number }

// ── Critério 1: nível do DRPS ────────────────────────────────────────────────
const LEVEL_RANK: Record<RiskLevel, number> = { critico: 0, alto: 1, moderado: 2, baixo: 3 }
// ── Critério 2: peso jurídico (passam à frente, nesta ordem) ─────────────────
// Assédio(1) → Justiça organizacional(7) → Eventos traumáticos(8) → Sobrecarga(10)
const JUR_RANK: Record<number, number> = { 1: 0, 7: 1, 8: 2, 10: 3 }

// "Alto ou crítico" — usado nas regras de mês duplo e da medida extra
const isHigh = (r: RiskLevel) => r === 'alto' || r === 'critico'
const isLowMid = (r: RiskLevel) => r === 'baixo' || r === 'moderado'

// Ação simples do fator = ação de ORIGEM (nível 1) do banco de ações.
export type SimpleAction = { title: string; how: string; who: string; evidence: string; howMuch?: string }
export function simpleActionFor(topicNum: number): SimpleAction | null {
  const f = ACTION_LIBRARY.find((l) => l.topicNum === topicNum)
  if (!f) return null
  const a = f.actions.find((x) => x.level === 1) ?? f.actions[0]
  return a ? { title: a.title, how: a.how, who: a.who, evidence: a.evidence, howMuch: a.howMuch } : null
}

/**
 * Régua de ordenação — 4 critérios em cascata, resultado sempre único:
 * 1) nível do DRPS (crítico→baixo); 2) peso jurídico; 3) gravidade numérica (maior→menor);
 * 4) ordem numérica fixa do fator.
 */
export function orderFactors(factors: FactorInput[]): FactorInput[] {
  return [...factors].sort(
    (a, b) =>
      LEVEL_RANK[a.riskLevel] - LEVEL_RANK[b.riskLevel] ||
      (JUR_RANK[a.topicNum] ?? 4) - (JUR_RANK[b.topicNum] ?? 4) ||
      b.score - a.score ||
      a.topicNum - b.topicNum,
  )
}

// Meses do calendário em português
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
function calendarLabel(start: Date, offsetMonths: number): string {
  const d = new Date(start.getFullYear(), start.getMonth() + offsetMonths, 1)
  return `${MESES[d.getMonth()]}/${d.getFullYear()}`
}
// Rótulo completo do mês: "Mês 1 (Julho/2026)" — index começa em 0
export function monthLabelFor(start: Date, index: number): string {
  return `Mês ${index + 1} (${calendarLabel(start, index)})`
}
// Chave estável de um mês pelos fatores que ele contém (ex.: "13" ou "11-12") — sobrevive à reordenação
export function monthKey(topicNums: number[]): string {
  return [...topicNums].sort((a, b) => a - b).join('-')
}

export type MonthFactor = {
  topicNum: number
  factor: string
  riskLevel: RiskLevel
  score: number
  simpleAction: SimpleAction | null
  extraMeasure?: string // medida obrigatória (ex.: canal de denúncias do assédio)
  gestorVideos: { key: string; title: string; author: string }[]
  colabVideos: { key: string; title: string; author: string }[]
}
export type PlanMonth = {
  monthNum: number      // 1..12
  key: string           // chave estável pelos fatores (ex.: "13" ou "11-12")
  label: string         // "Mês 1 (Julho/2026)"
  isDouble: boolean     // mês com 2 fatores
  reapplyDrps: boolean  // mês 12 sugere reaplicar o DRPS
  factors: MonthFactor[]
}

// Descobre qual PAR de fatores divide um mês (regra do mês duplo, item 4).
function choosePair(byNum: Map<number, FactorInput>, ranking: FactorInput[]): [number, number] {
  const risk = (n: number) => byNum.get(n)?.riskLevel ?? 'baixo'
  // Padrão: Difícil comunicação (12) + Maus relacionamentos (11), se nenhum for alto/crítico
  if (byNum.has(11) && byNum.has(12) && isLowMid(risk(11)) && isLowMid(risk(12))) return [12, 11]
  // Reserva 1: Subcarga (9) + Sobrecarga (10) — só se AMBOS baixo/médio
  if (byNum.has(9) && byNum.has(10) && isLowMid(risk(9)) && isLowMid(risk(10))) return [9, 10]
  // Reserva 2: Má gestão de mudanças (3) + Baixa clareza de papel (4) — mesma condição
  if (byNum.has(3) && byNum.has(4) && isLowMid(risk(3)) && isLowMid(risk(4))) return [3, 4]
  // Caso extremo: junta os dois últimos fatores do ranking
  const n = ranking.length
  return [ranking[n - 2].topicNum, ranking[n - 1].topicNum]
}

function toMonthFactor(f: FactorInput): MonthFactor {
  const extra =
    f.topicNum === 1 && isHigh(f.riskLevel)
      ? 'Ativar o canal de denúncias com comunicação registrada à equipe (medida obrigatória por assédio em risco alto/crítico).'
      : undefined
  return {
    topicNum: f.topicNum,
    factor: FACTOR_NAMES[f.topicNum] ?? `Fator ${f.topicNum}`,
    riskLevel: f.riskLevel,
    score: f.score,
    simpleAction: simpleActionFor(f.topicNum),
    extraMeasure: extra,
    gestorVideos: slotsFor(f.topicNum, 'gestor').map((s) => ({ key: s.key, title: s.title, author: s.author })),
    colabVideos: slotsFor(f.topicNum, 'colaborador').map((s) => ({ key: s.key, title: s.title, author: s.author })),
  }
}

/**
 * Monta o plano de 12 meses a partir dos 13 fatores avaliados.
 * @param factors os 13 fatores com nível e gravidade
 * @param startDate início do plano (para rotular os meses do calendário)
 */
export function buildMonthPlan(factors: FactorInput[], startDate: Date, order?: string[]): PlanMonth[] {
  if (factors.length === 0) return []
  const ranking = orderFactors(factors)
  const byNum = new Map(factors.map((f) => [f.topicNum, f]))

  // Só há mês duplo quando temos mais fatores do que meses (13 > 12).
  const pair = ranking.length > 12 ? choosePair(byNum, ranking) : null
  const pairSet = new Set(pair ?? [])

  // Percorre o ranking; ao chegar num membro do par, agrupa os dois no mesmo mês.
  const placed = new Set<number>()
  const monthsFactors: FactorInput[][] = []
  for (const f of ranking) {
    if (placed.has(f.topicNum)) continue
    if (pair && pairSet.has(f.topicNum)) {
      const partner = byNum.get(pair[0] === f.topicNum ? pair[1] : pair[0])!
      monthsFactors.push([f, partner])
      placed.add(f.topicNum)
      placed.add(partner.topicNum)
    } else {
      monthsFactors.push([f])
      placed.add(f.topicNum)
    }
  }

  let built = monthsFactors.map((fs) => ({
    key: monthKey(fs.map((f) => f.topicNum)),
    isDouble: fs.length > 1,
    factors: fs.map(toMonthFactor),
  }))

  // Ordem manual (arrastar): reordena os grupos conforme `order` (lista de chaves), mantendo
  // no fim qualquer grupo que não esteja na lista.
  if (order && order.length) {
    const byKey = new Map(built.map((b) => [b.key, b]))
    const picked: typeof built = []
    for (const k of order) { const b = byKey.get(k); if (b) { picked.push(b); byKey.delete(k) } }
    built = [...picked, ...byKey.values()]
  }

  const total = built.length
  return built.map((b, i) => ({
    monthNum: i + 1,
    key: b.key,
    label: monthLabelFor(startDate, i),
    isDouble: b.isDouble,
    reapplyDrps: i + 1 === total, // último mês sugere reaplicar o DRPS
    factors: b.factors,
  }))
}
