import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

const secret = process.env.JWT_SECRET ?? 'fallback-employee-secret'

// Sessão do colaborador (área de membros do Material Didático)
export function signEmployeeToken(employeeId: string, companyId: string): string {
  return jwt.sign({ sub: employeeId, cid: companyId, kind: 'employee' }, secret, { expiresIn: '30d' })
}

export function getEmployeeFromReq(req: NextRequest): { employeeId: string; companyId: string } | null {
  const token = req.cookies.get('emp_token')?.value
  if (!token) return null
  try {
    const p = jwt.verify(token, secret) as { sub?: string; cid?: string; kind?: string }
    if (p.kind !== 'employee' || !p.sub || !p.cid) return null
    return { employeeId: p.sub, companyId: p.cid }
  } catch {
    return null
  }
}
