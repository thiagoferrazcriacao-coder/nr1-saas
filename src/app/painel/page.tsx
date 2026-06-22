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

type CompanySettings = {
  employeeCount: number | null
  name: string
  drpsStatus: string
}

const riskConfig = {
  baixo:    { label: 'Baixo',    bg: 'bg-green-100',  text: 'text-green-700',  border: 'border-green-300'  },
  moderado: { label: 'Moderado', bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
  alto:     { label: 'Alto',     bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
  critico:  { label: 'Crítico',  bg: 'bg-red-100',    text: 'text-red-700',    border: 'border-red-300'    },
}

function QrModal({ url, sectorName, onClose }: { url: string; sectorName: string; onClose: () => void }) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(url)}&color=1e3a5f&bgcolor=ffffff&margin=10`

  const handleDownload = async () => {
    try {
      const res = await fetch(qrUrl)
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `qrcode-${sectorName.toLowerCase().replace(/\s+/g, '-')}.png`
      a.click()
    } catch {
      window.open(qrUrl, '_blank')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">QR Code</h2>
            <p className="text-xs text-gray-500 mt-0.5">{sectorName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <div className="flex justify-center bg-gray-50 rounded-xl p-4 mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrUrl} alt={`QR Code ${sectorName}`} width={200} height={200} className="rounded-lg" />
        </div>

        <p className="text-xs text-gray-400 text-center mb-4 break-all">{url}</p>

        <div className="flex gap-3">
          <button
            onClick={handleDownload}
            className="flex-1 py-3 rounded-xl bg-primary-800 text-white font-semibold text-sm hover:bg-primary-700 transition-colors"
          >
            ⬇️ Baixar PNG
          </button>
          <button
            onClick={() => { navigator.clipboard.writeText(url) }}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium text-sm hover:bg-gray-50 transition-colors"
          >
            🔗 Copiar Link
          </button>
        </div>

        <p className="text-xs text-gray-400 text-center mt-3">
          Imprima e cole no mural do setor para facilitar o acesso dos colaboradores
        </p>
      </div>
    </div>
  )
}

export default function PainelPage() {
  const [sectors, setSectors]       = useState<Sector[]>([])
  const [company, setCompany]       = useState<CompanySettings | null>(null)
  const [loading, setLoading]       = useState(true)
  const [modalOpen, setModalOpen]   = useState(false)
  const [newSectorName, setNewSectorName] = useState('')
  const [creating, setCreating]     = useState(false)
  const [copiedId, setCopiedId]     = useState<string | null>(null)
  const [qrSector, setQrSector]     = useState<Sector | null>(null)
  const [assessmentDone, setAssessmentDone] = useState(true) // assume preenchida até confirmar

  const fetchData = async () => {
    try {
      const [sectorsRes, settingsRes, assessmentRes] = await Promise.all([
        fetch('/api/dashboard/sectors'),
        fetch('/api/dashboard/company-settings'),
        fetch('/api/dashboard/company-assessment'),
      ])
      if (sectorsRes.ok) setSectors(await sectorsRes.json())
      if (settingsRes.ok) {
        const { company: c } = await settingsRes.json()
        setCompany(c)
      }
      if (assessmentRes.ok) {
        const { assessment } = await assessmentRes.json()
        setAssessmentDone(!!assessment)
      } else {
        setAssessmentDone(false)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

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
      if (res.ok) { setNewSectorName(''); setModalOpen(false); fetchData() }
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir setor e todas as suas respostas?')) return
    await fetch(`/api/dashboard/sectors/${id}`, { method: 'DELETE' })
    fetchData()
  }

  const handleCopy = (sector: Sector) => {
    navigator.clipboard.writeText(sector.shareUrl)
    setCopiedId(sector.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const totalResponses   = sectors.reduce((s, sec) => s + sec.totalResponses, 0)
  const sectorsWithData  = sectors.filter((s) => s.avgRiskScore !== null)
  const avgRisk          = sectorsWithData.length
    ? sectorsWithData.reduce((s, sec) => s + (sec.avgRiskScore ?? 0), 0) / sectorsWithData.length
    : null
  const overallRisk      = avgRisk === null ? null
    : avgRisk <= 1 ? 'baixo' : avgRisk <= 2 ? 'moderado' : avgRisk <= 3 ? 'alto' : 'critico'

  const employeeCount    = company?.employeeCount ?? null
  const targetPerSector  = employeeCount && sectors.length ? Math.ceil(employeeCount / sectors.length) : null
  const globalProgress   = employeeCount ? Math.min(100, Math.round((totalResponses / employeeCount) * 100)) : null

  // Passos de onboarding
  const step1Done = sectors.length > 0
  const step2Done = sectors.some((s) => s.totalResponses > 0)
  const step3Done = sectorsWithData.length > 0 && sectorsWithData.some((s) => s.riskLevel !== null)
  const step4Done = company?.drpsStatus === 'aprovado'
  const onboardingDone = step1Done && step2Done && step3Done

  return (
    <div className="max-w-5xl mx-auto">

      {/* Guia de configuração inicial */}
      {!onboardingDone && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">▶</span>
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Guia de Configuração</h2>
              <p className="text-sm text-gray-500">Siga os passos para lançar seu primeiro diagnóstico</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { done: step1Done, icon: '🏢', title: 'Crie seus setores', desc: 'Cadastre cada setor da empresa', action: () => setModalOpen(true), actionLabel: 'Criar Setor' },
              { done: step2Done, icon: '🔗', title: 'Distribua os links', desc: 'Envie o link ou QR code para os colaboradores', action: null, actionLabel: null },
              { done: step3Done, icon: '📊', title: 'Aguarde as respostas', desc: 'Acompanhe o progresso em tempo real', action: null, actionLabel: null },
              { done: step4Done, icon: '✅', title: 'Baixe o DRPS', desc: 'Relatório assinado pela psicóloga Annie Talma', action: null, actionLabel: null },
            ].map((step, i) => (
              <div key={i} className={`bg-white rounded-xl p-4 border ${step.done ? 'border-green-200' : 'border-gray-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step.done ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {step.done ? '✓' : i + 1}
                  </div>
                  <span className="text-lg">{step.icon}</span>
                </div>
                <p className={`text-sm font-semibold ${step.done ? 'text-green-700 line-through' : 'text-gray-800'}`}>{step.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{step.desc}</p>
                {!step.done && step.action && (
                  <button
                    onClick={step.action}
                    className="mt-3 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    {step.actionLabel} →
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
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

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-gray-500 text-xs uppercase tracking-wide">Setores</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{sectors.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-gray-500 text-xs uppercase tracking-wide">Respostas</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{totalResponses}</p>
          {globalProgress !== null && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>{globalProgress}% dos CLTs</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${globalProgress >= 80 ? 'bg-green-500' : globalProgress >= 50 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                  style={{ width: `${globalProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-gray-500 text-xs uppercase tracking-wide">Risco Médio</p>
          {overallRisk ? (
            <div className="flex items-center gap-2 mt-1">
              <p className="text-3xl font-bold text-gray-900">{avgRisk?.toFixed(1)}</p>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg border ${riskConfig[overallRisk].bg} ${riskConfig[overallRisk].text} ${riskConfig[overallRisk].border}`}>
                {riskConfig[overallRisk].label}
              </span>
            </div>
          ) : (
            <p className="text-gray-400 text-sm mt-1">—</p>
          )}
        </div>
        <Link href="/painel/documentos" className="bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-100 rounded-2xl shadow-sm p-5 hover:shadow-md transition-shadow group">
          <p className="text-blue-600 text-xs uppercase tracking-wide font-medium">Documentos</p>
          <p className="text-lg font-bold text-blue-800 mt-1 group-hover:underline">DRPS, PGR e Plano de Ação</p>
          <p className="text-blue-500 text-xs mt-1">Gere seus documentos da NR-1 →</p>
        </Link>
      </div>

      {/* Trava: link do time só libera após a Avaliação do Gestor */}
      {!loading && !assessmentDone && sectors.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4 flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <span className="text-xl">🔒</span>
            <div>
              <p className="text-sm font-semibold text-amber-900">Link bloqueado</p>
              <p className="text-sm text-amber-800 mt-0.5">
                Para enviar o questionário ao time, primeiro preencha a <strong>Avaliação do Gestor</strong>.
                Ela define a probabilidade de cada risco — sem ela, o DRPS sai incompleto.
              </p>
            </div>
          </div>
          <Link
            href="/painel/avaliacao-gestor"
            className="flex-shrink-0 bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-amber-700 transition-colors"
          >
            Preencher agora
          </Link>
        </div>
      )}

      {/* Lista de setores */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-800 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sectors.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="text-5xl mb-4">🏢</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhum setor criado</h3>
          <p className="text-gray-400 text-sm mb-6">Crie seus setores para começar a coletar respostas dos colaboradores.</p>
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
            const progress = targetPerSector ? Math.min(100, Math.round((sector.totalResponses / targetPerSector) * 100)) : null
            const progressColor = progress === null ? '' : progress >= 80 ? 'bg-green-500' : progress >= 50 ? 'bg-yellow-500' : 'bg-blue-400'

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

                    {/* Barra de progresso de respostas */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>
                          <strong className="text-gray-700">{sector.totalResponses}</strong> respondente{sector.totalResponses !== 1 ? 's' : ''}
                          {targetPerSector ? ` / ~${targetPerSector} estimados` : ''}
                        </span>
                        {sector.avgRiskScore !== null && (
                          <span>Score: <strong className="text-gray-700">{sector.avgRiskScore.toFixed(2)}/4.0</strong></span>
                        )}
                      </div>
                      {targetPerSector && (
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden w-full max-w-xs">
                          <div
                            className={`h-full rounded-full transition-all ${progressColor}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}
                      {progress !== null && progress < 80 && sector.totalResponses > 0 && (
                        <p className="text-xs text-amber-600 mt-1">
                          ⚠️ Meta: 80% de participação ({Math.ceil((targetPerSector ?? 0) * 0.8)} respostas)
                        </p>
                      )}
                      {progress !== null && progress >= 80 && (
                        <p className="text-xs text-green-600 mt-1">✅ Meta de participação atingida</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                    <button
                      onClick={() => setQrSector(sector)}
                      disabled={!assessmentDone}
                      title={assessmentDone ? 'Gerar QR Code' : 'Preencha a Avaliação do Gestor para liberar o QR Code'}
                      className="text-xs px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                    >
                      {assessmentDone ? '📱 QR Code' : '🔒 QR Code'}
                    </button>
                    <button
                      onClick={() => handleCopy(sector)}
                      disabled={!assessmentDone}
                      title={assessmentDone ? 'Copiar link do questionário' : 'Preencha a Avaliação do Gestor para liberar o link'}
                      className="text-xs px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                    >
                      {!assessmentDone ? '🔒 Link' : copiedId === sector.id ? '✅ Copiado!' : '🔗 Link'}
                    </button>
                    {sector.totalResponses > 0 && (
                      <Link
                        href={`/painel/setor/${sector.id}`}
                        className="text-xs px-3 py-2 rounded-lg bg-primary-800 text-white hover:bg-primary-700 transition-colors"
                      >
                        📊 Relatório
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

      {/* Modal QR Code */}
      {qrSector && (
        <QrModal
          url={qrSector.shareUrl}
          sectorName={qrSector.name}
          onClose={() => setQrSector(null)}
        />
      )}

      {/* Modal novo setor */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Novo Setor</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do setor</label>
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
