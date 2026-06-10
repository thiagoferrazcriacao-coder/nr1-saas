import { NextRequest, NextResponse } from 'next/server'
import { signAdminToken } from '@/lib/admin-auth'
import { z } from 'zod'

const schema = z.object({ password: z.string().min(1) })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { password } = schema.parse(body)

    const expected = process.env.ADMIN_PASSWORD
    if (!expected || password !== expected) {
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
