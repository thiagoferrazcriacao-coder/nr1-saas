'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

function maskCnpj(v: string) {
  return v
    .replace(/\D/g, '')
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

export default function CadastroPage() {
  const router = useRouter()
  const [step, setStep] = useState<'dados' | 'codigo'>('dados')
  const [form, setForm] = useState({ companyName: '', cnpj: '', email: '', password: '', confirm: '' })
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [cnpjLoading, setCnpjLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const fetchCnpj = async (raw: string) => {
    const digits = raw.replace(/\D/g, '')
    if (digits.length !== 14) return
    setCnpjLoading(true)
    try {
      const r = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`)
      if (!r.ok) return
      const data = await r.json()
      const name = data.razao_social || data.nome_fantasia || ''
      if (name) set('companyName', name)
    } catch { /* silencioso */ } finally { setCnpjLoading(false) }
  }

  // Passo 1 → valida e envia o código
  const enviarCodigo = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.companyName.trim()) { setError('Informe o nome da empresa.'); return }
    if (form.password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); return }
    if (form.password !== form.confirm) { setError('As senhas não coincidem.'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Não foi possível enviar o código.'); return }
      setInfo(`Enviamos um código de 6 dígitos para ${form.email}.`)
      setStep('codigo')
    } finally { setLoading(false) }
  }

  // Passo 2 → confirma o código e cria a conta
  const criarConta = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!/^\d{6}$/.test(code)) { setError('Digite o código de 6 dígitos.'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: form.companyName,
          cnpj: form.cnpj || undefined,
          email: form.email,
          password: form.password,
          code,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erro ao criar conta.'); return }
      localStorage.setItem('token', data.token)
      router.replace('/painel')
    } finally { setLoading(false) }
  }

  const reenviar = async () => {
    setError(''); setInfo('')
    const res = await fetch('/api/auth/send-code', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: form.email }),
    })
    const data = await res.json()
    if (!res.ok) setError(data.error || 'Erro ao reenviar.')
    else setInfo('Código reenviado! Confira seu e-mail.')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0FBFC] to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-zelo-3.png" alt="Zelo" className="h-12 w-auto mx-auto" />
          <p className="text-gray-500 text-sm mt-3">Crie a conta da sua empresa</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-[#0E2A47]/10 border border-gray-100 p-8">
          {step === 'dados' ? (
            <form onSubmit={enviarCodigo} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ <span className="text-gray-400 font-normal">(opcional)</span></label>
                <div className="relative">
                  <input type="text" value={form.cnpj} onChange={(e) => set('cnpj', maskCnpj(e.target.value))} onBlur={() => fetchCnpj(form.cnpj)} placeholder="00.000.000/0000-00"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#17C3C9] text-sm" />
                  {cnpjLoading && <div className="absolute right-3 top-3.5"><div className="w-4 h-4 border-2 border-[#17C3C9] border-t-transparent rounded-full animate-spin" /></div>}
                </div>
                <p className="text-xs text-gray-400 mt-1">O nome da empresa é preenchido automaticamente</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da empresa <span className="text-red-500">*</span></label>
                <input type="text" required value={form.companyName} onChange={(e) => set('companyName', e.target.value)} placeholder="Razão social ou nome fantasia"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#17C3C9] text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail do gestor <span className="text-red-500">*</span></label>
                <input type="email" required value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="voce@empresa.com.br"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#17C3C9] text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Senha <span className="text-red-500">*</span></label>
                <input type="password" required minLength={6} value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="Mínimo 6 caracteres"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#17C3C9] text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar senha <span className="text-red-500">*</span></label>
                <input type="password" required value={form.confirm} onChange={(e) => set('confirm', e.target.value)} placeholder="Repita a senha"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#17C3C9] text-sm" />
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}
              <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-gradient-to-r from-[#17C3C9] to-[#3F7DE0] text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 mt-2">
                {loading ? 'Enviando código...' : 'Continuar →'}
              </button>
            </form>
          ) : (
            <form onSubmit={criarConta} className="space-y-4">
              <div className="text-center">
                <div className="text-3xl mb-2">📧</div>
                <h2 className="font-bold text-gray-900">Confirme seu e-mail</h2>
                <p className="text-sm text-gray-500 mt-1">{info}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código de verificação</label>
                <input type="text" inputMode="numeric" maxLength={6} value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#17C3C9] text-center text-2xl font-bold tracking-[0.4em]" />
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}
              {info && !error && <p className="text-sm text-[#109CA1]">{info}</p>}
              <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-gradient-to-r from-[#17C3C9] to-[#3F7DE0] text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
                {loading ? 'Criando conta...' : 'Criar conta e acessar'}
              </button>
              <div className="flex items-center justify-between text-sm">
                <button type="button" onClick={() => { setStep('dados'); setError(''); setInfo('') }} className="text-gray-500 hover:text-gray-700">← Trocar e-mail</button>
                <button type="button" onClick={reenviar} className="text-[#109CA1] font-semibold hover:underline">Reenviar código</button>
              </div>
            </form>
          )}

          <p className="text-center text-sm text-gray-500 mt-6">
            Já tem conta?{' '}
            <Link href="/login" className="text-[#109CA1] font-semibold hover:underline">Fazer login</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
