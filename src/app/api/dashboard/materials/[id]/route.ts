export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

// DELETE — gestor remove um material extra da própria empresa
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { companyId } = requireAuth(req)
    const material = await prisma.material.findFirst({ where: { id: params.id, companyId }, select: { id: true } })
    if (!material) return NextResponse.json({ error: 'Material não encontrado.' }, { status: 404 })
    await prisma.material.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }
}
