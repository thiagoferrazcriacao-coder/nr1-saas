// Validação de CPF pelo dígito verificador (módulo 11). Bloqueia CPF inventado/inválido.
// Obs.: validação algorítmica — não confirma o NOME na Receita (isso exigiria API paga).

export function stripCPF(raw: string): string {
  return (raw || '').replace(/\D/g, '')
}

export function isValidCPF(raw: string): boolean {
  const cpf = stripCPF(raw)
  if (cpf.length !== 11) return false
  if (/^(\d)\1{10}$/.test(cpf)) return false // todos os dígitos iguais (ex.: 111.111.111-11)

  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(cpf[i], 10) * (10 - i)
  let d1 = (sum * 10) % 11
  if (d1 === 10) d1 = 0
  if (d1 !== parseInt(cpf[9], 10)) return false

  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(cpf[i], 10) * (11 - i)
  let d2 = (sum * 10) % 11
  if (d2 === 10) d2 = 0
  if (d2 !== parseInt(cpf[10], 10)) return false

  return true
}

export function formatCPF(raw: string): string {
  const c = stripCPF(raw)
  if (c.length !== 11) return raw
  return `${c.slice(0, 3)}.${c.slice(3, 6)}.${c.slice(6, 9)}-${c.slice(9)}`
}
