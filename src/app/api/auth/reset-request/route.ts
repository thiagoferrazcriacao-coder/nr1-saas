export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetCode, emailConfigured } from '@/lib/email'

const schema = z.object({ email: z.string().email('E-mail inválido.') })

// POST — pede um código para redefinir a senha de um gestor já cadastrado.
// Por segurança, respondemos sempre "ok" — sem revelar se o e-mail existe ou não.
export async function POST(req: NextRequest) {
  try {
    if (!emailConfigured()) {
      return NextResponse.json({ error: 'Serviço de e-mail indisponível no momento.' }, { status: 503 })
    }

    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Dados inválidos.' }, { status: 400 })
    }
    const email = parsed.data.email.toLowerCase().trim()

    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } })

    // Só envia se a conta existir — mas responde igual nos dois casos.
    if (user) {
      const code = String(Math.floor(100000 + Math.random() * 900000))
      const codeHash = await bcrypt.hash(code, 8)
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutos

      await prisma.emailVerification.upsert({
        where:  { email },
        create: { email, codeHash, expiresAt, attempts: 0 },
        update: { codeHash, expiresAt, attempts: 0 },
      })

      await sendPasswordResetCode(email, code)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[RESET-REQUEST]', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Não foi possível enviar o código. Tente novamente.' }, { status: 500 })
  }
}
