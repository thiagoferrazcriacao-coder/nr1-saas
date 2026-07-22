// Bloco de assinatura do GESTOR usado em todos os documentos gerados (DRPS, Anexo PGR,
// Plano de Ação, Atas). Substitui a antiga assinatura da psicóloga.

function esc(s: string): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function gestorSignatureHtml(o: {
  gestorName?: string | null
  signatureUrl?: string | null
  companyName: string
  date: string
  color?: string
}): string {
  const name = (o.gestorName && o.gestorName.trim()) || o.companyName
  const color = o.color || '#0E2A47'
  const img = o.signatureUrl
    ? `<img src="${o.signatureUrl}" alt="Assinatura do gestor" style="max-height:54px;max-width:230px;object-fit:contain;display:block;margin-bottom:4px;" />`
    : `<div style="height:38px;border-bottom:1px solid #94a3b8;width:230px;margin-bottom:6px;"></div>`
  return `<div>
    ${img}
    <p style="font-size:14px;font-weight:700;color:${color};">${esc(name)}</p>
    <p style="font-size:11px;color:#64748b;">Gestor(a) Responsável</p>
    <p style="font-size:10px;color:#94a3b8;margin-top:4px;">${esc(o.date)}</p>
  </div>`
}
