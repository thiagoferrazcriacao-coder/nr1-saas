import { prisma } from '@/lib/prisma'

// Monta os dados da área de membros do colaborador: aulas da empresa + progresso dele.
export async function buildMemberPayload(
  companyId: string,
  companyName: string,
  employee: { id: string; name: string | null }
) {
  // Biblioteca global (mesma para todas as empresas) — companyId não é usado aqui.
  // O colaborador vê APENAS a Trilha do Colaborador.
  void companyId
  const lessons = await prisma.lesson.findMany({
    where:   { companyId: null, active: true, trilha: 'colaborador' },
    orderBy: [{ programNum: 'asc' }, { order: 'asc' }],
  })
  const progresses = await prisma.lessonProgress.findMany({ where: { employeeId: employee.id } })
  const progMap = new Map(progresses.map((p) => [p.lessonId, p]))

  return {
    companyName,
    employeeId:   employee.id,
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
  }
}
