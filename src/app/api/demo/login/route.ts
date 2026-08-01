import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { calculateManagerResults, MANAGER_QUESTIONS } from '@/lib/manager-assessment'
import { signToken, signRefreshToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const DEMO_EMAIL = 'demo@zelo.test'
const DEMO_SLUG = 'zelo-demo-real'

export async function POST() {
  try {
    const old = await prisma.company.findUnique({ where: { slug: DEMO_SLUG }, select: { id: true } })
    if (old) await prisma.company.delete({ where: { id: old.id } })

    const company = await prisma.company.create({
      data: {
        name: 'Alvorada Serviços Industriais Ltda.',
        fantasyName: 'Alvorada Serviços',
        slug: DEMO_SLUG,
        cnpj: '12.345.678/0001-90',
        responsible: 'Mariana Oliveira',
        gestorName: 'Mariana Oliveira',
        phone: '(24) 3333-2026',
        address: 'Avenida das Indústrias, 100',
        city: 'Volta Redonda',
        state: 'RJ',
        employeeCount: 32,
        workModality: 'presencial',
        termsAcceptedAt: new Date(),
        plan: 'starter',
      },
    })
    const user = await prisma.user.create({
      data: { companyId: company.id, email: DEMO_EMAIL, passwordHash: await bcrypt.hash('demo-only', 10), role: 'ADMIN' },
    })

    const answers = MANAGER_QUESTIONS.map((q) => ({ code: q.code, value: q.topicNum === 13 ? 1 : (q.topicNum % 4) }))
    await prisma.companyAssessment.create({
      data: {
        companyId: company.id,
        items: calculateManagerResults(answers) as unknown as Prisma.InputJsonValue,
        openingAcceptedAt: new Date(),
        openingAcceptedBy: `${user.id}:${DEMO_EMAIL}`,
        confirmationAt: new Date(),
        confirmationBy: `${user.id}:${DEMO_EMAIL}`,
      },
    })

    const sectors = await Promise.all(['Administrativo', 'Produção', 'Comercial'].map((name) => prisma.sector.create({ data: { companyId: company.id, name } })))
    const questions = await prisma.question.findMany({ select: { code: true, topicNum: true, reverse: true } })
    for (const [sectorIndex, sector] of sectors.entries()) {
      const rows = Array.from({ length: sectorIndex === 1 ? 16 : 8 }, (_, respondent) => ({
        sectorId: sector.id,
        answers: questions.map((q) => ({ questionCode: q.code, value: Math.max(0, Math.min(4, (q.topicNum + respondent + sectorIndex) % 4)) })),
      }))
      if (rows.length) await prisma.response.createMany({ data: rows as Prisma.ResponseCreateManyInput[] })
    }

    const token = signToken({ userId: user.id, companyId: company.id, role: user.role, email: DEMO_EMAIL })
    const refresh = signRefreshToken({ userId: user.id })
    const response = NextResponse.json({ ok: true, companyId: company.id, email: DEMO_EMAIL })
    response.cookies.set('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 60 * 15, path: '/' })
    response.cookies.set('refresh_token', refresh, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/' })
    return response
  } catch (error) {
    console.error('[DEMO LOGIN]', error instanceof Error ? error.message : String(error))
    return NextResponse.json({ error: 'Não foi possível preparar o ambiente demonstrativo.' }, { status: 500 })
  }
}
