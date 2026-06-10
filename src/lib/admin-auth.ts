import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

const secret = process.env.ADMIN_JWT_SECRET ?? process.env.JWT_SECRET ?? 'fallback-admin-secret'

export function signAdminToken(): string {
  return jwt.sign({ role: 'admin' }, secret, { expiresIn: '24h' })
}

export function verifyAdminToken(token: string): boolean {
  try {
    jwt.verify(token, secret)
    return true
  } catch {
    return false
  }
}

export function requireAdmin(req: NextRequest): void {
  const token = req.cookies.get('admin_token')?.value
  if (!token) throw new Error('Não autorizado')
  if (!verifyAdminToken(token)) throw new Error('Não autorizado')
}
