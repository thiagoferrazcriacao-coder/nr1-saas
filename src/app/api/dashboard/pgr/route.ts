import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { calcScore, buildRiskMatrix, type MatrixResult, type Probability } from '@/lib/scoring'

// Rota dinâmica: depende de autenticação (headers), não pode ser pré-renderizada
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

// Os 10 programas do plano anual contínuo (Protocolo NR-1)
const PROGRAMAS = [
  'Gestão do Estresse e Carga de Trabalho',
  'Comunicação Não-Violenta e Relacionamentos',
  'Liderança Saudável e Suporte da Equipe',
  'Prevenção e Combate ao Assédio',
  'Clareza de Papéis, Metas e Expectativas',
  'Reconhecimento e Valorização',
  'Autonomia e Organização do Trabalho',
  'Gestão de Mudanças e Segurança no Emprego',
  'Justiça Organizacional e Transparência',
  'Saúde Mental, Acolhimento e Trabalho Remoto',
]

// Medidas sugeridas por fator (usadas no plano de ação dos fatores médio+)
const MEDIDAS: Record<number, string> = {
  1:  'Reforçar o canal de denúncias e o treinamento de prevenção ao assédio; apuração célere e imparcial.',
  2:  'Capacitar lideranças em suporte à equipe; instituir rituais de apoio e escuta ativa.',
  3:  'Comunicar mudanças com antecedência e transparência; envolver as equipes nas decisões que as afetam.',
  4:  'Documentar e comunicar claramente papéis, metas e responsabilidades de cada função.',
  5:  'Implantar política de reconhecimento e feedback contínuo sobre o desempenho.',
  6:  'Ampliar autonomia na execução das tarefas; revisar excesso de controle e burocracia.',
  7:  'Tornar transparentes os critérios de avaliação, promoção e desligamento.',
  8:  'Estabelecer protocolo de acolhimento e apoio psicológico para eventos críticos.',
  9:  'Redistribuir tarefas e enriquecer funções para reduzir a ociosidade e a subutilização.',
  10: 'Dimensionar a equipe à demanda; revisar metas e jornada para reduzir a sobrecarga.',
  11: 'Mediar conflitos de forma justa; promover convivência e cooperação entre as equipes.',
  12: 'Melhorar os canais e o acesso à informação entre turnos, áreas e liderança.',
  13: 'Acompanhar de perto o trabalho remoto/isolado; garantir suporte e integração.',
}

// ─── Builder do HTML ──────────────────────────────────────────────────────────

function buildPgrHtml(opts: {
  companyName: string
  cnpj: string | null
  city: string | null
  state: string | null
  address: string | null
  responsible: string | null
  employeeCount: number | null
  workModality: string | null
  totalResponses: number
  sectorCount: number
  matrix: MatrixResult[]
}): string {
  const {
    companyName, cnpj, city, state, address, responsible, employeeCount, workModality,
    totalResponses, sectorCount, matrix,
  } = opts
  const date = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

  // Fatores que exigem plano de ação (moderado, alto ou crítico)
  const fatoresTratados = matrix.filter((m) => m.riskFinal !== 'baixo')

  const inventarioRows = matrix.map((m) => {
    const gravC = riskColors[m.gravidade === 'baixa' ? 'baixo' : m.gravidade === 'media' ? 'moderado' : 'alto']
    const probC = m.probabilidade === 'alta' ? '#dc2626' : m.probabilidade === 'media' ? '#ca8a04' : '#16a34a'
    const finC  = riskColors[m.riskFinal]
    const finBg = riskBg[m.riskFinal]
    return `
      <tr style="border-bottom:1px solid #f1f5f9;">
        <td style="padding:7px 10px;font-size:11px;color:#374151;">${m.topicNum}. ${m.topic}</td>
        <td style="padding:7px 10px;text-align:center;font-size:11px;color:${gravC};font-weight:600;">${gravLabel[m.gravidade]} (${m.gravScore.toFixed(1)})</td>
        <td style="padding:7px 10px;text-align:center;font-size:11px;color:${probC};font-weight:600;">${probLabel[m.probabilidade]}</td>
        <td style="padding:7px 10px;text-align:center;">
          <span style="background:${finBg};color:${finC};border:1px solid ${finC}40;padding:2px 9px;border-radius:20px;font-size:10px;font-weight:bold;">${riskLabel[m.riskFinal]}</span>
        </td>
      </tr>`
  }).join('')

  const planoRows = fatoresTratados.length
    ? fatoresTratados.map((m) => {
        const finC = riskColors[m.riskFinal]
        const prazo = m.riskFinal === 'critico' ? 'Imediato (até 30 dias)'
          : m.riskFinal === 'alto' ? 'Curto prazo (até 90 dias)'
          : 'Médio prazo (até 180 dias)'
        return `
          <tr style="border-bottom:1px solid #f1f5f9;">
            <td style="padding:8px 10px;font-size:11px;color:#374151;">${m.topicNum}. ${m.topic}
              <span style="color:${finC};font-weight:700;"> · ${riskLabel[m.riskFinal]}</span></td>
            <td style="padding:8px 10px;font-size:11px;color:#475569;">${MEDIDAS[m.topicNum] ?? 'Medida de controle a definir com a responsável técnica.'}</td>
            <td style="padding:8px 10px;font-size:11px;color:#475569;white-space:nowrap;">${prazo}</td>
            <td style="padding:8px 10px;font-size:11px;color:#475569;">RH / Liderança</td>
          </tr>`
      }).join('')
    : `<tr><td colspan="4" style="padding:14px;text-align:center;font-size:11px;color:#64748b;">Nenhum fator classificado acima de "Baixo". Manter monitoramento contínuo.</td></tr>`

  const programaRows = PROGRAMAS.map((p, i) => `
    <tr style="border-bottom:1px solid #f1f5f9;">
      <td style="padding:6px 10px;font-size:11px;color:#64748b;text-align:center;width:36px;">${i + 1}</td>
      <td style="padding:6px 10px;font-size:11px;color:#374151;">${p}</td>
    </tr>`).join('')

  const sec = (n: string, title: string) => `
    <h2 style="font-size:14px;color:#1e40af;border-bottom:2px solid #e2e8f0;padding-bottom:7px;margin:28px 0 14px;">
      ${n}. ${title}
    </h2>`

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <style>
    *{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:Arial,Helvetica,sans-serif;color:#1f2937;background:white;font-size:13px;}
    table{border-collapse:collapse;width:100%;}
    th{background:#f8fafc;font-weight:600;color:#6b7280;}
    p.txt{font-size:12px;color:#374151;line-height:1.65;margin-bottom:10px;}
    ul.txt{font-size:12px;color:#374151;line-height:1.7;padding-left:20px;margin-bottom:10px;}
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
  <div style="border-bottom:3px solid #1e40af;padding-bottom:20px;margin-bottom:8px;">
    <p style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">
      Programa de Gerenciamento de Riscos — PGR · Riscos Psicossociais (NR-1)
    </p>
    <h1 style="font-size:22px;color:#1e40af;font-weight:900;">${companyName}</h1>
    <div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:16px;font-size:11px;color:#64748b;">
      ${cnpj ? `<span>CNPJ: <strong>${cnpj}</strong></span>` : ''}
      ${(city || state) ? `<span>📍 ${[city, state].filter(Boolean).join('/')}</span>` : ''}
      ${address ? `<span>${address}</span>` : ''}
      ${responsible ? `<span>Responsável: <strong>${responsible}</strong></span>` : ''}
      ${employeeCount != null ? `<span>👥 ${employeeCount} colaboradores CLT</span>` : ''}
      ${workModality ? `<span>🏢 ${({ presencial: 'Presencial', hibrido: 'Híbrido', remoto: 'Remoto' } as Record<string,string>)[workModality] ?? workModality}</span>` : ''}
      <span>Emitido em ${date}</span>
    </div>
  </div>

  ${sec('1', 'Identificação e Objetivo')}
  <p class="txt">
    Este Programa de Gerenciamento de Riscos (PGR) consolida o gerenciamento dos <strong>riscos psicossociais</strong>
    da organização <strong>${companyName}</strong>, em atendimento à Norma Regulamentadora nº 1 (NR-1) e à Portaria MTE nº 1.419/2024.
    Foram avaliados <strong>${sectorCount} setor${sectorCount !== 1 ? 'es' : ''}</strong>, com base em
    <strong>${totalResponses} resposta${totalResponses !== 1 ? 's' : ''} anônima${totalResponses !== 1 ? 's' : ''}</strong> de colaboradores
    e na avaliação de probabilidade conduzida pela gestão.
  </p>
  <p class="txt">
    O objetivo é identificar, avaliar e controlar os fatores de risco psicossocial que possam afetar a saúde mental
    e o bem-estar dos trabalhadores, estabelecendo medidas de prevenção, um plano de ação e o monitoramento contínuo.
  </p>

  ${sec('2', 'Base Normativa')}
  <ul class="txt">
    <li>Norma Regulamentadora nº 1 (NR-1) — Disposições Gerais e Gerenciamento de Riscos Ocupacionais (GRO);</li>
    <li>Portaria MTE nº 1.419/2024 — inclusão dos riscos psicossociais no GRO;</li>
    <li>Lei nº 14.457/2022 — Programa Emprega + Mulheres, canal de denúncias e prevenção ao assédio;</li>
    <li>Itens 1.5.3.1.4, 1.5.3.2.1 e 1.5.4.4.5.3 da NR-1 — identificação de perigos, avaliação e controle de riscos.</li>
  </ul>

  ${sec('3', 'Metodologia')}
  <p class="txt">A avaliação combinou duas frentes complementares:</p>
  <ul class="txt">
    <li><strong>Gravidade</strong> — apurada de forma objetiva a partir do questionário anônimo respondido pelos colaboradores
      (50 itens, 13 fatores, método fundamentado em modelos validados internacionalmente);</li>
    <li><strong>Probabilidade</strong> — informada pela gestão para cada fator, considerando o contexto e os controles existentes.</li>
  </ul>
  <p class="txt">O cruzamento <strong>Gravidade × Probabilidade</strong> gera a classificação final de cada risco na Matriz NR-1.</p>

  ${sec('4', 'Documento de Critérios')}
  <div style="display:flex;gap:20px;flex-wrap:wrap;margin-bottom:8px;">
    <div style="flex:1;min-width:240px;">
      <p style="font-size:11px;font-weight:700;color:#475569;margin-bottom:6px;">Gravidade (questionário · escala 0–4)</p>
      <table style="font-size:11px;">
        <tr><td style="padding:4px 8px;border:1px solid #e2e8f0;background:#f0fdf4;color:#16a34a;font-weight:600;">Baixa</td><td style="padding:4px 8px;border:1px solid #e2e8f0;">0,0 – 1,0</td></tr>
        <tr><td style="padding:4px 8px;border:1px solid #e2e8f0;background:#fefce8;color:#ca8a04;font-weight:600;">Média</td><td style="padding:4px 8px;border:1px solid #e2e8f0;">1,1 – 2,0</td></tr>
        <tr><td style="padding:4px 8px;border:1px solid #e2e8f0;background:#fff7ed;color:#ea580c;font-weight:600;">Alta</td><td style="padding:4px 8px;border:1px solid #e2e8f0;">2,1 – 4,0</td></tr>
      </table>
    </div>
    <div style="flex:1;min-width:240px;">
      <p style="font-size:11px;font-weight:700;color:#475569;margin-bottom:6px;">Probabilidade (gestão)</p>
      <table style="font-size:11px;">
        <tr><td style="padding:4px 8px;border:1px solid #e2e8f0;background:#f0fdf4;color:#16a34a;font-weight:600;">Baixa</td><td style="padding:4px 8px;border:1px solid #e2e8f0;">Pouco provável no contexto atual</td></tr>
        <tr><td style="padding:4px 8px;border:1px solid #e2e8f0;background:#fefce8;color:#ca8a04;font-weight:600;">Média</td><td style="padding:4px 8px;border:1px solid #e2e8f0;">Possível, sem controles plenos</td></tr>
        <tr><td style="padding:4px 8px;border:1px solid #e2e8f0;background:#fef2f2;color:#dc2626;font-weight:600;">Alta</td><td style="padding:4px 8px;border:1px solid #e2e8f0;">Provável / recorrente</td></tr>
      </table>
    </div>
  </div>

  ${sec('5', 'Inventário de Riscos')}
  <table style="margin-bottom:8px;">
    <thead>
      <tr style="border-bottom:2px solid #e2e8f0;">
        <th style="padding:9px 10px;text-align:left;font-size:11px;">Fator de Risco Psicossocial</th>
        <th style="padding:9px 10px;text-align:center;font-size:11px;">Gravidade</th>
        <th style="padding:9px 10px;text-align:center;font-size:11px;">Probabilidade</th>
        <th style="padding:9px 10px;text-align:center;font-size:11px;">Risco Final</th>
      </tr>
    </thead>
    <tbody>${inventarioRows}</tbody>
  </table>

  ${sec('6', 'Plano de Ação')}
  <p class="txt">Medidas de controle para os fatores classificados acima de "Baixo", com prazo conforme a criticidade:</p>
  <table style="margin-bottom:8px;">
    <thead>
      <tr style="border-bottom:2px solid #e2e8f0;">
        <th style="padding:9px 10px;text-align:left;font-size:11px;">Fator</th>
        <th style="padding:9px 10px;text-align:left;font-size:11px;">Medida de Controle</th>
        <th style="padding:9px 10px;text-align:left;font-size:11px;">Prazo</th>
        <th style="padding:9px 10px;text-align:left;font-size:11px;">Responsável</th>
      </tr>
    </thead>
    <tbody>${planoRows}</tbody>
  </table>

  ${sec('7', 'Plano Anual Contínuo')}
  <p class="txt">Programa educativo contínuo de saúde mental no trabalho, distribuído ao longo de 52 semanas em 10 frentes:</p>
  <table style="margin-bottom:8px;max-width:560px;">
    <thead><tr style="border-bottom:2px solid #e2e8f0;"><th style="padding:7px 10px;text-align:center;font-size:11px;">#</th><th style="padding:7px 10px;text-align:left;font-size:11px;">Programa</th></tr></thead>
    <tbody>${programaRows}</tbody>
  </table>

  ${sec('8', 'Canal de Denúncias e Política Antiassédio')}
  <p class="txt">
    A organização mantém canal para recebimento de denúncias de assédio e violência, com tratamento sigiloso e proteção
    ao denunciante contra retaliação, em conformidade com a Lei nº 14.457/2022. A política antiassédio é divulgada a todos
    os colaboradores, com apuração imparcial e medidas corretivas quando cabível.
  </p>

  ${sec('9', 'Monitoramento e Arquivamento')}
  <ul class="txt">
    <li>Reavaliação periódica dos riscos psicossociais e revisão do plano de ação;</li>
    <li>Acompanhamento dos indicadores de saúde mental e da efetividade das medidas adotadas;</li>
    <li>Nova rodada de avaliação sempre que houver mudança organizacional relevante;</li>
    <li>Este PGR e seus registros devem ser <strong>arquivados por no mínimo 20 anos</strong>, conforme a NR-1.</li>
  </ul>

  <!-- Assinaturas -->
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
    <p>Programa de Gerenciamento de Riscos Psicossociais gerado pelo sistema Zelo.</p>
    <p style="margin-top:4px;font-weight:600;color:#64748b;">Zelo · ${companyName} · ${date}</p>
  </div>

</body>
</html>`
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { companyId } = requireAuth(req)

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        name: true, cnpj: true, city: true, state: true, address: true,
        responsible: true, employeeCount: true, workModality: true,
        sectors: { select: { id: true } },
        assessment: { select: { items: true } },
      },
    })
    if (!company) return NextResponse.json({ error: 'Empresa não encontrada.' }, { status: 404 })

    const sectorIds = company.sectors.map((s) => s.id)

    // Consolida TODAS as respostas de TODOS os setores
    const responses = await prisma.response.findMany({
      where: { sectorId: { in: sectorIds } },
      select: { answers: true },
    })
    if (responses.length === 0) {
      return NextResponse.json({ error: 'Sem respostas para gerar o PGR.' }, { status: 404 })
    }

    const questions = await prisma.question.findMany({
      select: { code: true, topic: true, topicNum: true, reverse: true },
    })

    // Média por questão considerando a empresa inteira
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

    const { byTopic } = calcScore(avgAnswers, questions)

    // Probabilidade vem da Avaliação do Gestor (CompanyAssessment)
    const assessmentItems = (company.assessment?.items as { topicNum: number; probability: Probability }[] | undefined) ?? []
    const fullAssessments = byTopic.map((t) => {
      const found = assessmentItems.find((a) => a.topicNum === t.topicNum)
      return { topicNum: t.topicNum, probability: found?.probability ?? ('media' as Probability) }
    })

    const matrix = buildRiskMatrix(byTopic, fullAssessments)

    const html = buildPgrHtml({
      companyName:    company.name,
      cnpj:           company.cnpj ?? null,
      city:           company.city ?? null,
      state:          company.state ?? null,
      address:        company.address ?? null,
      responsible:    company.responsible ?? null,
      employeeCount:  company.employeeCount ?? null,
      workModality:   company.workModality ?? null,
      totalResponses: responses.length,
      sectorCount:    sectorIds.length,
      matrix,
    })

    const date = new Date().toISOString().split('T')[0]
    const filename = `PGR-${company.name.replace(/\s+/g, '-')}-${date}.html`

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
