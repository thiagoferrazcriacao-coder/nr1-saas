import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req)

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
        workModality:    true,
        drpsStatus:      true,
        drpsValidatedAt: true,
        drpsValidatedBy: true,
        drpsNotes:       true,
        termsAcceptedAt: true,
        createdAt:       true,
        _count: {
          select: { sectors: true },
        },
        sectors: {
          select: {
            _count: { select: { responses: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const result = companies.map((c) => ({
      ...c,
      totalResponses: c.sectors.reduce((sum, s) => sum + s._count.responses, 0),
      sectors: undefined,
    }))

    return NextResponse.json({ companies: result })
  } catch (err) {
    if ((err as Error).message === 'Não autorizado') {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }
    console.error(err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
