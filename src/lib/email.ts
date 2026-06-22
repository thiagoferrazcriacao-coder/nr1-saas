import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const FROM = process.env.EMAIL_FROM ?? 'Zelo <noreply@plataformazelo.com.br>'

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM)
}

// Envia o código de verificação de 6 dígitos para o e-mail do gestor.
export async function sendVerificationCode(email: string, code: string): Promise<void> {
  if (!resend) throw new Error('Serviço de e-mail não configurado.')

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:24px;font-weight:900;color:#0E2A47;">Zelo</span>
      <span style="font-size:13px;color:#17C3C9;margin-left:6px;">Plataforma de NR-1</span>
    </div>
    <div style="background:#F6F9FC;border:1px solid #e2e8f0;border-radius:16px;padding:28px;text-align:center;">
      <p style="font-size:15px;color:#334155;margin:0 0 8px;">Seu código de verificação é:</p>
      <p style="font-size:38px;font-weight:900;letter-spacing:8px;color:#0E2A47;margin:8px 0;">${code}</p>
      <p style="font-size:13px;color:#64748b;margin:8px 0 0;">Válido por 10 minutos. Não compartilhe com ninguém.</p>
    </div>
    <p style="font-size:12px;color:#94a3b8;text-align:center;margin-top:20px;">
      Se você não solicitou este código, ignore este e-mail.
    </p>
  </div>`

  const { error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: `${code} é o seu código de acesso — Zelo`,
    html,
  })
  if (error) {
    const msg = typeof error === 'string' ? error : (error.message || JSON.stringify(error))
    throw new Error(`Resend: ${msg}`)
  }
}
