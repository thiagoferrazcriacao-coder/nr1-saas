import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

const itemSchema = z.object({
  id:           z.string(),
  topico:       z.string(),
  acao:         z.string(),
  tipo:         z.enum(['imediata', 'preventiva']),
  responsavel:  z.string().optional(),
  prazo:        z.string().optional(),
  status:       z.enum(['pendente', 'em_andamento', 'concluido']).default('pendente'),
  prioridade:   z.enum(['baixa', 'media', 'alta', 'urgente']).default('media'),
})

const schema = z.object({
  items: z.array(itemSchema),
})

// GET — busca plano de ação do setor
export async function GET(
  req: NextRequest,
  { params }: { params: { sectorId: string } }
) {
  try {
    const { companyId } = requireAuth(req)

    // Garante que o setor pertence à empresa
    const sector = await prisma.sector.findFirst({
      where: { id: params.sectorId, companyId },
    })
    if (!sector) return NextResponse.json({ error: 'Setor não encontrado.' }, { status: 404 })

    const plan = await prisma.actionPlan.findUnique({
      where: { sectorId: params.sectorId },
    })

    // Se não existe plano, tenta gerar a partir da última análise de IA
    if (!plan) {
      const latestResponse = await prisma.response.findFirst({
        where: { sectorId: params.sectorId },
        include: { aiAnalysis: true },
        orderBy: { createdAt: 'desc' },
      })

      const ai = latestResponse?.aiAnalysis?.classification as {
        acoes_imediatas?: string[]
        acoes_preventivas?: string[]
        topicos_criticos?: string[]
        prioridade_intervencao?: string
      } | null

      if (ai) {
        const prioridade = ai.prioridade_intervencao ?? 'media'
        const items = [
          ...(ai.acoes_imediatas ?? []).map((acao, i) => ({
            id: `imediata-${i}`,
            topico: ai.topicos_criticos?.[i] ?? 'Geral',
            acao,
            tipo: 'imediata' as const,
            responsavel: '',
            prazo: '',
            status: 'pendente' as const,
            prioridade: (prioridade === 'urgente' ? 'urgente' : 'alta') as 'urgente' | 'alta',
          })),
          ...(ai.acoes_preventivas ?? []).map((acao, i) => ({
            id: `preventiva-${i}`,
            topico: ai.topicos_criticos?.[i] ?? 'Geral',
            acao,
            tipo: 'preventiva' as const,
            responsavel: '',
            prazo: '',
            status: 'pendente' as const,
            prioridade: 'media' as const,
          })),
        ]
        return NextResponse.json({ plan: null, suggested: items })
      }
      return NextResponse.json({ plan: null, suggested: [] })
    }

    return NextResponse.json({ plan, suggested: [] })
  } catch {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }
}

// POST — salva (upsert) o plano de ação
export async function POST(
  req: NextRequest,
  { params }: { params: { sectorId: string } }
) {
  try {
    const { companyId } = requireAuth(req)

    const sector = await prisma.sector.findFirst({
      where: { id: params.sectorId, companyId },
    })
    if (!sector) return NextResponse.json({ error: 'Setor não encontrado.' }, { status: 404 })

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
    }

    const plan = await prisma.actionPlan.upsert({
      where:  { sectorId: params.sectorId },
      create: { sectorId: params.sectorId, companyId, items: parsed.data.items },
      update: { items: parsed.data.items },
    })

    return NextResponse.json({ plan })
  } catch {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }
}
