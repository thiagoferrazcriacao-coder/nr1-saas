export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendWelcomeEmail, emailConfigured } from '@/lib/email'
import { isZeloAmount } from '@/lib/kiwify'

// Mapeia o valor (em reais) ao plano
function inferPlan(amountReais: number): string | null {
  const map: Record<number, string> = { 1497: 'ate-10', 1997: '11-30', 2497: '31-50', 2997: '51-100' }
  return map[Math.round(amountReais)] ?? null
}

// Normaliza o status da Kiwify
function normStatus(s: string): string {
  const v = (s || '').toLowerCase()
  if (v.includes('paid') || v.includes('approv') || v.includes('aprov')) return 'paid'
  if (v.includes('refund') || v.includes('reembol')) return 'refunded'
  if (v.includes('charge')) return 'chargeback'
  if (v.includes('wait') || v.includes('pend')) return 'waiting'
  return v || 'paid'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pick(obj: any, ...paths: string[]): any {
  for (const p of paths) {
    const val = p.split('.').reduce((o, k) => (o == null ? o : o[k]), obj)
    if (val != null && val !== '') return val
  }
  return undefined
}

// POST — recebe a notificação de venda da Kiwify
export async function POST(req: NextRequest) {
  // Autenticação simples por token na URL
  const token = req.nextUrl.searchParams.get('token')
  const expected = process.env.KIWIFY_WEBHOOK_TOKEN
  if (!expected || token !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let body: any = {}
    try { body = await req.json() } catch { body = {} }

    const orderId = String(pick(body, 'order_id', 'order_ref', 'id', 'reference') ?? '') || null
    const rawStatus = String(pick(body, 'order_status', 'status', 'webhook_event_type') ?? 'paid')
    const status = normStatus(rawStatus)

    const customerName  = pick(body, 'Customer.full_name', 'Customer.name', 'customer.full_name', 'customer.name', 'customer_name') ?? null
    const customerEmail = pick(body, 'Customer.email', 'customer.email', 'customer_email', 'email') ?? null
    const productName   = pick(body, 'Product.product_name', 'Product.name', 'product.product_name', 'product.name', 'product_name') ?? null
    const trackingCode = pick(
      body,
      'src', 'sck', 'utm_source', 'utm_campaign', 'tracking.src', 'tracking.sck',
      'Tracking.src', 'Tracking.sck', 'custom_fields.partner', 'custom_fields.partner_code',
    )
    const partnerCode = trackingCode ? String(trackingCode).trim().toUpperCase() : null
    const partner = partnerCode
      ? await prisma.partner.findUnique({ where: { code: partnerCode }, select: { id: true } })
      : null

    const rawAmount = Number(
      pick(body, 'Commissions.charge_amount', 'commissions.charge_amount', 'charge_amount',
        'order_total', 'amount', 'Commissions.product_base_price', 'product_base_price') ?? 0
    )
    const amountReais = rawAmount > 10000 ? Math.round(rawAmount / 100) : Math.round(rawAmount)
    const amountCents = amountReais * 100
    const plan = inferPlan(amountReais)

    // O webhook da Kiwify é compartilhado com outros produtos. Só aceitamos
    // os quatro valores atualmente cadastrados para os planos da Zelo.
    if (!plan || !isZeloAmount(amountCents)) {
      console.warn('[KIWIFY-IGNORED-NON-ZELO]', { orderId, productName, amountReais })
      return NextResponse.json({ ok: true, ignored: true, reason: 'not-zelo-product' })
    }

    const data = {
      customerName: customerName ? String(customerName) : null,
      customerEmail: customerEmail ? String(customerEmail).toLowerCase() : null,
      productName: productName ? String(productName) : null,
      plan,
      amountCents,
      status,
      ...(partner ? { partnerId: partner.id } : {}),
      raw: body,
    }

    let sale
    if (orderId) {
      sale = await prisma.sale.upsert({
        where:  { orderId },
        create: { orderId, ...data },
        update: data,
      })
    } else {
      sale = await prisma.sale.create({ data })
    }

    // E-mail de boas-vindas/acesso — só quando aprovado e ainda não enviado (idempotente)
    if (sale.status === 'paid' && sale.customerEmail && !sale.welcomeSentAt && emailConfigured()) {
      try {
        await sendWelcomeEmail(sale.customerEmail, sale.customerName)
        await prisma.sale.update({ where: { id: sale.id }, data: { welcomeSentAt: new Date() } })
      } catch (e) {
        console.error('[KIWIFY-WELCOME-EMAIL]', e instanceof Error ? e.message : String(e))
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[KIWIFY-WEBHOOK]', err instanceof Error ? err.message : String(err))
    // Retorna 200 para a Kiwify não ficar reenviando indefinidamente
    return NextResponse.json({ ok: true, note: 'processed-with-warnings' })
  }
}
