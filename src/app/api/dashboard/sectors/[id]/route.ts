import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { companyId } = requireAuth(req)

    const sector = await prisma.sector.findFirst({
      where: { id: params.id, companyId },
    })

    if (!sector) {
      return NextResponse.json({ error: 'Setor não encontrado.' }, { status: 404 })
    }

    await prisma.sector.delete({ where: { id: params.id } })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }
}
