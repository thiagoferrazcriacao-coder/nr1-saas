export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getEmployeeFromReq } from '@/lib/employee-auth'
import { resolveLearnSlug } from '@/lib/learn-code'
import { isDemoCompany } from '@/lib/demo'
import { buildMemberPayload } from '../_payload'

// GET — sessão atual (se logada) com aulas + progresso; devolve o papel do link mesmo deslogado
export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const company = await resolveLearnSlug(params.slug)
  const linkRole = company?.role ?? 'colaborador'
  const companyName = company?.name ?? ''
  const demoUnlocked = company ? await isDemoCompany(company.id) : false

  const session = getEmployeeFromReq(req)
  if (!session) return NextResponse.json({ loggedIn: false, role: linkRole, companyName, demoUnlocked })

  try {
    if (!company || company.id !== session.companyId) {
      return NextResponse.json({ loggedIn: false, role: linkRole, companyName, demoUnlocked })
    }

    const employee = await prisma.employee.findUnique({
      where: { id: session.employeeId },
      select: { id: true, name: true, role: true },
    })
    if (!employee) return NextResponse.json({ loggedIn: false })

    const role = (employee.role === 'gestor' ? 'gestor' : 'colaborador') as 'gestor' | 'colaborador'
    const payload = await buildMemberPayload(company.id, company.name, employee, role)
    return NextResponse.json({ loggedIn: true, ...payload })
  } catch {
    return NextResponse.json({ loggedIn: false })
  }
}

// POST — logout
export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set('emp_token', '', { maxAge: 0, path: '/' })
  return res
}
