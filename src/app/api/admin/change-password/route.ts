export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/admin-auth'
import { validateAdminPasswordChange } from '@/lib/admin-password-policy'
import { setPlatformAdminPassword, verifyPlatformAdminPassword } from '@/lib/platform-admin-credentials'

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(1),
  confirmPassword: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    requireAdmin(req)
  } catch {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })

    const validation = validateAdminPasswordChange(parsed.data)
    if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 })

    const currentPasswordOk = await verifyPlatformAdminPassword(parsed.data.currentPassword)
    if (!currentPasswordOk) return NextResponse.json({ error: 'A senha atual está incorreta.' }, { status: 400 })

    await setPlatformAdminPassword(parsed.data.newPassword)

    const response = NextResponse.json({ ok: true })
    response.cookies.set('admin_token', '', { maxAge: 0, path: '/' })
    return response
  } catch {
    return NextResponse.json({ error: 'Não foi possível alterar a senha.' }, { status: 500 })
  }
}
