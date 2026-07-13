'use client'

import { useEffect, useState, useRef } from 'react'

function maskCnpj(v: string) {
  return v.replace(/\D/g, '').slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

type Company = {
  name: string; fantasyName: string; cnpj: string
  responsible: string; phone: string; address: string; city: string; state: string
  employeeCount: string; workModality: string
}

export default function ConfiguracoesPage() {
  const [form, setForm] = useState<Company>({
    name: '', fantasyName: '', cnpj: '',
    responsible: '', phone: '', address: '', city: '', state: '',
    employeeCount: '', workModality: 'presencial',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [error, setError]     = useState('')

  // Conta, logo e segurança
  const [email, setEmail]       = useState('')
  const [logoUrl, setLogoUrl]   = useState<string | null>(null)
  const [logoBusy, setLogoBusy] = useState(false)
  const logoRef = useRef<HTMLInputElement>(null)
  const [pwd, setPwd] = useState({ cur: '', nova: '', conf: '' })
  const [pwdBusy, setPwdBusy] = useState(false)
  const [pwdMsg, setPwdMsg]   = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    fetch('/api/dashboard/company-settings')
      .then((r) => r.json())
      .then((data) => {
        if (data.email) setEmail(data.email)
        if (data.company) {
          setLogoUrl(data.company.logoUrl ?? null)
          setForm({
            name:          data.company.name ?? '',
            fantasyName:   data.company.fantasyName ?? '',
            cnpj:          data.company.cnpj ?? '',
            responsible:   data.company.responsible ?? '',
            phone:         data.company.phone ?? '',
            address:       data.company.address ?? '',
            city:          data.company.city ?? '',
            state:         data.company.state ?? '',
            employeeCount: data.company.employeeCount?.toString() ?? '',
            workModality:  data.company.workModality ?? 'presencial',
          })
        }
      })
      .finally(() => setLoading(false))
  }, [])

  // Upload da logo/foto da empresa (vai pro R2 e salva a URL)
  const onLogo = async (file: File | null) => {
    if (!file) return
    setLogoBusy(true); setError('')
    try {
      const r = await fetch('/api/dashboard/materials/upload-url', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type || 'image/png' }),
      })
      const d = await r.json()
      if (!r.ok) { setError(d.error ?? 'Falha ao preparar o envio.'); return }
      await fetch(d.uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type || 'image/png' }, body: file })
      const res = await fetch('/api/dashboard/company-settings', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logoUrl: d.publicUrl }),
      })
      if (res.ok) setLogoUrl(d.publicUrl)
    } catch { setError('Erro no envio da imagem.') } finally { setLogoBusy(false); if (logoRef.current) logoRef.current.value = '' }
  }

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault(); setPwdMsg(null)
    if (pwd.nova !== pwd.conf) { setPwdMsg({ ok: false, text: 'A nova senha e a confirmação não conferem.' }); return }
    setPwdBusy(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: pwd.cur, newPassword: pwd.nova }),
      })
      const d = await res.json()
      if (!res.ok) { setPwdMsg({ ok: false, text: d.error ?? 'Não foi possível trocar a senha.' }); return }
      setPwd({ cur: '', nova: '', conf: '' })
      setPwdMsg({ ok: true, text: 'Senha alterada com sucesso!' })
    } finally { setPwdBusy(false) }
  }

  const set = (k: keyof Company, v: string) => {
    setForm((f) => ({ ...f, [k]: v }))
    setSaved(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const payload = {
        ...form,
        cnpj: form.cnpj.replace(/\D/g, ''),
        employeeCount: form.employeeCount ? parseInt(form.employeeCount, 10) : undefined,
      }
      const res = await fetch('/api/dashboard/company-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) { setError('Erro ao salvar.'); return }
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-4 border-primary-800 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Configurações da Empresa</h1>
        <p className="text-gray-500 text-sm mt-1">Dados que aparecem nos relatórios e documentos gerados</p>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">

        {/* Logo / foto da empresa */}
        <div className="flex items-center gap-4 pb-1">
          <div className="w-20 h-20 rounded-2xl border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Logo da empresa" className="w-full h-full object-contain" />
            ) : (
              <span className="text-2xl text-gray-300">🏢</span>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Logo da empresa</p>
            <p className="text-xs text-gray-400 mb-2">Aparece nos documentos. PNG ou JPG.</p>
            <button type="button" onClick={() => logoRef.current?.click()} disabled={logoBusy}
              className="text-sm font-semibold text-[#109CA1] border border-[#CCEFF1] bg-[#F0FBFC] px-3 py-1.5 rounded-lg hover:bg-[#E0F5F6] disabled:opacity-50">
              {logoBusy ? 'Enviando…' : logoUrl ? 'Trocar logo' : 'Enviar logo'}
            </button>
            <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={(e) => onLogo(e.target.files?.[0] ?? null)} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Razão Social *</label>
            <input
              required value={form.name}
              onChange={(e) => set('name', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-800 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome Fantasia</label>
            <input
              value={form.fantasyName}
              onChange={(e) => set('fantasyName', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-800 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
            <input
              value={maskCnpj(form.cnpj)}
              onChange={(e) => set('cnpj', e.target.value.replace(/\D/g, ''))}
              placeholder="00.000.000/0000-00"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-800 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Responsável (Gestor)</label>
            <input
              value={form.responsible}
              onChange={(e) => set('responsible', e.target.value)}
              placeholder="Nome do responsável"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-800 text-sm"
            />
          </div>
        </div>

        {/* Nº CLT + Modalidade — campos obrigatórios do GRO (R2) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nº de Colaboradores CLT *
              <span className="text-xs text-gray-400 font-normal ml-1">(exigido pelo GRO)</span>
            </label>
            <input
              type="number"
              min="1"
              required
              value={form.employeeCount}
              onChange={(e) => set('employeeCount', e.target.value)}
              placeholder="Ex: 45"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-800 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Modalidade de Trabalho *
              <span className="text-xs text-gray-400 font-normal ml-1">(exigido pelo GRO)</span>
            </label>
            <select
              required
              value={form.workModality}
              onChange={(e) => set('workModality', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-800 text-sm bg-white"
            >
              <option value="presencial">Presencial</option>
              <option value="hibrido">Híbrido</option>
              <option value="remoto">Remoto</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
            <input
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              placeholder="(00) 00000-0000"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-800 text-sm"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
              <input
                value={form.city}
                onChange={(e) => set('city', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-800 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">UF</label>
              <input
                value={form.state}
                onChange={(e) => set('state', e.target.value.toUpperCase().slice(0, 2))}
                placeholder="RJ"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-800 text-sm"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
          <input
            value={form.address}
            onChange={(e) => set('address', e.target.value)}
            placeholder="Rua, número, bairro"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-800 text-sm"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
        )}

        <div className="flex items-center justify-between pt-2">
          {saved && <p className="text-sm text-green-600 font-medium">✓ Dados salvos com sucesso!</p>}
          <div className="ml-auto">
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3 rounded-xl bg-primary-800 text-white font-semibold text-sm hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </form>

      {/* Conta e segurança */}
      <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900">Conta e segurança</h2>
        <p className="text-gray-500 text-sm mt-1 mb-5">O e-mail de acesso e a sua senha.</p>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">E-mail de acesso</label>
          <div className="flex items-center gap-2">
            <input value={email} readOnly className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-600" />
          </div>
          <p className="text-xs text-gray-400 mt-1">Para trocar o e-mail de acesso, fale com o suporte.</p>
        </div>

        <form onSubmit={changePassword} className="space-y-4 border-t border-gray-100 pt-5">
          <p className="text-sm font-semibold text-gray-700">Trocar senha</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha atual</label>
            <input type="password" required value={pwd.cur} onChange={(e) => { setPwd((p) => ({ ...p, cur: e.target.value })); setPwdMsg(null) }}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-800 text-sm" placeholder="••••••••" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nova senha</label>
              <input type="password" required minLength={6} value={pwd.nova} onChange={(e) => { setPwd((p) => ({ ...p, nova: e.target.value })); setPwdMsg(null) }}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-800 text-sm" placeholder="mínimo 6 caracteres" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar nova senha</label>
              <input type="password" required minLength={6} value={pwd.conf} onChange={(e) => { setPwd((p) => ({ ...p, conf: e.target.value })); setPwdMsg(null) }}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-800 text-sm" placeholder="repita a senha" />
            </div>
          </div>
          {pwdMsg && (
            <p className={`text-sm rounded-xl px-4 py-3 ${pwdMsg.ok ? 'text-green-700 bg-green-50 border border-green-200' : 'text-red-600 bg-red-50 border border-red-200'}`}>{pwdMsg.text}</p>
          )}
          <div className="flex justify-end">
            <button type="submit" disabled={pwdBusy}
              className="px-8 py-3 rounded-xl bg-primary-800 text-white font-semibold text-sm hover:bg-primary-700 transition-colors disabled:opacity-50">
              {pwdBusy ? 'Salvando…' : 'Trocar senha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
