import { NextRequest } from 'next/server'
import * as jose from 'jose'

const secret = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET ?? process.env.JWT_SECRET ?? 'fallback-admin-secret'
)

export async function signAdminToken(): Promise<string> {
  return new jose.SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(secret)
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    await jose.jwtVerify(token, secret)
    return true
  } catch {
    return false
  }
}

export async function requireAdmin(req: NextRequest): Promise<void> {
  const token = req.cookies.get('admin_token')?.value
  if (!token) throw new Error('Não autorizado')
  const valid = await verifyAdminToken(token)
  if (!valid) throw new Error('Não autorizado')
}
