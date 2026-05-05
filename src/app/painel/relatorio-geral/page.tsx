'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts'

type SectorOverview = {
  id: string
  name: string
  totalResponses: number
  avgRiskScore: number | null
  riskLevel: 'baixo' | 'moderado' | 'alto' | 'critico' | null
}

type CompanyReport = {
  sectors: SectorOverview[]
  companyAvgScore: number | null
  totalResponses: number
}

const riskConfig = {
  baixo:    { label: 'Baixo',    bg: 'bg-green-100',  text: 'text-green-700',  border: 'border-green-300',  bar: '#22c55e' },
  moderado: { label: 'Moderado', bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300', bar: '#eab308' },
  alto:     { label: 'Alto',     bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300', bar: '#f97316' },
  critico:  { label: 'Crítico',  bg: 'bg-red-100',    text: 'text-red-700',    border: 'border-red-300',    bar: '#ef4444' },
}

const getBarColor = (score: number | null) => {
  if (score === null) return '#d1d5db'
  if (score <= 1) return '#22c55e'
  if (score <= 2) return '#eab308'
  if (score <= 3) return '#f97316'
  return '#ef4444'
}

const getRiskFromScore = (score: number | null): 'baixo' | 'moderado' | 'alto' | 'critico' | null => {
  if (score === null) return null
  if (score <= 1) return 'baixo'
  if (score <= 2) return 'moderado'
  if (score <= 3) return 'alto'
  return 'critico'
}

export default function RelatorioGeralPage() {
  const [data, setData] = useState<CompanyReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/dashboard/reports/company')
      .then((r) => {
        if (!r.ok) throw new Error('Erro ao carregar relatório')
        return r.json()
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-4 border-primary-800 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-600">
        {error}
      </div>
    )
  }

  if (!data) return null

  const overallRisk = getRiskFromScore(data.companyAvgScore)
  const sectorsWithData = data.sectors.filter((s) => s.avgRiskScore !== null)

  // Dados para o gráfico de barras
  const barData = data.sectors.map((s) => ({
    name: s.name.length > 14 ? s.name.slice(0, 14) + '…' : s.name,
    fullName: s.name,
    score: s.avgRiskScore ?? 0,
    hasData: s.avgRiskScore !== null,
  }))

  // Dados para o gráfico radar (apenas setores com dados)
  const radarData = sectorsWithData.map((s) => ({
    subject: s.name.length > 12 ? s.name.slice(0, 12) + '…' : s.name,
    score: s.avgRiskScore ?? 0,
    fullMark: 4,
  }))

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Relatório Geral da Empresa</h1>
        <p className="text-gray-500 text-sm mt-1">Visão consolidada do risco psicossocial em todos os setores</p>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-gray-500 text-sm">Total de Setores</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{data.sectors.length}</p>
          <p className="text-gray-400 text-xs mt-1">{sectorsWithData.length} com respostas</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-gray-500 text-sm">Total de Respostas</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{data.totalResponses}</p>
          <p className="text-gray-400 text-xs mt-1">em todos os setores</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-gray-500 text-sm">Risco Médio Geral</p>
          {overallRisk && data.companyAvgScore !== null ? (
            <div className="flex items-center gap-2 mt-1">
              <p className="text-3xl font-bold text-gray-900">{data.companyAvgScore.toFixed(2)}</p>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${riskConfig[overallRisk].bg} ${riskConfig[overallRisk].text} ${riskConfig[overallRisk].border}`}>
                {riskConfig[overallRisk].label}
              </span>
            </div>
          ) : (
            <p className="text-gray-400 text-sm mt-1">Sem dados ainda</p>
          )}
        </div>
      </div>

      {data.sectors.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="text-5xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhum setor criado</h3>
          <p className="text-gray-400 text-sm mb-6">Crie setores e colete respostas para visualizar o relatório geral.</p>
          <Link href="/painel" className="bg-primary-800 text-white px-6 py-3 rounded-xl font-semibold text-sm">
            Ir para Visão Geral
          </Link>
        </div>
      ) : (
        <>
          {/* Gráfico de Barras — Score por Setor */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Score de Risco por Setor</h2>
            {data.sectors.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={barData} margin={{ top: 5, right: 10, left: -20, bottom: 20 }}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    angle={-30}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis domain={[0, 4]} tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <Tooltip
                    formatter={(value: number, _: string, props) => [
                      props.payload.hasData ? `${Number(value).toFixed(2)}/4.0` : 'Sem dados',
                      props.payload.fullName,
                    ]}
                    labelFormatter={() => ''}
                  />
                  <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={index} fill={entry.hasData ? getBarColor(entry.score) : '#e5e7eb'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-sm text-center py-8">Sem dados para exibir</p>
            )}
          </div>

          {/* Radar Chart — se tiver 3+ setores com dados */}
          {radarData.length >= 3 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-base font-semibold text-gray-800 mb-4">Mapa de Risco (Radar)</h2>
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <Radar
                    name="Risco"
                    dataKey="score"
                    stroke="#1e3a8a"
                    fill="#1e3a8a"
                    fillOpacity={0.25}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Tabela de setores */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-800">Detalhe por Setor</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {data.sectors.map((sector) => {
                const risk = sector.riskLevel ? riskConfig[sector.riskLevel] : null
                return (
                  <div key={sector.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-medium text-gray-900 text-sm">{sector.name}</span>
                        {risk ? (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg border ${risk.bg} ${risk.text} ${risk.border}`}>
                            {risk.label}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 border border-gray-200 px-2 py-0.5 rounded-lg">Sem dados</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {sector.totalResponses} {sector.totalResponses === 1 ? 'resposta' : 'respostas'}
                        {sector.avgRiskScore !== null && ` · Score: ${sector.avgRiskScore.toFixed(2)}/4.0`}
                      </p>
                    </div>
                    {sector.totalResponses > 0 && (
                      <Link
                        href={`/painel/setor/${sector.id}`}
                        className="text-xs px-3 py-2 rounded-lg bg-primary-800 text-white hover:bg-primary-700 transition-colors flex-shrink-0 ml-3"
                      >
                        Ver Relatório
                      </Link>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
