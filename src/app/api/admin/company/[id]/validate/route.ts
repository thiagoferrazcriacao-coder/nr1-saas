export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'
import { z } from 'zod'

const schema = z.object({
  action: z.enum(['aprovar', 'rejeitar']),
  notes:  z.string().max(2000).optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireAdmin(req)

    const body  = await req.json()
    const { action, notes } = schema.parse(body)

    const drpsStatus = action === 'aprovar' ? 'aprovado' : 'rejeitado'

    await prisma.company.update({
      where: { id: params.id },
      data: {
        drpsStatus,
        drpsValidatedAt: new Date(),
        drpsValidatedBy: 'Annie Talma — CRP/05/44595',
        drpsNotes:       notes ?? null,
      },
    })

    return NextResponse.json({ ok: true, drpsStatus })
  } catch (err) {
    if ((err as Error).message === 'Não autorizado') {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }
    console.error(err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
