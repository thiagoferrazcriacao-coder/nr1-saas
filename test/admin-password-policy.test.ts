import assert from 'node:assert/strict'
import test from 'node:test'
import { validateAdminPasswordChange } from '../src/lib/admin-password-policy'

test('aceita troca com senha atual válida e nova senha forte confirmada', () => {
  const result = validateAdminPasswordChange({
    currentPassword: 'senha-atual',
    newPassword: 'NovaSenha#2026',
    confirmPassword: 'NovaSenha#2026',
  })

  assert.deepEqual(result, { ok: true })
})

test('rejeita nova senha curta', () => {
  const result = validateAdminPasswordChange({
    currentPassword: 'senha-atual',
    newPassword: 'curta',
    confirmPassword: 'curta',
  })

  assert.deepEqual(result, { ok: false, error: 'A nova senha precisa ter ao menos 12 caracteres.' })
})

test('rejeita confirmação diferente', () => {
  const result = validateAdminPasswordChange({
    currentPassword: 'senha-atual',
    newPassword: 'NovaSenha#2026',
    confirmPassword: 'NovaSenha#2027',
  })

  assert.deepEqual(result, { ok: false, error: 'A confirmação da nova senha não confere.' })
})
