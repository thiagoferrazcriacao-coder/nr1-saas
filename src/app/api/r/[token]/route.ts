import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { calcScore } from '@/lib/scoring'
import Anthropic from '@anthropic-ai/sdk'

const answerSchema = z.object({
  answers: z.array(
    z.object({
      questionCode: z.string(),
      value: z.number().int().min(0).max(4),
    })
  ).length(50, 'Todas as 50 perguntas devem ser respondidas'),
})

// Roda análise IA diretamente — sem fila, sem Redis
async function runAiAnalysis(
  responseId: string,
  total: number,
  riskLevel: string,
  byTopic: Record<string, number>,
  sectorName: string
) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey || apiKey.includes('PLACEHOLDER')) return

  try {
    const client = new Anthropic({ apiKey })

    const topicLines = Object.entries(byTopic)
      .map(([topic, score]) => `- ${topic}: ${score.toFixed(2)}/4.0`)
      .join('\n')

    const prompt = `Você é especialista em saúde mental ocupacional e conformidade com a NR-1 (Norma Regulamentadora nº 1 do MTE).

Analise o perfil de risco psicossocial do setor "${sectorName}":

Score geral: ${total.toFixed(2)}/4.0 — Nível: ${riskLevel}

Scores por tópico:
${topicLines}

Responda SOMENTE em JSON válido:
{
  "diagnostico": "até 300 chars descrevendo o cenário geral",
  "topicos_criticos": ["tópico 1", "tópico 2", "tópico 3"],
  "acoes_imediatas": ["ação 1", "ação 2", "ação 3"],
  "acoes_preventivas": ["ação 1", "ação 2"],
  "adequacao_nr1": {
    "nivel_conformidade": "conforme|atencao|nao_conforme",
    "justificativa": "até 200 chars"
  },
  "prioridade_intervencao": "baixa|media|alta|urgente"
}`

    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = msg.content[0]?.type === 'text' ? msg.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return

    const classification = JSON.parse(jsonMatch[0])

    await prisma.aiAnalysis.create({
      data: {
        responseId,
        classification,
        recommendation: classification.diagnostico ?? '',
        modelUsed: 'claude-haiku-4-5-20251001',
      },
    })
  } catch (err) {
    console.error('[AI Analysis] erro:', err)
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const sector = await prisma.sector.findUnique({
      where: { linkToken: params.token },
      include: { company: { select: { name: true } } },
    })

    if (!sector) {
      return NextResponse.json({ error: 'Link inválido ou expirado.' }, { status: 404 })
    }

    const questions = await prisma.question.findMany({
      orderBy: { order: 'asc' },
      select: { code: true, topic: true, topicNum: true, text: true, hint: true, order: true },
    })

    return NextResponse.json({
      sectorName: sector.name,
      companyName: sector.company.name,
      questions,
    })
  } catch {
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const sector = await prisma.sector.findUnique({
      where: { linkToken: params.token },
    })

    if (!sector) {
      return NextResponse.json({ error: 'Link inválido.' }, { status: 404 })
    }

    const body = await req.json()
    const parsed = answerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? 'Dados inválidos.' },
        { status: 400 }
      )
    }

    const questions = await prisma.question.findMany({
      select: { code: true, topic: true, topicNum: true, reverse: true },
    })

    const { total, riskLevel, byTopic } = calcScore(parsed.data.answers, questions)

    const response = await prisma.response.create({
      data: {
        sectorId: sector.id,
        answers: parsed.data.answers as object[],
        riskScore: total,
        riskLevel,
      },
    })

    // Análise IA inline — sem Redis, sem fila
    await runAiAnalysis(response.id, total, riskLevel, byTopic, sector.name)

    return NextResponse.json({ message: 'Obrigado! Resposta registrada com sucesso.' })
  } catch {
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
