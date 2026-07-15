'use client'

import { useEffect, useState } from 'react'

type Archive = {
  id: string
  sectorName: string
  startedAt: string
  archivedAt: string
  horizonWeeks: number | null
  interventionCadence: string | null
  totalActions: number
  doneActions: number
  evidences: number
  reavaliada: boolean
  improved: number
  worsened: number
  stable: number
}

const fmt = (d: string) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })

export default function HistoricoPage() {
  const [archives, setArchives] = useState<Archive[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/history')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setArchives(d.archives ?? []) })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Histórico</h1>
        <p className="text-gray-500 mt-1">
          Cada vez que você <strong>encerra um ciclo e refaz o plano</strong>, o plano anterior (com as ações executadas e
          as evidências) fica guardado aqui. É a sua prova, para a fiscalização, de que a gestão do risco é contínua.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-9 h-9 border-4 border-primary-800 border-t-transparent rounded-full animate-spin" /></div>
      ) : archives.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="text-4xl mb-3">📦</div>
          <h3 className="font-semibold text-gray-700">Nenhum ciclo arquivado ainda</h3>
          <p className="text-gray-400 text-sm mt-1 max-w-md mx-auto">
            Quando você reavaliar e refizer o Plano de Ação de um setor, o ciclo anterior é arquivado automaticamente e
            aparece aqui — com o período, as ações concluídas e a evolução do risco.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {archives.map((a) => (
            <div key={a.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">📦 Ciclo arquivado</span>
                    <h3 className="font-bold text-[#0E2A47]">{a.sectorName}</h3>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {fmt(a.startedAt)} → {fmt(a.archivedAt)}
                    {a.horizonWeeks ? ` · ${a.horizonWeeks} semanas` : ''}
                  </p>
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">✅ {a.doneActions}/{a.totalActions} ações concluídas</span>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 border border-teal-200">📎 {a.evidences} evidência{a.evidences !== 1 ? 's' : ''}</span>
                    {a.reavaliada && a.improved > 0 && <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-green-50 text-green-700 border border-green-200">↓ {a.improved} melhorou</span>}
                    {a.reavaliada && a.worsened > 0 && <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-red-50 text-red-600 border border-red-200">↑ {a.worsened} piorou</span>}
                  </div>
                </div>
                <button
                  onClick={() => window.open(`/api/dashboard/history/${a.id}/pdf`, '_blank')}
                  className="flex-shrink-0 bg-primary-800 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-primary-700 transition-colors self-center"
                >
                  📄 Abrir documento
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
