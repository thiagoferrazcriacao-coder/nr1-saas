import { NextRequest, NextResponse } from 'next/server'
import { findPartnerByCode, PARTNER_COOKIE, PARTNER_DAYS } from '@/lib/partner'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
  const partner = await findPartnerByCode(params.code)
  const target = new URL('/', req.url)

  if (!partner) return NextResponse.redirect(target)

  target.searchParams.set('src', partner.code)
  const response = NextResponse.redirect(target)
  response.cookies.set(PARTNER_COOKIE, partner.code, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: PARTNER_DAYS * 24 * 60 * 60,
    path: '/',
  })
  return response
}
