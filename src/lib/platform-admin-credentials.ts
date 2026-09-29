import bcrypt from 'bcryptjs'
import { timingSafeEqual } from 'crypto'
import { prisma } from '@/lib/prisma'

const ADMIN_CREDENTIAL_ID = 'singleton'

function matchesEnvironmentPassword(candidate: string, configured?: string): boolean {
  if (!configured) return false
  const left = Buffer.from(candidate)
  const right = Buffer.from(configured)
  return left.length === right.length && timingSafeEqual(left, right)
}

export async function verifyPlatformAdminPassword(candidate: string): Promise<boolean> {
  const credential = await prisma.platformAdminCredential.findUnique({
    where: { id: ADMIN_CREDENTIAL_ID },
    select: { passwordHash: true },
  })

  if (credential) return bcrypt.compare(candidate, credential.passwordHash)
  return matchesEnvironmentPassword(candidate, process.env.ADMIN_PASSWORD)
}

export async function setPlatformAdminPassword(password: string): Promise<void> {
  const passwordHash = await bcrypt.hash(password, 12)
  await prisma.platformAdminCredential.upsert({
    where: { id: ADMIN_CREDENTIAL_ID },
    create: { id: ADMIN_CREDENTIAL_ID, passwordHash },
    update: { passwordHash },
  })
}
