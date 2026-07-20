export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signEmployeeToken } from '@/lib/employee-auth'
import { resolveLearnSlug } from '@/lib/learn-code'
import { isValidCPF, stripCPF } from '@/lib/cpf'
import { buildMemberPayload } from '../_payload'

const schema = z.object({
  name:     z.string().trim().min(1, 'Digite seu nome completo.').max(120),
  cpf:      z.string().trim().min(1, 'Informe o CPF.'),
  phone:    z.string().trim().min(8, 'Informe o WhatsApp.').max(20),
  email:    z.string().email('E-mail inválido.'),
  password: z.string().min(4, 'A senha deve ter ao menos 4 caracteres.').max(100),
})

// POST — cria a própria conta (nome, CPF, WhatsApp, e-mail e senha). O papel vem do link.
export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const company = await resolveLearnSlug(params.slug)
    if (!company) return NextResponse.json({ error: 'Empresa não encontrada.' }, { status: 404 })

    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Dados inválidos.' }, { status: 400 })
    }

    const cpf = stripCPF(parsed.data.cpf)
    if (!isValidCPF(cpf)) {
      return NextResponse.json({ error: 'CPF inválido. Confira os números digitados.' }, { status: 400 })
    }
    const email = parsed.data.email.toLowerCase().trim()

    // Já existe conta com este e-mail ou este CPF nesta empresa?
    const existing = await prisma.employee.findFirst({
      where: { companyId: company.id, OR: [{ email }, { cpf }] },
    })
    if (existing?.passwordHash) {
      return NextResponse.json({ error: 'Já existe uma conta com este e-mail ou CPF. Faça login.' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 10)
    const data = { name: parsed.data.name, cpf, phone: parsed.data.phone, passwordHash, role: company.role }
    const employee = existing
      ? await prisma.employee.update({ where: { id: existing.id }, data: { email, ...data } })
      : await prisma.employee.create({ data: { companyId: company.id, email, ...data } })

    const payload = await buildMemberPayload(company.id, company.name, employee, company.role)
    const res = NextResponse.json(payload)
    res.cookies.set('emp_token', signEmployeeToken(employee.id, company.id), {
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, path: '/',
    })
    return res
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erro ao criar conta.' }, { status: 500 })
  }
}
