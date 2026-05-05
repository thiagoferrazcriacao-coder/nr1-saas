/**
 * Script de setup inicial — cria a empresa e o usuário admin.
 * Rode UMA VEZ após configurar o banco:
 *   npm run setup:admin
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // ── Configurações do primeiro admin ────────────────────────────────────────
  const COMPANY_NAME = 'Minha Empresa'          // ← altere se quiser
  const COMPANY_SLUG = 'minha-empresa'          // ← slug único (sem espaços)
  const ADMIN_EMAIL  = 'admin@minhaempresa.com' // ← altere para seu e-mail
  const ADMIN_PASS   = '123456'                 // ← senha inicial (troque depois)
  // ──────────────────────────────────────────────────────────────────────────

  console.log('🚀 Criando empresa e usuário admin...\n')

  // Verifica se já existe
  const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } })
  if (existing) {
    console.log('⚠️  Usuário já existe:', ADMIN_EMAIL)
    return
  }

  // Cria empresa
  const company = await prisma.company.create({
    data: {
      name: COMPANY_NAME,
      slug: COMPANY_SLUG,
      plan: 'starter',
    },
  })

  // Hash da senha
  const passwordHash = await bcrypt.hash(ADMIN_PASS, 12)

  // Cria usuário admin
  const user = await prisma.user.create({
    data: {
      companyId:    company.id,
      email:        ADMIN_EMAIL,
      passwordHash,
      role:         'ADMIN',
    },
  })

  console.log('✅ Empresa criada:', company.name, `(slug: ${company.slug})`)
  console.log('✅ Admin criado:  ', user.email)
  console.log('\n🔐 Credenciais de acesso:')
  console.log('   E-mail:', ADMIN_EMAIL)
  console.log('   Senha: ', ADMIN_PASS)
  console.log('\n⚠️  Troque a senha após o primeiro login!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
