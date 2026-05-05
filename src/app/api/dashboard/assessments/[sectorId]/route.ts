import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

const assessmentSchema = z.object({
  assessments: z.array(
    z.object({
      topicNum: z.number().int().min(1).max(13),
      topic: z.string(),
      probability: z.enum(['baixa', 'media', 'alta']),
      observations: z.string().max(500).optional(),
    })
  ),
  assessedBy: z.string().max(100).optional(),
})

export async function GET(
  req: NextRequest,
  { params }: { params: { sectorId: string } }
) {
  try {
    const { companyId } = requireAuth(req)

    const sector = await prisma.sector.findFirst({
      where: { id: params.sectorId, companyId },
    })
    if (!sector) return NextResponse.json({ error: 'Setor não encontrado.' }, { status: 404 })

    const assessments = await prisma.topicAssessment.findMany({
      where: { sectorId: params.sectorId },
      orderBy: { topicNum: 'asc' },
    })

    return NextResponse.json(assessments)
  } catch {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { sectorId: string } }
) {
  try {
    const { companyId } = requireAuth(req)

    const sector = await prisma.sector.findFirst({
      where: { id: params.sectorId, companyId },
    })
    if (!sector) return NextResponse.json({ error: 'Setor não encontrado.' }, { status: 404 })

    const body = await req.json()
    const parsed = assessmentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
    }

    // Upsert: cria ou atualiza cada tópico
    const results = await Promise.all(
      parsed.data.assessments.map((a) =>
        prisma.topicAssessment.upsert({
          where: { sectorId_topicNum: { sectorId: params.sectorId, topicNum: a.topicNum } },
          create: {
            sectorId: params.sectorId,
            topicNum: a.topicNum,
            topic: a.topic,
            probability: a.probability,
            observations: a.observations ?? null,
            assessedBy: parsed.data.assessedBy ?? null,
          },
          update: {
            probability: a.probability,
            observations: a.observations ?? null,
            assessedBy: parsed.data.assessedBy ?? null,
          },
        })
      )
    )

    return NextResponse.json({ saved: results.length })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
