export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

// Marca a conclusão do tutorial inicial obrigatório do gestor.
export async function POST(req: NextRequest) {
  try {
    const { companyId } = requireAuth(req)
    const company = await prisma.company.update({
      where: { id: companyId },
      data: { gestorTutorialCompletedAt: new Date() },
      select: { gestorTutorialCompletedAt: true },
    })
    return NextResponse.json({ ok: true, completedAt: company.gestorTutorialCompletedAt })
  } catch {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }
}
