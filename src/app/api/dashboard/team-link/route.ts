export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

// Registra que o gestor confirmou o envio do link da avaliação ao time.
export async function POST(req: NextRequest) {
  try {
    const { companyId } = requireAuth(req)
    const company = await prisma.company.update({
      where: { id: companyId },
      data: { teamLinkSentAt: new Date() },
      select: { teamLinkSentAt: true },
    })
    return NextResponse.json({ ok: true, sentAt: company.teamLinkSentAt })
  } catch {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }
}
