import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { PlanItem, RiskLevel, cadenceLabel, Cadence } from '@/lib/action-plan-engine'
import { FactorRisk } from '@/lib/sector-factors'

export const dynamic = 'force-dynamic'

const riskColor: Record<RiskLevel, string> = { critico: '#dc2626', alto: '#ea580c', moderado: '#ca8a04', baixo: '#16a34a' }
const riskBg: Record<RiskLevel, string> = { critico: '#fef2f2', alto: '#fff7ed', moderado: '#fefce8', baixo: '#f0fdf4' }
const riskLabel: Record<RiskLevel, string> = { critico: 'Crítico', alto: 'Alto', moderado: 'Médio', baixo: 'Baixo' }
const levelLabel: Record<number, string> = { 1: 'Origem — eliminar/reduzir', 2: 'Recursos às pessoas', 3: 'Acolher consequências' }
const statusLabel: Record<string, string> = { pendente: 'Pendente', em_andamento: 'Em andamento', concluida: 'Concluída' }
const statusColor: Record<string, string> = { pendente: '#64748b', em_andamento: '#2563eb', concluida: '#16a34a' }
const sev: Record<RiskLevel, number> = { critico: 0, alto: 1, moderado: 2, baixo: 3 }
const esc = (s: string) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const fmtDate = (d: Date) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

// GET — documento de um ciclo ARQUIVADO (plano executado + evidências + evolução do risco)
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { companyId } = requireAuth(req)

    const arch = await prisma.actionPlanArchive.findFirst({ where: { id: params.id, companyId } })
    if (!arch) return NextResponse.json({ error: 'Ciclo não encontrado.' }, { status: 404 })
    const company = await prisma.company.findUnique({ where: { id: companyId }, select: { name: true } })

    const items = (Array.isArray(arch.items) ? arch.items : []) as unknown as PlanItem[]
    const baseline = (Array.isArray(arch.baseline) ? arch.baseline : []) as unknown as FactorRisk[]
    const final = (Array.isArray(arch.finalSnapshot) ? arch.finalSnapshot : []) as unknown as FactorRisk[]
    const finalMap = new Map(final.map((f) => [f.topicNum, f]))
    const done = items.filter((i) => i.status === 'concluida').length

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
        const sc = statusColor[it.status], evs = it.evidences?.length
          ? `<div style="margin-top:4px;font-size:9px;color:#16a34a;">📎 ${it.evidences.length} evidência(s): ${it.evidences.map((e) => esc(e.name ?? 'arquivo')).join(', ')}</div>`
          : `<div style="margin-top:4px;font-size:9px;color:#cbd5e1;">📎 sem evidência anexada</div>`
        return `<tr style="border-bottom:1px solid #f1f5f9;">
          <td style="padding:8px 10px;font-size:10px;color:#94a3b8;vertical-align:top;white-space:nowrap;">${esc(levelLabel[it.level])}</td>
          <td style="padding:8px 10px;font-size:11px;color:#374151;vertical-align:top;"><strong>${esc(it.title)}</strong><div style="font-size:10px;color:#64748b;margin-top:2px;">${esc(it.how)}</div>${evs}</td>
          <td style="padding:8px 10px;font-size:10px;color:#475569;vertical-align:top;">${esc(it.who)}</td>
          <td style="padding:8px 10px;text-align:center;vertical-align:top;"><span style="color:${sc};font-size:9px;font-weight:bold;white-space:nowrap;">${statusLabel[it.status]}</span></td>
        </tr>`
      }).join('')
      return `<div style="margin-bottom:18px;page-break-inside:avoid;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
          <span style="background:${rb};color:${rc};border:1px solid ${rc}40;padding:2px 9px;border-radius:6px;font-size:10px;font-weight:bold;">${riskLabel[g.risk]}</span>
          <h3 style="font-size:14px;color:#0f172a;font-weight:800;">${esc(g.factor)}</h3>
        </div>
        <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;">
          <thead><tr style="background:#f8fafc;">
            <th style="padding:7px 10px;text-align:left;font-size:9px;color:#6b7280;">Nível</th>
            <th style="padding:7px 10px;text-align:left;font-size:9px;color:#6b7280;">Ação / medida</th>
            <th style="padding:7px 10px;text-align:left;font-size:9px;color:#6b7280;">Responsável</th>
            <th style="padding:7px 10px;text-align:center;font-size:9px;color:#6b7280;">Status</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`
    }).join('')

    const trendCfg: Record<string, { t: string; c: string }> = {
      melhorou: { t: '↓ Melhorou', c: '#16a34a' }, piorou: { t: '↑ Piorou', c: '#dc2626' }, estavel: { t: '= Estável', c: '#64748b' },
    }
    const evoBlock = final.length && baseline.length ? `
      <div style="margin-bottom:22px;page-break-inside:avoid;">
        <h2 style="font-size:15px;color:#0E2A47;font-weight:800;margin-bottom:8px;">Evolução do risco no ciclo</h2>
        <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;">
          <thead><tr style="background:#f8fafc;">
            <th style="padding:7px 10px;text-align:left;font-size:10px;color:#6b7280;">Fator</th>
            <th style="padding:7px 10px;text-align:center;font-size:10px;color:#6b7280;">Início</th>
            <th style="padding:7px 10px;text-align:center;font-size:10px;color:#6b7280;">Encerramento</th>
            <th style="padding:7px 10px;text-align:center;font-size:10px;color:#6b7280;">Evolução</th>
          </tr></thead>
          <tbody>${baseline.filter((b) => b.riskLevel !== 'baixo').map((b) => {
            const c = finalMap.get(b.topicNum)
            const trend = !c ? null : sev[c.riskLevel] < sev[b.riskLevel] ? 'melhorou' : sev[c.riskLevel] > sev[b.riskLevel] ? 'piorou' : 'estavel'
            const tc = trend ? trendCfg[trend] : { t: '—', c: '#cbd5e1' }
            return `<tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:7px 10px;font-size:11px;color:#374151;">${esc(b.factor)}</td>
              <td style="padding:7px 10px;text-align:center;font-size:11px;font-weight:bold;color:${riskColor[b.riskLevel]};">${riskLabel[b.riskLevel]}</td>
              <td style="padding:7px 10px;text-align:center;font-size:11px;font-weight:bold;color:${c ? riskColor[c.riskLevel] : '#cbd5e1'};">${c ? riskLabel[c.riskLevel] : '—'}</td>
              <td style="padding:7px 10px;text-align:center;font-size:11px;font-weight:bold;color:${tc.c};">${tc.t}</td>
            </tr>`
          }).join('')}</tbody>
        </table>
      </div>` : ''

    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/><style>
      *{box-sizing:border-box;margin:0;padding:0;} body{font-family:Arial,Helvetica,sans-serif;color:#1f2937;background:white;font-size:13px;}
      @media print{.no-print{display:none!important;}}
    </style></head><body style="padding:40px 48px;max-width:920px;margin:0 auto;">
      <div class="no-print" style="text-align:right;margin-bottom:20px;">
        <button onclick="window.print()" style="background:#0E2A47;color:white;border:none;padding:10px 24px;border-radius:8px;cursor:pointer;font-size:14px;font-weight:bold;">🖨️ Imprimir / Salvar PDF</button>
      </div>
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:8px 14px;margin-bottom:18px;">
        <p style="font-size:11px;color:#92400e;font-weight:bold;">📦 CICLO ARQUIVADO — documento histórico para comprovação na fiscalização.</p>
      </div>
      <div style="border-bottom:3px solid #17C3C9;padding-bottom:18px;margin-bottom:22px;">
        <p style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Plano de Ação — Ciclo encerrado (NR-1)</p>
        <h1 style="font-size:22px;color:#0E2A47;font-weight:900;">${esc(company?.name ?? '')}</h1>
        <h2 style="font-size:15px;color:#374151;font-weight:600;margin-top:2px;">Setor: ${esc(arch.sectorName)}</h2>
        <div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:16px;font-size:11px;color:#64748b;">
          <span>Período: <strong>${fmtDate(arch.startedAt)} → ${fmtDate(arch.archivedAt)}</strong></span>
          ${arch.interventionCadence ? `<span>Ritmo: <strong>Intervenções ${cadenceLabel(arch.interventionCadence as Cadence).toLowerCase()}</strong></span>` : ''}
          <span>Ações concluídas: <strong>${done}/${items.length}</strong></span>
        </div>
      </div>
      ${evoBlock}
      ${factorBlocks || '<p style="font-size:12px;color:#64748b;">Sem ações registradas neste ciclo.</p>'}
      <div style="margin-top:16px;padding-top:12px;border-top:1px solid #e2e8f0;font-size:10px;color:#94a3b8;text-align:center;">
        <p>Documento de ciclo arquivado — gerado pelo sistema Zelo · guarda mínima de 20 anos (NR-1).</p>
      </div>
    </body></html>`

    const fname = `Plano-Arquivado-${arch.sectorName.replace(/\s+/g, '-')}-${new Date(arch.archivedAt).toISOString().split('T')[0]}.html`
    return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Content-Disposition': `attachment; filename="${fname}"` } })
  } catch (err) {
    console.error('[HISTORY PDF]', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }
}
