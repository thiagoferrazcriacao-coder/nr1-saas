'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminSegurancaPage() {
  const router = useRouter()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(data.error ?? 'Não foi possível alterar a senha.')
        return
      }

      router.replace('/admin/login')
    } catch {
      setError('Não foi possível alterar a senha. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Segurança</h1>
        <p className="text-gray-500 text-sm mt-1">Altere a senha de acesso ao painel administrativo.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div>
          <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 mb-1">Senha atual</label>
          <input id="current-password" type="password" autoComplete="current-password" required value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#17C3C9] text-sm" />
        </div>
        <div>
          <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">Nova senha</label>
          <input id="new-password" type="password" autoComplete="new-password" required minLength={12} value={newPassword} onChange={(event) => setNewPassword(event.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#17C3C9] text-sm" />
          <p className="mt-1 text-xs text-gray-500">Use pelo menos 12 caracteres.</p>
        </div>
        <div>
          <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">Confirme a nova senha</label>
          <input id="confirm-password" type="password" autoComplete="new-password" required minLength={12} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#17C3C9] text-sm" />
        </div>
        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full bg-gradient-to-r from-[#17C3C9] to-[#3F7DE0] text-white py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
          {loading ? 'Alterando...' : 'Alterar senha'}
        </button>
        <p className="text-xs text-gray-500 text-center">Após a alteração, você precisará entrar novamente.</p>
      </form>
    </div>
  )
}
