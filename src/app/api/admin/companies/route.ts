export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET(req: NextRequest) {
  try {
    requireAdmin(req)

    const companies = await prisma.company.findMany({
      select: {
        id:              true,
        name:            true,
        fantasyName:     true,
        cnpj:            true,
        city:            true,
        state:           true,
        responsible:     true,
        employeeCount:   true,
        plan:            true,
        drpsStatus:      true,
        createdAt:       true,
        users:           { select: { email: true }, take: 1 },
        sectors:         { select: { _count: { select: { responses: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const result = companies.map((c) => ({
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
      totalResponses: c.sectors.reduce((sum, s) => sum + s._count.responses, 0),
      sectorsCount: c.sectors.length,
      createdAt: c.createdAt,
    }))

    return NextResponse.json({ companies: result, total: result.length })
  } catch (err) {
    if ((err as Error).message === 'Não autorizado') {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }
    console.error(err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
