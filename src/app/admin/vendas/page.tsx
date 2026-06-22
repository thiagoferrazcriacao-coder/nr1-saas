'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Venda = {
  id: string
  customerName: string | null
  customerEmail: string | null
  planLabel: string
  valorReais: number
  status: string
  createdAt: string
}
type Resumo = { totalVendas: number; receitaReais: number; porPlano: Record<string, number> }

const statusCfg: Record<string, { label: string; cls: string }> = {
  paid:       { label: 'Paga',       cls: 'bg-green-500/15 text-green-400 border-green-500/30' },
  waiting:    { label: 'Aguardando', cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  refunded:   { label: 'Reembolsada',cls: 'bg-slate-500/15 text-slate-300 border-slate-500/30' },
  chargeback: { label: 'Chargeback', cls: 'bg-red-500/15 text-red-400 border-red-500/30' },
}

const planNames: Record<string, string> = {
  'ate-10': 'Até 10 CLT', '11-30': '11 a 30 CLT', '31-50': '31 a 50 CLT', '51-100': '51 a 100 CLT',
}

export default function AdminVendasPage() {
  const router = useRouter()
  const [vendas, setVendas] = useState<Venda[]>([])
  const [resumo, setResumo] = useState<Resumo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/sales')
      .then((r) => { if (r.status === 401) { router.replace('/admin/login'); return null } return r.json() })
      .then((d) => { if (d) { setVendas(d.vendas ?? []); setResumo(d.resumo ?? null) } })
      .finally(() => setLoading(false))
  }, [router])

  const handleLogout = async () => { await fetch('/api/admin/login', { method: 'DELETE' }); router.replace('/admin/login') }

  const fmt = (n: number) => n.toLocaleString('pt-BR')

  if (loading) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center"><span className="text-lg">💰</span></div>
          <div>
            <p className="font-bold text-white text-sm">Vendas</p>
            <p className="text-slate-400 text-xs">Zelo — Painel da Annie</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-slate-300 hover:text-white text-sm font-medium">← Empresas</Link>
          <button onClick={handleLogout} className="text-slate-400 hover:text-white text-sm">Sair →</button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Resumo */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-5">
            <p className="text-2xl font-black">{resumo?.totalVendas ?? 0}</p>
            <p className="text-slate-300 text-xs mt-1">Vendas pagas</p>
          </div>
          <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-5">
            <p className="text-2xl font-black text-green-400">R$ {fmt(resumo?.receitaReais ?? 0)}</p>
            <p className="text-slate-300 text-xs mt-1">Receita total</p>
          </div>
          {resumo && Object.entries(resumo.porPlano).slice(0, 2).map(([plan, qtd]) => (
            <div key={plan} className="rounded-2xl border border-slate-700 bg-slate-800 p-5">
              <p className="text-2xl font-black">{qtd}</p>
              <p className="text-slate-300 text-xs mt-1">{planNames[plan] ?? plan}</p>
            </div>
          ))}
        </div>

        {/* Tabela */}
        <h2 className="font-bold text-lg mb-4">Histórico de vendas</h2>
        {vendas.length === 0 ? (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-10 text-center">
            <p className="text-slate-400 text-sm">Nenhuma venda registrada ainda.</p>
            <p className="text-slate-500 text-xs mt-2">As vendas aparecem aqui automaticamente assim que a Kiwify confirmar um pagamento.</p>
          </div>
        ) : (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 text-xs border-b border-slate-700">
                    <th className="text-left px-5 py-3 font-medium">Cliente</th>
                    <th className="text-left px-5 py-3 font-medium">Plano</th>
                    <th className="text-left px-5 py-3 font-medium">Valor</th>
                    <th className="text-left px-5 py-3 font-medium">Status</th>
                    <th className="text-left px-5 py-3 font-medium">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {vendas.map((v) => {
                    const st = statusCfg[v.status] ?? { label: v.status, cls: 'bg-slate-500/15 text-slate-300 border-slate-500/30' }
                    return (
                      <tr key={v.id} className="border-b border-slate-700/50 last:border-0">
                        <td className="px-5 py-3">
                          <p className="font-medium text-white">{v.customerName || '—'}</p>
                          <p className="text-slate-400 text-xs">{v.customerEmail || ''}</p>
                        </td>
                        <td className="px-5 py-3 text-slate-300">{v.planLabel}</td>
                        <td className="px-5 py-3 font-semibold">R$ {fmt(v.valorReais)}</td>
                        <td className="px-5 py-3"><span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${st.cls}`}>{st.label}</span></td>
                        <td className="px-5 py-3 text-slate-400 text-xs whitespace-nowrap">{new Date(v.createdAt).toLocaleString('pt-BR')}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
