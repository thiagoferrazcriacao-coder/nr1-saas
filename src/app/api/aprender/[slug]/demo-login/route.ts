import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { resolveLearnSlug } from '@/lib/learn-code'
import { signEmployeeToken } from '@/lib/employee-auth'
import { buildMemberPayload } from '../_payload'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const resolved = await resolveLearnSlug(params.slug)
    if (!resolved) return NextResponse.json({ error: 'Link de treinamento não encontrado.' }, { status: 404 })
    const company = await prisma.company.findUnique({ where: { id: resolved.id }, select: { slug: true } })
    if (company?.slug !== 'zelo-demo-real') return NextResponse.json({ error: 'Acesso automático disponível somente na demonstração.' }, { status: 403 })

    const demoEmail = resolved.role === 'gestor' ? 'gestor.demo@zelo.test' : 'funcionario.demo@zelo.test'
    const demoName = resolved.role === 'gestor' ? 'Mariana Oliveira' : 'Carlos Henrique'
    const demoCpf = resolved.role === 'gestor' ? '52998224725' : '11144477735'
    const employee = await prisma.employee.upsert({
      where: { companyId_email: { companyId: resolved.id, email: demoEmail } },
      create: { companyId: resolved.id, email: demoEmail, name: demoName, cpf: demoCpf, phone: '(24) 99999-2026', role: resolved.role, passwordHash: await bcrypt.hash('demo-only', 10) },
      update: { name: demoName, cpf: demoCpf, phone: '(24) 99999-2026', role: resolved.role },
    })

    const payload = await buildMemberPayload(resolved.id, resolved.name, employee, resolved.role)
    const response = NextResponse.json(payload)
    response.cookies.set('emp_token', signEmployeeToken(employee.id, resolved.id), {
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 60 * 60 * 24 * 30, path: '/',
    })
    return response
  } catch (error) {
    console.error('[DEMO LEARN LOGIN]', error instanceof Error ? error.message : String(error))
    return NextResponse.json({ error: 'Não foi possível abrir a trilha demonstrativa.' }, { status: 500 })
  }
}
