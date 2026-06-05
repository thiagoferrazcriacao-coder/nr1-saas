import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

const schema = z.object({
  name: z.string().min(2).max(100).optional(),
  fantasyName: z.string().max(100).optional(),
  cnpj: z.string().max(18).optional(),
  responsible: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  address: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(2).optional(),
})

export async function GET(req: NextRequest) {
  try {
    const { companyId } = requireAuth(req)
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true, name: true, fantasyName: true, cnpj: true,
        responsible: true, phone: true, address: true, city: true, state: true,
      },
    })
    return NextResponse.json({ company })
  } catch {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { companyId } = requireAuth(req)
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
    }
    const company = await prisma.company.update({
      where: { id: companyId },
      data: parsed.data,
      select: {
        id: true, name: true, fantasyName: true, cnpj: true,
        responsible: true, phone: true, address: true, city: true, state: true,
      },
    })
    return NextResponse.json({ company })
  } catch {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }
}
