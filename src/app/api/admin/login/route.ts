export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { signAdminToken } from '@/lib/admin-auth'
import { z } from 'zod'
import { verifyPlatformAdminPassword } from '@/lib/platform-admin-credentials'

const schema = z.object({ username: z.string().min(1), password: z.string().min(1) })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { username, password } = schema.parse(body)

    const expectedUser = process.env.ADMIN_USER ?? 'admin'
    const passwordOk = await verifyPlatformAdminPassword(password)
    if (username.trim().toLowerCase() !== expectedUser.toLowerCase() || !passwordOk) {
      return NextResponse.json({ error: 'Credenciais inválidas.' }, { status: 401 })
    }

    const token = signAdminToken()

    const res = NextResponse.json({ ok: true })
    res.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24h
      path: '/',
    })
    return res
  } catch {
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set('admin_token', '', { maxAge: 0, path: '/' })
  return res
}
