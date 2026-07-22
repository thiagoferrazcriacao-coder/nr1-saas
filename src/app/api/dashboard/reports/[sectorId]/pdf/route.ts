import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { calcScore, buildRiskMatrix, type MatrixResult, type Probability } from '@/lib/scoring'
import { FACTOR_ANALYSIS } from '@/lib/drps-content'

export const dynamic = 'force-dynamic'

// ─── Cores e rótulos ──────────────────────────────────────────────────────────

const riskColors: Record<string, string> = {
  baixo: '#16a34a', moderado: '#ca8a04', alto: '#ea580c', critico: '#dc2626',
}
const riskBg: Record<string, string> = {
  baixo: '#f0fdf4', moderado: '#fefce8', alto: '#fff7ed', critico: '#fef2f2',
}
const riskLabel: Record<string, string> = {
  baixo: 'Baixo', moderado: 'Moderado', alto: 'Alto', critico: 'Crítico',
}
const gravLabel: Record<string, string> = { baixa: 'Baixa', media: 'Média', alta: 'Alta' }
const probLabel: Record<string, string> = { baixa: 'Baixa', media: 'Média', alta: 'Alta' }

// ─── Builder do HTML ──────────────────────────────────────────────────────────

function buildHtml(opts: {
  sectorName:      string
  companyName:     string
  fantasyName:     string | null
  totalResponses:  number
  avgScore:        number
  riskLevel:       string
  matrix:          MatrixResult[]
  assessedBy:      string | null
  cnpj:            string | null
  city:            string | null
  state:           string | null
  address:         string | null
  responsible:     string | null
  gestorName:      string | null
  gestorSignatureUrl: string | null
  employeeCount:   number | null
  workModality:    string | null
  drpsValidatedAt: Date | null
  drpsValidatedBy: string | null
  drpsNotes:       string | null
}): string {
  const {
    sectorName, companyName, fantasyName, totalResponses, matrix, assessedBy,
    cnpj, city, state, address, responsible, gestorName, gestorSignatureUrl, employeeCount,
    drpsValidatedAt, drpsValidatedBy, drpsNotes,
  } = opts

  const now = new Date()
  const date = now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  const proxima = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
    .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  // Distribuição dos riscos
  const nBaixo    = matrix.filter((m) => m.riskFinal === 'baixo').length
  const nModerado = matrix.filter((m) => m.riskFinal === 'moderado').length
  const nAltoCrit = matrix.filter((m) => m.riskFinal === 'alto' || m.riskFinal === 'critico').length
  const elevados  = matrix.filter((m) => m.riskFinal !== 'baixo')

  const participacao = employeeCount && employeeCount > 0
    ? Math.min(100, Math.round((totalResponses / employeeCount) * 100))
    : null

  // Frase-resumo adaptada ao perfil
  const resumoFrase = nAltoCrit > 0
    ? `A avaliação identificou <strong>${nAltoCrit} fator${nAltoCrit !== 1 ? 'es' : ''}</strong> em nível Alto ou Crítico, que demanda${nAltoCrit !== 1 ? 'm' : ''} intervenção imediata, além de ${nModerado} em nível moderado. A priorização das medidas está detalhada no Plano de Ação integrante do PGR.`
    : nModerado > 0
      ? `Resultado tecnicamente classificado como positivo. A organização apresenta perfil de baixa exposição aos riscos psicossociais previstos pela NR-1, com <strong>${nModerado} fator${nModerado !== 1 ? 'es' : ''}</strong> em nível moderado que demanda${nModerado !== 1 ? 'm' : ''} ações preventivas estruturadas para evitar evolução para níveis críticos.`
      : 'Resultado tecnicamente classificado como positivo. A organização apresenta perfil de baixa exposição aos fatores de risco psicossocial previstos pela NR-1, sem fatores em nível moderado, alto ou crítico no momento da avaliação.'

  const sec = (n: string, title: string) => `
    <h2 style="font-size:14px;color:#1e40af;border-bottom:2px solid #e2e8f0;padding-bottom:7px;margin:30px 0 14px;">
      ${n}. ${title}
    </h2>`

  // ── 4. Matriz de risco completa ───────────────────────────────────────────
  const matrixRows = matrix.map((m) => {
    const gravC = riskColors[m.gravidade === 'baixa' ? 'baixo' : m.gravidade === 'media' ? 'moderado' : 'alto']
    const probC = m.probabilidade === 'alta' ? '#dc2626' : m.probabilidade === 'media' ? '#ca8a04' : '#16a34a'
    const finC  = riskColors[m.riskFinal]
    const finBg = riskBg[m.riskFinal]
    return `
      <tr style="border-bottom:1px solid #f1f5f9;">
        <td style="padding:7px 10px;font-size:11px;color:#94a3b8;text-align:center;">${String(m.topicNum).padStart(2, '0')}</td>
        <td style="padding:7px 10px;font-size:11px;color:#374151;">${m.topic}</td>
        <td style="padding:7px 10px;text-align:center;font-size:11px;color:${gravC};font-weight:600;">${gravLabel[m.gravidade]}</td>
        <td style="padding:7px 10px;text-align:center;font-size:11px;color:${probC};font-weight:600;">${probLabel[m.probabilidade]}</td>
        <td style="padding:7px 10px;text-align:center;">
          <span style="background:${finBg};color:${finC};border:1px solid ${finC}40;padding:2px 9px;border-radius:20px;font-size:10px;font-weight:bold;">${riskLabel[m.riskFinal]}</span>
        </td>
      </tr>`
  }).join('')

  // ── 5. Análise qualitativa por fator ──────────────────────────────────────
  const analise = matrix.map((m) => {
    const fa = FACTOR_ANALYSIS[m.topicNum]
    const elevado = m.riskFinal !== 'baixo'
    const finC = riskColors[m.riskFinal], finBg = riskBg[m.riskFinal]
    const gravC = riskColors[m.gravidade === 'baixa' ? 'baixo' : m.gravidade === 'media' ? 'moderado' : 'alto']
    const probC = m.probabilidade === 'alta' ? '#dc2626' : m.probabilidade === 'media' ? '#ca8a04' : '#16a34a'
    let texto = elevado ? (fa?.exposicao ?? '') : (fa?.protetivo ?? '')
    if (m.riskFinal === 'critico') {
      texto = `<strong style="color:${finC};">Trata-se de risco CRÍTICO, exigindo ação imediata e obrigatória, com medidas de controle adotadas em caráter emergencial.</strong> ${texto}`
    } else if (m.riskFinal === 'alto') {
      texto = `<strong style="color:${finC};">A intervenção é prioritária e de implementação imediata.</strong> ${texto}`
    }
    const grav = m.gravScore.toFixed(1).replace('.', ',')
    return `
      <div style="margin-bottom:18px;page-break-inside:avoid;">
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:6px;">
          <span style="font-size:13px;font-weight:800;color:#1e3a8a;">${String(m.topicNum).padStart(2, '0')}. ${m.topic}</span>
          <span style="font-size:10px;color:${gravC};">Gravidade: <strong>${gravLabel[m.gravidade]}</strong></span>
          <span style="font-size:10px;color:#64748b;">Pontuação: <strong>${grav}/4,0</strong></span>
          <span style="font-size:10px;color:${probC};">Probabilidade: <strong>${probLabel[m.probabilidade]}</strong></span>
          <span style="background:${finBg};color:${finC};border:1px solid ${finC}40;padding:1px 9px;border-radius:20px;font-size:10px;font-weight:bold;">${riskLabel[m.riskFinal]}</span>
        </div>
        <p style="font-size:11.5px;color:#374151;line-height:1.6;text-align:justify;">${texto}</p>
      </div>`
  }).join('')

  // ── 6. Pontos de atenção ──────────────────────────────────────────────────
  const pontosAtencao = elevados.length
    ? elevados.map((m) => {
        const fa = FACTOR_ANALYSIS[m.topicNum]
        const finC = riskColors[m.riskFinal]
        return `
          <div style="margin-bottom:12px;background:${riskBg[m.riskFinal]};border:1px solid ${finC}40;border-radius:8px;padding:12px 14px;">
            <p style="font-size:12px;font-weight:700;color:${finC};">Fator ${String(m.topicNum).padStart(2, '0')} — ${m.topic} (${riskLabel[m.riskFinal]})</p>
            <p style="font-size:11px;color:#475569;margin-top:4px;line-height:1.55;">${fa?.medida ?? ''}</p>
          </div>`
      }).join('')
    : `<p style="font-size:12px;color:#374151;line-height:1.6;">Nenhum fator foi classificado acima do nível Baixo no momento da avaliação. Recomenda-se a manutenção das boas práticas vigentes e o monitoramento contínuo previsto no PGR.</p>`

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <style>
    *{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:Arial,Helvetica,sans-serif;color:#1f2937;background:white;font-size:13px;}
    table{border-collapse:collapse;width:100%;}
    th{background:#f8fafc;font-weight:600;color:#6b7280;}
    p.txt{font-size:12px;color:#374151;line-height:1.65;margin-bottom:10px;text-align:justify;}
    @media print{.no-print{display:none!important;}body{padding:20px;}}
  </style>
</head>
<body style="padding:40px 48px;max-width:900px;margin:0 auto;">

  <div class="no-print" style="text-align:right;margin-bottom:20px;">
    <button onclick="window.print()" style="background:#1e40af;color:white;border:none;padding:10px 24px;border-radius:8px;cursor:pointer;font-size:14px;font-weight:bold;">
      🖨️ Imprimir / Salvar PDF
    </button>
  </div>

  <!-- Capa -->
  <div style="text-align:center;border-bottom:3px solid #1e40af;padding-bottom:24px;margin-bottom:8px;">
    <p style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;">Relatório Técnico</p>
    <h1 style="font-size:30px;color:#1e40af;font-weight:900;margin-top:6px;">DRPS</h1>
    <p style="font-size:14px;color:#475569;margin-top:2px;">Diagnóstico de Riscos Psicossociais</p>
    <p style="font-size:13px;color:#1e3a8a;font-weight:600;margin-top:14px;">${companyName} — Setor: ${sectorName}</p>
    <p style="font-size:11px;color:#94a3b8;margin-top:2px;">${date}</p>
  </div>

  ${sec('1', 'Identificação')}
  <table style="font-size:12px;margin-bottom:4px;">
    <tbody>
      <tr><td style="padding:6px 10px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600;width:38%;">Razão social</td><td style="padding:6px 10px;border:1px solid #e2e8f0;">${companyName}</td></tr>
      ${fantasyName ? `<tr><td style="padding:6px 10px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600;">Nome fantasia</td><td style="padding:6px 10px;border:1px solid #e2e8f0;">${fantasyName}</td></tr>` : ''}
      ${cnpj ? `<tr><td style="padding:6px 10px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600;">CNPJ</td><td style="padding:6px 10px;border:1px solid #e2e8f0;">${cnpj}</td></tr>` : ''}
      <tr><td style="padding:6px 10px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600;">Setor avaliado</td><td style="padding:6px 10px;border:1px solid #e2e8f0;">${sectorName}</td></tr>
      ${(city || state) ? `<tr><td style="padding:6px 10px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600;">Localização</td><td style="padding:6px 10px;border:1px solid #e2e8f0;">${[city, state].filter(Boolean).join('/')}${address ? ' · ' + address : ''}</td></tr>` : ''}
      ${responsible ? `<tr><td style="padding:6px 10px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600;">Responsável pela organização</td><td style="padding:6px 10px;border:1px solid #e2e8f0;">${responsible}</td></tr>` : ''}
      <tr><td style="padding:6px 10px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600;">Data do relatório</td><td style="padding:6px 10px;border:1px solid #e2e8f0;">${date}</td></tr>
      <tr><td style="padding:6px 10px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600;">Gestor responsável</td><td style="padding:6px 10px;border:1px solid #e2e8f0;">${gestorName || responsible || companyName}</td></tr>
      <tr><td style="padding:6px 10px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600;">Próxima reaplicação</td><td style="padding:6px 10px;border:1px solid #e2e8f0;">${proxima}</td></tr>
    </tbody>
  </table>

  ${sec('2', 'Resumo Executivo')}
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px;">
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px;text-align:center;">
      <p style="font-size:26px;font-weight:900;color:#1e3a8a;">${totalResponses}</p>
      <p style="font-size:10px;color:#64748b;text-transform:uppercase;">Respondentes</p>
    </div>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px;text-align:center;">
      <p style="font-size:26px;font-weight:900;color:#1e3a8a;">${participacao != null ? participacao + '%' : '—'}</p>
      <p style="font-size:10px;color:#64748b;text-transform:uppercase;">Taxa de participação</p>
    </div>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px;text-align:center;">
      <p style="font-size:26px;font-weight:900;color:#1e3a8a;">13</p>
      <p style="font-size:10px;color:#64748b;text-transform:uppercase;">Fatores avaliados</p>
    </div>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px;text-align:center;">
      <p style="font-size:26px;font-weight:900;color:#1e3a8a;">50</p>
      <p style="font-size:10px;color:#64748b;text-transform:uppercase;">Itens aplicados</p>
    </div>
  </div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:14px;">
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:12px;text-align:center;">
      <p style="font-size:22px;font-weight:900;color:#16a34a;">${nBaixo}</p>
      <p style="font-size:10px;color:#15803d;text-transform:uppercase;">Risco Baixo</p>
    </div>
    <div style="background:#fefce8;border:1px solid #fef08a;border-radius:10px;padding:12px;text-align:center;">
      <p style="font-size:22px;font-weight:900;color:#ca8a04;">${nModerado}</p>
      <p style="font-size:10px;color:#854d0e;text-transform:uppercase;">Risco Moderado</p>
    </div>
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:12px;text-align:center;">
      <p style="font-size:22px;font-weight:900;color:#dc2626;">${nAltoCrit}</p>
      <p style="font-size:10px;color:#991b1b;text-transform:uppercase;">Risco Alto ou Crítico</p>
    </div>
  </div>
  <p class="txt">${resumoFrase}</p>

  ${sec('3', 'Metodologia')}
  <p class="txt">
    A presente avaliação foi conduzida com base em instrumento técnico estruturado de rastreamento organizacional para
    identificação, análise e classificação de fatores de risco psicossocial relacionados ao trabalho, em conformidade com a
    Norma Regulamentadora 1 (NR-1), a Portaria MTE nº 1.419/2024 e a Portaria MTP nº 6.730/2023. A fundamentação teórica
    integra referenciais consolidados da psicodinâmica do trabalho e dos modelos de estresse ocupacional
    Demanda-Controle de Karasek e Esforço-Recompensa de Siegrist, além das diretrizes da Organização Mundial da Saúde (OMS)
    e da Organização Internacional do Trabalho (OIT). O instrumento, de caráter coletivo e organizacional, não se configura
    como avaliação clínica individual, estando alinhado ao Gerenciamento de Riscos Ocupacionais (GRO).
  </p>
  <p class="txt">
    <strong>Coleta:</strong> questionário estruturado em formato digital, com anonimato dos participantes, confidencialidade e
    tratamento agregado dos dados (LGPD). As respostas foram registradas em escala Likert de 0 a 4, representando a frequência
    percebida; itens de natureza protetiva foram tratados por lógica invertida.
    <strong>Gravidade:</strong> determinada pela conversão das respostas em valores numéricos e cálculo das médias por item e por fator.
    <strong>Probabilidade:</strong> definida por análise técnica especializada, considerando histórico, contexto e a efetividade dos controles.
    <strong>Classificação final:</strong> cruzamento entre gravidade e probabilidade na Matriz de Risco NR-1 (Baixo, Moderado, Alto ou Crítico).
  </p>

  ${sec('4', 'Matriz de Risco Completa')}
  <table style="margin-bottom:8px;">
    <thead>
      <tr style="border-bottom:2px solid #e2e8f0;">
        <th style="padding:9px 10px;text-align:center;font-size:11px;">Nº</th>
        <th style="padding:9px 10px;text-align:left;font-size:11px;">Fator de Risco Psicossocial</th>
        <th style="padding:9px 10px;text-align:center;font-size:11px;">Gravidade</th>
        <th style="padding:9px 10px;text-align:center;font-size:11px;">Probabilidade</th>
        <th style="padding:9px 10px;text-align:center;font-size:11px;">Classificação</th>
      </tr>
    </thead>
    <tbody>${matrixRows}</tbody>
  </table>

  ${sec('5', 'Análise Qualitativa por Fator de Risco')}
  <p class="txt" style="margin-bottom:16px;">
    Avaliação técnica individualizada dos 13 fatores de risco psicossocial, fundamentada em referenciais consolidados da
    psicodinâmica do trabalho e dos modelos contemporâneos de estresse ocupacional.
  </p>
  ${analise}

  ${sec('6', 'Pontos de Atenção')}
  ${elevados.length ? `<p class="txt">Os fatores classificados acima do nível Baixo demandam ação preventiva. As medidas técnicas recomendadas estão estruturadas no Plano de Ação integrante do PGR.</p>` : ''}
  ${pontosAtencao}

  ${sec('7', 'Plano de Ação Recomendado')}
  <p class="txt">
    Recomenda-se a adesão ao Plano de Ação Anual do Protocolo NR-1, instrumento estruturado em 52 sessões semanais de
    30 minutos, distribuídas em dez programas técnicos que cobrem integralmente os 13 fatores de risco psicossocial previstos
    na norma. ${elevados.length ? 'Para os fatores classificados acima do nível Baixo, foram previstas ações específicas de controle, conforme detalhado no Plano de Ação integrante do PGR.' : ''}
    O acompanhamento contínuo contempla registro eletrônico de presença dos colaboradores nas sessões, documentação das
    medidas adotadas e reaplicação completa do DRPS prevista para ${proxima}.
  </p>

  ${sec('8', 'Considerações Finais')}
  <p class="txt">
    ${nAltoCrit > 0
      ? `A organização apresenta fatores que exigem intervenção imediata, plenamente endereçáveis pelas ações estruturadas previstas no Plano de Ação, com expectativa técnica de redução do nível de exposição mediante implementação consistente das medidas indicadas.`
      : `A organização apresenta, no momento da avaliação, perfil tecnicamente classificado como de baixa exposição aos fatores de risco psicossocial. ${elevados.length ? 'Os pontos identificados em nível moderado são plenamente endereçáveis pelas ações estruturadas previstas no Plano de Ação.' : ''}`}
    O presente relatório atende aos requisitos técnicos da NR-1 para diagnóstico de fatores de risco psicossocial, devendo
    integrar a documentação oficial do Programa de Gerenciamento de Riscos (PGR) como anexo técnico, com guarda mínima de
    20 anos. O resultado não substitui avaliações clínicas individuais, restringindo-se à análise organizacional dos fatores de
    risco psicossocial no contexto coletivo de trabalho.
  </p>

  ${drpsNotes ? `
  <div style="margin-top:18px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px;">
    <p style="font-size:11px;font-weight:700;color:#475569;margin-bottom:6px;">📝 Observações Técnicas</p>
    <p style="font-size:12px;color:#374151;line-height:1.6;">${drpsNotes}</p>
  </div>` : ''}

  <!-- Assinatura -->
  <div style="margin-top:40px;padding-top:20px;border-top:2px solid #e2e8f0;">
    ${drpsValidatedAt ? `
    <div style="display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:24px;">
      <div>
        ${gestorSignatureUrl ? `<img src="${gestorSignatureUrl}" alt="Assinatura do gestor" style="max-height:52px;max-width:220px;object-fit:contain;display:block;margin-bottom:4px;" />` : '<div style="height:36px;border-bottom:1px solid #94a3b8;width:220px;margin-bottom:6px;"></div>'}
        <p style="font-size:14px;font-weight:700;color:#1e3a8a;">${gestorName || responsible || companyName}</p>
        <p style="font-size:11px;color:#64748b;">Gestor(a) Responsável</p>
        <p style="font-size:10px;color:#94a3b8;margin-top:4px;">Assinatura digital registrada em ${new Date(drpsValidatedAt).toLocaleString('pt-BR')}</p>
      </div>
      <div style="text-align:right;">
        <div style="display:inline-block;background:#f0fdf4;border:2px solid #16a34a;border-radius:8px;padding:10px 20px;">
          <p style="font-size:10px;font-weight:700;color:#15803d;">✅ DOCUMENTO VALIDADO</p>
          <p style="font-size:9px;color:#166534;margin-top:2px;">Conforme NR-1 / MTE</p>
        </div>
      </div>
    </div>
    ${drpsValidatedBy ? `<p style="font-size:9px;color:#94a3b8;margin-top:6px;">Validado por ${drpsValidatedBy}.</p>` : ''}` : `
    <div style="display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:24px;">
      <div>
        ${gestorSignatureUrl ? `<img src="${gestorSignatureUrl}" alt="Assinatura do gestor" style="max-height:52px;max-width:220px;object-fit:contain;display:block;margin-bottom:4px;" />` : '<div style="height:36px;border-bottom:1px solid #94a3b8;width:220px;margin-bottom:6px;"></div>'}
        <p style="font-size:14px;font-weight:700;color:#1e3a8a;">${gestorName || responsible || companyName}</p>
        <p style="font-size:11px;color:#64748b;">Gestor(a) Responsável</p>
        <p style="font-size:10px;color:#94a3b8;margin-top:4px;">Assinatura eletrônica · ${date}</p>
      </div>
      <div style="text-align:right;">
        <div style="display:inline-block;background:#f0fdf4;border:2px solid #16a34a;border-radius:8px;padding:10px 20px;">
          <p style="font-size:10px;font-weight:700;color:#15803d;">✅ ASSINADO ELETRONICAMENTE</p>
          <p style="font-size:9px;color:#166534;margin-top:2px;">Conforme NR-1 / MTE</p>
        </div>
      </div>
    </div>
    <div style="margin-top:14px;background:#fefce8;border:1px solid #fef08a;border-radius:8px;padding:10px 14px;">
      <p style="font-size:10px;color:#92400e;line-height:1.5;">
        <strong>Observação:</strong> a guarda deste documento e das evidências deve ser mantida por no mínimo 20 anos, conforme a NR-1.
      </p>
    </div>`}
  </div>

  <div style="margin-top:18px;padding-top:12px;border-top:1px solid #e2e8f0;font-size:10px;color:#94a3b8;text-align:center;">
    <p>DRPS — Diagnóstico de Riscos Psicossociais · Documento técnico em conformidade com a NR-1 · Portaria MTE 1.419/2024 · Portaria MTP 6.730/2023.</p>
    ${assessedBy ? `<p style="margin-top:2px;">Avaliação de probabilidade conduzida por ${assessedBy}.</p>` : ''}
    <p style="margin-top:4px;font-weight:600;color:#64748b;">${companyName} · ${sectorName} · ${date}</p>
  </div>

</body>
</html>`
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: { sectorId: string } }
) {
  try {
    const { companyId } = requireAuth(req)

    const sector = await prisma.sector.findFirst({
      where: { id: params.sectorId, companyId },
      include: {
        company: {
          select: {
            name: true, fantasyName: true, cnpj: true, city: true, state: true, address: true,
            responsible: true, gestorName: true, gestorSignatureUrl: true, employeeCount: true, workModality: true,
            drpsStatus: true, drpsValidatedAt: true, drpsValidatedBy: true, drpsNotes: true,
          },
        },
      },
    })
    if (!sector) return NextResponse.json({ error: 'Setor não encontrado.' }, { status: 404 })

    const [responses, assessments] = await Promise.all([
      prisma.response.findMany({ where: { sectorId: params.sectorId }, orderBy: { createdAt: 'desc' } }),
      prisma.topicAssessment.findMany({ where: { sectorId: params.sectorId }, orderBy: { topicNum: 'asc' } }),
    ])
    if (responses.length === 0) return NextResponse.json({ error: 'Sem respostas.' }, { status: 404 })

    const questions = await prisma.question.findMany({
      select: { code: true, topic: true, topicNum: true, reverse: true },
    })

    // Média por questão
    const byCode = new Map<string, number[]>()
    for (const r of responses) {
      for (const a of r.answers as { questionCode: string; value: number }[]) {
        if (!byCode.has(a.questionCode)) byCode.set(a.questionCode, [])
        byCode.get(a.questionCode)!.push(a.value)
      }
    }
    const avgAnswers = Array.from(byCode.entries()).map(([code, vals]) => ({
      questionCode: code,
      value: vals.reduce((s, v) => s + v, 0) / vals.length,
    }))

    const { total, riskLevel, byTopic } = calcScore(avgAnswers, questions)

    const fullAssessments = byTopic.map((t) => {
      const found = assessments.find((a) => a.topicNum === t.topicNum)
      return { topicNum: t.topicNum, probability: (found?.probability as Probability) ?? 'media' }
    })

    const matrix = buildRiskMatrix(byTopic, fullAssessments)
    const assessedBy = assessments[0]?.assessedBy ?? null

    const date     = new Date().toISOString().split('T')[0]
    const filename = `DRPS-${sector.name.replace(/\s+/g, '-')}-${date}.html`

    const html = buildHtml({
      sectorName:      sector.name,
      companyName:     sector.company.name,
      fantasyName:     sector.company.fantasyName ?? null,
      totalResponses:  responses.length,
      avgScore:        parseFloat(total.toFixed(2)),
      riskLevel,
      matrix,
      assessedBy,
      cnpj:            sector.company.cnpj ?? null,
      city:            sector.company.city ?? null,
      state:           sector.company.state ?? null,
      address:         sector.company.address ?? null,
      responsible:     sector.company.responsible ?? null,
      gestorName:      sector.company.gestorName ?? null,
      gestorSignatureUrl: sector.company.gestorSignatureUrl ?? null,
      employeeCount:   sector.company.employeeCount ?? null,
      workModality:    sector.company.workModality ?? null,
      drpsValidatedAt: sector.company.drpsValidatedAt ?? null,
      drpsValidatedBy: sector.company.drpsValidatedBy ?? null,
      drpsNotes:       sector.company.drpsNotes ?? null,
    })

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
