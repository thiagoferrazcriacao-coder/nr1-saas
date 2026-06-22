export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { sendVerificationCode, emailConfigured } from '@/lib/email'

const schema = z.object({ email: z.string().email('E-mail inválido.') })

// POST — gera um código de 6 dígitos e envia para o e-mail informado
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

    // Já existe conta com esse e-mail?
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Este e-mail já tem conta. Faça login.' }, { status: 409 })
    }

    // Gera código de 6 dígitos
    const code = String(Math.floor(100000 + Math.random() * 900000))
    const codeHash = await bcrypt.hash(code, 8)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutos

    await prisma.emailVerification.upsert({
      where:  { email },
      create: { email, codeHash, expiresAt, attempts: 0 },
      update: { codeHash, expiresAt, attempts: 0 },
    })

    await sendVerificationCode(email, code)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[SEND-CODE]', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Não foi possível enviar o código. Tente novamente.' }, { status: 500 })
  }
}
