import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { calcScore, buildRiskMatrix, type MatrixResult, type Probability } from '@/lib/scoring'

type AiClassification = {
  diagnostico?: string
  acoes_imediatas?: string[]
  acoes_preventivas?: string[]
  topicos_criticos?: string[]
  adequacao_nr1?: { nivel_conformidade?: string; justificativa?: string }
  prioridade_intervencao?: string
}

// ─── Cores ────────────────────────────────────────────────────────────────────

const riskColors: Record<string, string> = {
  baixo:    '#16a34a',
  moderado: '#ca8a04',
  alto:     '#ea580c',
  critico:  '#dc2626',
}

const riskBg: Record<string, string> = {
  baixo:    '#f0fdf4',
  moderado: '#fefce8',
  alto:     '#fff7ed',
  critico:  '#fef2f2',
}

const riskLabel: Record<string, string> = {
  baixo: 'Baixo', moderado: 'Moderado', alto: 'Alto', critico: 'Crítico',
}

const gravLabel: Record<string, string> = {
  baixa: 'Baixa', media: 'Média', alta: 'Alta',
}

const probLabel: Record<string, string> = {
  baixa: 'Baixa', media: 'Média', alta: 'Alta',
}

// ─── Builder do HTML ──────────────────────────────────────────────────────────

function buildHtml(opts: {
  sectorName:     string
  companyName:    string
  totalResponses: number
  avgScore:       number
  riskLevel:      string
  byTopic:        { topicNum: number; topic: string; score: number; riskLevel: string }[]
  matrix:         MatrixResult[]
  ai:             AiClassification | null
  assessedBy:     string | null
}): string {
  const { sectorName, companyName, totalResponses, avgScore, riskLevel, byTopic, matrix, ai, assessedBy } = opts
  const date     = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  const mainColor = riskColors[riskLevel] ?? '#64748b'
  const mainBg    = riskBg[riskLevel]    ?? '#f8fafc'

  // Risco final dominante da matriz
  const matrixFinal = (['critico','alto','moderado','baixo'] as const)
    .find((l) => matrix.some((m) => m.riskFinal === l)) ?? riskLevel

  // ── Tabela de scores de gravidade ─────────────────────────────────────────
  const gravRows = byTopic.map((t) => {
    const c   = riskColors[t.riskLevel]
    const bg  = riskBg[t.riskLevel]
    const pct = Math.round((t.score / 4) * 100)
    return `
      <tr style="border-bottom:1px solid #f1f5f9;">
        <td style="padding:8px 12px;font-size:12px;color:#374151;">${t.topicNum}. ${t.topic}</td>
        <td style="padding:8px 12px;text-align:center;font-weight:bold;color:${c};font-size:13px;">${t.score.toFixed(2)}</td>
        <td style="padding:8px 12px;width:160px;">
          <div style="background:#e2e8f0;border-radius:4px;height:8px;">
            <div style="width:${pct}%;height:8px;background:${c};border-radius:4px;"></div>
          </div>
        </td>
        <td style="padding:8px 12px;text-align:center;">
          <span style="background:${bg};color:${c};border:1px solid ${c}40;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:bold;">
            ${riskLabel[t.riskLevel] ?? t.riskLevel}
          </span>
        </td>
      </tr>`
  }).join('')

  // ── Tabela da Matriz NR-1 ─────────────────────────────────────────────────
  const matrixRows = matrix.map((m) => {
    const gravC  = riskColors[m.gravidade === 'baixa' ? 'baixo' : m.gravidade === 'media' ? 'moderado' : 'alto']
    const gravBg = riskBg[m.gravidade === 'baixa' ? 'baixo' : m.gravidade === 'media' ? 'moderado' : 'alto']
    const probC  = m.probabilidade === 'alta' ? '#dc2626' : m.probabilidade === 'media' ? '#ca8a04' : '#16a34a'
    const probBg = m.probabilidade === 'alta' ? '#fef2f2' : m.probabilidade === 'media' ? '#fefce8' : '#f0fdf4'
    const finC   = riskColors[m.riskFinal]
    const finBg  = riskBg[m.riskFinal]
    return `
      <tr style="border-bottom:1px solid #f1f5f9;">
        <td style="padding:8px 12px;font-size:12px;color:#374151;">${m.topicNum}. ${m.topic}</td>
        <td style="padding:8px 12px;text-align:center;">
          <span style="background:${gravBg};color:${gravC};border:1px solid ${gravC}40;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:bold;">
            ${gravLabel[m.gravidade]} (${m.gravScore.toFixed(1)})
          </span>
        </td>
        <td style="padding:8px 12px;text-align:center;">
          <span style="background:${probBg};color:${probC};border:1px solid ${probC}40;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:bold;">
            ${probLabel[m.probabilidade]}
          </span>
        </td>
        <td style="padding:8px 12px;text-align:center;">
          <span style="background:${finBg};color:${finC};border:1px solid ${finC}40;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:bold;">
            ${riskLabel[m.riskFinal]}
          </span>
        </td>
      </tr>`
  }).join('')

  // ── Seção de IA ───────────────────────────────────────────────────────────
  const aiSection = ai ? `
    <div style="margin-top:32px;page-break-before:always;">
      <h2 style="font-size:15px;color:#1e40af;border-bottom:2px solid #e2e8f0;padding-bottom:8px;margin-bottom:16px;">
        🤖 Análise e Recomendações (IA)
      </h2>
      ${ai.diagnostico ? `
        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;margin-bottom:16px;">
          <strong style="color:#1e40af;font-size:13px;">📋 Diagnóstico</strong>
          <p style="margin:8px 0 0;font-size:12px;color:#1e3a8a;line-height:1.6;">${ai.diagnostico}</p>
        </div>` : ''}
      ${ai.adequacao_nr1 ? `
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px;margin-bottom:16px;">
          <strong style="font-size:13px;">⚖️ Adequação NR-1: </strong>
          <span style="font-size:13px;font-weight:bold;">${ai.adequacao_nr1.nivel_conformidade?.replace('_',' ') ?? '-'}</span>
          ${ai.adequacao_nr1.justificativa ? `<p style="margin:6px 0 0;font-size:11px;color:#64748b;">${ai.adequacao_nr1.justificativa}</p>` : ''}
        </div>` : ''}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
        ${ai.acoes_imediatas?.length ? `
          <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:14px;">
            <strong style="color:#dc2626;font-size:13px;">🚨 Ações Imediatas</strong>
            <ol style="margin:8px 0 0;padding-left:18px;font-size:11px;color:#7f1d1d;line-height:1.7;">
              ${ai.acoes_imediatas.map((a) => `<li>${a}</li>`).join('')}
            </ol>
          </div>` : ''}
        ${ai.acoes_preventivas?.length ? `
          <div style="background:#fefce8;border:1px solid #fef08a;border-radius:8px;padding:14px;">
            <strong style="color:#854d0e;font-size:13px;">🛡️ Ações Preventivas</strong>
            <ol style="margin:8px 0 0;padding-left:18px;font-size:11px;color:#713f12;line-height:1.7;">
              ${ai.acoes_preventivas.map((a) => `<li>${a}</li>`).join('')}
            </ol>
          </div>` : ''}
      </div>
      ${ai.topicos_criticos?.length ? `
        <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:14px;">
          <strong style="color:#9a3412;font-size:13px;">⚠️ Tópicos Prioritários</strong>
          <p style="margin:6px 0 0;font-size:12px;color:#7c2d12;">${ai.topicos_criticos.join(' · ')}</p>
        </div>` : ''}
    </div>` : ''

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

  <!-- Botão imprimir (some ao imprimir) -->
  <div class="no-print" style="text-align:right;margin-bottom:20px;">
    <button onclick="window.print()"
      style="background:#1e40af;color:white;border:none;padding:10px 24px;border-radius:8px;cursor:pointer;font-size:14px;font-weight:bold;">
      🖨️ Imprimir / Salvar PDF
    </button>
  </div>

  <!-- Cabeçalho -->
  <div style="border-bottom:3px solid #1e40af;padding-bottom:20px;margin-bottom:28px;">
    <div style="display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:12px;">
      <div>
        <p style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">
          Diagnóstico de Risco Psicossocial — DRPS NR-1
        </p>
        <h1 style="font-size:22px;color:#1e40af;font-weight:900;">${companyName}</h1>
        <h2 style="font-size:16px;color:#374151;font-weight:600;margin-top:2px;">Setor: ${sectorName}</h2>
      </div>
      <div style="text-align:right;font-size:11px;color:#94a3b8;">
        <p>Emitido em ${date}</p>
        <p>${totalResponses} respondente${totalResponses !== 1 ? 's' : ''} (anônimos)</p>
        ${assessedBy ? `<p style="margin-top:4px;color:#64748b;font-weight:600;">Avaliador: ${assessedBy}</p>` : ''}
      </div>
    </div>
  </div>

  <!-- Cards de resumo -->
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:28px;">
    <div style="background:${mainBg};border:2px solid ${mainColor}30;border-radius:12px;padding:20px;">
      <p style="font-size:11px;color:${mainColor};font-weight:600;">Score de Gravidade Médio</p>
      <p style="font-size:36px;font-weight:900;color:${mainColor};line-height:1.1;margin-top:4px;">${avgScore.toFixed(2)}</p>
      <p style="font-size:11px;color:${mainColor};margin-top:2px;">de 4.0 — ${riskLabel[riskLevel] ?? riskLevel}</p>
    </div>
    <div style="background:${riskBg[matrixFinal]};border:2px solid ${riskColors[matrixFinal]}30;border-radius:12px;padding:20px;">
      <p style="font-size:11px;color:${riskColors[matrixFinal]};font-weight:600;">Risco Final (Matriz NR-1)</p>
      <p style="font-size:24px;font-weight:900;color:${riskColors[matrixFinal]};line-height:1.2;margin-top:8px;">
        ${riskLabel[matrixFinal]}
      </p>
      <p style="font-size:11px;color:${riskColors[matrixFinal]};margin-top:2px;">Gravidade × Probabilidade</p>
    </div>
    <div style="background:#f8fafc;border:2px solid #e2e8f030;border-radius:12px;padding:20px;">
      <p style="font-size:11px;color:#64748b;font-weight:600;">Tópicos Alto/Crítico</p>
      <p style="font-size:36px;font-weight:900;color:#1f2937;line-height:1.1;margin-top:4px;">
        ${matrix.filter((m) => m.riskFinal === 'critico' || m.riskFinal === 'alto').length}
      </p>
      <p style="font-size:11px;color:#94a3b8;margin-top:2px;">de ${matrix.length} tópicos</p>
    </div>
  </div>

  <!-- Tabela de Gravidade -->
  <h2 style="font-size:14px;color:#1e40af;border-bottom:2px solid #e2e8f0;padding-bottom:8px;margin-bottom:14px;">
    1. Gravidade por Tópico (resultado do questionário)
  </h2>
  <table style="margin-bottom:28px;">
    <thead>
      <tr style="border-bottom:2px solid #e2e8f0;">
        <th style="padding:10px 12px;text-align:left;font-size:11px;">Tópico</th>
        <th style="padding:10px 12px;text-align:center;font-size:11px;">Score</th>
        <th style="padding:10px 12px;font-size:11px;">Nível visual</th>
        <th style="padding:10px 12px;text-align:center;font-size:11px;">Gravidade</th>
      </tr>
    </thead>
    <tbody>${gravRows}</tbody>
  </table>

  <!-- Matriz NR-1 -->
  <h2 style="font-size:14px;color:#1e40af;border-bottom:2px solid #e2e8f0;padding-bottom:8px;margin-bottom:14px;">
    2. Matriz de Risco NR-1 — Gravidade × Probabilidade
  </h2>
  <table style="margin-bottom:16px;">
    <thead>
      <tr style="border-bottom:2px solid #e2e8f0;">
        <th style="padding:10px 12px;text-align:left;font-size:11px;">Tópico</th>
        <th style="padding:10px 12px;text-align:center;font-size:11px;">Gravidade</th>
        <th style="padding:10px 12px;text-align:center;font-size:11px;">Probabilidade</th>
        <th style="padding:10px 12px;text-align:center;font-size:11px;">Risco Final</th>
      </tr>
    </thead>
    <tbody>${matrixRows}</tbody>
  </table>

  <!-- Tabela de referência da matriz -->
  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px;margin-bottom:28px;display:inline-block;">
    <p style="font-size:10px;font-weight:600;color:#6b7280;margin-bottom:8px;text-transform:uppercase;">Tabela de Referência NR-1</p>
    <table style="font-size:11px;width:auto;">
      <thead>
        <tr>
          <th style="padding:4px 10px;background:#f1f5f9;border:1px solid #e2e8f0;">Prob ╲ Grav</th>
          <th style="padding:4px 10px;background:#f0fdf4;color:#16a34a;border:1px solid #e2e8f0;">Baixa</th>
          <th style="padding:4px 10px;background:#fefce8;color:#ca8a04;border:1px solid #e2e8f0;">Média</th>
          <th style="padding:4px 10px;background:#fef2f2;color:#dc2626;border:1px solid #e2e8f0;">Alta</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding:4px 10px;font-weight:600;background:#f1f5f9;border:1px solid #e2e8f0;">Alta</td>
          <td style="padding:4px 10px;text-align:center;background:#fefce8;color:#ca8a04;font-weight:bold;border:1px solid #e2e8f0;">Moderado</td>
          <td style="padding:4px 10px;text-align:center;background:#fff7ed;color:#ea580c;font-weight:bold;border:1px solid #e2e8f0;">Alto</td>
          <td style="padding:4px 10px;text-align:center;background:#fef2f2;color:#dc2626;font-weight:bold;border:1px solid #e2e8f0;">Crítico</td>
        </tr>
        <tr>
          <td style="padding:4px 10px;font-weight:600;background:#f1f5f9;border:1px solid #e2e8f0;">Média</td>
          <td style="padding:4px 10px;text-align:center;background:#f0fdf4;color:#16a34a;font-weight:bold;border:1px solid #e2e8f0;">Baixo</td>
          <td style="padding:4px 10px;text-align:center;background:#fefce8;color:#ca8a04;font-weight:bold;border:1px solid #e2e8f0;">Moderado</td>
          <td style="padding:4px 10px;text-align:center;background:#fff7ed;color:#ea580c;font-weight:bold;border:1px solid #e2e8f0;">Alto</td>
        </tr>
        <tr>
          <td style="padding:4px 10px;font-weight:600;background:#f1f5f9;border:1px solid #e2e8f0;">Baixa</td>
          <td style="padding:4px 10px;text-align:center;background:#f0fdf4;color:#16a34a;font-weight:bold;border:1px solid #e2e8f0;">Baixo</td>
          <td style="padding:4px 10px;text-align:center;background:#f0fdf4;color:#16a34a;font-weight:bold;border:1px solid #e2e8f0;">Baixo</td>
          <td style="padding:4px 10px;text-align:center;background:#fefce8;color:#ca8a04;font-weight:bold;border:1px solid #e2e8f0;">Moderado</td>
        </tr>
      </tbody>
    </table>
  </div>

  ${aiSection}

  <!-- Rodapé -->
  <div style="margin-top:40px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:10px;color:#94a3b8;text-align:center;">
    <p>Documento gerado pelo sistema NR-1 Risk — Diagnóstico de Risco Psicossocial.</p>
    <p style="margin-top:2px;">As respostas são coletadas de forma anônima e agregadas por setor. Este documento deve integrar o PGR da empresa.</p>
    <p style="margin-top:4px;font-weight:600;color:#64748b;">NR-1 Risk · ${companyName} · ${sectorName} · ${date}</p>
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
      include: { company: { select: { name: true } } },
    })
    if (!sector) return NextResponse.json({ error: 'Setor não encontrado.' }, { status: 404 })

    const [responses, assessments] = await Promise.all([
      prisma.response.findMany({
        where: { sectorId: params.sectorId },
        include: { aiAnalysis: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.topicAssessment.findMany({
        where: { sectorId: params.sectorId },
        orderBy: { topicNum: 'asc' },
      }),
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

    const assessmentInput = assessments.map((a) => ({
      topicNum:    a.topicNum,
      probability: a.probability as Probability,
    }))

    // Usa 'media' como padrão para tópicos sem avaliação
    const fullAssessments = byTopic.map((t) => {
      const found = assessmentInput.find((a) => a.topicNum === t.topicNum)
      return { topicNum: t.topicNum, probability: found?.probability ?? ('media' as Probability) }
    })

    const matrix = buildRiskMatrix(byTopic, fullAssessments)

    const latestAi   = responses.find((r) => r.aiAnalysis?.classification)?.aiAnalysis
    const assessedBy = assessments[0]?.assessedBy ?? null

    const date     = new Date().toISOString().split('T')[0]
    const filename = `DRPS-${sector.name.replace(/\s+/g, '-')}-${date}.html`

    const html = buildHtml({
      sectorName:     sector.name,
      companyName:    sector.company.name,
      totalResponses: responses.length,
      avgScore:       parseFloat(total.toFixed(2)),
      riskLevel,
      byTopic,
      matrix,
      ai:             (latestAi?.classification as AiClassification) ?? null,
      assessedBy,
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
