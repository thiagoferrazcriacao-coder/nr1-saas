export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-auth'

const planLabel: Record<string, string> = {
  'ate-10': 'Até 10 CLT', '11-30': '11 a 30 CLT', '31-50': '31 a 50 CLT', '51-100': '51 a 100 CLT',
}

// GET — lista de vendas + resumo
export async function GET(req: NextRequest) {
  try {
    requireAdmin(req)

    const sales = await prisma.sale.findMany({ orderBy: { createdAt: 'desc' }, take: 500 })

    const pagas = sales.filter((s) => s.status === 'paid')
    const receitaCents = pagas.reduce((acc, s) => acc + (s.amountCents ?? 0), 0)

    // Contagem por plano (apenas pagas)
    const porPlano: Record<string, number> = {}
    for (const s of pagas) {
      const key = s.plan ?? 'outro'
      porPlano[key] = (porPlano[key] ?? 0) + 1
    }

    return NextResponse.json({
      resumo: {
        totalVendas: pagas.length,
        receitaReais: Math.round(receitaCents / 100),
        porPlano,
      },
      vendas: sales.map((s) => ({
        id: s.id,
        customerName: s.customerName,
        customerEmail: s.customerEmail,
        productName: s.productName,
        plan: s.plan,
        planLabel: s.plan ? (planLabel[s.plan] ?? s.plan) : (s.productName ?? '—'),
        valorReais: Math.round((s.amountCents ?? 0) / 100),
        status: s.status,
        createdAt: s.createdAt,
      })),
    })
  } catch (err) {
    if ((err as Error).message === 'Não autorizado') {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }
    console.error(err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
