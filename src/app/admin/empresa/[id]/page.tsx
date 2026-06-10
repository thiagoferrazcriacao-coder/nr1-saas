'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

type TopicScore = {
  topicNum: number; topic: string; score: number; riskLevel: string
}

type MatrixItem = {
  topicNum: number; topic: string; gravidade: string; gravScore: number
  probabilidade: string; riskFinal: string
}

type AiData = {
  diagnostico?: string
  topicos_criticos?: string[]
  acoes_imediatas?: string[]
}

type SectorData = {
  id: string; name: string; totalResponses: number
  avgScore: number | null; riskLevel: string | null
  byTopic: TopicScore[]; matrix: MatrixItem[]
  latestAi: AiData | null; assessedBy: string | null
}

type CompanyData = {
  id: string; name: string; fantasyName: string | null
  cnpj: string | null; city: string | null; state: string | null
  address: string | null; responsible: string | null; phone: string | null
  employeeCount: number | null; workModality: string | null
  drpsStatus: string; drpsValidatedAt: string | null
  drpsValidatedBy: string | null; drpsNotes: string | null
  termsAcceptedAt: string | null; createdAt: string
}

const riskCfg: Record<string, { label: string; color: string; bg: string }> = {
  baixo:    { label: 'Baixo',    color: '#16a34a', bg: '#f0fdf4' },
  moderado: { label: 'Moderado', color: '#ca8a04', bg: '#fefce8' },
  alto:     { label: 'Alto',     color: '#ea580c', bg: '#fff7ed' },
  critico:  { label: 'Crítico',  color: '#dc2626', bg: '#fef2f2' },
}

const modalityLabel: Record<string, string> = {
  presencial: 'Presencial', hibrido: 'Híbrido', remoto: 'Remoto',
}

function RiskBadge({ level }: { level: string }) {
  const cfg = riskCfg[level]
  if (!cfg) return null
  return (
    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}40` }}>
      {cfg.label}
    </span>
  )
}

export default function AdminEmpresaPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [company, setCompany] = useState<CompanyData | null>(null)
  const [sectors, setSectors] = useState<SectorData[]>([])
  const [loading, setLoading] = useState(true)
  const [notes, setNotes]     = useState('')
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetch(`/api/admin/company/${id}`)
      .then((r) => {
        if (r.status === 401) { router.replace('/admin/login'); return null }
        return r.json()
      })
      .then((data) => {
        if (!data) return
        setCompany(data.company)
        setSectors(data.sectors)
        setNotes(data.company.drpsNotes ?? '')
      })
      .finally(() => setLoading(false))
  }, [id, router])

  const handleValidate = async (action: 'aprovar' | 'rejeitar') => {
    setError('')
    setSuccess('')
    if (action === 'rejeitar' && !notes.trim()) {
      setError('Informe o motivo da rejeição nas observações.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/company/${id}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes: notes.trim() || undefined }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setCompany((prev) => prev ? { ...prev, drpsStatus: data.drpsStatus, drpsValidatedAt: new Date().toISOString(), drpsValidatedBy: 'Annie Talma — CRP/05/44595' } : prev)
      setSuccess(action === 'aprovar' ? '✅ DRPS aprovado e liberado para a empresa!' : '❌ DRPS rejeitado. A empresa será notificada.')
    } catch {
      setError('Erro ao salvar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!company) return null

  const totalResponses = sectors.reduce((s, sec) => s + sec.totalResponses, 0)
  const sectorsWithData = sectors.filter((s) => s.totalResponses > 0)
  const overallRisk = sectorsWithData.length
    ? (['critico', 'alto', 'moderado', 'baixo'] as const)
        .find((l) => sectorsWithData.some((s) => s.riskLevel === l)) ?? 'baixo'
    : null

  const isApproved = company.drpsStatus === 'aprovado'
  const isRejected = company.drpsStatus === 'rejeitado'

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center gap-4">
        <Link href="/admin" className="text-slate-400 hover:text-white text-sm transition-colors">← Voltar</Link>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-lg">🧠</span>
          </div>
          <div className="min-w-0">
            <p className="font-bold text-white text-sm truncate">{company.fantasyName ?? company.name}</p>
            <p className="text-slate-400 text-xs">Revisão do DRPS</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* Dados da empresa */}
        <section className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Dados da Empresa</h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-slate-500 text-xs">Razão Social</p>
              <p className="font-semibold mt-0.5">{company.name}</p>
            </div>
            {company.cnpj && (
              <div>
                <p className="text-slate-500 text-xs">CNPJ</p>
                <p className="font-semibold mt-0.5">{company.cnpj}</p>
              </div>
            )}
            {company.responsible && (
              <div>
                <p className="text-slate-500 text-xs">Responsável</p>
                <p className="font-semibold mt-0.5">{company.responsible}</p>
              </div>
            )}
            {(company.city || company.state) && (
              <div>
                <p className="text-slate-500 text-xs">Cidade/UF</p>
                <p className="font-semibold mt-0.5">{[company.city, company.state].filter(Boolean).join('/')}</p>
              </div>
            )}
            {company.employeeCount != null && (
              <div>
                <p className="text-slate-500 text-xs">Colaboradores CLT</p>
                <p className="font-semibold mt-0.5">{company.employeeCount}</p>
              </div>
            )}
            {company.workModality && (
              <div>
                <p className="text-slate-500 text-xs">Modalidade</p>
                <p className="font-semibold mt-0.5">{modalityLabel[company.workModality] ?? company.workModality}</p>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            <div className="bg-slate-700/50 rounded-xl p-3 text-center">
              <p className="text-2xl font-black">{totalResponses}</p>
              <p className="text-slate-400 text-xs mt-0.5">Respostas totais</p>
            </div>
            <div className="bg-slate-700/50 rounded-xl p-3 text-center">
              <p className="text-2xl font-black">{sectors.length}</p>
              <p className="text-slate-400 text-xs mt-0.5">Setores</p>
            </div>
            <div className="bg-slate-700/50 rounded-xl p-3 text-center">
              {overallRisk ? <RiskBadge level={overallRisk} /> : <span className="text-slate-500 text-xs">—</span>}
              <p className="text-slate-400 text-xs mt-1">Risco dominante</p>
            </div>
          </div>
        </section>

        {/* Setores */}
        <section>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Setores ({sectors.length})
          </h2>
          <div className="space-y-4">
            {sectors.map((sector) => (
              <div key={sector.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
                <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
                  <div>
                    <h3 className="font-bold text-white">{sector.name}</h3>
                    <p className="text-slate-400 text-xs mt-0.5">
                      {sector.totalResponses} respondente{sector.totalResponses !== 1 ? 's' : ''}
                      {sector.assessedBy ? ` · Avaliador: ${sector.assessedBy}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {sector.avgScore != null && (
                      <span className="text-xl font-black">{sector.avgScore.toFixed(2)}</span>
                    )}
                    {sector.riskLevel && <RiskBadge level={sector.riskLevel} />}
                  </div>
                </div>

                {sector.totalResponses === 0 ? (
                  <p className="text-slate-500 text-sm italic">Sem respostas ainda</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="text-left py-2 px-2 text-slate-500 font-medium">Tópico</th>
                          <th className="text-center py-2 px-2 text-slate-500 font-medium">Score</th>
                          <th className="text-center py-2 px-2 text-slate-500 font-medium">Gravidade</th>
                          <th className="text-center py-2 px-2 text-slate-500 font-medium">Probabilidade</th>
                          <th className="text-center py-2 px-2 text-slate-500 font-medium">Risco Final</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sector.matrix.map((m) => (
                          <tr key={m.topicNum} className="border-b border-slate-700/50">
                            <td className="py-2 px-2 text-slate-300">{m.topicNum}. {m.topic}</td>
                            <td className="py-2 px-2 text-center font-mono">{m.gravScore.toFixed(2)}</td>
                            <td className="py-2 px-2 text-center"><RiskBadge level={m.gravidade === 'baixa' ? 'baixo' : m.gravidade === 'media' ? 'moderado' : 'alto'} /></td>
                            <td className="py-2 px-2 text-center"><RiskBadge level={m.probabilidade === 'baixa' ? 'baixo' : m.probabilidade === 'media' ? 'moderado' : 'alto'} /></td>
                            <td className="py-2 px-2 text-center"><RiskBadge level={m.riskFinal} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Diagnóstico da IA */}
                {sector.latestAi?.diagnostico && (
                  <div className="mt-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3">
                    <p className="text-xs font-semibold text-indigo-400 mb-1">🤖 Diagnóstico da IA</p>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {sector.latestAi.diagnostico}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Painel de validação */}
        <section className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Validação — Annie Talma (CRP/05/44595)
          </h2>

          {(isApproved || isRejected) && (
            <div className={`rounded-xl p-4 mb-4 ${isApproved ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
              <p className={`text-sm font-semibold ${isApproved ? 'text-green-400' : 'text-red-400'}`}>
                {isApproved ? '✅ DRPS aprovado' : '❌ DRPS rejeitado'}
              </p>
              {company.drpsValidatedAt && (
                <p className="text-xs text-slate-400 mt-1">
                  {new Date(company.drpsValidatedAt).toLocaleString('pt-BR')} · {company.drpsValidatedBy}
                </p>
              )}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Observações técnicas <span className="text-slate-500 font-normal">(obrigatório para rejeição)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Descreva achados técnicos, recomendações ou motivo da rejeição..."
              className="w-full px-4 py-3 rounded-xl bg-slate-700 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-2 mb-4">{error}</p>
          )}
          {success && (
            <p className="text-sm text-green-400 bg-green-400/10 border border-green-400/20 rounded-xl px-4 py-2 mb-4">{success}</p>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => handleValidate('aprovar')}
              disabled={saving || isApproved}
              className="px-6 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-500 transition-colors disabled:opacity-50 text-sm"
            >
              {saving ? '...' : '✅ Aprovar e Assinar DRPS'}
            </button>
            <button
              onClick={() => handleValidate('rejeitar')}
              disabled={saving || isRejected}
              className="px-6 py-3 rounded-xl bg-red-600/80 text-white font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 text-sm"
            >
              {saving ? '...' : '❌ Rejeitar'}
            </button>
          </div>

          <p className="text-xs text-slate-500 mt-4">
            Ao aprovar, o DRPS será liberado para download pela empresa com a assinatura digital da responsável técnica Annie Talma — CRP/05/44595, conforme exigido pela NR-1.
          </p>
        </section>
      </main>
    </div>
  )
}
