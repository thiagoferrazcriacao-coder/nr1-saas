import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { calculateManagerResults, managerIsComplete } from '@/lib/manager-assessment'

const answerSchema = z.object({ code: z.string().regex(/^G(1[0-3]|[1-9])\.[1-3]$/), value: z.number().int().min(0).max(3) })
const schema = z.object({
  answers: z.array(answerSchema),
  openingAccepted: z.literal(true),
  confirmation: z.literal(true),
})

export async function GET(req: NextRequest) {
  try {
    const { companyId } = requireAuth(req)
    const assessment = await prisma.companyAssessment.findUnique({ where: { companyId } })
    return NextResponse.json({ assessment })
  } catch {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { companyId, userId, email } = requireAuth(req)
    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) return NextResponse.json({ error: 'Aceite a declaração inicial, responda todas as perguntas e confirme o envio.' }, { status: 400 })
    if (!managerIsComplete(parsed.data.answers)) return NextResponse.json({ error: 'Todas as perguntas obrigatórias devem ser respondidas.' }, { status: 400 })

    const now = new Date()
    const items = calculateManagerResults(parsed.data.answers)
    const assessment = await prisma.companyAssessment.upsert({
      where: { companyId },
      create: { companyId, items, openingAcceptedAt: now, openingAcceptedBy: `${userId}:${email}`, confirmationAt: now, confirmationBy: `${userId}:${email}`, completedAt: now },
      update: { items, openingAcceptedAt: now, openingAcceptedBy: `${userId}:${email}`, confirmationAt: now, confirmationBy: `${userId}:${email}`, completedAt: now },
    })
    return NextResponse.json({ assessment })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }
}
