import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
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
        name: '',
        fantasyName: '',
        slug: DEMO_SLUG,
        cnpj: '',
        responsible: '',
        gestorName: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        employeeCount: null,
        workModality: 'presencial',
        termsAcceptedAt: new Date(),
        gestorTutorialCompletedAt: new Date(),
        plan: 'starter',
      },
    })
    const user = await prisma.user.create({
      data: { companyId: company.id, email: DEMO_EMAIL, passwordHash: await bcrypt.hash('demo-only', 10), role: 'ADMIN' },
    })

    const sectors = await Promise.all(['Administrativo', 'Produção', 'Comercial'].map((name) => prisma.sector.create({ data: { companyId: company.id, name } })))

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
