import crypto from 'crypto'
import { prisma } from './prisma'

// Gera um código curto e NEUTRO (sem nome de pessoa) para o link de treinamento.
function gen(): string {
  return crypto.randomBytes(5).toString('hex') // 10 caracteres, ex: "a3f9c1b27d"
}

// Garante que a empresa tenha um learnCode; cria sob demanda para empresas antigas.
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
