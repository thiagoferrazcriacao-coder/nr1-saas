export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword:     z.string().min(6, 'A nova senha precisa ter ao menos 6 caracteres.'),
})

// POST — troca a senha do gestor logado (confere a senha atual antes).
export async function POST(req: NextRequest) {
  try {
    const { userId } = requireAuth(req)
    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Dados inválidos.' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true } })
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 })

    const ok = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash)
    if (!ok) return NextResponse.json({ error: 'A senha atual está incorreta.' }, { status: 400 })

    const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12)
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }
}
