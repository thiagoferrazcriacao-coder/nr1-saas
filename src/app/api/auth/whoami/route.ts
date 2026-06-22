export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, isOwnerEmail } from '@/lib/auth'

// GET — retorna quem é o usuário logado e se ele é o dono do projeto
export async function GET(req: NextRequest) {
  try {
    const { email } = requireAuth(req)
    return NextResponse.json({ email, isOwner: isOwnerEmail(email) })
  } catch {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  }
}
