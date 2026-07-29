import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: { sectorId: string } }) {
  try {
    const { companyId } = requireAuth(req)
    const sector = await prisma.sector.findFirst({ where: { id: params.sectorId, companyId } })
    if (!sector) return NextResponse.json({ error: 'Setor não encontrado.' }, { status: 404 })
    const assessment = await prisma.companyAssessment.findUnique({ where: { companyId } })
    const items = Array.isArray(assessment?.items) ? assessment.items : []
    return NextResponse.json(items.map((item) => {
      const value = item as { topicNum: number; topic: string; probability: string; formalFloorApplied?: boolean; notApplicable?: boolean }
      return { topicNum: value.topicNum, topic: value.topic, probability: value.probability, formalFloorApplied: value.formalFloorApplied, notApplicable: value.notApplicable }
    }))
  } catch {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }
}

export async function POST() {
  return NextResponse.json({ error: 'A probabilidade é calculada exclusivamente pela Avaliação do Gestor.' }, { status: 403 })
}
