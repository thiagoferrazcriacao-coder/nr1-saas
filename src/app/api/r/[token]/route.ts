import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { calcScore } from '@/lib/scoring'
import { Queue } from 'bullmq'
import IORedis from 'ioredis'

const answerSchema = z.object({
  answers: z.array(
    z.object({
      questionCode: z.string(),
      value: z.number().int().min(0).max(4),
    })
  ).length(50, 'Todas as 50 perguntas devem ser respondidas'),
})

function getQueue() {
  const connection = new IORedis(process.env.REDIS_URL!, { maxRetriesPerRequest: null })
  return new Queue('ai-risk-analysis', { connection })
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

    // Enfileira análise IA com scores já calculados
    try {
      const queue = getQueue()
      await queue.add('analyze', {
        responseId: response.id,
        total,
        riskLevel,
        byTopic,
        sectorName: sector.name,
      })
    } catch {
      // Falha na fila não bloqueia o respondente
    }

    return NextResponse.json({ message: 'Obrigado! Resposta registrada com sucesso.' })
  } catch {
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
