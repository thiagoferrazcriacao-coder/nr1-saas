import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Anonimização: apenas nas rotas públicas do questionário
  if (pathname.startsWith('/api/r/')) {
    const response = NextResponse.next()

    // Remove identificadores do request clonando sem IP/UA
    response.headers.delete('x-forwarded-for')
    response.headers.delete('x-real-ip')

    // Headers de segurança
    response.headers.set('X-Anonymous', 'true')
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'no-referrer')

    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/r/:path*'],
}
