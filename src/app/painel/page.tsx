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
  cnpj: string | null
  responsible: string | null
  name: string
  drpsStatus: string
  gestorTutorialCompletedAt: string | null
  teamLinkSentAt: string | null
}

type RiskLevel = 'baixo' | 'moderado' | 'alto' | 'critico'
type Trend = 'melhorou' | 'estavel' | 'piorou' | 'sem_dados'
type AttentionItem = { sectorId: string; sectorName: string; topicNum: number; factor: string; riskLevel: RiskLevel; score: number }
type FactorCmp = { topicNum: number; factor: string; baseline: RiskLevel; baselineScore: number; current: RiskLevel | null; currentScore: number | null; trend: Trend }
type SectorEvolution = { sectorId: string; name: string; reavaliada: boolean; improved: number; worsened: number; stable: number; comparison: FactorCmp[] }
type FactorAvg = { topicNum: number; factor: string; score: number; riskLevel: RiskLevel; sectors: number; rank: number; interventionMonth: number | null; monthLabel: string }
type Overview = { attention: AttentionItem[]; evolution: SectorEvolution[]; factors: FactorAvg[]; hasAnyPlan: boolean; hasAnyReaval: boolean }

const riskBar: Record<RiskLevel, string> = { baixo: '#16a34a', moderado: '#ca8a04', alto: '#ea580c', critico: '#dc2626' }

const riskConfig = {
  baixo:    { label: 'Baixo',    bg: 'bg-green-100',  text: 'text-green-700',  border: 'border-green-300'  },
  moderado: { label: 'Moderado', bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
  alto:     { label: 'Alto',     bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
  critico:  { label: 'Crítico',  bg: 'bg-red-100',    text: 'text-red-700',    border: 'border-red-300'    },
}

const trendCfg: Record<Trend, { label: string; icon: string; cls: string; bg: string }> = {
  melhorou:  { label: 'Melhorou', icon: '↓', cls: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  estavel:   { label: 'Estável',  icon: '=', cls: 'text-gray-500',  bg: 'bg-gray-50 border-gray-200' },
  piorou:    { label: 'Piorou',   icon: '↑', cls: 'text-red-600',   bg: 'bg-red-50 border-red-200' },
  sem_dados: { label: '—',        icon: '•', cls: 'text-gray-300',  bg: 'bg-gray-50 border-gray-100' },
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
  const [tutorialOpen, setTutorialOpen] = useState(false)
  const [tutorialConfirming, setTutorialConfirming] = useState(false)
  const [overview, setOverview]     = useState<Overview | null>(null)

  const fetchData = async () => {
    try {
      const [sectorsRes, settingsRes, assessmentRes, overviewRes] = await Promise.all([
        fetch('/api/dashboard/sectors'),
        fetch('/api/dashboard/company-settings'),
        fetch('/api/dashboard/company-assessment'),
        fetch('/api/dashboard/overview'),
      ])
      if (sectorsRes.ok) setSectors(await sectorsRes.json())
      if (settingsRes.ok) {
        const { company: c } = await settingsRes.json()
        setCompany(c)
        setTutorialOpen(!c?.gestorTutorialCompletedAt)
      }
      if (assessmentRes.ok) {
        const { assessment } = await assessmentRes.json()
        setAssessmentDone(!!assessment)
      } else {
        setAssessmentDone(false)
      }
      if (overviewRes.ok) setOverview(await overviewRes.json())
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

  const completeTutorial = async () => {
    setTutorialConfirming(true)
    try {
      const res = await fetch('/api/dashboard/gestor-tutorial', { method: 'POST' })
      if (!res.ok) return
      setTutorialOpen(false)
      setCompany((current) => current ? { ...current, gestorTutorialCompletedAt: new Date().toISOString() } : current)
    } finally {
      setTutorialConfirming(false)
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
  const participationReady = globalProgress !== null && globalProgress >= 80

  // Passos de onboarding
  const step1Done = !!company?.gestorTutorialCompletedAt
  const step2Done = !!company?.employeeCount && !!company?.cnpj && !!company?.responsible
  const step3Done = assessmentDone
  const step4Done = !!company?.teamLinkSentAt
  const step5Done = participationReady
  const step6Done = sectorsWithData.length > 0 && sectorsWithData.some((s) => s.riskLevel !== null)
  const onboardingDone = step1Done && step2Done && step3Done && step4Done && step5Done && step6Done

  return (
    <div className="max-w-5xl mx-auto">

      {/* Tutorial obrigatório — o espaço é substituído pelo vídeo do gestor quando ele for enviado. */}
      {tutorialOpen && (
        <div className="fixed inset-0 z-50 bg-[#0E2A47]/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-[#0E2A47] to-[#1769AA] px-6 py-5 text-white">
              <p className="text-xs font-bold uppercase tracking-wider text-cyan-200">Primeiro passo obrigatório</p>
              <h2 className="text-2xl font-bold mt-1">Como conduzir sua empresa na Zelo</h2>
              <p className="text-blue-100 text-sm mt-1">Assista ao tutorial antes de começar a configuração.</p>
            </div>
            <div className="p-6">
              <div className="aspect-video rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-center p-6">
                <span className="text-5xl mb-3">🎬</span>
                <p className="font-bold text-slate-700">Espaço reservado para o vídeo tutorial</p>
                <p className="text-sm text-slate-500 mt-2 max-w-md">O vídeo mostrará como configurar a empresa, responder a Avaliação do Gestor, enviar o link aos funcionários e acompanhar o DRPS.</p>
              </div>
              <div className="mt-5 bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-900">
                <strong>Depois do tutorial, você seguirá nesta ordem:</strong> configurar a empresa → responder a Avaliação do Gestor → enviar o link aos funcionários → alcançar 80% de respostas → revisar o DRPS e o Plano de Ação.
              </div>
              <button onClick={completeTutorial} disabled={tutorialConfirming} className="w-full mt-5 py-3 rounded-xl bg-gradient-to-r from-[#17C3C9] to-[#3F7DE0] text-white font-bold hover:opacity-95 disabled:opacity-50">
                {tutorialConfirming ? 'Salvando...' : 'Concluí o tutorial e quero começar →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guia de configuração inicial */}
      {!onboardingDone && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center"><span className="text-white text-sm">▶</span></div>
            <div><h2 className="font-bold text-gray-900">Comece por aqui</h2><p className="text-sm text-gray-500">Siga uma etapa por vez para concluir seu DRPS.</p></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { done: step1Done, icon: '🎬', title: 'Assista ao tutorial', desc: 'Entenda como conduzir a plataforma', action: () => setTutorialOpen(true), actionLabel: 'Abrir tutorial' },
              { done: step2Done, icon: '🏢', title: 'Preencha os Dados da Empresa', desc: 'Informe CNPJ, responsável e funcionários', action: () => { window.location.href = '/painel/configuracoes' }, actionLabel: 'Preencher' },
              { done: step3Done, icon: '📋', title: 'Avaliação do Gestor', desc: 'Responda para liberar a Avaliação do Time', action: () => { window.location.href = '/painel/avaliacao-gestor' }, actionLabel: 'Responder' },
              { done: step4Done, icon: '📨', title: 'Envie o link aos funcionários', desc: 'Copie a mensagem pronta na Avaliação do Time', action: () => { window.location.href = '/painel/avaliacao-time' }, actionLabel: 'Abrir área' },
              { done: step5Done, icon: '🔗', title: 'Alcance 80% de respostas', desc: 'Acompanhe a participação do time', action: () => { window.location.href = '/painel/avaliacao-time' }, actionLabel: 'Acompanhar' },
              { done: step6Done, icon: '✅', title: 'Revise o DRPS', desc: 'Confira o diagnóstico e o Plano de Ação', action: null, actionLabel: null },
            ].map((step, i) => (
              <div key={i} className={`bg-white rounded-xl p-4 border ${step.done ? 'border-green-200' : 'border-gray-200'}`}>
                <div className="flex items-center gap-2 mb-2"><div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step.done ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{step.done ? '✓' : i + 1}</div><span className="text-lg">{step.icon}</span></div>
                <p className={`text-sm font-semibold ${step.done ? 'text-green-700 line-through' : 'text-gray-800'}`}>{step.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{step.desc}</p>
                {!step.done && step.action && <button onClick={step.action} className="mt-3 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-blue-700 transition-colors">{step.actionLabel} →</button>}
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

      {/* Gráfico — os 13 riscos psicossociais (média da empresa) */}
      {overview && overview.factors.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 mb-6">
          <div className="flex items-start justify-between gap-3 flex-wrap mb-1">
            <div>
              <h2 className="font-bold text-gray-900">Os 13 riscos psicossociais</h2>
              <p className="text-gray-500 text-sm mt-0.5">Do <strong>mais grave ao menos grave</strong> (0 = sem risco · 4 = crítico). A etiqueta mostra em que <strong>mês</strong> cada fator entra no plano de ação.</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap text-[11px] text-gray-500">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: riskBar.baixo }} /> Baixo</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: riskBar.moderado }} /> Moderado</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: riskBar.alto }} /> Alto</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: riskBar.critico }} /> Crítico</span>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {overview.factors.map((f) => (
              <div key={f.topicNum} className="flex items-center gap-3">
                <div className="w-44 sm:w-64 flex-shrink-0 flex items-center gap-2 min-w-0">
                  <span className="w-6 h-6 rounded-lg bg-[#0E2A47] text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">{f.rank}º</span>
                  <div className="min-w-0">
                    <span className="block text-xs text-gray-700 truncate" title={f.factor}>{f.factor}</span>
                    {f.interventionMonth && <span className="block text-[10px] text-[#109CA1] font-semibold">🗓️ Mês {f.interventionMonth}</span>}
                  </div>
                </div>
                <div className="flex-1 h-5 bg-gray-100 rounded-md overflow-hidden relative min-w-0">
                  {/* linhas divisórias das faixas 1/2/3 */}
                  <div className="absolute inset-y-0 left-1/4 w-px bg-white/70" />
                  <div className="absolute inset-y-0 left-2/4 w-px bg-white/70" />
                  <div className="absolute inset-y-0 left-3/4 w-px bg-white/70" />
                  <div className="h-full rounded-md transition-all duration-500 flex items-center justify-end pr-1.5" style={{ width: `${Math.max(4, (f.score / 4) * 100)}%`, background: riskBar[f.riskLevel] }}>
                    <span className="text-[10px] font-bold text-white">{f.score.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between mt-2 pl-44 sm:pl-64 text-[10px] text-gray-300 font-medium">
            <span>0</span><span>1</span><span>2</span><span>3</span><span>4</span>
          </div>
        </div>
      )}

      {/* Precisa de atenção — fatores em risco alto/crítico em toda a empresa */}
      {overview && sectorsWithData.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">🚨</span>
            <h2 className="font-bold text-gray-900">Precisa de atenção agora</h2>
            {overview.attention.length > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">{overview.attention.length}</span>
            )}
          </div>

          {overview.attention.length === 0 ? (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <p className="font-semibold text-green-800 text-sm">Nenhum fator em risco alto ou crítico</p>
                <p className="text-green-700 text-sm mt-0.5">Os setores avaliados estão sob controle. Mantenha o monitoramento e reavalie no próximo ciclo.</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {overview.attention.map((a) => {
                const cfg = riskConfig[a.riskLevel]
                const accent = a.riskLevel === 'critico' ? 'border-l-red-500' : 'border-l-orange-500'
                return (
                  <Link key={`${a.sectorId}-${a.topicNum}`} href={`/painel/setor/${a.sectorId}/plano-de-acao`}
                    className={`group block bg-white rounded-2xl border border-gray-100 border-l-4 ${accent} shadow-sm p-4 hover:shadow-md transition-shadow`}>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${cfg.bg} ${cfg.text} ${cfg.border}`}>{cfg.label}</span>
                      <span className="text-[11px] text-gray-400 font-semibold">{a.score.toFixed(1)}/4.0</span>
                    </div>
                    <p className="font-bold text-[#0E2A47] text-sm leading-tight">{a.factor}</p>
                    <p className="text-xs text-gray-500 mt-1">📍 {a.sectorName}</p>
                    <p className="text-xs font-semibold text-primary-800 mt-2 group-hover:underline">Ver plano de ação →</p>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Evolução — antes × depois (aparece quando há reavaliação) */}
      {overview && sectorsWithData.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">📈</span>
            <h2 className="font-bold text-gray-900">Evolução do risco</h2>
          </div>

          {overview.hasAnyReaval ? (
            <div className="space-y-3">
              {overview.evolution.filter((e) => e.reavaliada).map((e) => {
                const atRisk = e.comparison.filter((c) => c.baseline !== 'baixo')
                return (
                  <div key={e.sectorId} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                      <h3 className="font-bold text-[#0E2A47]">{e.name}</h3>
                      <div className="flex items-center gap-2">
                        {e.improved > 0 && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">↓ {e.improved} melhorou</span>}
                        {e.stable > 0 && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 border border-gray-200">= {e.stable} estável</span>}
                        {e.worsened > 0 && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">↑ {e.worsened} piorou</span>}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      {(atRisk.length ? atRisk : e.comparison).map((c) => {
                        const t = trendCfg[c.trend]
                        return (
                          <div key={c.topicNum} className="flex items-center justify-between gap-2 text-sm border-t border-gray-50 pt-1.5 first:border-0 first:pt-0">
                            <span className="text-gray-700 truncate min-w-0">{c.factor}</span>
                            <span className="flex items-center gap-2 flex-shrink-0">
                              <span className={`text-[11px] font-semibold ${riskConfig[c.baseline].text}`}>{riskConfig[c.baseline].label}</span>
                              <span className="text-gray-300">→</span>
                              <span className={`text-[11px] font-semibold ${c.current ? riskConfig[c.current].text : 'text-gray-300'}`}>{c.current ? riskConfig[c.current].label : '—'}</span>
                              <span className={`text-[11px] font-bold w-20 text-right ${t.cls}`}>{t.icon} {t.label}</span>
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="bg-gradient-to-br from-[#F0FBFC] to-white border border-[#CCEFF1] rounded-2xl p-5 flex items-start gap-3">
              <span className="text-2xl">🔄</span>
              <div>
                <p className="font-semibold text-[#0E2A47] text-sm">A comparação de melhoria aparece aqui</p>
                <p className="text-gray-600 text-sm mt-0.5">
                  {overview.hasAnyPlan
                    ? 'Quando você reenviar o questionário (meses 3, 6 e 12 do plano), o sistema compara o risco de cada fator — início × agora — e mostra a evolução aqui, com setas de melhora ou piora.'
                    : 'Crie o Plano de Ação de um setor e, ao reavaliar mais adiante, a evolução do risco (antes × depois) aparece aqui automaticamente.'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Próximo passo: avaliação do time */}
      {!loading && sectors.length > 0 && (
        <div className={`${!assessmentDone ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'} border rounded-2xl p-4 mb-4 flex items-start justify-between gap-4 flex-wrap`}>
          <div className="flex items-start gap-3">
            <span className="text-xl">{assessmentDone ? '📨' : '🔒'}</span>
            <div>
              <p className={`text-sm font-semibold ${assessmentDone ? 'text-blue-900' : 'text-amber-900'}`}>{assessmentDone ? 'Agora envie o link aos funcionários' : 'Avaliação do Time bloqueada'}</p>
              <p className={`text-sm mt-0.5 ${assessmentDone ? 'text-blue-800' : 'text-amber-800'}`}>
                {assessmentDone ? 'Abra a Avaliação do Time para copiar o link e a mensagem pronta. Depois confirme o envio para liberar Vídeos, Relatório Geral, Documentos e Material Didático.' : 'Para enviar o questionário ao time, primeiro preencha a Avaliação do Gestor.'}
              </p>
            </div>
          </div>
          <Link href={assessmentDone ? '/painel/avaliacao-time' : '/painel/avaliacao-gestor'} className={`flex-shrink-0 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors ${assessmentDone ? 'bg-blue-600 hover:bg-blue-700' : 'bg-amber-600 hover:bg-amber-700'}`}>
            {assessmentDone ? 'Abrir Avaliação do Time' : 'Preencher agora'}
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
                    <Link
                      href="/painel/avaliacao-time"
                      className="text-xs px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors"
                    >
                      📨 Enviar ao time
                    </Link>
                    {sector.totalResponses > 0 && (
                      <Link
                        href={`/painel/setor/${sector.id}`}
                        className={`text-xs px-3 py-2 rounded-lg transition-colors ${company?.teamLinkSentAt ? 'bg-primary-800 text-white hover:bg-primary-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                        aria-disabled={!company?.teamLinkSentAt}
                      >
                        {company?.teamLinkSentAt ? '📊 Relatório' : '🔒 Relatório'}
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
