'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Sector = {
  id: string
  name: string
  linkToken: string
  shareUrl: string
  totalResponses: number
  avgRiskScore: number | null
  riskLevel: 'baixo' | 'moderado' | 'alto' | 'critico' | null
}

const riskConfig = {
  baixo: { label: 'Baixo', bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  moderado: { label: 'Moderado', bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
  alto: { label: 'Alto', bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
  critico: { label: 'Crítico', bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
}

export default function PainelPage() {
  const [sectors, setSectors] = useState<Sector[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [newSectorName, setNewSectorName] = useState('')
  const [creating, setCreating] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const fetchSectors = async () => {
    try {
      const res = await fetch('/api/dashboard/sectors')
      if (!res.ok) return
      const data = await res.json()
      setSectors(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSectors() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSectorName.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/dashboard/sectors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSectorName }),
      })
      if (res.ok) {
        setNewSectorName('')
        setModalOpen(false)
        fetchSectors()
      }
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir setor e todas as suas respostas?')) return
    await fetch(`/api/dashboard/sectors/${id}`, { method: 'DELETE' })
    fetchSectors()
  }

  const handleCopy = (sector: Sector) => {
    navigator.clipboard.writeText(sector.shareUrl)
    setCopiedId(sector.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const totalResponses = sectors.reduce((s, sec) => s + sec.totalResponses, 0)
  const sectorsWithData = sectors.filter((s) => s.avgRiskScore !== null)
  const avgRisk = sectorsWithData.length
    ? sectorsWithData.reduce((s, sec) => s + (sec.avgRiskScore ?? 0), 0) / sectorsWithData.length
    : null

  const overallRisk = avgRisk === null ? null
    : avgRisk <= 1 ? 'baixo' : avgRisk <= 2 ? 'moderado' : avgRisk <= 3 ? 'alto' : 'critico'

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Visão Geral</h1>
          <p className="text-gray-500 text-sm mt-1">Gerencie os setores e acompanhe o risco psicossocial</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-primary-800 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary-700 transition-colors flex items-center gap-2"
        >
          <span>+</span> Novo Setor
        </button>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-gray-500 text-sm">Total de Setores</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{sectors.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-gray-500 text-sm">Total de Respostas</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{totalResponses}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-gray-500 text-sm">Risco Médio Geral</p>
          {overallRisk ? (
            <div className="flex items-center gap-2 mt-1">
              <p className="text-3xl font-bold text-gray-900">{avgRisk?.toFixed(1)}</p>
              <span className={`text-xs font-semibold px-2 py-1 rounded-lg border ${riskConfig[overallRisk].bg} ${riskConfig[overallRisk].text} ${riskConfig[overallRisk].border}`}>
                {riskConfig[overallRisk].label}
              </span>
            </div>
          ) : (
            <p className="text-gray-400 text-sm mt-1">Sem dados ainda</p>
          )}
        </div>
      </div>

      {/* Lista de setores */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-800 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sectors.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="text-5xl mb-4">🏢</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhum setor criado</h3>
          <p className="text-gray-400 text-sm mb-6">Crie seu primeiro setor para começar a coletar respostas.</p>
          <button
            onClick={() => setModalOpen(true)}
            className="bg-primary-800 text-white px-6 py-3 rounded-xl font-semibold text-sm"
          >
            + Criar Primeiro Setor
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sectors.map((sector) => {
            const risk = sector.riskLevel ? riskConfig[sector.riskLevel] : null
            return (
              <div key={sector.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-semibold text-gray-900">{sector.name}</h3>
                      {risk && (
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${risk.bg} ${risk.text} ${risk.border}`}>
                          {risk.label}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span>{sector.totalResponses} {sector.totalResponses === 1 ? 'resposta' : 'respostas'}</span>
                      {sector.avgRiskScore !== null && (
                        <span>Score: <strong className="text-gray-700">{sector.avgRiskScore.toFixed(2)}/4.0</strong></span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                    <button
                      onClick={() => handleCopy(sector)}
                      className="text-xs px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      {copiedId === sector.id ? '✅ Copiado!' : '🔗 Copiar Link'}
                    </button>
                    {sector.totalResponses > 0 && (
                      <Link
                        href={`/painel/setor/${sector.id}`}
                        className="text-xs px-3 py-2 rounded-lg bg-primary-800 text-white hover:bg-primary-700 transition-colors"
                      >
                        📊 Ver Relatório
                      </Link>
                    )}
                    <button
                      onClick={() => handleDelete(sector.id)}
                      className="text-xs px-3 py-2 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal novo setor */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Novo Setor</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do setor
                </label>
                <input
                  type="text"
                  required
                  value={newSectorName}
                  onChange={(e) => setNewSectorName(e.target.value)}
                  placeholder="Ex: Financeiro, RH, Operações..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-800 text-sm"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setModalOpen(false); setNewSectorName('') }}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-3 rounded-xl bg-primary-800 text-white font-semibold text-sm disabled:opacity-50"
                >
                  {creating ? 'Criando...' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
