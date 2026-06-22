export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signEmployeeToken } from '@/lib/employee-auth'
import { buildMemberPayload } from '../_payload'

const schema = z.object({
  email:    z.string().email('E-mail inválido.'),
  password: z.string().min(1),
})

// POST — login do colaborador
export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const company = await prisma.company.findUnique({
      where: { learnCode: params.slug },
      select: { id: true, name: true },
    })
    if (!company) return NextResponse.json({ error: 'Empresa não encontrada.' }, { status: 404 })

    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
    const email = parsed.data.email.toLowerCase().trim()

    const employee = await prisma.employee.findUnique({
      where: { companyId_email: { companyId: company.id, email } },
    })
    if (!employee?.passwordHash || !(await bcrypt.compare(parsed.data.password, employee.passwordHash))) {
      return NextResponse.json({ error: 'E-mail ou senha incorretos.' }, { status: 401 })
    }

    const payload = await buildMemberPayload(company.id, company.name, employee)
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
