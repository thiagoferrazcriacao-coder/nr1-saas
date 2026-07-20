export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signEmployeeToken } from '@/lib/employee-auth'
import { resolveLearnSlug } from '@/lib/learn-code'
import { stripCPF } from '@/lib/cpf'
import { buildMemberPayload } from '../_payload'

// identifier = e-mail OU CPF (a pessoa escolhe)
const schema = z.object({
  identifier: z.string().trim().min(1, 'Informe o e-mail ou CPF.'),
  password:   z.string().min(1),
})

// POST — login com (e-mail ou CPF) + senha
export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const company = await resolveLearnSlug(params.slug)
    if (!company) return NextResponse.json({ error: 'Empresa não encontrada.' }, { status: 404 })

    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })

    const id = parsed.data.identifier.trim()
    const digits = stripCPF(id)
    const looksLikeCpf = digits.length === 11 && !id.includes('@')

    const employee = looksLikeCpf
      ? await prisma.employee.findFirst({ where: { companyId: company.id, cpf: digits } })
      : await prisma.employee.findUnique({ where: { companyId_email: { companyId: company.id, email: id.toLowerCase() } } })

    if (!employee?.passwordHash || !(await bcrypt.compare(parsed.data.password, employee.passwordHash))) {
      return NextResponse.json({ error: 'E-mail/CPF ou senha incorretos.' }, { status: 401 })
    }

    // A pessoa sempre vê a trilha do próprio papel (definido no cadastro).
    const role = (employee.role === 'gestor' ? 'gestor' : 'colaborador') as 'gestor' | 'colaborador'
    const payload = await buildMemberPayload(company.id, company.name, employee, role)
    const res = NextResponse.json(payload)
    res.cookies.set('emp_token', signEmployeeToken(employee.id, company.id), {
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, path: '/',
    })
    return res
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erro ao entrar.' }, { status: 500 })
  }
}
