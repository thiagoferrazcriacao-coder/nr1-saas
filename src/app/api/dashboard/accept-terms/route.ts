import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

// POST — registra aceite dos termos (data + IP)
export async function POST(req: NextRequest) {
  try {
    const { companyId } = requireAuth(req)

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? req.headers.get('x-real-ip')
      ?? 'unknown'

    await prisma.company.update({
      where: { id: companyId },
      data: {
        termsAcceptedAt: new Date(),
        termsAcceptedIp: ip,
      },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }
}

// GET — verifica se termos já foram aceitos
export async function GET(req: NextRequest) {
  try {
    const { companyId } = requireAuth(req)
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { termsAcceptedAt: true },
    })
    return NextResponse.json({ accepted: !!company?.termsAcceptedAt })
  } catch {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }
}
