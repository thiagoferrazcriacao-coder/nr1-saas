'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RecuperarSenhaPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3>(1) // 1=e-mail, 2=código+senha, 3=pronto
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const requestCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Não foi possível enviar o código.')
      }
      setStep(2)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar o código.')
    } finally {
      setLoading(false)
    }
  }

  const confirmReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== password2) { setError('As senhas não conferem.'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, password }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Não foi possível redefinir a senha.')
      }
      setStep(3)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao redefinir a senha.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0FBFC] to-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-zelo-3.png" alt="Zelo — Plataforma de NR1" className="h-12 w-auto mx-auto" />
          <p className="text-gray-500 text-sm mt-3">
            {step === 3 ? 'Senha redefinida' : 'Recuperar sua senha'}
          </p>
        </div>

        {/* Passo 1 — pedir e-mail */}
        {step === 1 && (
          <form onSubmit={requestCode} className="bg-white rounded-2xl shadow-xl shadow-[#0E2A47]/10 border border-gray-100 p-7 space-y-4">
            <p className="text-sm text-gray-600">Digite o e-mail da sua conta. Vamos enviar um código de 6 dígitos para você criar uma nova senha.</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
              <input
                type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#17C3C9] text-sm"
                placeholder="seu@email.com.br"
              />
            </div>
            {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3"><p className="text-red-600 text-sm">{error}</p></div>}
            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-[#17C3C9] to-[#3F7DE0] text-white py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
              {loading ? 'Enviando...' : 'Enviar código'}
            </button>
          </form>
        )}

        {/* Passo 2 — código + nova senha */}
        {step === 2 && (
          <form onSubmit={confirmReset} className="bg-white rounded-2xl shadow-xl shadow-[#0E2A47]/10 border border-gray-100 p-7 space-y-4">
            <p className="text-sm text-gray-600">Enviamos um código para <strong>{email}</strong>. Confira o e-mail (inclusive a caixa de spam) e defina sua nova senha.</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código de 6 dígitos</label>
              <input
                type="text" inputMode="numeric" required value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#17C3C9] text-sm tracking-widest text-center font-bold"
                placeholder="000000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nova senha</label>
              <input
                type="password" required minLength={6} value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#17C3C9] text-sm"
                placeholder="mínimo 6 caracteres"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar nova senha</label>
              <input
                type="password" required minLength={6} value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#17C3C9] text-sm"
                placeholder="repita a senha"
              />
            </div>
            {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3"><p className="text-red-600 text-sm">{error}</p></div>}
            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-[#17C3C9] to-[#3F7DE0] text-white py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
              {loading ? 'Salvando...' : 'Redefinir senha'}
            </button>
            <button type="button" onClick={() => { setStep(1); setError('') }} className="w-full text-sm text-gray-500 hover:underline">
              Não recebeu? Enviar de novo
            </button>
          </form>
        )}

        {/* Passo 3 — sucesso */}
        {step === 3 && (
          <div className="bg-white rounded-2xl shadow-xl shadow-[#0E2A47]/10 border border-gray-100 p-7 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-green-100 text-green-600 text-3xl flex items-center justify-center mx-auto">✓</div>
            <p className="text-gray-700 font-medium">Senha redefinida com sucesso!</p>
            <p className="text-sm text-gray-500">Agora você já pode entrar com a nova senha.</p>
            <button onClick={() => router.push('/login')} className="w-full bg-gradient-to-r from-[#17C3C9] to-[#3F7DE0] text-white py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity">
              Ir para o login
            </button>
          </div>
        )}

        <p className="text-center text-sm text-gray-500 mt-6">
          <Link href="/login" className="text-[#109CA1] font-semibold hover:underline">← Voltar para o login</Link>
        </p>
      </div>
    </div>
  )
}
