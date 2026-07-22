import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { computeSectorFactors, FactorRisk } from '@/lib/sector-factors'
import { buildMonthPlan, FactorInput } from '@/lib/month-plan'
import { gestorSignatureHtml } from '@/lib/signature-html'

export const dynamic = 'force-dynamic'

const esc = (s: string) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
type Evidence = { url: string; name?: string; at: string }
type MonthData = Record<string, { done?: boolean; ataSummary?: string; evidences: Evidence[] }>

// GET ?month=N — gera a ata de um mês (resumo + evidências + lista de presença + assinatura)
export async function GET(req: NextRequest, { params }: { params: { sectorId: string } }) {
  try {
    const { companyId } = requireAuth(req)
    const monthNum = Number(new URL(req.url).searchParams.get('month') ?? '0')

    const sector = await prisma.sector.findFirst({
      where: { id: params.sectorId, companyId },
      include: { company: { select: { name: true, cnpj: true, gestorName: true, gestorSignatureUrl: true } } },
    })
    if (!sector) return NextResponse.json({ error: 'Setor não encontrado.' }, { status: 404 })

    const plan = await prisma.actionPlan.findUnique({ where: { sectorId: params.sectorId } })
    const baseline: FactorRisk[] = plan && Array.isArray(plan.baseline) ? (plan.baseline as unknown as FactorRisk[]) : []
    const factors: FactorInput[] = (baseline.length ? baseline : await computeSectorFactors(params.sectorId))
      .map((b) => ({ topicNum: b.topicNum, riskLevel: b.riskLevel, score: b.score }))
    if (factors.length === 0) return NextResponse.json({ error: 'Sem dados para a ata.' }, { status: 400 })

    const start = plan ? new Date(plan.createdAt) : new Date()
    const layout = (plan?.layout as { order?: string[] } | null) ?? {}
    const months = buildMonthPlan(factors, start, layout.order)
    const month = months.find((m) => m.monthNum === monthNum) ?? months[0]
    const md = ((plan?.monthData as MonthData) ?? {})[month.key] ?? { evidences: [] }

    const date = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    const company = sector.company

    const fatores = month.factors.map((f) => esc(f.factor)).join(' + ')
    const acoes = month.factors
      .filter((f) => f.simpleAction)
      .map((f) => `<li style="margin-bottom:4px;"><strong>${esc(f.factor)}:</strong> ${esc(f.simpleAction!.title)}</li>`)
      .join('')

    const fotos = (md.evidences ?? []).filter((e) => !/\.pdf($|\?)/i.test(e.url))
    const docs = (md.evidences ?? []).filter((e) => /\.pdf($|\?)/i.test(e.url))
    const fotosHtml = fotos.length
      ? `<div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:8px;">${fotos
          .map((e) => `<img src="${e.url}" alt="${esc(e.name ?? 'evidência')}" style="width:150px;height:150px;object-fit:cover;border:1px solid #e2e8f0;border-radius:8px;" />`)
          .join('')}</div>`
      : '<p style="font-size:11px;color:#94a3b8;">Nenhuma foto anexada.</p>'
    const docsHtml = docs.length
      ? `<ul style="font-size:11px;color:#475569;margin-top:6px;padding-left:16px;">${docs.map((e) => `<li>${esc(e.name ?? 'documento.pdf')}</li>`).join('')}</ul>`
      : ''

    // Lista de presença: 12 linhas (nº · nome · assinatura)
    const linhas = Array.from({ length: 12 })
      .map(
        (_, i) => `<tr>
        <td style="border:1px solid #cbd5e1;padding:10px 8px;font-size:11px;color:#94a3b8;width:26px;text-align:center;">${i + 1}</td>
        <td style="border:1px solid #cbd5e1;padding:10px 8px;">&nbsp;</td>
        <td style="border:1px solid #cbd5e1;padding:10px 8px;width:220px;">&nbsp;</td>
      </tr>`,
      )
      .join('')

    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/><style>
      *{box-sizing:border-box;margin:0;padding:0;} body{font-family:Arial,Helvetica,sans-serif;color:#1f2937;}
      @media print{.no-print{display:none!important;}}
    </style></head>
    <body style="padding:40px 48px;max-width:900px;margin:0 auto;">
      <div class="no-print" style="text-align:right;margin-bottom:18px;">
        <button onclick="window.print()" style="background:#0E2A47;color:#fff;border:none;padding:10px 24px;border-radius:8px;cursor:pointer;font-size:14px;font-weight:bold;">🖨️ Imprimir / Salvar PDF</button>
      </div>

      <div style="border-bottom:3px solid #17C3C9;padding-bottom:16px;margin-bottom:20px;">
        <p style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Ata de Ação — Plano NR-1</p>
        <h1 style="font-size:22px;color:#0E2A47;font-weight:900;">${esc(company.name)}</h1>
        <p style="font-size:14px;color:#374151;margin-top:2px;">${esc(month.label)} — ${fatores}</p>
        <div style="margin-top:8px;font-size:11px;color:#64748b;display:flex;gap:16px;flex-wrap:wrap;">
          <span>Setor: <strong>${esc(sector.name)}</strong></span>
          ${company.cnpj ? `<span>CNPJ: <strong>${esc(company.cnpj)}</strong></span>` : ''}
          <span>Emitida em ${date}</span>
        </div>
      </div>

      <h2 style="font-size:14px;color:#0E2A47;font-weight:800;margin-bottom:6px;">1. Ações previstas para o mês</h2>
      <ul style="font-size:12px;color:#374151;padding-left:18px;line-height:1.6;margin-bottom:18px;">${acoes || '<li>—</li>'}</ul>

      <h2 style="font-size:14px;color:#0E2A47;font-weight:800;margin-bottom:6px;">2. Resumo do que foi realizado</h2>
      <p style="font-size:12px;color:#374151;line-height:1.7;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;min-height:60px;margin-bottom:18px;">${md.ataSummary ? esc(md.ataSummary) : '<span style="color:#94a3b8;">(descrever a ação realizada)</span>'}</p>

      <h2 style="font-size:14px;color:#0E2A47;font-weight:800;margin-bottom:6px;">3. Evidências (fotos e documentos)</h2>
      ${fotosHtml}
      ${docsHtml}

      <h2 style="font-size:14px;color:#0E2A47;font-weight:800;margin:22px 0 6px;">4. Lista de presença</h2>
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr style="background:#f1f5f9;">
          <th style="border:1px solid #cbd5e1;padding:7px 8px;font-size:10px;color:#475569;">#</th>
          <th style="border:1px solid #cbd5e1;padding:7px 8px;font-size:10px;color:#475569;text-align:left;">Nome</th>
          <th style="border:1px solid #cbd5e1;padding:7px 8px;font-size:10px;color:#475569;text-align:left;">Assinatura</th>
        </tr></thead>
        <tbody>${linhas}</tbody>
      </table>

      <div style="margin-top:40px;display:flex;justify-content:flex-start;">
        ${gestorSignatureHtml({ gestorName: company.gestorName, signatureUrl: company.gestorSignatureUrl, companyName: company.name, date })}
      </div>

      <div style="margin-top:20px;padding-top:12px;border-top:1px solid #e2e8f0;font-size:10px;color:#94a3b8;text-align:center;">
        Ata gerada pela plataforma Zelo · guardar por no mínimo 20 anos (NR-1).
      </div>
    </body></html>`

    const filename = `Ata-Mes-${month.monthNum}-${sector.name.replace(/\s+/g, '-')}.html`
    return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Content-Disposition': `attachment; filename="${filename}"` } })
  } catch (err) {
    console.error('[ATA]', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }
}
