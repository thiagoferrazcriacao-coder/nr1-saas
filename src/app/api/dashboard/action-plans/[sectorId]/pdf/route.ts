import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

type ActionItem = {
  id: string
  topico: string
  acao: string
  tipo: 'imediata' | 'preventiva'
  responsavel?: string
  prazo?: string
  status: 'pendente' | 'em_andamento' | 'concluido'
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente'
}

const prioOrder: Record<string, number> = { urgente: 0, alta: 1, media: 2, baixa: 3 }

const prioColor: Record<string, string> = {
  urgente: '#dc2626', alta: '#ea580c', media: '#ca8a04', baixa: '#16a34a',
}
const prioBg: Record<string, string> = {
  urgente: '#fef2f2', alta: '#fff7ed', media: '#fefce8', baixa: '#f0fdf4',
}
const prioLabel: Record<string, string> = {
  urgente: 'Urgente', alta: 'Alta', media: 'Média', baixa: 'Baixa',
}
const statusColor: Record<string, string> = {
  pendente: '#64748b', em_andamento: '#2563eb', concluido: '#16a34a',
}
const statusBg: Record<string, string> = {
  pendente: '#f1f5f9', em_andamento: '#eff6ff', concluido: '#f0fdf4',
}
const statusLabel: Record<string, string> = {
  pendente: 'Pendente', em_andamento: 'Em andamento', concluido: 'Concluído',
}

function buildHtml(opts: {
  companyName: string
  sectorName: string
  cnpj: string | null
  city: string | null
  state: string | null
  responsible: string | null
  items: ActionItem[]
}): string {
  const { companyName, sectorName, cnpj, city, state, responsible, items } = opts
  const date = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

  const sorted = [...items].sort(
    (a, b) => (prioOrder[a.prioridade] ?? 9) - (prioOrder[b.prioridade] ?? 9)
  )

  const rows = sorted.length
    ? sorted.map((it, i) => {
        const pc = prioColor[it.prioridade], pb = prioBg[it.prioridade]
        const sc = statusColor[it.status], sb = statusBg[it.status]
        return `
          <tr style="border-bottom:1px solid #f1f5f9;">
            <td style="padding:9px 10px;text-align:center;font-size:11px;color:#94a3b8;">${i + 1}</td>
            <td style="padding:9px 10px;text-align:center;">
              <span style="background:${pb};color:${pc};border:1px solid ${pc}40;padding:2px 9px;border-radius:20px;font-size:10px;font-weight:bold;">${prioLabel[it.prioridade]}</span>
            </td>
            <td style="padding:9px 10px;font-size:11px;color:#374151;">${it.topico || '—'}</td>
            <td style="padding:9px 10px;font-size:11px;color:#374151;">
              ${it.acao}
              <span style="display:block;font-size:9px;color:#94a3b8;margin-top:2px;text-transform:uppercase;letter-spacing:.5px;">${it.tipo === 'imediata' ? 'Ação imediata' : 'Ação preventiva'}</span>
            </td>
            <td style="padding:9px 10px;font-size:11px;color:#475569;">${it.responsavel || '<span style="color:#cbd5e1;">A definir</span>'}</td>
            <td style="padding:9px 10px;font-size:11px;color:#475569;white-space:nowrap;">${it.prazo || '<span style="color:#cbd5e1;">A definir</span>'}</td>
            <td style="padding:9px 10px;text-align:center;">
              <span style="background:${sb};color:${sc};border:1px solid ${sc}40;padding:2px 9px;border-radius:20px;font-size:10px;font-weight:bold;">${statusLabel[it.status]}</span>
            </td>
          </tr>`
      }).join('')
    : `<tr><td colspan="7" style="padding:16px;text-align:center;font-size:12px;color:#64748b;">
         Nenhuma ação cadastrada. Os fatores avaliados estão sob controle — manter monitoramento contínuo.
       </td></tr>`

  const concluidos = items.filter((i) => i.status === 'concluido').length
  const progresso = items.length ? Math.round((concluidos / items.length) * 100) : 0

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <style>
    *{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:Arial,Helvetica,sans-serif;color:#1f2937;background:white;font-size:13px;}
    table{border-collapse:collapse;width:100%;}
    th{background:#f8fafc;font-weight:600;color:#6b7280;}
    @media print{.no-print{display:none!important;}body{padding:20px;}}
  </style>
</head>
<body style="padding:40px 48px;max-width:900px;margin:0 auto;">

  <div class="no-print" style="text-align:right;margin-bottom:20px;">
    <button onclick="window.print()" style="background:#1e40af;color:white;border:none;padding:10px 24px;border-radius:8px;cursor:pointer;font-size:14px;font-weight:bold;">
      🖨️ Imprimir / Salvar PDF
    </button>
  </div>

  <!-- Cabeçalho -->
  <div style="border-bottom:3px solid #1e40af;padding-bottom:20px;margin-bottom:24px;">
    <p style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">
      Plano de Ação — Riscos Psicossociais (NR-1)
    </p>
    <h1 style="font-size:22px;color:#1e40af;font-weight:900;">${companyName}</h1>
    <h2 style="font-size:15px;color:#374151;font-weight:600;margin-top:2px;">Setor: ${sectorName}</h2>
    <div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:16px;font-size:11px;color:#64748b;">
      ${cnpj ? `<span>CNPJ: <strong>${cnpj}</strong></span>` : ''}
      ${(city || state) ? `<span>📍 ${[city, state].filter(Boolean).join('/')}</span>` : ''}
      ${responsible ? `<span>Responsável: <strong>${responsible}</strong></span>` : ''}
      <span>Emitido em ${date}</span>
    </div>
  </div>

  <!-- Resumo -->
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:24px;">
    <div style="background:#f8fafc;border:2px solid #e2e8f030;border-radius:12px;padding:18px;">
      <p style="font-size:11px;color:#64748b;font-weight:600;">Total de ações</p>
      <p style="font-size:32px;font-weight:900;color:#1f2937;line-height:1.1;margin-top:4px;">${items.length}</p>
    </div>
    <div style="background:#f0fdf4;border:2px solid #16a34a30;border-radius:12px;padding:18px;">
      <p style="font-size:11px;color:#15803d;font-weight:600;">Concluídas</p>
      <p style="font-size:32px;font-weight:900;color:#16a34a;line-height:1.1;margin-top:4px;">${concluidos}</p>
    </div>
    <div style="background:#eff6ff;border:2px solid #2563eb30;border-radius:12px;padding:18px;">
      <p style="font-size:11px;color:#1d4ed8;font-weight:600;">Progresso</p>
      <p style="font-size:32px;font-weight:900;color:#2563eb;line-height:1.1;margin-top:4px;">${progresso}%</p>
    </div>
  </div>

  <p style="font-size:12px;color:#374151;line-height:1.65;margin-bottom:18px;">
    Este Plano de Ação define as medidas de controle dos fatores de risco psicossocial identificados na avaliação do setor,
    com responsável, prazo e acompanhamento de status, em atendimento à NR-1. As ações são priorizadas pela criticidade do risco.
  </p>

  <!-- Tabela de ações -->
  <table style="margin-bottom:8px;">
    <thead>
      <tr style="border-bottom:2px solid #e2e8f0;">
        <th style="padding:9px 10px;text-align:center;font-size:11px;">#</th>
        <th style="padding:9px 10px;text-align:center;font-size:11px;">Prioridade</th>
        <th style="padding:9px 10px;text-align:left;font-size:11px;">Fator</th>
        <th style="padding:9px 10px;text-align:left;font-size:11px;">Medida / Ação</th>
        <th style="padding:9px 10px;text-align:left;font-size:11px;">Responsável</th>
        <th style="padding:9px 10px;text-align:left;font-size:11px;">Prazo</th>
        <th style="padding:9px 10px;text-align:center;font-size:11px;">Status</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <!-- Assinatura -->
  <div style="margin-top:36px;padding-top:20px;border-top:2px solid #e2e8f0;display:flex;justify-content:space-between;gap:40px;flex-wrap:wrap;">
    <div>
      <p style="font-size:10px;color:#94a3b8;margin-bottom:4px;">Responsável Técnica</p>
      <p style="font-size:14px;font-weight:700;color:#1e3a8a;">Annie Talma</p>
      <p style="font-size:11px;color:#64748b;">Psicóloga Organizacional · CRP/05/44595</p>
      <p style="font-size:10px;color:#94a3b8;margin-top:4px;">Assinatura eletrônica · ${date}</p>
    </div>
    <div>
      <p style="font-size:10px;color:#94a3b8;margin-bottom:4px;">Responsável pela Organização</p>
      <p style="font-size:14px;font-weight:700;color:#1e3a8a;">${responsible ?? companyName}</p>
      <p style="font-size:11px;color:#64748b;">${companyName}</p>
      <p style="font-size:10px;color:#94a3b8;margin-top:4px;">${date}</p>
    </div>
  </div>

  <div style="margin-top:16px;background:#fefce8;border:1px solid #fef08a;border-radius:8px;padding:10px 14px;">
    <p style="font-size:10px;color:#92400e;line-height:1.5;">
      <strong>Observação:</strong> assinatura eletrônica pré-aplicada da responsável técnica. A formalização final
      (assinatura manuscrita/certificada da psicóloga) será concluída em etapa posterior, sem prejuízo da validade técnica deste documento.
    </p>
  </div>

  <div style="margin-top:18px;padding-top:12px;border-top:1px solid #e2e8f0;font-size:10px;color:#94a3b8;text-align:center;">
    <p>Plano de Ação gerado pelo sistema NR-1 Risk. Documento integrante do PGR da empresa.</p>
    <p style="margin-top:4px;font-weight:600;color:#64748b;">NR-1 Risk · ${companyName} · ${sectorName} · ${date}</p>
  </div>

</body>
</html>`
}

export async function GET(
  req: NextRequest,
  { params }: { params: { sectorId: string } }
) {
  try {
    const { companyId } = requireAuth(req)

    const sector = await prisma.sector.findFirst({
      where: { id: params.sectorId, companyId },
      include: {
        company: { select: { name: true, cnpj: true, city: true, state: true, responsible: true } },
      },
    })
    if (!sector) return NextResponse.json({ error: 'Setor não encontrado.' }, { status: 404 })

    // Usa o plano salvo; se não houver, cai para a sugestão automática (análise técnica)
    const plan = await prisma.actionPlan.findUnique({ where: { sectorId: params.sectorId } })
    let items: ActionItem[] = []

    if (plan) {
      items = plan.items as ActionItem[]
    } else {
      const latestResponse = await prisma.response.findFirst({
        where: { sectorId: params.sectorId },
        include: { aiAnalysis: true },
        orderBy: { createdAt: 'desc' },
      })
      const ai = latestResponse?.aiAnalysis?.classification as {
        acoes_imediatas?: string[]
        acoes_preventivas?: string[]
        topicos_criticos?: string[]
        prioridade_intervencao?: string
      } | null
      if (ai) {
        const prioridade = ai.prioridade_intervencao === 'urgente' ? 'urgente' : 'alta'
        items = [
          ...(ai.acoes_imediatas ?? []).map((acao, i) => ({
            id: `imediata-${i}`, topico: ai.topicos_criticos?.[i] ?? 'Geral', acao,
            tipo: 'imediata' as const, responsavel: '', prazo: '',
            status: 'pendente' as const, prioridade: prioridade as 'urgente' | 'alta',
          })),
          ...(ai.acoes_preventivas ?? []).map((acao, i) => ({
            id: `preventiva-${i}`, topico: ai.topicos_criticos?.[i] ?? 'Geral', acao,
            tipo: 'preventiva' as const, responsavel: '', prazo: '',
            status: 'pendente' as const, prioridade: 'media' as const,
          })),
        ]
      }
    }

    const html = buildHtml({
      companyName: sector.company.name,
      sectorName:  sector.name,
      cnpj:        sector.company.cnpj ?? null,
      city:        sector.company.city ?? null,
      state:       sector.company.state ?? null,
      responsible: sector.company.responsible ?? null,
      items,
    })

    const date = new Date().toISOString().split('T')[0]
    const filename = `Plano-de-Acao-${sector.name.replace(/\s+/g, '-')}-${date}.html`

    return new NextResponse(html, {
      headers: {
        'Content-Type':        'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }
}
