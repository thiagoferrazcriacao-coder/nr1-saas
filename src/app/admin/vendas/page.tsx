'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

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
  paid:       { label: 'Paga',        cls: 'bg-green-50 text-green-700 border-green-200' },
  waiting:    { label: 'Aguardando',  cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  refunded:   { label: 'Reembolsada', cls: 'bg-gray-50 text-gray-600 border-gray-200' },
  chargeback: { label: 'Chargeback',  cls: 'bg-red-50 text-red-700 border-red-200' },
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

  const fmt = (n: number) => n.toLocaleString('pt-BR')

  if (loading) {
    return <div className="flex justify-center py-24"><div className="w-10 h-10 border-4 border-primary-800 border-t-transparent rounded-full animate-spin" /></div>
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Vendas</h1>
        <p className="text-gray-500 text-sm mt-1">Pagamentos confirmados pela Kiwify, em tempo real.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-[#17C3C9] to-[#3F7DE0] text-white rounded-2xl shadow-sm p-5">
          <p className="text-3xl font-black">{resumo?.totalVendas ?? 0}</p>
          <p className="text-white/80 text-xs mt-1">Vendas pagas</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-2xl font-black text-green-600">R$ {fmt(resumo?.receitaReais ?? 0)}</p>
          <p className="text-gray-500 text-xs mt-1">Receita total</p>
        </div>
        {resumo && Object.entries(resumo.porPlano).slice(0, 2).map(([plan, qtd]) => (
          <div key={plan} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-2xl font-black text-gray-900">{qtd}</p>
            <p className="text-gray-500 text-xs mt-1">{planNames[plan] ?? plan}</p>
          </div>
        ))}
      </div>

      {vendas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <p className="text-gray-500 text-sm">Nenhuma venda registrada ainda.</p>
          <p className="text-gray-400 text-xs mt-2">As vendas aparecem aqui automaticamente quando a Kiwify confirmar um pagamento.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 text-xs border-b border-gray-100">
                  <th className="text-left px-5 py-3 font-medium">Cliente</th>
                  <th className="text-left px-5 py-3 font-medium">Plano</th>
                  <th className="text-left px-5 py-3 font-medium">Valor</th>
                  <th className="text-left px-5 py-3 font-medium">Status</th>
                  <th className="text-left px-5 py-3 font-medium">Data</th>
                </tr>
              </thead>
              <tbody>
                {vendas.map((v) => {
                  const st = statusCfg[v.status] ?? { label: v.status, cls: 'bg-gray-50 text-gray-600 border-gray-200' }
                  return (
                    <tr key={v.id} className="border-b border-gray-50 last:border-0">
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-900">{v.customerName || '—'}</p>
                        <p className="text-gray-400 text-xs">{v.customerEmail || ''}</p>
                      </td>
                      <td className="px-5 py-3 text-gray-600">{v.planLabel}</td>
                      <td className="px-5 py-3 font-semibold text-gray-900">R$ {fmt(v.valorReais)}</td>
                      <td className="px-5 py-3"><span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${st.cls}`}>{st.label}</span></td>
                      <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">{new Date(v.createdAt).toLocaleString('pt-BR')}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
