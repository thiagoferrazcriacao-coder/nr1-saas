import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { ensureLessons } from '@/lib/lessons-seed'

export const dynamic = 'force-dynamic'

const schema = z.object({
  email: z.string().email('E-mail inválido.'),
  name:  z.string().trim().min(1).max(120).optional(),
})

// POST — colaborador entra/cadastra pelo e-mail e recebe a lista de vídeos + seu progresso
export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const company = await prisma.company.findUnique({
      where: { slug: params.slug },
      select: { id: true, name: true },
    })
    if (!company) return NextResponse.json({ error: 'Empresa não encontrada.' }, { status: 404 })

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Dados inválidos.' }, { status: 400 })
    }
    const email = parsed.data.email.toLowerCase().trim()

    // Garante a biblioteca de vídeos
    await ensureLessons()

    // Cria ou recupera o colaborador pelo par (empresa, e-mail)
    const employee = await prisma.employee.upsert({
      where:  { companyId_email: { companyId: company.id, email } },
      create: { companyId: company.id, email, name: parsed.data.name ?? null },
      update: parsed.data.name ? { name: parsed.data.name } : {},
    })

    const lessons = await prisma.lesson.findMany({
      where:   { active: true },
      orderBy: { order: 'asc' },
    })

    const progresses = await prisma.lessonProgress.findMany({
      where: { employeeId: employee.id },
    })
    const progMap = new Map(progresses.map((p) => [p.lessonId, p]))

    return NextResponse.json({
      companyName: company.name,
      employeeId:  employee.id,
      employeeName: employee.name,
      lessons: lessons.map((l) => ({
        id:          l.id,
        programNum:  l.programNum,
        program:     l.program,
        title:       l.title,
        description: l.description,
        videoUrl:    l.videoUrl,
        percent:     progMap.get(l.id)?.percent ?? 0,
        completed:   progMap.get(l.id)?.completed ?? false,
      })),
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erro ao processar o cadastro.' }, { status: 500 })
  }
}
