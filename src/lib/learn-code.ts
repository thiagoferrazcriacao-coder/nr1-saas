import crypto from 'crypto'
import { prisma } from './prisma'

// Gera um código curto e NEUTRO (sem nome de pessoa) para o link de treinamento.
function gen(): string {
  return crypto.randomBytes(5).toString('hex') // 10 caracteres, ex: "a3f9c1b27d"
}

// Garante que a empresa tenha um learnCode (link do COLABORADOR); cria sob demanda.
export async function ensureLearnCode(companyId: string): Promise<string> {
  const c = await prisma.company.findUnique({ where: { id: companyId }, select: { learnCode: true } })
  if (c?.learnCode) return c.learnCode
  for (let i = 0; i < 5; i++) {
    try {
      const updated = await prisma.company.update({
        where: { id: companyId },
        data: { learnCode: gen() },
        select: { learnCode: true },
      })
      if (updated.learnCode) return updated.learnCode
    } catch {
      // colisão no @unique — tenta outro código
    }
  }
  // fallback improvável: usa parte do próprio id (ainda neutro, sem nome)
  return companyId.replace(/-/g, '').slice(0, 10)
}

// Garante que a empresa tenha um gestorCode (link do GESTOR/LÍDER); cria sob demanda.
export async function ensureGestorCode(companyId: string): Promise<string> {
  const c = await prisma.company.findUnique({ where: { id: companyId }, select: { gestorCode: true } })
  if (c?.gestorCode) return c.gestorCode
  for (let i = 0; i < 5; i++) {
    try {
      const updated = await prisma.company.update({
        where: { id: companyId },
        data: { gestorCode: gen() },
        select: { gestorCode: true },
      })
      if (updated.gestorCode) return updated.gestorCode
    } catch {
      // colisão no @unique — tenta outro código
    }
  }
  return 'g' + companyId.replace(/-/g, '').slice(0, 9)
}

// Resolve o slug de um link de aprendizado → empresa + papel (gestor ou colaborador).
export async function resolveLearnSlug(
  slug: string,
): Promise<{ id: string; name: string; role: 'gestor' | 'colaborador' } | null> {
  const c = await prisma.company.findFirst({
    where: { OR: [{ learnCode: slug }, { gestorCode: slug }] },
    select: { id: true, name: true, learnCode: true, gestorCode: true },
  })
  if (!c) return null
  const role: 'gestor' | 'colaborador' = c.gestorCode === slug ? 'gestor' : 'colaborador'
  return { id: c.id, name: c.name, role }
}
