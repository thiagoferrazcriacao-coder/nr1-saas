export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

const schema = z.object({
  email:    z.string().email('E-mail inválido.'),
  code:     z.string().regex(/^\d{6}$/, 'Código inválido.'),
  password: z.string().min(6, 'A senha precisa ter ao menos 6 caracteres.'),
})

// POST — confirma o código e grava a nova senha do gestor.
export async function POST(req: NextRequest) {
  try {
    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Dados inválidos.' }, { status: 400 })
    }
    const { code, password } = parsed.data
    const email = parsed.data.email.toLowerCase().trim()

    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } })
    if (!user) {
      return NextResponse.json({ error: 'Código incorreto.' }, { status: 400 })
    }

    // Valida o código enviado por e-mail
    const verification = await prisma.emailVerification.findUnique({ where: { email } })
    if (!verification) {
      return NextResponse.json({ error: 'Solicite um novo código.' }, { status: 400 })
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

    // Grava a nova senha e invalida o código
    const passwordHash = await bcrypt.hash(password, 12)
    await prisma.user.update({ where: { email }, data: { passwordHash } })
    await prisma.emailVerification.delete({ where: { email } }).catch(() => {})

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[RESET-CONFIRM]', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
