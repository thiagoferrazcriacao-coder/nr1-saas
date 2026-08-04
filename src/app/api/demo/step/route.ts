import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { calculateManagerResults, MANAGER_QUESTIONS } from '@/lib/manager-assessment'
import { calcScore } from '@/lib/scoring'

export const dynamic = 'force-dynamic'

const DEMO_SLUG = 'zelo-demo-real'
const DEMO_COMPANY = {
  name: 'Alvorada Serviços Industriais Ltda.',
  fantasyName: 'Alvorada Serviços',
  cnpj: '12.345.678/0001-90',
  responsible: 'Mariana Oliveira',
  gestorName: 'Mariana Oliveira',
  phone: '(24) 3333-2026',
  address: 'Avenida das Indústrias, 100',
  city: 'Volta Redonda',
  state: 'RJ',
  employeeCount: 32,
  workModality: 'presencial' as const,
}

export async function POST(req: NextRequest) {
  try {
    const { companyId, userId } = requireAuth(req)
    const body = await req.json().catch(() => ({})) as { step?: string }
    const company = await prisma.company.findUnique({ where: { id: companyId }, select: { id: true, slug: true } })
    if (!company || company.slug !== DEMO_SLUG) return NextResponse.json({ error: 'Ação disponível somente no ambiente demonstrativo.' }, { status: 403 })

    if (body.step === 'empresa') {
      await prisma.company.update({ where: { id: companyId }, data: { ...DEMO_COMPANY } })
    } else if (body.step === 'gestor') {
      const answers = MANAGER_QUESTIONS.map((q) => ({ code: q.code, value: q.topicNum === 13 ? 1 : (q.topicNum % 4) }))
      await prisma.companyAssessment.upsert({
        where: { companyId },
        create: { companyId, items: calculateManagerResults(answers) as unknown as Prisma.InputJsonValue, openingAcceptedAt: new Date(), openingAcceptedBy: `${userId}:demo`, confirmationAt: new Date(), confirmationBy: `${userId}:demo` },
        update: { items: calculateManagerResults(answers) as unknown as Prisma.InputJsonValue, openingAcceptedAt: new Date(), openingAcceptedBy: `${userId}:demo`, confirmationAt: new Date(), confirmationBy: `${userId}:demo`, completedAt: new Date() },
      })
    } else if (body.step === 'time') {
      await prisma.company.update({ where: { id: companyId }, data: { ...DEMO_COMPANY, teamLinkSentAt: new Date() } })
      const sectors = await prisma.sector.findMany({ where: { companyId }, orderBy: { createdAt: 'asc' } })
      const questions = await prisma.question.findMany({ select: { code: true, topic: true, topicNum: true, reverse: true } })
      await prisma.response.deleteMany({ where: { sector: { companyId } } })
      for (const [sectorIndex, sector] of sectors.entries()) {
        const rows = Array.from({ length: sectorIndex === 1 ? 16 : 8 }, (_, respondent) => {
          const answers = questions.map((q) => ({ questionCode: q.code, value: Math.max(0, Math.min(4, (q.topicNum + respondent + sectorIndex) % 4)) }))
          const score = calcScore(answers, questions)
          return { sectorId: sector.id, answers, riskScore: score.total, riskLevel: score.riskLevel }
        })
        if (rows.length) await prisma.response.createMany({ data: rows as Prisma.ResponseCreateManyInput[] })
      }
    } else {
      return NextResponse.json({ error: 'Etapa demonstrativa inválida.' }, { status: 400 })
    }

    return NextResponse.json({ ok: true, step: body.step })
  } catch (error) {
    console.error('[DEMO STEP]', error instanceof Error ? error.message : String(error))
    return NextResponse.json({ error: 'Não foi possível preencher a etapa demonstrativa.' }, { status: 500 })
  }
}
