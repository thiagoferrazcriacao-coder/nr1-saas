import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { calcScore, buildRiskMatrix, type MatrixResult, type Probability } from '@/lib/scoring'
import { FACTOR_ANALYSIS } from '@/lib/drps-content'

export const dynamic = 'force-dynamic'

// ─── Paleta / rótulos ─────────────────────────────────────────────────────────
const NAVY = '#0E2A47', TEAL = '#17C3C9', TEALD = '#0E8F95'
const riskColors: Record<string, string> = { baixo: '#16a34a', moderado: '#ca8a04', alto: '#ea580c', critico: '#dc2626' }
const riskBg: Record<string, string> = { baixo: '#f0fdf4', moderado: '#fefce8', alto: '#fff7ed', critico: '#fef2f2' }
const riskLabel: Record<string, string> = { baixo: 'Baixo', moderado: 'Médio', alto: 'Alto', critico: 'Crítico' }
const gravLabel: Record<string, string> = { baixa: 'Baixa', media: 'Média', alta: 'Alta' }
const probLabel: Record<string, string> = { baixa: 'Baixa', media: 'Média', alta: 'Alta' }
const gravColor: Record<string, string> = { baixa: '#16a34a', media: '#ca8a04', alta: '#ea580c' }

type SectorData = { name: string; totalResponses: number; matrix: MatrixResult[] }

// ─── Donut SVG a partir de segmentos {value,color,label} ──────────────────────
function donut(segments: { value: number; color: string; label: string }[], title: string): string {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1
  const r = 52, cx = 70, cy = 70, C = 2 * Math.PI * r
  let acc = 0
  const rings = segments.filter((s) => s.value > 0).map((s) => {
    const frac = s.value / total
    const dash = frac * C
    const el = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${s.color}" stroke-width="20"
      stroke-dasharray="${dash.toFixed(2)} ${(C - dash).toFixed(2)}" stroke-dashoffset="${(-acc * C).toFixed(2)}"
      transform="rotate(-90 ${cx} ${cy})" />`
    acc += frac
    return el
  }).join('')
  const legend = segments.map((s) => `
    <div style="display:flex;align-items:center;gap:6px;font-size:10px;color:#475569;">
      <span style="width:10px;height:10px;border-radius:3px;background:${s.color};display:inline-block;"></span>
      ${s.label} <strong>(${s.value})</strong>
    </div>`).join('')
  return `
    <div style="text-align:center;">
      <p style="font-size:11px;font-weight:700;color:${NAVY};margin-bottom:6px;">${title}</p>
      <svg width="140" height="140" viewBox="0 0 140 140">${rings}
        <text x="70" y="76" text-anchor="middle" font-size="20" font-weight="800" fill="${NAVY}">${total}</text>
      </svg>
      <div style="display:flex;flex-direction:column;gap:3px;align-items:flex-start;width:max-content;margin:6px auto 0;">${legend}</div>
    </div>`
}

// Lista natural em português: [a, b, c] → "a, b e c"
function fmtList(names: string[]): string {
  if (names.length === 0) return ''
  if (names.length === 1) return names[0]
  return names.slice(0, -1).join(', ') + ' e ' + names[names.length - 1]
}

// ─── Análise narrativa automática do setor (item 5 preenchido por nós) ────────
function narrative(sd: SectorData): string {
  const low = (m: MatrixResult) => m.topic.charAt(0).toLowerCase() + m.topic.slice(1)
  const alta   = sd.matrix.filter((m) => m.gravidade === 'alta')
  const media  = sd.matrix.filter((m) => m.gravidade === 'media')
  const protet = sd.matrix.filter((m) => m.gravidade === 'baixa')
  const criticos = sd.matrix.filter((m) => m.riskFinal === 'critico')
  const altos    = sd.matrix.filter((m) => m.riskFinal === 'alto')
  const parts: string[] = []

  if (alta.length) {
    const nivel = criticos.length ? 'Alto ou Crítico' : altos.length ? 'Alto' : 'Médio'
    parts.push(`A análise das médias por eixo temático indicou que os fatores relacionados a <strong>${fmtList(alta.map(low))}</strong> apresentaram o maior nível de gravidade neste setor. No cruzamento com a probabilidade de ocorrência, tais fatores foram classificados como <strong>${nivel}</strong>, correlacionando-se com a análise técnica contextual e demandando priorização das medidas de controle.`)
  } else {
    parts.push('A análise das médias por eixo temático não identificou fatores em nível elevado de gravidade neste setor, indicando um ambiente organizacional com baixa exposição aos riscos psicossociais avaliados no momento da coleta.')
  }
  if (media.length) {
    parts.push(`Os fatores relacionados a <strong>${fmtList(media.map(low))}</strong> apresentaram classificação intermediária, sugerindo a necessidade de monitoramento sistemático e de ajustes organizacionais preventivos, a fim de evitar a evolução para níveis mais elevados.`)
  }
  parts.push('No que se refere à probabilidade de ocorrência, a análise técnica considerou a frequência percebida dos relatos, a recorrência histórica de situações semelhantes e a existência (ou ausência) de medidas formais de controle. O resultado do cruzamento entre gravidade e probabilidade, conforme a Matriz de Risco NR-1, é apresentado na tabela e nos gráficos a seguir.')
  if (protet.length) {
    parts.push(`Observou-se, ainda, a presença de fatores protetivos relacionados a <strong>${fmtList(protet.map(low))}</strong>, que atuam como elementos moderadores do risco e devem ser mantidos e fortalecidos nas estratégias de intervenção deste setor.`)
  }
  return parts.map((t) => `<p style="font-size:11.5px;color:#374151;line-height:1.65;text-align:justify;margin-bottom:9px;">${t}</p>`).join('')
}

// ─── Bloco do setor (identificação + narrativa + tabela + página de gráficos) ──
function sectorBlock(sd: SectorData, label: string): string {
  const rows = sd.matrix.map((m) => {
    const gC = gravColor[m.gravidade]
    const pC = m.probabilidade === 'alta' ? '#dc2626' : m.probabilidade === 'media' ? '#ca8a04' : '#16a34a'
    const fC = riskColors[m.riskFinal], fBg = riskBg[m.riskFinal]
    return `<tr style="border-bottom:1px solid #f1f5f9;">
      <td style="padding:6px 8px;font-size:10.5px;color:#94a3b8;text-align:center;">${String(m.topicNum).padStart(2, '0')}</td>
      <td style="padding:6px 8px;font-size:10.5px;color:#374151;">${m.topic}</td>
      <td style="padding:6px 8px;text-align:center;font-size:10.5px;color:${gC};font-weight:600;">${gravLabel[m.gravidade]}</td>
      <td style="padding:6px 8px;text-align:center;font-size:10.5px;color:${pC};font-weight:600;">${probLabel[m.probabilidade]}</td>
      <td style="padding:6px 8px;text-align:center;">
        <span style="background:${fBg};color:${fC};border:1px solid ${fC}40;padding:2px 8px;border-radius:20px;font-size:9.5px;font-weight:bold;">${riskLabel[m.riskFinal]}</span>
      </td></tr>`
  }).join('')

  // Distribuições para os gráficos
  const finalSeg = (['baixo', 'moderado', 'alto', 'critico'] as const).map((k) => ({
    value: sd.matrix.filter((m) => m.riskFinal === k).length, color: riskColors[k], label: riskLabel[k],
  }))
  const gravSeg = (['baixa', 'media', 'alta'] as const).map((k) => ({
    value: sd.matrix.filter((m) => m.gravidade === k).length, color: gravColor[k], label: gravLabel[k],
  }))

  return `
    <p style="font-size:13px;font-weight:800;color:${NAVY};margin:10px 0 6px;">${label}</p>
    <p style="font-size:11px;color:#64748b;margin-bottom:10px;"><strong>Número de respondentes:</strong> ${sd.totalResponses} · <strong>Fatores avaliados:</strong> 13, conforme os eixos temáticos do DRPS.</p>
    ${narrative(sd)}
    <div class="avoid-break" style="margin:12px 0 14px;">
      <p style="font-size:11px;font-weight:700;color:${NAVY};margin-bottom:6px;">Classificação dos 13 fatores — Matriz de Risco NR-1</p>
      <table style="border-collapse:collapse;width:100%;">
        <thead><tr style="border-bottom:2px solid #e2e8f0;background:#f8fafc;">
          <th style="padding:7px 8px;font-size:10px;color:#6b7280;text-align:center;">Nº</th>
          <th style="padding:7px 8px;font-size:10px;color:#6b7280;text-align:left;">Fator de Risco Psicossocial</th>
          <th style="padding:7px 8px;font-size:10px;color:#6b7280;text-align:center;">Gravidade</th>
          <th style="padding:7px 8px;font-size:10px;color:#6b7280;text-align:center;">Probabilidade</th>
          <th style="padding:7px 8px;font-size:10px;color:#6b7280;text-align:center;">Classificação</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div class="page-break"></div>
    <div class="avoid-break" style="text-align:center;">
      <p style="font-size:12px;font-weight:800;color:${NAVY};margin-bottom:4px;">Resultado visual — ${label.replace(/^5\.\d+\s+/, '').replace(/^Setor:\s*/, '')}</p>
      <p style="font-size:10.5px;color:#64748b;margin-bottom:16px;">Distribuição dos 13 fatores por classificação final e por gravidade.</p>
      <div style="display:flex;justify-content:center;gap:48px;flex-wrap:wrap;">
        ${donut(finalSeg, 'Classificação final (Matriz de Risco)')}
        ${donut(gravSeg, 'Gravidade')}
      </div>
    </div>`
}

function buildHtml(opts: {
  origin: string
  companyName: string
  fantasyName: string | null
  cnpj: string | null
  city: string | null
  state: string | null
  responsible: string | null
  logoUrl: string | null
  sectors: SectorData[]
  single: boolean
  drpsValidatedAt: Date | null
  drpsValidatedBy: string | null
  drpsNotes: string | null
}): string {
  const { origin, companyName, fantasyName, cnpj, city, state, responsible, logoUrl, sectors, single, drpsValidatedAt, drpsNotes } = opts
  const now = new Date()
  const mesAnoRaw = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const mesAno = mesAnoRaw.charAt(0).toUpperCase() + mesAnoRaw.slice(1)
  const date = now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  const proxima = new Date(now.getFullYear() + 1, now.getMonth(), 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const zelo = `${origin}/logo-zelo-3.png`

  // Item 5 — dinâmico por setor
  const item5 = single
    ? sectorBlock(sectors[0], 'A empresa como um todo')
    : sectors.map((sd, i) => sectorBlock(sd, `5.${i + 1}  Setor: ${sd.name}`)).join('<div class="page-break"></div>')

  // Item 6 — medidas dos fatores elevados (dedup por fator, maior risco)
  const sev: Record<string, number> = { critico: 0, alto: 1, moderado: 2, baixo: 3 }
  const bestByFactor = new Map<number, MatrixResult>()
  for (const sd of sectors) for (const m of sd.matrix) {
    if (m.riskFinal === 'baixo') continue
    const cur = bestByFactor.get(m.topicNum)
    if (!cur || sev[m.riskFinal] < sev[cur.riskFinal]) bestByFactor.set(m.topicNum, m)
  }
  const elevados = Array.from(bestByFactor.values()).sort((a, b) => sev[a.riskFinal] - sev[b.riskFinal])
  const prazoDe: Record<string, string> = { critico: '30 dias', alto: '60 dias', moderado: '90 dias', baixo: '—' }
  const medidasRows = elevados.length
    ? elevados.map((m) => {
        const fC = riskColors[m.riskFinal]
        return `<tr>
          <td style="padding:8px 10px;border:1px solid #e2e8f0;font-size:10.5px;font-weight:600;color:#374151;">${m.topic}</td>
          <td style="padding:8px 10px;border:1px solid #e2e8f0;text-align:center;"><span style="color:${fC};font-weight:700;font-size:10.5px;">${riskLabel[m.riskFinal]}</span></td>
          <td style="padding:8px 10px;border:1px solid #e2e8f0;font-size:10.5px;color:#475569;">${FACTOR_ANALYSIS[m.topicNum]?.medida ?? ''}</td>
          <td style="padding:8px 10px;border:1px solid #e2e8f0;font-size:10.5px;color:#475569;text-align:center;">Gestão / RH</td>
          <td style="padding:8px 10px;border:1px solid #e2e8f0;font-size:10.5px;color:#475569;text-align:center;">${prazoDe[m.riskFinal]}</td>
        </tr>`
      }).join('')
    : `<tr><td colspan="5" style="padding:12px;border:1px solid #e2e8f0;font-size:11px;color:#475569;text-align:center;">Nenhum fator classificado acima do nível Baixo. Recomenda-se a manutenção das boas práticas e o monitoramento periódico.</td></tr>`

  const P = (t: string) => `<p style="font-size:11.5px;color:#374151;line-height:1.65;text-align:justify;margin-bottom:10px;">${t}</p>`
  const H = (n: string, t: string) => `<h2 style="font-size:15px;color:${NAVY};border-bottom:2px solid ${TEAL};padding-bottom:6px;margin:26px 0 12px;">${n}. ${t}</h2>`
  const H3 = (t: string) => `<h3 style="font-size:12px;color:${TEALD};font-weight:700;margin:16px 0 6px;">${t}</h3>`

  // Fluxograma simples (5 etapas) para o item 4
  const flowStep = (n: string, t: string, d: string) => `<div style="flex:1;text-align:center;"><div style="width:34px;height:34px;border-radius:50%;background:${NAVY};color:#fff;font-weight:800;font-size:14px;display:flex;align-items:center;justify-content:center;margin:0 auto 6px;">${n}</div><p style="font-size:10px;font-weight:700;color:${NAVY};line-height:1.25;">${t}</p><p style="font-size:9px;color:#94a3b8;line-height:1.2;margin-top:2px;">${d}</p></div>`
  const arrow = `<div style="align-self:flex-start;margin-top:8px;color:${TEAL};font-weight:800;font-size:16px;">›</div>`
  const fluxograma = `<div class="avoid-break" style="display:flex;align-items:stretch;justify-content:space-between;gap:4px;background:#F6F9FC;border:1px solid #e2e8f0;border-radius:12px;padding:16px 12px;margin:10px 0 4px;">
    ${flowStep('1', 'Alinhamento inicial', 'Reunião e definição dos setores')}${arrow}
    ${flowStep('2', 'Coleta de dados', 'Questionário confidencial (digital)')}${arrow}
    ${flowStep('3', 'Análise integrada', 'Dados + análise técnica')}${arrow}
    ${flowStep('4', 'Classificação', 'Matriz de Risco NR-1')}${arrow}
    ${flowStep('5', 'Relatório técnico', 'Síntese e recomendações')}
  </div>`

  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/>
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:Arial,Helvetica,sans-serif;color:#1f2937;}
  @page{ size:A4; margin:1.3cm 1.4cm; }
  .report{width:100%;border-collapse:collapse;}
  .report > thead{display:table-header-group;}
  .report > tfoot{display:table-footer-group;}
  .report > tbody > tr > td, .report > thead > tr > td, .report > tfoot > tr > td{padding:0;}
  .run-head{height:1.25cm;display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid ${TEAL};margin-bottom:14px;}
  .run-foot{width:100%;border-collapse:collapse;border-top:1px solid #e2e8f0;font-size:8px;color:#94a3b8;margin-top:8px;}
  .run-foot td{border:none!important;padding:5px 0 0;vertical-align:middle;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .page-break{page-break-after:always;}
  .avoid-break{page-break-inside:avoid;}
  table{border-collapse:collapse;width:100%;}
  @media screen{ body{background:#eef2f6;} .sheet{max-width:820px;margin:16px auto;background:#fff;padding:1.4cm 1.6cm;box-shadow:0 4px 20px rgba(0,0,0,.08);} }
  @media print{ .no-print{display:none!important;} .sheet{padding:0;} }
</style></head>
<body>
<div class="no-print" style="text-align:center;padding:14px;background:${NAVY};position:sticky;top:0;z-index:10;">
  <button onclick="window.print()" style="background:${TEAL};color:#fff;border:none;padding:11px 26px;border-radius:10px;cursor:pointer;font-size:14px;font-weight:bold;">🖨️ Imprimir / Salvar em PDF</button>
</div>

<div class="sheet">
<table class="report">
<thead><tr><td>
  <div class="run-head">
    <span style="font-size:9px;color:#94a3b8;letter-spacing:1px;">DRPS · DIAGNÓSTICO DE RISCOS PSICOSSOCIAIS</span>
    <img src="${zelo}" alt="Zelo" style="height:0.85cm;width:auto;"/>
  </div>
</td></tr></thead>
<tfoot><tr><td>
  <table class="run-foot"><tr>
    <td style="text-align:left;max-width:60%;">© Plataforma Zelo NR-1 · Anexo técnico ao PGR (NR-1)</td>
    <td style="text-align:right;font-weight:600;">${companyName}</td>
  </tr></table>
</td></tr></tfoot>
<tbody><tr><td>

  <!-- CAPA -->
  <div style="min-height:22cm;display:flex;flex-direction:column;justify-content:center;text-align:center;">
    <img src="${zelo}" alt="Zelo" style="height:1.6cm;width:auto;margin:0 auto 40px;"/>
    <div style="width:70px;height:5px;background:${TEAL};margin:0 auto 20px;border-radius:3px;"></div>
    <p style="font-size:13px;letter-spacing:3px;color:${TEALD};font-weight:700;">RELATÓRIO TÉCNICO</p>
    <h1 style="font-size:40px;font-weight:900;color:${NAVY};margin:10px 0 4px;letter-spacing:2px;">DRPS</h1>
    <p style="font-size:18px;color:#475569;">Diagnóstico de Riscos Psicossociais</p>
    <div style="margin-top:48px;">
      ${logoUrl ? `<img src="${logoUrl}" alt="${companyName}" style="max-height:2cm;max-width:6cm;margin:0 auto 14px;display:block;object-fit:contain;"/>` : ''}
      <p style="font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;">Empresa</p>
      <p style="font-size:20px;font-weight:800;color:${NAVY};margin-top:4px;">${fantasyName || companyName}</p>
      <p style="font-size:13px;color:#64748b;margin-top:24px;">${mesAno}</p>
    </div>
  </div>
  <div class="page-break"></div>

  <!-- ÍNDICE -->
  <h2 style="font-size:20px;color:${NAVY};border-bottom:2px solid ${TEAL};padding-bottom:8px;margin-bottom:18px;">Conteúdo do Relatório</h2>
  <ol style="list-style:none;font-size:13px;color:#374151;line-height:2.2;">
    <li><strong>1.</strong> Introdução</li>
    <li><strong>2.</strong> Objetivo</li>
    <li><strong>3.</strong> Metodologia</li>
    <li><strong>4.</strong> Fluxo de Aplicação do DRPS</li>
    <li><strong>5.</strong> Análises e Resultados</li>
    <li><strong>6.</strong> Medidas de Prevenção</li>
    <li><strong>7.</strong> Conclusão</li>
    <li><strong>8.</strong> Referências</li>
  </ol>
  <div class="page-break"></div>

  ${H('1', 'Introdução')}
  ${P('A gestão dos fatores de riscos psicossociais integra o Gerenciamento de Riscos Ocupacionais previsto na NR-1 — Disposições Gerais e Gerenciamento de Riscos Ocupacionais, exigindo das organizações a identificação, avaliação e controle das condições de trabalho que possam impactar a saúde mental dos trabalhadores.')}
  ${P('Os riscos psicossociais compreendem aspectos relacionados à organização do trabalho, às exigências produtivas, às relações interpessoais, à liderança, ao reconhecimento, à comunicação, à interface entre vida pessoal e profissional e às condições estruturais do ambiente organizacional. Quando não adequadamente monitorados e geridos, tais fatores podem contribuir para estresse ocupacional, sofrimento psíquico, absenteísmo, rotatividade e queda de desempenho.')}
  ${P('O presente relatório apresenta os resultados obtidos por meio da aplicação do DRPS — Diagnóstico de Riscos Psicossociais, instrumento técnico estruturado para rastreamento organizacional dos fatores psicossociais relacionados ao trabalho, com análise integrada de dados quantitativos e qualitativos e classificação de risco conforme parâmetros da NR-1.')}

  ${H('2', 'Objetivo')}
  ${P('Este relatório tem por objetivo estruturar e sistematizar a análise dos fatores de riscos psicossociais identificados na organização avaliada, classificando-os conforme gravidade e probabilidade de ocorrência, de modo a subsidiar a tomada de decisão, a definição de prioridades de intervenção e a integração dos resultados ao Programa de Gerenciamento de Riscos (PGR), do qual este documento constitui anexo técnico.')}

  ${H('3', 'Metodologia')}
  ${P('A metodologia empregada fundamenta-se em referenciais consolidados da psicodinâmica do trabalho, nos estudos sobre estresse ocupacional e nas diretrizes normativas nacionais e internacionais sobre riscos psicossociais relacionados ao trabalho. O DRPS constitui instrumento técnico de rastreamento organizacional, destinado à identificação de fatores de risco em nível coletivo, não se configurando como avaliação clínica individual.')}
  ${P('<strong>Coleta de dados.</strong> A coleta foi realizada por meio de questionário estruturado, aplicado em formato digital, assegurando anonimato, confidencialidade e tratamento agregado das informações, em conformidade com a Lei Geral de Proteção de Dados (LGPD). O instrumento organiza-se em torno dos treze fatores de risco psicossocial, com respostas registradas em escala do tipo Likert de 0 a 4 (0 = nunca; 4 = sempre), conforme a frequência percebida.')}
  ${H3('Cálculo da gravidade')}
  ${P('Após a coleta, as respostas são convertidas em valores numéricos de 0 a 4. Os itens de natureza protetiva são corrigidos por <strong>lógica invertida</strong> (pontuação = 4 − valor), de modo que a pontuação final represente coerentemente o nível de exposição ao risco. Para cada questão calcula-se a média, e a gravidade é classificada, por intervalos predefinidos, em <strong>Baixa</strong>, <strong>Média</strong> ou <strong>Alta</strong>.')}
  ${H3('Média por eixo temático')}
  ${P('Cada um dos treze fatores (como assédio, sobrecarga de trabalho, autonomia, reconhecimento, entre outros) recebe uma média de gravidade calculada a partir das respostas de todas as questões daquele eixo. Essas médias são então consolidadas e classificadas em Baixa, Média ou Alta.')}
  ${H3('Probabilidade de ocorrência')}
  ${P('A probabilidade é definida a partir de avaliação qualitativa conduzida pelo profissional responsável, que correlaciona os achados com o inventário de riscos psicossociais. São considerados três critérios: a <strong>frequência</strong> percebida do risco no setor (baixa, média ou alta); o <strong>histórico</strong> de ocorrências semelhantes (sim, não ou frequente); e os <strong>recursos disponíveis</strong> para mitigação (adequados, insuficientes ou inexistentes).')}
  ${H3('Matriz de Risco NR-1')}
  ${P('A classificação final resulta do cruzamento entre a gravidade (obtida do questionário) e a probabilidade (obtida da análise técnica), utilizando a matriz compatível com os parâmetros da NR-1, que resulta nas categorias Baixo, Médio, Alto ou Crítico:')}
  <table style="margin:10px 0 4px;max-width:520px;">
    <thead><tr>
      <th style="padding:7px 10px;border:1px solid #e2e8f0;background:#f8fafc;font-size:10.5px;text-align:left;color:#475569;">Probabilidade \\ Gravidade</th>
      <th style="padding:7px 10px;border:1px solid #e2e8f0;background:#f8fafc;font-size:10.5px;color:#475569;">Baixa</th>
      <th style="padding:7px 10px;border:1px solid #e2e8f0;background:#f8fafc;font-size:10.5px;color:#475569;">Média</th>
      <th style="padding:7px 10px;border:1px solid #e2e8f0;background:#f8fafc;font-size:10.5px;color:#475569;">Alta</th>
    </tr></thead>
    <tbody>
      ${[['Baixa', ['baixo', 'baixo', 'moderado']], ['Média', ['baixo', 'moderado', 'alto']], ['Alta', ['moderado', 'alto', 'critico']]].map(([p, cells]) => `
        <tr><td style="padding:7px 10px;border:1px solid #e2e8f0;font-size:10.5px;font-weight:600;color:#475569;">${p}</td>
        ${(cells as string[]).map((c) => `<td style="padding:7px 10px;border:1px solid #e2e8f0;text-align:center;font-size:10px;color:${riskColors[c]};font-weight:700;">${riskLabel[c]}</td>`).join('')}</tr>`).join('')}
    </tbody>
  </table>
  ${H3('Escalas e questionários utilizados')}
  ${P('Foram utilizados questionários estruturados fundamentados em modelos reconhecidos — entre eles as referências da Organização Mundial da Saúde (OMS) e da Organização Internacional do Trabalho (OIT) — e nos modelos de estresse ocupacional Demanda-Controle (Karasek) e Esforço-Recompensa (Siegrist). As perguntas abordam os treze fatores de risco psicossocial, incluindo assédio, sobrecarga, metas, autonomia e reconhecimento, entre outros. Após a coleta, as médias de gravidade e probabilidade são calculadas e classificadas segundo a Matriz de Risco NR-1, permitindo mapear e priorizar os riscos que exigem ação imediata.')}
  <div class="page-break"></div>

  ${H('4', 'Fluxo de Aplicação do DRPS')}
  ${P('A aplicação do DRPS seguiu fluxo técnico estruturado, garantindo consistência metodológica, confidencialidade das informações e adequação às diretrizes do Gerenciamento de Riscos Ocupacionais.')}
  ${fluxograma}
  ${P('Inicialmente, realizou-se o <strong>alinhamento</strong> com a organização para compreender sua estrutura, número de colaboradores, setores existentes e contexto produtivo, definindo-se os setores a avaliar e o período de aplicação. Em seguida, procedeu-se à <strong>coleta</strong> por questionário digital, com anonimato e comunicação prévia aos colaboradores quanto ao objetivo e ao uso agregado dos dados.')}
  ${P('Após a coleta, os dados quantitativos foram <strong>consolidados</strong> (médias por item e por eixo, correção da lógica invertida e classificação preliminar da gravidade). Paralelamente, a <strong>análise qualitativa</strong> — observações contextuais e informações organizacionais — qualificou a probabilidade de ocorrência. Procedeu-se, então, ao <strong>cruzamento</strong> na Matriz de Risco NR-1 e à organização dos achados neste <strong>relatório técnico</strong>, com recomendações proporcionais e orientações para integração ao PGR.')}
  <div class="page-break"></div>

  ${H('5', 'Análises e Resultados')}
  ${P('A seguir, apresentam-se os resultados obtidos, com descrição integrada dos dados quantitativos e da análise qualitativa realizada.' + (single ? ' Considerando a estrutura avaliada, os resultados representam a organização como um todo.' : ' Os resultados são apresentados por setor avaliado.'))}
  ${item5}

  <div class="page-break"></div>
  ${H('6', 'Medidas de Prevenção e Recomendações Técnicas')}
  ${P('Com base na classificação dos fatores identificados, especialmente aqueles enquadrados como Alto ou Crítico, torna-se necessária a implementação de medidas preventivas proporcionais ao nível de exposição. As recomendações consideram o princípio da <strong>hierarquia de controle de riscos</strong> aplicado ao contexto psicossocial, priorizando intervenções organizacionais estruturais antes de ações exclusivamente individuais.')}
  ${P('As medidas propostas visam reduzir a exposição aos fatores de risco identificados; fortalecer os fatores protetivos existentes; estruturar mecanismos formais de prevenção; integrar as ações ao Programa de Gerenciamento de Riscos (PGR); e estabelecer monitoramento contínuo. Cada medida deve observar a proporcionalidade ao risco, a definição clara de responsáveis e prazos, e o acompanhamento por indicadores objetivos ou reavaliação periódica. Recomenda-se que os riscos classificados como <strong>Crítico</strong> sejam tratados com prioridade máxima.')}
  <table style="margin-top:6px;">
    <thead><tr style="background:${NAVY};">
      <th style="padding:8px 10px;border:1px solid ${NAVY};color:#fff;font-size:10.5px;text-align:left;">Fator de Risco</th>
      <th style="padding:8px 10px;border:1px solid ${NAVY};color:#fff;font-size:10.5px;">Classificação</th>
      <th style="padding:8px 10px;border:1px solid ${NAVY};color:#fff;font-size:10.5px;text-align:left;">Medida Preventiva Recomendada</th>
      <th style="padding:8px 10px;border:1px solid ${NAVY};color:#fff;font-size:10.5px;">Responsável</th>
      <th style="padding:8px 10px;border:1px solid ${NAVY};color:#fff;font-size:10.5px;">Prazo</th>
    </tr></thead>
    <tbody>${medidasRows}</tbody>
  </table>

  ${H('7', 'Conclusão')}
  ${P('A análise evidencia que os fatores de riscos psicossociais identificados demandam atenção técnica proporcional à sua classificação final. Os riscos classificados como Alto ou Crítico requerem priorização de medidas estruturadas, com responsáveis, prazos e indicadores, integrando-se formalmente ao Programa de Gerenciamento de Riscos. Os fatores em nível Médio indicam necessidade de monitoramento; os classificados como Baixo devem permanecer sob acompanhamento periódico.')}
  ${P('Recomenda-se a adesão ao Plano de Ação estruturado, com registro eletrônico de presença dos colaboradores nos treinamentos, documentação das medidas adotadas e reaplicação do DRPS prevista para ' + proxima + '. A avaliação representa recorte temporal específico, baseado em autorrelato e análise técnica contextual, não substituindo avaliações clínicas individuais.')}
  ${drpsNotes ? `<div style="margin-top:12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;"><p style="font-size:10.5px;font-weight:700;color:#475569;margin-bottom:4px;">Observações técnicas da responsável</p><p style="font-size:11px;color:#374151;line-height:1.6;">${drpsNotes}</p></div>` : ''}

  <div style="margin-top:40px;text-align:center;">
    <div style="display:inline-block;border-top:2px solid #334155;padding-top:6px;min-width:320px;">
      <p style="font-size:13px;font-weight:700;color:${NAVY};">Annie Talma Ferreira Coelho</p>
      <p style="font-size:11px;color:#64748b;">Psicóloga Organizacional — Responsável Técnica · CRP/05/44595</p>
      <p style="font-size:10px;color:#94a3b8;margin-top:4px;">${drpsValidatedAt ? 'Assinatura digital registrada em ' + new Date(drpsValidatedAt).toLocaleString('pt-BR') : 'Assinatura eletrônica · ' + date}</p>
    </div>
  </div>

  <div class="page-break"></div>
  ${H('8', 'Referências')}
  <ol style="font-size:10.5px;color:#475569;line-height:1.7;padding-left:18px;">
    <li>BRASIL. MTE. NR-1 — Disposições Gerais e Gerenciamento de Riscos Ocupacionais. Portaria MTP nº 6.730/2023 e Portaria MTE nº 1.419/2024.</li>
    <li>BRASIL. MTE. Guia de informações sobre os fatores de riscos psicossociais relacionados ao trabalho. Brasília: MTE, 2023.</li>
    <li>INTERNATIONAL LABOUR OFFICE (ILO). Psychosocial risks at work: recognition and prevention. Geneva: ILO, 2016.</li>
    <li>KARASEK, R.; THEORELL, T. Healthy Work: stress, productivity and the reconstruction of working life. Basic Books, 1990.</li>
    <li>SIEGRIST, J. Adverse health effects of high-effort/low-reward conditions. Journal of Occupational Health Psychology, 1996.</li>
    <li>MASLACH, C.; SCHAUFELI, W. B.; LEITER, M. P. Job burnout. Annual Review of Psychology, v. 52, 2001.</li>
    <li>ABNT. NBR ISO 10075-1: Princípios ergonômicos relacionados à carga de trabalho mental. Rio de Janeiro: ABNT, 2013.</li>
    <li>ISO 45003:2021 — Occupational health and safety management — Psychological health and safety at work.</li>
  </ol>

</td></tr></tbody>
</table>
</div>
</body></html>`
}

export async function GET(req: NextRequest) {
  try {
    const { companyId } = requireAuth(req)

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        name: true, fantasyName: true, cnpj: true, city: true, state: true, responsible: true, logoUrl: true,
        drpsValidatedAt: true, drpsValidatedBy: true, drpsNotes: true,
      },
    })
    if (!company) return NextResponse.json({ error: 'Empresa não encontrada.' }, { status: 404 })

    const sectors = await prisma.sector.findMany({ where: { companyId }, orderBy: { createdAt: 'asc' } })
    const questions = await prisma.question.findMany({ select: { code: true, topic: true, topicNum: true, reverse: true } })

    const sectorData: SectorData[] = []
    for (const s of sectors) {
      const [responses, assessments] = await Promise.all([
        prisma.response.findMany({ where: { sectorId: s.id } }),
        prisma.topicAssessment.findMany({ where: { sectorId: s.id } }),
      ])
      if (responses.length === 0) continue

      const byCode = new Map<string, number[]>()
      for (const r of responses) for (const a of r.answers as { questionCode: string; value: number }[]) {
        if (!byCode.has(a.questionCode)) byCode.set(a.questionCode, [])
        byCode.get(a.questionCode)!.push(a.value)
      }
      const avg = Array.from(byCode.entries()).map(([code, v]) => ({ questionCode: code, value: v.reduce((s2, x) => s2 + x, 0) / v.length }))
      const { byTopic } = calcScore(avg, questions)
      const full = byTopic.map((t) => {
        const found = assessments.find((a) => a.topicNum === t.topicNum)
        return { topicNum: t.topicNum, probability: (found?.probability as Probability) ?? 'media' }
      })
      const matrix = buildRiskMatrix(byTopic, full)
      sectorData.push({ name: s.name, totalResponses: responses.length, matrix })
    }

    if (sectorData.length === 0) {
      return NextResponse.json({ error: 'Nenhum setor com respostas ainda.' }, { status: 404 })
    }

    // Setor geral / único → "a empresa como um todo"
    const single = sectorData.length === 1

    const html = buildHtml({
      origin: req.nextUrl.origin,
      companyName: company.name,
      fantasyName: company.fantasyName ?? null,
      cnpj: company.cnpj ?? null,
      city: company.city ?? null,
      state: company.state ?? null,
      responsible: company.responsible ?? null,
      logoUrl: company.logoUrl ?? null,
      sectors: sectorData,
      single,
      drpsValidatedAt: company.drpsValidatedAt ?? null,
      drpsValidatedBy: company.drpsValidatedBy ?? null,
      drpsNotes: company.drpsNotes ?? null,
    })

    return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  } catch (err) {
    console.error('[DRPS]', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }
}
