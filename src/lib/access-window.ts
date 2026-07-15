// Janela de acesso à plataforma: 1 ano a partir da criação da conta.
// O Plano de Ação sempre termina junto com o vencimento do acesso — por isso, se a empresa
// refizer o plano no meio do caminho, o novo plano é mais curto (só as semanas que faltam).

const MS_WEEK = 7 * 24 * 60 * 60 * 1000

/** Data de vencimento do acesso: criação da conta + 1 ano. */
export function accessEndDate(companyCreatedAt: Date | string): Date {
  const start = new Date(companyCreatedAt)
  const end = new Date(start)
  end.setFullYear(end.getFullYear() + 1)
  return end
}

/**
 * Horizonte do plano em semanas: da data de início (normalmente "agora", quando o plano é
 * montado) até o vencimento do acesso. Limitado entre 2 e 52 semanas.
 */
export function horizonWeeksUntil(accessEnd: Date, from: Date = new Date()): number {
  const weeks = Math.round((accessEnd.getTime() - from.getTime()) / MS_WEEK)
  return Math.max(2, Math.min(52, weeks))
}

/** Semanas restantes de acesso a partir de agora (0 se já venceu). */
export function weeksLeft(accessEnd: Date, from: Date = new Date()): number {
  return Math.max(0, Math.round((accessEnd.getTime() - from.getTime()) / MS_WEEK))
}
