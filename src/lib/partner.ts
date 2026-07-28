import { prisma } from '@/lib/prisma'

export const PARTNER_COOKIE = 'zelo_partner'
export const PARTNER_DAYS = 90

export function normalizePartnerCode(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
}

export function addPartnerToUrl(url: string, code: string): string {
  const target = new URL(url)
  target.searchParams.set('src', code)
  target.searchParams.set('utm_source', 'partner')
  target.searchParams.set('utm_medium', 'referral')
  target.searchParams.set('utm_campaign', code.toLowerCase())
  return target.toString()
}

export async function findPartnerByCode(code: string) {
  return prisma.partner.findFirst({
    where: { code: normalizePartnerCode(code), active: true },
    select: { id: true, name: true, code: true },
  })
}
