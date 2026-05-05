'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'
import { buildRiskMatrix, type MatrixResult, type Probability } from '@/lib/scoring'

// ─── Tipos ────────────────────────────────────────────────────────────────────

type TopicScore = {
  topicNum: number
  topic: string
  score: number
  riskLevel: 'baixo' | 'moderado' | 'alto' | 'critico'
}

type AiClassification = {
  diagnostico: string
  topicos_criticos: string[]
  acoes_imediatas: string[]
  acoes_preventivas: string[]
  adequacao_nr1: { nivel_conformidade: string; justificativa: string }
  prioridade_intervencao: string
}

type Report = {
  sector: { name: string }
  totalResponses: number
  avgScore: number
  riskLevel: 'baixo' | 'moderado' | 'alto' | 'critico'
  byTopic: TopicScore[]
  timeline: { date: string; avgScore: number }[]
  aiRecommendations: AiClassification | null
}

type Assessment = {
  topicNum: number
  topic: string
  probability: Probability
  observations?: string
}

// ─── Configs visuais ──────────────────────────────────────────────────────────

const riskConfig = {
  baixo:    { label: 'Baixo',    bg: 'bg-green-100',  text: 'text-green-700',  border: 'border-green-200',  color: '#16a34a' },
  moderado: { label: 'Moderado', bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200', color: '#ca8a04' },
  alto:     { label: 'Alto',     bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200', color: '#ea580c' },
  critico:  { label: 'Crítico',  bg: 'bg-red-100',    text: 'text-red-700',    border: 'border-red-200',    color: '#dc2626' },
}

const probConfig = {
  baixa: { label: 'Baixa', bg: 'bg-green-50',  ring: 'ring-green-400',  text: 'text-green-700'  },
  media: { label: 'Média', bg: 'bg-yellow-50', ring: 'ring-yellow-400', text: 'text-yellow-700' },
  alta:  { label: 'Alta',  bg: 'bg-red-50',    ring: 'ring-red-400',    text: 'text-red-700'    },
}

const conformityConfig: Record<string, { label: string; bg: string; text: string }> = {
  conforme:     { label: '✅ Conforme',     bg: 'bg-green-100',  text: 'text-green-700'  },
  atencao:      { label: '⚠️ Atenção',      bg: 'bg-yellow-100', text: 'text-yellow-700' },
  nao_conforme: { label: '❌ Não Conforme', bg: 'bg-red-100',    text: 'text-red-700'    },
}

const topicShort: Record<number, string> = {
  1: 'Assédio', 2: 'Suporte', 3: 'Mudanças', 4: 'Clareza',
  5: 'Reconhec.', 6: 'Autonomia', 7: 'Justiça', 8: 'Trauma',
  9: 'Subcarga', 10: 'Sobrecarga', 11: 'Relacion.', 12: 'Comunic.', 13: 'Remoto',
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function SetorReportPage() {
  const params = useParams()
  const router = useRouter()
  const sectorId = params.id as string

  const [report, setReport]             = useState<Report | null>(null)
  const [assessments, setAssessments]   = useState<Assessment[]>([])
  const [matrix, setMatrix]             = useState<MatrixResult[]>([])
  const [assessedBy, setAssessedBy]     = useState('')
  const [saving, setSaving]             = useState(false)
  const [saved, setSaved]               = useState(false)
  const [loading, setLoading]           = useState(true)
  const [exporting, setExporting]       = useState(false)
  const [activeTab, setActiveTab]       = useState<'scores' | 'matrix' | 'ia'>('scores')

  // Busca relatório e avaliações salvas
  useEffect(() => {
    Promise.all([
      fetch(`/api/dashboard/reports/${sectorId}`).then((r) => r.ok ? r.json() : null),
      fetch(`/api/dashboard/assessments/${sectorId}`).then((r) => r.ok ? r.json() : []),
    ]).then(([rep, saved]: [Report | null, Assessment[]]) => {
      if (!rep) { router.replace('/painel'); return }
      setReport(rep)

      // Inicializa avaliações com os valores salvos ou padrão 'media'
      const init: Assessment[] = rep.byTopic.map((t) => {
        const existing = saved.find((s) => s.topicNum === t.topicNum)
        return { topicNum: t.topicNum, topic: t.topic, probability: existing?.probability ?? 'media', observations: existing?.observations ?? '' }
      })
      setAssessments(init)
      setMatrix(buildRiskMatrix(rep.byTopic, init))
    }).finally(() => setLoading(false))
  }, [sectorId, router])

  // Recalcula matriz sempre que avaliações mudam
  const updateProb = useCallback((topicNum: number, probability: Probability) => {
    setAssessments((prev) => {
      const next = prev.map((a) => a.topicNum === topicNum ? { ...a, probability } : a)
      if (report) setMatrix(buildRiskMatrix(report.byTopic, next))
      return next
    })
    setSaved(false)
  }, [report])

  const updateObs = useCallback((topicNum: number, observations: string) => {
    setAssessments((prev) => prev.map((a) => a.topicNum === topicNum ? { ...a, observations } : a))
    setSaved(false)
  }, [])

  const handleSaveAssessments = async () => {
    setSaving(true)
    try {
      await fetch(`/api/dashboard/assessments/${sectorId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessments, assessedBy }),
      })
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  const handleExportPdf = async () => {
    setExporting(true)
    try {
      const res = await fetch(`/api/dashboard/reports/${sectorId}/pdf`)
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `DRPS-${report?.sector.name ?? 'setor'}-${new Date().toISOString().split('T')[0]}.html`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="w-10 h-10 border-4 border-primary-800 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  if (!report) return null

  const risk       = riskConfig[report.riskLevel]
  const conformity = report.aiRecommendations ? conformityConfig[report.aiRecommendations.adequacao_nr1?.nivel_conformidade] : null

  const radarData = report.byTopic.map((t) => ({
    topic: topicShort[t.topicNum] ?? `T${t.topicNum}`,
    score: t.score,
    fullMark: 4,
  }))

  // Risco final dominante na matriz
  const matrixFinalRisk = matrix.length
    ? (['critico', 'alto', 'moderado', 'baixo'] as const).find((l) => matrix.some((m) => m.riskFinal === l)) ?? 'baixo'
    : report.riskLevel

  const matrixRiskCfg = riskConfig[matrixFinalRisk]

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <button onClick={() => router.back()} className="text-gray-400 text-sm hover:text-gray-600 mb-2 flex items-center gap-1">
            ← Voltar
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{report.sector.name}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {report.totalResponses} respondente{report.totalResponses !== 1 ? 's' : ''} · DRPS NR-1
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {conformity && (
            <span className={`text-sm font-semibold px-3 py-1.5 rounded-xl ${conformity.bg} ${conformity.text}`}>
              {conformity.label}
            </span>
          )}
          <button
            onClick={handleExportPdf}
            disabled={exporting}
            className="bg-primary-800 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {exporting ? '⏳ Gerando...' : '📄 Exportar Relatório'}
          </button>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className={`rounded-2xl border-2 p-4 ${risk.bg} ${risk.border}`}>
          <p className={`text-xs font-medium ${risk.text}`}>Gravidade Média</p>
          <p className={`text-3xl font-black mt-1 ${risk.text}`}>{report.avgScore.toFixed(2)}</p>
          <p className={`text-xs mt-0.5 ${risk.text}`}>{risk.label} · de 4.0</p>
        </div>
        <div className={`rounded-2xl border-2 p-4 ${matrixRiskCfg.bg} ${matrixRiskCfg.border}`}>
          <p className={`text-xs font-medium ${matrixRiskCfg.text}`}>Risco Final (Matriz)</p>
          <p className={`text-xl font-black mt-2 ${matrixRiskCfg.text}`}>{matrixRiskCfg.label}</p>
          <p className={`text-xs mt-0.5 ${matrixRiskCfg.text}`}>Grav × Prob</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4">
          <p className="text-xs font-medium text-gray-500">Respondentes</p>
          <p className="text-3xl font-black mt-1 text-gray-900">{report.totalResponses}</p>
          <p className="text-xs mt-0.5 text-gray-400">anônimos</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4">
          <p className="text-xs font-medium text-gray-500">Tópicos Críticos</p>
          <p className="text-3xl font-black mt-1 text-gray-900">
            {matrix.filter((m) => m.riskFinal === 'critico' || m.riskFinal === 'alto').length}
          </p>
          <p className="text-xs mt-0.5 text-gray-400">alto ou crítico</p>
        </div>
      </div>

      {/* Abas */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {([
          { key: 'scores', label: '📊 Scores por Tópico' },
          { key: 'matrix', label: '⚖️ Matriz de Risco NR-1' },
          { key: 'ia',     label: '🤖 Análise IA' },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab.key ? 'bg-white text-primary-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── ABA: SCORES ────────────────────────────────────────────────────── */}
      {activeTab === 'scores' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Radar */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-bold text-gray-900 mb-4">Perfil de Gravidade por Tópico</h2>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="topic" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 4]} tick={{ fontSize: 9 }} />
                  <Radar name="Gravidade" dataKey="score" stroke="#1E40AF" fill="#1E40AF" fillOpacity={0.2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Timeline */}
            {report.timeline.length > 1 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="font-bold text-gray-900 mb-4">Evolução Temporal</h2>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={report.timeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 4]} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="avgScore" stroke="#1E40AF" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5 flex items-center justify-center">
                <p className="text-gray-400 text-sm text-center">Evolução disponível<br />a partir de 2 coletas</p>
              </div>
            )}
          </div>

          {/* Barra de scores */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-gray-900 mb-4">Gravidade por Tópico</h2>
            <div className="space-y-4">
              {report.byTopic.map((t) => {
                const cfg = riskConfig[t.riskLevel]
                return (
                  <div key={t.topicNum}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700 font-medium truncate pr-2">
                        {t.topicNum}. {t.topic}
                      </span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-sm font-bold text-gray-700">{t.score.toFixed(2)}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                          {cfg.label}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div
                        className="rounded-full h-2.5 transition-all duration-500"
                        style={{ width: `${(t.score / 4) * 100}%`, backgroundColor: cfg.color }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── ABA: MATRIZ NR-1 ───────────────────────────────────────────────── */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          {/* Avaliador */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <div>
                <h2 className="font-bold text-gray-900">Avaliação de Probabilidade</h2>
                <p className="text-gray-400 text-xs mt-0.5">
                  Defina a probabilidade de cada fator de risco ocorrer. A matriz NR-1 é calculada automaticamente.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {saved && <span className="text-green-600 text-xs font-medium">✅ Salvo</span>}
                <button
                  onClick={handleSaveAssessments}
                  disabled={saving}
                  className="bg-primary-800 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Salvando...' : '💾 Salvar Avaliação'}
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-600 mb-1">Nome do avaliador (opcional)</label>
              <input
                type="text"
                value={assessedBy}
                onChange={(e) => setAssessedBy(e.target.value)}
                placeholder="Ex: Dr. João Silva — Psicólogo"
                className="w-full max-w-sm px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-800"
              />
            </div>

            {/* Legenda de probabilidade */}
            <div className="flex gap-3 mb-4 flex-wrap">
              {(['baixa', 'media', 'alta'] as Probability[]).map((p) => (
                <div key={p} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${probConfig[p].bg} ${probConfig[p].ring} ring-1`}>
                  <span className={`text-xs font-semibold ${probConfig[p].text}`}>
                    {p === 'baixa' ? '🟢' : p === 'media' ? '🟡' : '🔴'} Prob. {probConfig[p].label}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              {assessments.map((a) => {
                const mx = matrix.find((m) => m.topicNum === a.topicNum)
                const mxCfg = mx ? riskConfig[mx.riskFinal] : null
                return (
                  <div key={a.topicNum} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800">{a.topicNum}. {a.topic}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Gravidade: <strong>{report.byTopic.find((t) => t.topicNum === a.topicNum)?.score.toFixed(2)}</strong>
                          {' '}({riskConfig[report.byTopic.find((t) => t.topicNum === a.topicNum)?.riskLevel ?? 'baixo'].label})
                        </p>
                      </div>
                      {mxCfg && (
                        <span className={`text-xs font-bold px-3 py-1 rounded-lg border flex-shrink-0 ${mxCfg.bg} ${mxCfg.text} ${mxCfg.border}`}>
                          Risco Final: {mxCfg.label}
                        </span>
                      )}
                    </div>

                    {/* Seletor de probabilidade */}
                    <div className="flex gap-2 mt-3">
                      {(['baixa', 'media', 'alta'] as Probability[]).map((p) => (
                        <button
                          key={p}
                          onClick={() => updateProb(a.topicNum, p)}
                          className={`flex-1 py-2 rounded-lg text-xs font-semibold border-2 transition-all ${
                            a.probability === p
                              ? `${probConfig[p].bg} ${probConfig[p].ring} ring-2 ${probConfig[p].text}`
                              : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                          }`}
                        >
                          {p === 'baixa' ? '🟢' : p === 'media' ? '🟡' : '🔴'} {probConfig[p].label}
                        </button>
                      ))}
                    </div>

                    {/* Campo de observações */}
                    <textarea
                      value={a.observations}
                      onChange={(e) => updateObs(a.topicNum, e.target.value)}
                      placeholder="Observações / critérios qualitativos (opcional)..."
                      rows={2}
                      className="mt-2 w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-primary-800 resize-none"
                    />
                  </div>
                )
              })}
            </div>
          </div>

          {/* Tabela resumo da matriz */}
          {matrix.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-bold text-gray-900 mb-1">Resumo da Matriz de Risco</h2>
              <p className="text-gray-400 text-xs mb-4">Cruzamento Gravidade × Probabilidade conforme NR-1</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 px-3 font-semibold text-gray-600 text-xs">Tópico</th>
                      <th className="text-center py-2 px-3 font-semibold text-gray-600 text-xs">Gravidade</th>
                      <th className="text-center py-2 px-3 font-semibold text-gray-600 text-xs">Probabilidade</th>
                      <th className="text-center py-2 px-3 font-semibold text-gray-600 text-xs">Risco Final</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matrix.map((m) => {
                      const finalCfg = riskConfig[m.riskFinal]
                      const gravCfg  = riskConfig[
                        m.gravidade === 'baixa' ? 'baixo' : m.gravidade === 'media' ? 'moderado' : 'alto'
                      ]
                      const probCfg  = probConfig[m.probabilidade]
                      return (
                        <tr key={m.topicNum} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-2 px-3 text-gray-800 font-medium text-xs">{m.topicNum}. {m.topic}</td>
                          <td className="py-2 px-3 text-center">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${gravCfg.bg} ${gravCfg.text}`}>
                              {m.gravidade.charAt(0).toUpperCase() + m.gravidade.slice(1)} ({m.gravScore.toFixed(1)})
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${probCfg.bg} ${probCfg.text}`}>
                              {probCfg.label}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${finalCfg.bg} ${finalCfg.text} ${finalCfg.border}`}>
                              {finalCfg.label}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Legenda visual da matriz */}
              <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                <p className="text-xs font-semibold text-gray-500 mb-3">Tabela de referência NR-1</p>
                <table className="text-xs w-full max-w-xs">
                  <thead>
                    <tr>
                      <th className="text-gray-400 font-medium py-1 px-2 text-left">Prob ╲ Grav</th>
                      <th className="text-green-600 font-semibold py-1 px-2 text-center">Baixa</th>
                      <th className="text-yellow-600 font-semibold py-1 px-2 text-center">Média</th>
                      <th className="text-red-600 font-semibold py-1 px-2 text-center">Alta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { prob: 'Alta',  cells: ['Moderado','Alto','Crítico'], colors: ['bg-yellow-100 text-yellow-700','bg-orange-100 text-orange-700','bg-red-100 text-red-700'] },
                      { prob: 'Média', cells: ['Baixo','Moderado','Alto'],   colors: ['bg-green-100 text-green-700','bg-yellow-100 text-yellow-700','bg-orange-100 text-orange-700'] },
                      { prob: 'Baixa', cells: ['Baixo','Baixo','Moderado'],  colors: ['bg-green-100 text-green-700','bg-green-100 text-green-700','bg-yellow-100 text-yellow-700'] },
                    ].map((row) => (
                      <tr key={row.prob}>
                        <td className="text-gray-500 font-medium py-1 px-2">{row.prob}</td>
                        {row.cells.map((c, i) => (
                          <td key={i} className="py-1 px-2 text-center">
                            <span className={`px-2 py-0.5 rounded font-semibold ${row.colors[i]}`}>{c}</span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ABA: IA ────────────────────────────────────────────────────────── */}
      {activeTab === 'ia' && (
        <div className="space-y-4">
          {report.aiRecommendations ? (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
                <h3 className="font-semibold text-blue-900 mb-2">📋 Diagnóstico</h3>
                <p className="text-blue-800 text-sm leading-relaxed">{report.aiRecommendations.diagnostico}</p>
              </div>

              {report.aiRecommendations.adequacao_nr1 && (
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-2">⚖️ Adequação à NR-1</h3>
                  {conformity && (
                    <span className={`inline-block text-sm font-semibold px-3 py-1 rounded-lg mb-2 ${conformity.bg} ${conformity.text}`}>
                      {conformity.label}
                    </span>
                  )}
                  <p className="text-gray-600 text-sm">{report.aiRecommendations.adequacao_nr1.justificativa}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
                  <h3 className="font-semibold text-red-800 mb-3">🚨 Ações Imediatas</h3>
                  <ol className="space-y-2">
                    {report.aiRecommendations.acoes_imediatas.map((a, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                        <span className="flex-shrink-0 font-bold">{i + 1}.</span>
                        <span>{a}</span>
                      </li>
                    ))}
                  </ol>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5">
                  <h3 className="font-semibold text-yellow-800 mb-3">🛡️ Ações Preventivas</h3>
                  <ol className="space-y-2">
                    {report.aiRecommendations.acoes_preventivas.map((a, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-yellow-700">
                        <span className="flex-shrink-0 font-bold">{i + 1}.</span>
                        <span>{a}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              {report.aiRecommendations.topicos_criticos?.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5">
                  <h3 className="font-semibold text-orange-800 mb-3">⚠️ Tópicos Prioritários</h3>
                  <div className="flex flex-wrap gap-2">
                    {report.aiRecommendations.topicos_criticos.map((t, i) => (
                      <span key={i} className="bg-orange-100 text-orange-700 border border-orange-300 text-sm font-medium px-3 py-1 rounded-lg">{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-gray-50 rounded-2xl border border-gray-100 p-12 text-center">
              <div className="text-4xl mb-3">⏳</div>
              <p className="text-gray-500 font-medium">Análise IA em processamento</p>
              <p className="text-gray-400 text-sm mt-1">Recarregue a página em alguns instantes</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
