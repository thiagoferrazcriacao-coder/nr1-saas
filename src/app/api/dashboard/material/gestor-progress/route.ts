export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

const schema = z.object({
  lessonId: z.string().min(1),
  percent:  z.number().int().min(0).max(100),
})

// POST — registra quanto o próprio gestor (dono da conta) assistiu de um vídeo da Trilha do Gestor.
// Só sobe (nunca reduz o percentual já alcançado). Comprovação da liderança.
export async function POST(req: NextRequest) {
  try {
    const { userId } = requireAuth(req)
    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
    const { lessonId, percent } = parsed.data

    // Confirma que a aula existe e é da trilha do gestor
    const lesson = await prisma.lesson.findFirst({
      where: { id: lessonId, companyId: null, trilha: 'gestor' },
      select: { id: true },
    })
    if (!lesson) return NextResponse.json({ error: 'Aula não encontrada.' }, { status: 404 })

    const existing = await prisma.gestorProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
      select: { percent: true },
    })
    const best = Math.max(existing?.percent ?? 0, percent)
    const completed = best >= 90

    await prisma.gestorProgress.upsert({
      where:  { userId_lessonId: { userId, lessonId } },
      create: { userId, lessonId, percent: best, completed },
      update: { percent: best, completed },
    })

    return NextResponse.json({ ok: true, percent: best, completed })
  } catch {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }
}
