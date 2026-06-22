// Links de checkout da Kiwify, por plano (porte da empresa).
// Cada plano é um produto na Kiwify com seu preço próprio.
// Cole aqui o link de checkout de cada produto (ex: https://pay.kiwify.com.br/XXXXXXX).
// Enquanto vazio, o botão usa o checkout interno como fallback.
export const KIWIFY_LINKS: Record<string, string> = {
  'ate-10':    '',
  '11-30':     '',
  '31-50':     '',
  '51-100':    '',
  'acima-100': '', // "Sob consulta" — pode ficar vazio (vira "Falar com a gente")
}

// Retorna o destino do botão de cada plano: link da Kiwify (se configurado)
// ou o checkout interno como fallback.
export function checkoutUrl(slug: string): string {
  const link = KIWIFY_LINKS[slug]
  return link && link.trim() ? link.trim() : `/checkout?plano=${slug}`
}
