'use client'

import { useEffect, useState } from 'react'

type Company = {
  id: string
  name: string
  fantasyName: string | null
  cnpj: string | null
  city: string | null
  state: string | null
  email: string | null
  employeeCount: number | null
  plan: string
  drpsStatus: string
  totalResponses: number
  sectorsCount: number
  createdAt: string
}

const planLabel: Record<string, string> = {
  starter: 'Starter', 'ate-10': 'Até 10 CLT', '11-30': '11 a 30 CLT', '31-50': '31 a 50 CLT', '51-100': '51 a 100 CLT',
}
const statusCfg: Record<string, { label: string; cls: string }> = {
  pendente:   { label: 'Pendente',   cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  em_revisao: { label: 'Em revisão', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  aprovado:   { label: 'Aprovado',   cls: 'bg-green-50 text-green-700 border-green-200' },
  rejeitado:  { label: 'Rejeitado',  cls: 'bg-red-50 text-red-700 border-red-200' },
}

export default function EmpresasPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/owner/companies')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setCompanies(d.companies ?? []) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="flex justify-center py-24"><div className="w-10 h-10 border-4 border-primary-800 border-t-transparent rounded-full animate-spin" /></div>
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Empresas</h1>
        <p className="text-gray-500 text-sm mt-1">Todos os clientes que entraram na plataforma.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-gray-500 text-xs uppercase tracking-wide">Empresas</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{companies.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-gray-500 text-xs uppercase tracking-wide">DRPS aprovados</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{companies.filter((c) => c.drpsStatus === 'aprovado').length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-gray-500 text-xs uppercase tracking-wide">Respostas (total)</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{companies.reduce((s, c) => s + c.totalResponses, 0)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-gray-500 text-xs uppercase tracking-wide">Colaboradores (CLT)</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{companies.reduce((s, c) => s + (c.employeeCount ?? 0), 0)}</p>
        </div>
      </div>

      {companies.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <p className="text-gray-500 text-sm">Nenhuma empresa cadastrada ainda.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {companies.map((c) => {
            const st = statusCfg[c.drpsStatus] ?? { label: c.drpsStatus, cls: 'bg-gray-50 text-gray-600 border-gray-200' }
            return (
              <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900">{c.name}</h3>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg border ${st.cls}`}>{st.label}</span>
                      <span className="text-xs bg-[#F0FBFC] text-[#109CA1] border border-[#CCEFF1] px-2 py-0.5 rounded-lg font-semibold">{planLabel[c.plan] ?? c.plan}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                      {c.email && <span>✉️ {c.email}</span>}
                      {c.cnpj && <span>CNPJ: {c.cnpj}</span>}
                      {(c.city || c.state) && <span>📍 {[c.city, c.state].filter(Boolean).join('/')}</span>}
                      {c.employeeCount != null && <span>👥 {c.employeeCount} CLT</span>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-400">Entrou em</p>
                    <p className="text-sm font-medium text-gray-700">{new Date(c.createdAt).toLocaleDateString('pt-BR')}</p>
                    <p className="text-xs text-gray-400 mt-1">{c.sectorsCount} setor{c.sectorsCount !== 1 ? 'es' : ''} · {c.totalResponses} resp.</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
