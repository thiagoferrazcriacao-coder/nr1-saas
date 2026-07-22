import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { buildPlan, PlanItem, RiskLevel, cadenceLabel, Cadence } from '@/lib/action-plan-engine'
import { computeSectorFactors, FactorRisk } from '@/lib/sector-factors'
import { buildTrainingSchedule, weeksSince, TrainingFactor, IntervCadence } from '@/lib/training-schedule'
import { gestorSignatureHtml } from '@/lib/signature-html'
import { accessEndDate, horizonWeeksUntil } from '@/lib/access-window'

export const dynamic = 'force-dynamic'

const riskColor: Record<RiskLevel, string> = { critico: '#dc2626', alto: '#ea580c', moderado: '#ca8a04', baixo: '#16a34a' }
const riskBg: Record<RiskLevel, string> = { critico: '#fef2f2', alto: '#fff7ed', moderado: '#fefce8', baixo: '#f0fdf4' }
const riskLabel: Record<RiskLevel, string> = { critico: 'Crítico', alto: 'Alto', moderado: 'Médio', baixo: 'Baixo' }
const levelLabel: Record<number, string> = { 1: 'Origem — eliminar/reduzir', 2: 'Recursos às pessoas', 3: 'Acolher consequências' }
const statusColor: Record<string, string> = { pendente: '#64748b', em_andamento: '#2563eb', concluida: '#16a34a' }
const statusBg: Record<string, string> = { pendente: '#f1f5f9', em_andamento: '#eff6ff', concluida: '#f0fdf4' }
const statusLabel: Record<string, string> = { pendente: 'Pendente', em_andamento: 'Em andamento', concluida: 'Concluída' }
const sev: Record<RiskLevel, number> = { critico: 0, alto: 1, moderado: 2, baixo: 3 }

const esc = (s: string) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const when = (i: PlanItem) => (i.dueWeek === 0 ? 'Contínuo' : `Semana ${i.startWeek}–${i.dueWeek}`)

type Comparison = { factor: string; baseline: RiskLevel; current: RiskLevel | null; trend: string }

function buildHtml(o: {
  companyName: string; sectorName: string; cnpj: string | null; city: string | null; state: string | null
  responsible: string | null; gestorName: string | null; gestorSignatureUrl: string | null; items: PlanItem[]; cadence: Cadence | null; comparison: Comparison[]; reavaliada: boolean
  training: TrainingFactor[]; weeksElapsed: number; planStarted: boolean; horizonWeeks: number; accessEnd: Date
}): string {
  const { companyName, sectorName, cnpj, city, state, responsible, gestorName, gestorSignatureUrl, items, cadence, comparison, reavaliada, training, weeksElapsed, planStarted, horizonWeeks, accessEnd } = o
  const date = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  const venc = accessEnd.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

  const done = items.filter((i) => i.status === 'concluida').length
  const progresso = items.length ? Math.round((done / items.length) * 100) : 0

  // agrupa por fator, ordenado por gravidade
  const groups: { factor: string; risk: RiskLevel; items: PlanItem[] }[] = []
  for (const it of [...items].sort((a, b) => sev[a.riskLevel] - sev[b.riskLevel] || a.startWeek - b.startWeek)) {
    let g = groups.find((x) => x.factor === it.factor)
    if (!g) { g = { factor: it.factor, risk: it.riskLevel, items: [] }; groups.push(g) }
    g.items.push(it)
  }

  const factorBlocks = groups.map((g) => {
    const rc = riskColor[g.risk], rb = riskBg[g.risk]
    const rows = g.items.map((it) => {
      const sc = statusColor[it.status], sb = statusBg[it.status]
      const ev = it.evidences?.length
        ? `<div style="margin-top:4px;font-size:9px;color:#16a34a;">📎 ${it.evidences.length} evidência(s): ${it.evidences.map((e) => esc(e.name ?? 'arquivo')).join(', ')}</div>`
        : `<div style="margin-top:4px;font-size:9px;color:#cbd5e1;">📎 sem evidência anexada</div>`
      return `
        <tr style="border-bottom:1px solid #f1f5f9;">
          <td style="padding:8px 10px;font-size:10px;color:#94a3b8;white-space:nowrap;vertical-align:top;">${esc(levelLabel[it.level])}</td>
          <td style="padding:8px 10px;font-size:11px;color:#374151;vertical-align:top;">
            <strong>${esc(it.title)}</strong>
            <div style="font-size:10px;color:#64748b;margin-top:2px;">${esc(it.how)}</div>
            ${ev}
          </td>
          <td style="padding:8px 10px;font-size:10px;color:#475569;vertical-align:top;">${esc(it.who)}</td>
          <td style="padding:8px 10px;font-size:10px;color:#475569;white-space:nowrap;vertical-align:top;">${when(it)}<div style="font-size:9px;color:#94a3b8;">${cadenceLabel(it.cadence)}</div></td>
          <td style="padding:8px 10px;text-align:center;vertical-align:top;">
            <span style="background:${sb};color:${sc};border:1px solid ${sc}40;padding:2px 8px;border-radius:20px;font-size:9px;font-weight:bold;white-space:nowrap;">${statusLabel[it.status]}</span>
          </td>
        </tr>`
    }).join('')
    return `
      <div style="margin-bottom:18px;page-break-inside:avoid;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
          <span style="background:${rb};color:${rc};border:1px solid ${rc}40;padding:2px 9px;border-radius:6px;font-size:10px;font-weight:bold;">${riskLabel[g.risk]}</span>
          <h3 style="font-size:14px;color:#0f172a;font-weight:800;">${esc(g.factor)}</h3>
        </div>
        <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
          <thead><tr style="background:#f8fafc;">
            <th style="padding:7px 10px;text-align:left;font-size:9px;color:#6b7280;">Nível</th>
            <th style="padding:7px 10px;text-align:left;font-size:9px;color:#6b7280;">Ação / medida</th>
            <th style="padding:7px 10px;text-align:left;font-size:9px;color:#6b7280;">Responsável</th>
            <th style="padding:7px 10px;text-align:left;font-size:9px;color:#6b7280;">Prazo</th>
            <th style="padding:7px 10px;text-align:center;font-size:9px;color:#6b7280;">Status</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`
  }).join('')

  // Cronograma de treinamentos (vídeos como ações nas 52 semanas, por prioridade)
  const trainingBlock = training.length ? `
    <div style="margin-top:8px;margin-bottom:24px;page-break-inside:avoid;">
      <h2 style="font-size:15px;color:#0E2A47;font-weight:800;margin-bottom:4px;">Cronograma de Treinamentos (52 semanas)</h2>
      <p style="font-size:10.5px;color:#64748b;line-height:1.5;margin-bottom:8px;">
        As vídeo-aulas da NR-1 entram como ações do plano, na ordem de prioridade do diagnóstico. O gestor/líder assiste à
        trilha de gestão; para os colaboradores, cada leva é <strong>liberada automaticamente</strong> na semana indicada${planStarted ? ` (plano na semana ${weeksElapsed} de 52)` : ''}.
      </p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;">
        <thead><tr style="background:#f8fafc;">
          <th style="padding:7px 10px;text-align:center;font-size:9px;color:#6b7280;white-space:nowrap;">Semana</th>
          <th style="padding:7px 10px;text-align:left;font-size:9px;color:#6b7280;">Fator</th>
          <th style="padding:7px 10px;text-align:center;font-size:9px;color:#6b7280;">Risco</th>
          <th style="padding:7px 10px;text-align:left;font-size:9px;color:#6b7280;">Vídeos do gestor/líder</th>
          <th style="padding:7px 10px;text-align:left;font-size:9px;color:#6b7280;">Liberado ao time</th>
        </tr></thead>
        <tbody>
          ${training.map((f) => {
            const liberado = planStarted && weeksElapsed >= f.releaseWeek
            const status = liberado ? '<span style="color:#16a34a;font-weight:bold;">✓ liberado</span>' : 'agendado'
            return `<tr style="border-bottom:1px solid #f1f5f9;vertical-align:top;">
              <td style="padding:7px 10px;text-align:center;font-size:12px;font-weight:800;color:#0E2A47;">${f.releaseWeek}</td>
              <td style="padding:7px 10px;font-size:10.5px;color:#374151;font-weight:600;">${esc(f.factor)}</td>
              <td style="padding:7px 10px;text-align:center;font-size:10px;font-weight:bold;color:${riskColor[f.riskLevel]};">${riskLabel[f.riskLevel]}</td>
              <td style="padding:7px 10px;font-size:9.5px;color:#475569;">${f.gestor.map((v) => `<div>${esc(v.key)} · ${esc(v.title)}</div>`).join('')}</td>
              <td style="padding:7px 10px;font-size:9.5px;color:#475569;">${f.colaborador.map((v) => `<div>${esc(v.key)} · ${esc(v.title)}</div>`).join('')}<div style="font-size:9px;color:#94a3b8;margin-top:2px;">${status}</div></td>
            </tr>`
          }).join('')}
        </tbody>
      </table>
    </div>` : ''

  const trendCfg: Record<string, { t: string; c: string }> = {
    melhorou: { t: '↓ Melhorou', c: '#16a34a' }, piorou: { t: '↑ Piorou', c: '#dc2626' },
    estavel: { t: '= Estável', c: '#64748b' }, sem_dados: { t: 'Aguardando', c: '#94a3b8' },
  }
  const reavalBlock = reavaliada && comparison.length ? `
    <div style="margin-top:8px;margin-bottom:24px;page-break-inside:avoid;">
      <h2 style="font-size:15px;color:#0E2A47;font-weight:800;margin-bottom:8px;">Reavaliação — evolução do risco</h2>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;">
        <thead><tr style="background:#f8fafc;">
          <th style="padding:7px 10px;text-align:left;font-size:10px;color:#6b7280;">Fator</th>
          <th style="padding:7px 10px;text-align:center;font-size:10px;color:#6b7280;">Início</th>
          <th style="padding:7px 10px;text-align:center;font-size:10px;color:#6b7280;">Agora</th>
          <th style="padding:7px 10px;text-align:center;font-size:10px;color:#6b7280;">Evolução</th>
        </tr></thead>
        <tbody>
          ${comparison.filter((c) => c.baseline !== 'baixo').map((c) => {
            const tc = trendCfg[c.trend] ?? trendCfg.sem_dados
            return `<tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:7px 10px;font-size:11px;color:#374151;">${esc(c.factor)}</td>
              <td style="padding:7px 10px;text-align:center;font-size:11px;font-weight:bold;color:${riskColor[c.baseline]};">${riskLabel[c.baseline]}</td>
              <td style="padding:7px 10px;text-align:center;font-size:11px;font-weight:bold;color:${c.current ? riskColor[c.current] : '#cbd5e1'};">${c.current ? riskLabel[c.current] : '—'}</td>
              <td style="padding:7px 10px;text-align:center;font-size:11px;font-weight:bold;color:${tc.c};">${tc.t}</td>
            </tr>`
          }).join('')}
        </tbody>
      </table>
    </div>` : ''

  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"/><style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:Arial,Helvetica,sans-serif;color:#1f2937;background:white;font-size:13px;}
  @media print{.no-print{display:none!important;}body{padding:18px;}}
</style></head>
<body style="padding:40px 48px;max-width:920px;margin:0 auto;">

  <div class="no-print" style="text-align:right;margin-bottom:20px;">
    <button onclick="window.print()" style="background:#0E2A47;color:white;border:none;padding:10px 24px;border-radius:8px;cursor:pointer;font-size:14px;font-weight:bold;">🖨️ Imprimir / Salvar PDF</button>
  </div>

  <div style="border-bottom:3px solid #17C3C9;padding-bottom:18px;margin-bottom:22px;">
    <p style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Plano de Ação Vivo — Riscos Psicossociais (NR-1 · ${horizonWeeks} semanas)</p>
    <h1 style="font-size:22px;color:#0E2A47;font-weight:900;">${esc(companyName)}</h1>
    <h2 style="font-size:15px;color:#374151;font-weight:600;margin-top:2px;">Setor: ${esc(sectorName)}</h2>
    <div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:16px;font-size:11px;color:#64748b;">
      ${cnpj ? `<span>CNPJ: <strong>${esc(cnpj)}</strong></span>` : ''}
      ${(city || state) ? `<span>📍 ${esc([city, state].filter(Boolean).join('/'))}</span>` : ''}
      ${responsible ? `<span>Responsável: <strong>${esc(responsible)}</strong></span>` : ''}
      ${cadence ? `<span>Ritmo: <strong>Intervenções ${cadenceLabel(cadence).toLowerCase()}</strong></span>` : ''}
      <span>Emitido em ${date}</span>
      <span>Vigência do plano: <strong>${horizonWeeks} semanas</strong> (até ${venc})</span>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:12px;margin-bottom:22px;">
    <div style="background:#f8fafc;border-radius:10px;padding:14px;"><p style="font-size:10px;color:#64748b;font-weight:600;">Ações no plano</p><p style="font-size:28px;font-weight:900;color:#1f2937;margin-top:2px;">${items.length}</p></div>
    <div style="background:#f0fdf4;border-radius:10px;padding:14px;"><p style="font-size:10px;color:#15803d;font-weight:600;">Concluídas</p><p style="font-size:28px;font-weight:900;color:#16a34a;margin-top:2px;">${done}</p></div>
    <div style="background:#eff6ff;border-radius:10px;padding:14px;"><p style="font-size:10px;color:#1d4ed8;font-weight:600;">Execução</p><p style="font-size:28px;font-weight:900;color:#2563eb;margin-top:2px;">${progresso}%</p></div>
    <div style="background:#f0fbfc;border-radius:10px;padding:14px;"><p style="font-size:10px;color:#109CA1;font-weight:600;">Fatores tratados</p><p style="font-size:28px;font-weight:900;color:#0E2A47;margin-top:2px;">${groups.length}</p></div>
  </div>

  <p style="font-size:11.5px;color:#374151;line-height:1.6;margin-bottom:20px;">
    Este Plano de Ação Vivo define, para cada fator de risco psicossocial identificado, medidas de controle organizadas pela
    hierarquia de controle (origem → pessoas → acolhimento, conforme ISO 45003), com responsável, prazo e cadência de
    acompanhamento ao longo de ${horizonWeeks} semanas — encerrando junto com a vigência do acesso (${venc}). As evidências
    anexadas e a reavaliação periódica comprovam a gestão contínua exigida pela NR-1.
  </p>

  ${factorBlocks || '<p style="font-size:12px;color:#64748b;">Nenhuma ação no plano. Os fatores avaliados estão sob controle — manter monitoramento.</p>'}

  ${trainingBlock}

  ${reavalBlock}

  <div style="margin-top:32px;padding-top:18px;border-top:2px solid #e2e8f0;display:flex;justify-content:flex-start;gap:40px;flex-wrap:wrap;page-break-inside:avoid;">
    ${gestorSignatureHtml({ gestorName, signatureUrl: gestorSignatureUrl, companyName, date })}
  </div>

  <div style="margin-top:14px;background:#fefce8;border:1px solid #fef08a;border-radius:8px;padding:10px 14px;">
    <p style="font-size:10px;color:#92400e;line-height:1.5;"><strong>Observação:</strong> a guarda deste documento e das evidências deve ser mantida por no mínimo 20 anos, conforme a NR-1.</p>
  </div>

  <div style="margin-top:16px;padding-top:12px;border-top:1px solid #e2e8f0;font-size:10px;color:#94a3b8;text-align:center;">
    <p>Plano de Ação Vivo gerado pelo sistema Zelo · documento integrante do PGR.</p>
    <p style="margin-top:4px;font-weight:600;color:#64748b;">Zelo · ${esc(companyName)} · ${esc(sectorName)} · ${date}</p>
  </div>
</body></html>`
}

export async function GET(req: NextRequest, { params }: { params: { sectorId: string } }) {
  try {
    const { companyId } = requireAuth(req)

    const sector = await prisma.sector.findFirst({
      where: { id: params.sectorId, companyId },
      include: { company: { select: { name: true, cnpj: true, city: true, state: true, responsible: true, gestorName: true, gestorSignatureUrl: true, createdAt: true } } },
    })
    if (!sector) return NextResponse.json({ error: 'Setor não encontrado.' }, { status: 404 })

    const accessEnd = accessEndDate(sector.company.createdAt)

    const plan = await prisma.actionPlan.findUnique({ where: { sectorId: params.sectorId } })

    let items: PlanItem[] = []
    let cadence: Cadence | null = null
    let comparison: Comparison[] = []
    let reavaliada = false
    let training: TrainingFactor[] = []
    let weeksElapsed = 0
    let planStarted = false
    let horizonWeeks = 52

    const arr = (plan?.items as unknown[]) ?? []
    const f0 = arr[0] as { topicNum?: number; level?: number } | undefined
    const isNewShape = arr.length > 0 && f0?.topicNum != null && f0?.level != null

    if (plan && isNewShape) {
      items = plan.items as unknown as PlanItem[]
      cadence = (plan.interventionCadence as Cadence) ?? null
      horizonWeeks = plan.horizonWeeks ?? 52
      const baseline: FactorRisk[] = Array.isArray(plan.baseline) ? (plan.baseline as unknown as FactorRisk[]) : []
      training = baseline.length ? buildTrainingSchedule(baseline.map((b) => ({ topicNum: b.topicNum, factor: b.factor, riskLevel: b.riskLevel })), (cadence as IntervCadence) ?? 'mensal', horizonWeeks) : []
      weeksElapsed = weeksSince(plan.createdAt)
      planStarted = true
      const reEval = await computeSectorFactors(params.sectorId, new Date(plan.createdAt))
      reavaliada = reEval.length > 0
      if (reavaliada && baseline.length) {
        const map = new Map(reEval.map((f) => [f.topicNum, f]))
        const order: Record<RiskLevel, number> = { baixo: 0, moderado: 1, alto: 2, critico: 3 }
        comparison = baseline.map((b) => {
          const cur = map.get(b.topicNum)
          let trend = 'sem_dados'
          if (cur) trend = order[cur.riskLevel] < order[b.riskLevel] ? 'melhorou' : order[cur.riskLevel] > order[b.riskLevel] ? 'piorou' : 'estavel'
          return { factor: b.factor, baseline: b.riskLevel, current: cur?.riskLevel ?? null, trend }
        })
      }
    } else {
      // Sem plano salvo: gera uma prévia no ritmo mensal, no horizonte até o vencimento
      horizonWeeks = horizonWeeksUntil(accessEnd)
      const factors = await computeSectorFactors(params.sectorId)
      items = buildPlan(factors.map((f) => ({ topicNum: f.topicNum, riskLevel: f.riskLevel })), 'mensal', horizonWeeks)
      cadence = 'mensal'
      training = buildTrainingSchedule(factors.map((f) => ({ topicNum: f.topicNum, factor: f.factor, riskLevel: f.riskLevel })), 'mensal', horizonWeeks)
      weeksElapsed = 0
      planStarted = false
    }

    const html = buildHtml({
      companyName: sector.company.name, sectorName: sector.name,
      cnpj: sector.company.cnpj ?? null, city: sector.company.city ?? null, state: sector.company.state ?? null,
      responsible: sector.company.responsible ?? null,
      gestorName: sector.company.gestorName ?? null, gestorSignatureUrl: sector.company.gestorSignatureUrl ?? null,
      items, cadence, comparison, reavaliada,
      training, weeksElapsed, planStarted, horizonWeeks, accessEnd,
    })

    const date = new Date().toISOString().split('T')[0]
    const filename = `Plano-de-Acao-${sector.name.replace(/\s+/g, '-')}-${date}.html`
    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Content-Disposition': `attachment; filename="${filename}"` },
    })
  } catch (err) {
    console.error('[ACTION-PLAN PDF]', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }
}
