export type AdminPasswordChangeInput = {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export type AdminPasswordChangeValidation =
  | { ok: true }
  | { ok: false; error: string }

export function validateAdminPasswordChange(input: AdminPasswordChangeInput): AdminPasswordChangeValidation {
  if (input.newPassword.length < 12) {
    return { ok: false, error: 'A nova senha precisa ter ao menos 12 caracteres.' }
  }

  if (input.newPassword !== input.confirmPassword) {
    return { ok: false, error: 'A confirmação da nova senha não confere.' }
  }

  return { ok: true }
}
