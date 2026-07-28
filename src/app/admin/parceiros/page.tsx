'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Partner = { id: string; name: string; code: string; contactName: string | null; email: string | null; phone: string | null; paidSales: number; link: string; createdAt: string }

export default function AdminParceirosPage() {
  const router = useRouter()
  const [partners, setPartners] = useState<Partner[]>([])
  const [form, setForm] = useState({ name: '', code: '', contactName: '', email: '', phone: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')

  const load = () => fetch('/api/admin/partners').then((r) => {
    if (r.status === 401) { router.replace('/admin/login'); return null }
    return r.json()
  }).then((d) => { if (d) setPartners(d.partners ?? []) }).finally(() => setLoading(false))

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const create = async (e: FormEvent) => {
    e.preventDefault(); setError(''); setSaving(true)
    try {
      const res = await fetch('/api/admin/partners', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Não foi possível cadastrar.'); return }
      setForm({ name: '', code: '', contactName: '', email: '', phone: '' })
      await load()
    } finally { setSaving(false) }
  }

  const copy = async (p: Partner) => {
    await navigator.clipboard.writeText(p.link)
    setCopied(p.id); setTimeout(() => setCopied(''), 1800)
  }

  if (loading) return <div className="flex justify-center py-24"><div className="w-10 h-10 border-4 border-primary-800 border-t-transparent rounded-full animate-spin" /></div>

  return <div className="max-w-5xl mx-auto">
    <div className="mb-6"><h1 className="text-2xl font-bold text-gray-900">Parceiros</h1><p className="text-gray-500 text-sm mt-1">Crie links de indicação e acompanhe as vendas de cada contabilidade.</p></div>
    <form onSubmit={create} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
      <h2 className="font-bold text-gray-900 mb-4">Cadastrar parceiro</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <input required placeholder="Nome da contabilidade *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
        <input placeholder="Código (opcional)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
        <input placeholder="Responsável" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
        <input type="email" placeholder="E-mail" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
        <input placeholder="WhatsApp" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
        <button disabled={saving} className="rounded-xl bg-gradient-to-r from-[#17C3C9] to-[#3F7DE0] text-white font-semibold text-sm disabled:opacity-50">{saving ? 'Salvando...' : 'Gerar link do parceiro'}</button>
      </div>
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2 mt-3">{error}</p>}
    </form>
    <div className="space-y-3">{partners.length === 0 ? <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-sm text-gray-500">Nenhum parceiro cadastrado.</div> : partners.map((p) => <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold text-gray-900">{p.name}</h3><p className="text-xs text-gray-500 mt-1">Código: <b>{p.code}</b> · {p.paidSales} venda{p.paidSales === 1 ? '' : 's'} paga{p.paidSales === 1 ? '' : 's'}</p></div><button onClick={() => copy(p)} className="px-3 py-2 rounded-lg bg-[#F0FBFC] text-[#109CA1] text-xs font-semibold">{copied === p.id ? 'Copiado!' : 'Copiar link'}</button></div><p className="mt-3 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 break-all">{p.link}</p></div>)}</div>
  </div>
}
