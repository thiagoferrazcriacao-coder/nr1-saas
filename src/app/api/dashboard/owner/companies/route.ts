export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireOwner, isOwnerEmail } from '@/lib/auth'

// GET — lista todas as empresas clientes (apenas o dono do projeto)
export async function GET(req: NextRequest) {
  try {
    requireOwner(req)
  } catch {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }
  try {
    const companies = await prisma.company.findMany({
      select: {
        id: true, name: true, fantasyName: true, cnpj: true, city: true, state: true,
        responsible: true, employeeCount: true, plan: true, drpsStatus: true, createdAt: true,
        users: { select: { email: true }, take: 1 },
        sectors: { select: { _count: { select: { responses: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const result = companies
      .filter((c) => !isOwnerEmail(c.users[0]?.email))
      .map((c) => ({
      id: c.id,
      name: c.name,
      fantasyName: c.fantasyName,
      cnpj: c.cnpj,
      city: c.city,
      state: c.state,
      responsible: c.responsible,
      employeeCount: c.employeeCount,
      plan: c.plan,
      drpsStatus: c.drpsStatus,
      email: c.users[0]?.email ?? null,
      totalResponses: c.sectors.reduce((s, sec) => s + sec._count.responses, 0),
      sectorsCount: c.sectors.length,
      createdAt: c.createdAt,
    }))

    return NextResponse.json({ companies: result, total: result.length })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
