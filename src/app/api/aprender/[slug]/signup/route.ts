export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signEmployeeToken } from '@/lib/employee-auth'
import { buildMemberPayload } from '../_payload'

const schema = z.object({
  name:     z.string().trim().min(1).max(120),
  email:    z.string().email('E-mail inválido.'),
  password: z.string().min(4, 'A senha deve ter ao menos 4 caracteres.').max(100),
})

// POST — colaborador cria a própria conta (e-mail + senha)
export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const company = await prisma.company.findUnique({
      where: { slug: params.slug },
      select: { id: true, name: true },
    })
    if (!company) return NextResponse.json({ error: 'Empresa não encontrada.' }, { status: 404 })

    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Dados inválidos.' }, { status: 400 })
    }
    const email = parsed.data.email.toLowerCase().trim()

    const existing = await prisma.employee.findUnique({
      where: { companyId_email: { companyId: company.id, email } },
    })
    if (existing?.passwordHash) {
      return NextResponse.json({ error: 'Este e-mail já tem conta. Faça login.' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 10)
    const employee = existing
      ? await prisma.employee.update({ where: { id: existing.id }, data: { name: parsed.data.name, passwordHash } })
      : await prisma.employee.create({ data: { companyId: company.id, email, name: parsed.data.name, passwordHash } })

    const payload = await buildMemberPayload(company.id, company.name, employee)
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
