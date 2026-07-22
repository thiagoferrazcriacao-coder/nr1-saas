import { prisma } from './prisma'

// Usuário de teste: enxerga tudo liberado (Material Didático) antes do lançamento geral.
export const DEMO_EMAIL = 'thiagoferrazcriacao@gmail.com'

export function isDemoEmail(email?: string | null): boolean {
  return (email ?? '').toLowerCase() === DEMO_EMAIL
}

// A empresa é a de teste se algum usuário dela for o e-mail de demonstração.
export async function isDemoCompany(companyId: string): Promise<boolean> {
  const u = await prisma.user.findFirst({ where: { companyId, email: DEMO_EMAIL }, select: { id: true } })
  return !!u
}
