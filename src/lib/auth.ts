import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET!
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!

export type JwtPayload = {
  userId: string
  companyId: string
  role: string
  email: string
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' })
}

export function signRefreshToken(payload: Pick<JwtPayload, 'userId'>): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload
}

export function verifyRefreshToken(token: string): Pick<JwtPayload, 'userId'> {
  return jwt.verify(token, JWT_REFRESH_SECRET) as Pick<JwtPayload, 'userId'>
}

/** Extrai e valida o JWT do header Authorization ou cookie */
export function requireAuth(req: NextRequest): JwtPayload {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '') ?? req.cookies.get('token')?.value

  if (!token) throw new Error('Não autenticado')

  return verifyToken(token)
}
