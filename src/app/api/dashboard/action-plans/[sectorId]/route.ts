import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { computeSectorFactors, FactorRisk } from '@/lib/sector-factors'
import { buildMonthPlan, FactorInput } from '@/lib/month-plan'

export const dynamic = 'force-dynamic'

// Dados que a empresa preenche por mês: evidências anexadas + resumo da ata + status
type MonthData = Record<string, { done?: boolean; ataSummary?: string; evidences: { url: string; name?: string; at: string }[] }>

const evidenceSchema = z.object({ url: z.string().url(), name: z.string().optional(), at: z.string() })
const monthEntrySchema = z.object({
  done: z.boolean().optional(),
  ataSummary: z.string().max(5000).optional(),
  evidences: z.array(evidenceSchema).default([]),
})
const bodySchema = z.object({
  create:    z.boolean().optional(),                  // ativa o plano (grava baseline + início)
  monthData: z.record(monthEntrySchema).optional(),   // salva evidências/ata/status por mês
})

function factorsFrom(baseline: FactorRisk[]): FactorInput[] {
  return baseline.map((b) => ({ topicNum: b.topicNum, riskLevel: b.riskLevel, score: b.score }))
}

// GET — devolve o plano de 12 meses (sempre 12, com base no DRPS). Sem cadência/semanas.
export async function GET(req: NextRequest, { params }: { params: { sectorId: string } }) {
  try {
    const { companyId } = requireAuth(req)

    const sector = await prisma.sector.findFirst({ where: { id: params.sectorId, companyId } })
    if (!sector) return NextResponse.json({ error: 'Setor não encontrado.' }, { status: 404 })

    const plan = await prisma.actionPlan.findUnique({ where: { sectorId: params.sectorId } })

    // fatores: do baseline salvo (plano ativo) ou do diagnóstico atual (prévia)
    const baseline: FactorRisk[] = plan && Array.isArray(plan.baseline) ? (plan.baseline as unknown as FactorRisk[]) : []
    const factors: FactorInput[] = baseline.length ? factorsFrom(baseline) : factorsFrom(await computeSectorFactors(params.sectorId))

    if (factors.length === 0) {
      return NextResponse.json({ months: [], planStarted: false, noData: true, sectorName: sector.name })
    }

    const startDate = plan ? new Date(plan.createdAt) : new Date()
    const months = buildMonthPlan(factors, startDate)
    const md: MonthData = (plan?.monthData as MonthData) ?? {}

    // anexa o que a empresa já preencheu (evidências / ata / concluído) em cada mês
    const monthsOut = months.map((m) => ({
      ...m,
      done: !!md[m.monthNum]?.done,
      ataSummary: md[m.monthNum]?.ataSummary ?? '',
      evidences: md[m.monthNum]?.evidences ?? [],
    }))

    return NextResponse.json({
      months: monthsOut,
      planStarted: !!plan,
      startDate: startDate.toISOString(),
      sectorName: sector.name,
    })
  } catch (err) {
    console.error('[ACTION-PLAN GET]', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }
}

// POST — ativa o plano (create) e/ou salva os dados por mês (evidências/ata/status)
export async function POST(req: NextRequest, { params }: { params: { sectorId: string } }) {
  try {
    const { companyId } = requireAuth(req)
    const sector = await prisma.sector.findFirst({ where: { id: params.sectorId, companyId }, select: { id: true } })
    if (!sector) return NextResponse.json({ error: 'Setor não encontrado.' }, { status: 404 })

    const parsed = bodySchema.safeParse(await req.json())
    if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })

    const existing = await prisma.actionPlan.findUnique({ where: { sectorId: params.sectorId }, select: { id: true } })

    // Ativa o plano: grava o baseline (13 fatores) e o snapshot dos meses; createdAt = início
    if (parsed.data.create && !existing) {
      const baseline = await computeSectorFactors(params.sectorId)
      if (baseline.length === 0) return NextResponse.json({ error: 'Sem respostas para montar o plano.' }, { status: 400 })
      const months = buildMonthPlan(factorsFrom(baseline), new Date())
      await prisma.actionPlan.create({
        data: {
          sectorId: params.sectorId, companyId,
          items: months as unknown as Prisma.InputJsonValue,
          baseline: baseline as unknown as Prisma.InputJsonValue,
          monthData: {} as Prisma.InputJsonValue,
        },
      })
    }

    // Salva dados por mês
    if (parsed.data.monthData) {
      await prisma.actionPlan.update({
        where: { sectorId: params.sectorId },
        data: { monthData: parsed.data.monthData as Prisma.InputJsonValue },
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[ACTION-PLAN POST]', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Não foi possível salvar.' }, { status: 500 })
  }
}

// DELETE — encerra o ciclo: arquiva o plano (com evidências) e remove o ativo para recomeçar
export async function DELETE(req: NextRequest, { params }: { params: { sectorId: string } }) {
  try {
    const { companyId } = requireAuth(req)
    const sector = await prisma.sector.findFirst({ where: { id: params.sectorId, companyId }, select: { id: true, name: true } })
    if (!sector) return NextResponse.json({ error: 'Setor não encontrado.' }, { status: 404 })

    const plan = await prisma.actionPlan.findUnique({ where: { sectorId: params.sectorId } })
    if (plan) {
      const finalSnapshot = await computeSectorFactors(params.sectorId, new Date(plan.createdAt))
      await prisma.actionPlanArchive.create({
        data: {
          companyId, sectorId: params.sectorId, sectorName: sector.name,
          items: (plan.monthData ?? plan.items ?? []) as Prisma.InputJsonValue,
          baseline: plan.baseline == null ? Prisma.JsonNull : (plan.baseline as Prisma.InputJsonValue),
          finalSnapshot: finalSnapshot.length ? (finalSnapshot as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
          startedAt: plan.createdAt,
        },
      })
    }

    await prisma.actionPlan.deleteMany({ where: { sectorId: params.sectorId, companyId } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[ACTION-PLAN DELETE]', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Não foi possível excluir.' }, { status: 500 })
  }
}
