import { prisma } from './prisma'

// E-mails liberados pra cadastrar mesmo sem compra (testes do dono).
// Configurável em SIGNUP_ALLOWLIST (separado por vírgula).
function allowlist(): string[] {
  return (process.env.SIGNUP_ALLOWLIST ?? '')
    .split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
}

// Só pode se cadastrar quem tem uma compra paga (Kiwify) com esse e-mail — ou está na allowlist de teste.
export async function canSignup(email: string): Promise<boolean> {
  const e = email.toLowerCase().trim()
  if (!e) return false
  if (allowlist().includes(e)) return true
  const sale = await prisma.sale.findFirst({ where: { customerEmail: e, status: 'paid' }, select: { id: true } })
  return !!sale
}

export const SIGNUP_BLOCKED_MSG =
  'Não encontramos uma compra com esse e-mail. Use o mesmo e-mail que você usou na compra. Se ainda não comprou, finalize a compra para liberar o acesso.'
