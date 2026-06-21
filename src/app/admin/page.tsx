'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Company = {
  id:              string
  name:            string
  fantasyName:     string | null
  cnpj:            string | null
  city:            string | null
  state:           string | null
  responsible:     string | null
  employeeCount:   number | null
  workModality:    string | null
  drpsStatus:      string
  drpsValidatedAt: string | null
  drpsValidatedBy: string | null
  termsAcceptedAt: string | null
  createdAt:       string
  _count:          { sectors: number }
  totalResponses:  number
}

const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  pendente:   { label: 'Aguardando', bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500' },
  em_revisao: { label: 'Em revisão',  bg: 'bg-blue-100',   text: 'text-blue-800',   dot: 'bg-blue-500'   },
  aprovado:   { label: 'Aprovado',   bg: 'bg-green-100',  text: 'text-green-800',  dot: 'bg-green-500'  },
  rejeitado:  { label: 'Rejeitado',  bg: 'bg-red-100',    text: 'text-red-800',    dot: 'bg-red-500'    },
}

const modalityLabel: Record<string, string> = {
  presencial: 'Presencial', hibrido: 'Híbrido', remoto: 'Remoto',
}

export default function AdminPage() {
  const router = useRouter()
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState<string>('todos')

  useEffect(() => {
    fetch('/api/admin/companies')
      .then((r) => {
        if (r.status === 401) { router.replace('/admin/login'); return null }
        return r.json()
      })
      .then((data) => {
        if (data) setCompanies(data.companies ?? [])
      })
      .finally(() => setLoading(false))
  }, [router])

  const handleLogout = async () => {
    await fetch('/api/admin/login', { method: 'DELETE' })
    router.replace('/admin/login')
  }

  const filtered = filter === 'todos'
    ? companies
    : companies.filter((c) => c.drpsStatus === filter)

  const counts = {
    pendente:   companies.filter((c) => c.drpsStatus === 'pendente').length,
    em_revisao: companies.filter((c) => c.drpsStatus === 'em_revisao').length,
    aprovado:   companies.filter((c) => c.drpsStatus === 'aprovado').length,
    rejeitado:  companies.filter((c) => c.drpsStatus === 'rejeitado').length,
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
            <span className="text-lg">🧠</span>
          </div>
          <div>
            <p className="font-bold text-white text-sm">Zelo</p>
            <p className="text-slate-400 text-xs">Painel da Annie</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="text-slate-400 hover:text-white text-sm transition-colors"
        >
          Sair →
        </button>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Título + stats */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Fila de Validação</h1>
          <p className="text-slate-400 text-sm mt-1">
            Revise os dados de cada empresa e assine o DRPS antes da liberação
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
            {[
              { key: 'pendente',   label: 'Aguardando',  icon: '⏳', color: 'border-yellow-500/30 bg-yellow-500/10' },
              { key: 'em_revisao', label: 'Em revisão',  icon: '🔍', color: 'border-blue-500/30 bg-blue-500/10'     },
              { key: 'aprovado',   label: 'Aprovados',   icon: '✅', color: 'border-green-500/30 bg-green-500/10'   },
              { key: 'rejeitado',  label: 'Rejeitados',  icon: '❌', color: 'border-red-500/30 bg-red-500/10'       },
            ].map((s) => (
              <button
                key={s.key}
                onClick={() => setFilter(s.key === filter ? 'todos' : s.key)}
                className={`rounded-2xl border p-4 text-left transition-all ${s.color} ${filter === s.key ? 'ring-2 ring-indigo-500' : ''}`}
              >
                <p className="text-2xl">{s.icon}</p>
                <p className="text-2xl font-black mt-1">{counts[s.key as keyof typeof counts]}</p>
                <p className="text-slate-400 text-xs mt-0.5">{s.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Filtro ativo */}
        {filter !== 'todos' && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-slate-400">Filtrando por:</span>
            <span className="text-sm font-semibold text-indigo-400">{statusConfig[filter]?.label}</span>
            <button onClick={() => setFilter('todos')} className="text-xs text-slate-500 hover:text-white ml-2">× limpar</button>
          </div>
        )}

        {/* Lista */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <p className="text-4xl mb-3">📭</p>
            <p>Nenhuma empresa neste filtro</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((company) => {
              const st = statusConfig[company.drpsStatus] ?? statusConfig.pendente
              return (
                <Link
                  key={company.id}
                  href={`/admin/empresa/${company.id}`}
                  className="block bg-slate-800 border border-slate-700 rounded-2xl p-5 hover:border-indigo-500/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-bold text-white truncate">{company.fantasyName ?? company.name}</h2>
                        <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${st.bg} ${st.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                          {st.label}
                        </span>
                      </div>
                      <p className="text-slate-400 text-sm mt-0.5 truncate">{company.name}</p>
                    </div>

                    <div className="flex items-center gap-6 text-right flex-shrink-0">
                      <div>
                        <p className="text-xl font-black text-white">{company.totalResponses}</p>
                        <p className="text-xs text-slate-500">respostas</p>
                      </div>
                      <div>
                        <p className="text-xl font-black text-white">{company._count.sectors}</p>
                        <p className="text-xs text-slate-500">setores</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-300">{company.employeeCount ?? '—'}</p>
                        <p className="text-xs text-slate-500">CLT</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-500 flex-wrap">
                    {company.city && <span>📍 {company.city}{company.state ? `/${company.state}` : ''}</span>}
                    {company.workModality && <span>🏢 {modalityLabel[company.workModality] ?? company.workModality}</span>}
                    {company.cnpj && <span>CNPJ: {company.cnpj}</span>}
                    <span>Cadastro: {new Date(company.createdAt).toLocaleDateString('pt-BR')}</span>
                    {company.drpsValidatedAt && (
                      <span className="text-green-400">
                        Validado em {new Date(company.drpsValidatedAt).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
