import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireOwner } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    requireOwner(req)
    const sampleSize = Math.min(50, Math.max(1, Number(req.nextUrl.searchParams.get('sample') ?? 5)))
    const onlyAdjusted = req.nextUrl.searchParams.get('adjusted') === 'true'
    const companies = await prisma.company.findMany({ where: { assessment: { isNot: null } }, select: { id: true, name: true, drpsStatus: true, createdAt: true, assessment: true, technicalReviews: { orderBy: { reviewedAt: 'desc' }, take: 1 } } })
    const candidates = companies.filter((company) => {
      if (!onlyAdjusted) return true
      const items = Array.isArray(company.assessment?.items) ? company.assessment.items as { prudentialAdjustmentApplied?: boolean }[] : []
      return items.some((item) => item.prudentialAdjustmentApplied)
    })
    const sample = [...candidates].sort(() => Math.random() - 0.5).slice(0, sampleSize)
    return NextResponse.json({ total: candidates.length, sample: sample.map(({ assessment, ...company }) => ({ ...company, completedAt: assessment?.completedAt, adjusted: Array.isArray(assessment?.items) && (assessment.items as { prudentialAdjustmentApplied?: boolean }[]).some((item) => item.prudentialAdjustmentApplied) })) })
  } catch { return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 }) }
}

const schema = z.object({ companyId: z.string().uuid(), sampleSize: z.number().int().min(1).max(100), findings: z.string().min(1).max(10000), actions: z.string().max(10000).optional() })
export async function POST(req: NextRequest) {
  try {
    const auth = requireOwner(req)
    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) return NextResponse.json({ error: 'Preencha empresa, tamanho da amostra e achados.' }, { status: 400 })
    const ata = await prisma.technicalReviewAta.create({ data: { ...parsed.data, reviewer: auth.email } })
    return NextResponse.json({ ata }, { status: 201 })
  } catch { return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 }) }
}
