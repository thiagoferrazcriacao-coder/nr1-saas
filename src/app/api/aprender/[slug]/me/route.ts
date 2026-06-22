export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getEmployeeFromReq } from '@/lib/employee-auth'
import { buildMemberPayload } from '../_payload'

// GET — retorna a sessão atual do colaborador (se logado) com aulas + progresso
export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const session = getEmployeeFromReq(req)
  if (!session) return NextResponse.json({ loggedIn: false })

  try {
    const company = await prisma.company.findUnique({
      where: { learnCode: params.slug },
      select: { id: true, name: true },
    })
    if (!company || company.id !== session.companyId) {
      return NextResponse.json({ loggedIn: false })
    }

    const employee = await prisma.employee.findUnique({
      where: { id: session.employeeId },
      select: { id: true, name: true },
    })
    if (!employee) return NextResponse.json({ loggedIn: false })

    const payload = await buildMemberPayload(company.id, company.name, employee)
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
