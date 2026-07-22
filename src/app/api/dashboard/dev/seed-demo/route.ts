import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// Só o usuário de demonstração pode popular dados de exemplo
const DEMO_EMAIL = 'thiagoferrazcriacao@gmail.com'

// Nível de risco alvo por fator (0 = tranquilo, 4 = crítico) — dá um espectro bom pro demo
const TARGET: Record<number, number> = {
  1: 3.3, 7: 2.6, 10: 2.7, 8: 1.7, 5: 1.9, 2: 1.4, 6: 1.2, 11: 1.0, 4: 0.9, 12: 0.8, 3: 0.8, 9: 0.7, 13: 0.6,
}
const clamp = (n: number) => Math.max(0, Math.min(4, Math.round(n)))

// Gera um CPF válido (dígitos verificadores corretos) a partir de um índice
function genCpf(seed: number): string {
  const base = String(100000000 + (seed * 7919) % 900000000).slice(-9).split('').map(Number)
  const dv = (arr: number[]) => { let s = 0; for (let i = 0; i < arr.length; i++) s += arr[i] * (arr.length + 1 - i); const d = (s * 10) % 11; return d === 10 ? 0 : d }
  const d1 = dv(base)
  const d2 = dv([...base, d1])
  return base.join('') + d1 + d2
}

async function run(req: NextRequest) {
  try {
    const { companyId, email } = requireAuth(req)
    if ((email ?? '').toLowerCase() !== DEMO_EMAIL) {
      return NextResponse.json({ error: 'Disponível apenas para o usuário de demonstração.' }, { status: 403 })
    }

    // 1) Garante um setor
    let sector = await prisma.sector.findFirst({ where: { companyId } })
    if (!sector) {
      sector = await prisma.sector.create({ data: { companyId, name: 'Geral' } })
    }

    // 2) Respostas de exemplo (só se o setor tiver poucas respostas)
    const existingResponses = await prisma.response.count({ where: { sectorId: sector.id } })
    let createdResponses = 0
    if (existingResponses < 5) {
      const questions = await prisma.question.findMany({ select: { code: true, topicNum: true, reverse: true } })
      const N = 18
      const rows: Prisma.ResponseCreateManyInput[] = []
      for (let r = 0; r < N; r++) {
        const answers = questions.map((q) => {
          const target = TARGET[q.topicNum] ?? 1
          const noise = (r % 5) * 0.25 - 0.5 // pequena variação por respondente
          const riskValue = clamp(target + noise)
          // questão reversa: valor alto = menos risco, então inverte
          const value = q.reverse ? clamp(4 - riskValue) : riskValue
          return { questionCode: q.code, value }
        })
        rows.push({ sectorId: sector.id, answers: answers as unknown as Prisma.InputJsonValue })
      }
      const res = await prisma.response.createMany({ data: rows })
      createdResponses = res.count
    }

    // 3) Funcionários de exemplo (gestor + colaboradores), com progresso se houver vídeos
    const passwordHash = await bcrypt.hash('demo1234', 10)
    const people: { name: string; role: 'gestor' | 'colaborador' }[] = [
      { name: 'Carlos Gestor (demo)', role: 'gestor' },
      { name: 'Ana Souza (demo)', role: 'colaborador' },
      { name: 'Bruno Lima (demo)', role: 'colaborador' },
      { name: 'Carla Dias (demo)', role: 'colaborador' },
      { name: 'Diego Alves (demo)', role: 'colaborador' },
      { name: 'Elaine Rocha (demo)', role: 'colaborador' },
      { name: 'Felipe Nunes (demo)', role: 'colaborador' },
      { name: 'Gabriela Melo (demo)', role: 'colaborador' },
    ]

    const gestorLessons = await prisma.lesson.findMany({ where: { companyId: null, active: true, trilha: 'gestor' }, select: { id: true } })
    const colabLessons = await prisma.lesson.findMany({ where: { companyId: null, active: true, trilha: 'colaborador' }, select: { id: true } })

    let createdPeople = 0
    let createdProgress = 0
    for (let i = 0; i < people.length; i++) {
      const p = people[i]
      const emailDemo = `${p.role}${i}.demo@zelo.test`
      const cpf = genCpf(i + 1)
      const emp = await prisma.employee.upsert({
        where: { companyId_email: { companyId, email: emailDemo } },
        create: { companyId, email: emailDemo, name: p.name, cpf, phone: `(24) 99${String(100000 + i).slice(-6)}`, role: p.role, passwordHash },
        update: { name: p.name, cpf, role: p.role },
      })
      createdPeople++

      const lessons = p.role === 'gestor' ? gestorLessons : colabLessons
      for (let j = 0; j < lessons.length; j++) {
        // varia: alguns concluídos (100), alguns parciais, alguns não assistidos
        const roll = (i + j) % 3
        const percent = roll === 0 ? 100 : roll === 1 ? 60 : 0
        if (percent === 0) continue
        await prisma.lessonProgress.upsert({
          where: { employeeId_lessonId: { employeeId: emp.id, lessonId: lessons[j].id } },
          create: { employeeId: emp.id, lessonId: lessons[j].id, percent, completed: percent >= 90 },
          update: { percent, completed: percent >= 90 },
        })
        createdProgress++
      }
    }

    return NextResponse.json({
      ok: true,
      sector: sector.name,
      createdResponses,
      totalResponses: existingResponses + createdResponses,
      createdPeople,
      createdProgress,
      lessonsGestor: gestorLessons.length,
      lessonsColab: colabLessons.length,
      note: createdProgress === 0 ? 'Sem vídeos publicados ainda — as pessoas foram criadas, mas sem progresso de aulas.' : 'Dados de exemplo populados.',
    })
  } catch (err) {
    console.error('[SEED-DEMO]', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }
}

export async function GET(req: NextRequest) { return run(req) }
export async function POST(req: NextRequest) { return run(req) }
