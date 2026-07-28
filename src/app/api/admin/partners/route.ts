import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'
import { normalizePartnerCode } from '@/lib/partner'

export const dynamic = 'force-dynamic'

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  code: z.string().trim().min(2).max(40).optional(),
  contactName: z.string().trim().max(120).optional(),
  email: z.string().trim().email().optional().or(z.literal('')),
  phone: z.string().trim().max(30).optional(),
})

export async function GET(req: NextRequest) {
  try {
    requireAdmin(req)
    const partners = await prisma.partner.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { sales: { where: { status: 'paid' } } } } },
    })
    const origin = req.nextUrl.origin
    return NextResponse.json({
      partners: partners.map((p) => ({
        id: p.id,
        name: p.name,
        code: p.code,
        contactName: p.contactName,
        email: p.email,
        phone: p.phone,
        active: p.active,
        paidSales: p._count.sales,
        link: `${origin}/parceiro/${p.code}`,
        createdAt: p.createdAt,
      })),
    })
  } catch (err) {
    if ((err as Error).message === 'Não autorizado') return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    console.error('[ADMIN PARTNERS GET]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    requireAdmin(req)
    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) return NextResponse.json({ error: 'Informe o nome e dados válidos.' }, { status: 400 })

    const code = normalizePartnerCode(parsed.data.code || parsed.data.name)
    if (code.length < 2) return NextResponse.json({ error: 'Não foi possível gerar um código válido.' }, { status: 400 })

    const partner = await prisma.partner.create({
      data: {
        name: parsed.data.name,
        code,
        contactName: parsed.data.contactName || null,
        email: parsed.data.email || null,
        phone: parsed.data.phone || null,
      },
    })
    return NextResponse.json({ partner, link: `${req.nextUrl.origin}/parceiro/${partner.code}` }, { status: 201 })
  } catch (err) {
    if ((err as Error).message === 'Não autorizado') return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    if ((err as { code?: string }).code === 'P2002') return NextResponse.json({ error: 'Esse código de parceiro já existe.' }, { status: 409 })
    console.error('[ADMIN PARTNERS POST]', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
