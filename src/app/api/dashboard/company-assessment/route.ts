import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

const itemSchema = z.object({
  topicNum: z.number().int().min(1).max(13),
  topic: z.string(),
  probability: z.enum(['baixa', 'media', 'alta']),
})

const schema = z.object({
  items: z.array(itemSchema).length(13, 'Todos os 13 tópicos devem ser avaliados'),
})

// GET — busca avaliação atual da empresa
export async function GET(req: NextRequest) {
  try {
    const { companyId } = requireAuth(req)

    const assessment = await prisma.companyAssessment.findUnique({
      where: { companyId },
    })

    return NextResponse.json({ assessment })
  } catch {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }
}

// POST — salva ou atualiza avaliação do gestor
export async function POST(req: NextRequest) {
  try {
    const { companyId } = requireAuth(req)

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? 'Dados inválidos.' },
        { status: 400 }
      )
    }

    const assessment = await prisma.companyAssessment.upsert({
      where: { companyId },
      create: {
        companyId,
        items: parsed.data.items,
      },
      update: {
        items: parsed.data.items,
      },
    })

    return NextResponse.json({ assessment })
  } catch {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }
}
