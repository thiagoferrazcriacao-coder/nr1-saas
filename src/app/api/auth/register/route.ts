import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signToken, signRefreshToken } from '@/lib/auth'

const schema = z.object({
  companyName: z.string().min(2).max(100),
  cnpj: z.string().min(14).max(18).optional(),
  email: z.string().email(),
  password: z.string().min(6),
  code: z.string().regex(/^\d{6}$/, 'Código inválido.'),
})

// Gera um slug único a partir do nome da empresa
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 50)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
    }

    const { companyName, cnpj, password, code } = parsed.data
    const email = parsed.data.email.toLowerCase().trim()

    // Verifica se e-mail já existe
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: 'E-mail já cadastrado.' }, { status: 409 })
    }

    // Valida o código de verificação enviado por e-mail
    const verification = await prisma.emailVerification.findUnique({ where: { email } })
    if (!verification) {
      return NextResponse.json({ error: 'Solicite um código de verificação primeiro.' }, { status: 400 })
    }
    if (verification.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Código expirado. Solicite um novo.' }, { status: 400 })
    }
    if (verification.attempts >= 5) {
      return NextResponse.json({ error: 'Muitas tentativas. Solicite um novo código.' }, { status: 429 })
    }
    const codeOk = await bcrypt.compare(code, verification.codeHash)
    if (!codeOk) {
      await prisma.emailVerification.update({ where: { email }, data: { attempts: { increment: 1 } } })
      return NextResponse.json({ error: 'Código incorreto.' }, { status: 400 })
    }

    // Gera slug único
    let slug = toSlug(companyName)
    const existing = await prisma.company.findUnique({ where: { slug } })
    if (existing) slug = `${slug}-${Date.now()}`

    // Cria empresa e usuário em transação
    const passwordHash = await bcrypt.hash(password, 12)

    const company = await prisma.company.create({
      data: {
        name: companyName,
        slug,
        cnpj: cnpj ?? null,
        plan: 'starter',
        users: {
          create: {
            email,
            passwordHash,
            role: 'ADMIN',
          },
        },
      },
      include: { users: true },
    })

    const user = company.users[0]

    // Código já usado — remove
    await prisma.emailVerification.delete({ where: { email } }).catch(() => {})

    const payload = {
      userId: user.id,
      companyId: company.id,
      role: user.role,
      email: user.email,
    }

    const token = signToken(payload)
    const refreshToken = signRefreshToken({ userId: user.id })

    const response = NextResponse.json({
      token,
      user: { name: company.name, role: user.role, companyId: company.id },
    })

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 15,
      path: '/',
    })
    response.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return response
  } catch (e) {
    console.error('[REGISTER ERROR]', e instanceof Error ? e.message : String(e))
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
