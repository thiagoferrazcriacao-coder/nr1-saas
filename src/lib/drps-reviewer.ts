export const RENATA_MATOS_REVIEWER = 'Renata Matos — Desenvolvimento Pessoal e Mentora'

/** Mantém documentos e telas históricas sem a identificação da profissional anterior. */
export function displayDrpsReviewer(value: string | null | undefined): string | null {
  if (!value) return null
  return value.includes('CRP/05/44595') ? RENATA_MATOS_REVIEWER : value
}
