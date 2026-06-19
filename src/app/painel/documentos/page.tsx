'use client'

import { useEffect, useState } from 'react'

type SectorOverview = {
  id: string
  name: string
  totalResponses: number
  riskLevel: string | null
}

const riskBadge: Record<string, { label: string; cls: string }> = {
  baixo:    { label: 'Baixo',    cls: 'bg-green-50 text-green-700 border-green-200' },
  moderado: { label: 'Moderado', cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  alto:     { label: 'Alto',     cls: 'bg-orange-50 text-orange-700 border-orange-200' },
  critico:  { label: 'Crítico',  cls: 'bg-red-50 text-red-700 border-red-200' },
}

export default function DocumentosPage() {
  const [sectors, setSectors] = useState<SectorOverview[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/reports/company')
      .then((r) => r.json())
      .then((d) => setSectors(Array.isArray(d.sectors) ? d.sectors : []))
      .catch(() => setSectors([]))
      .finally(() => setLoading(false))
  }, [])

  // Abre o DRPS do setor em nova aba (documento HTML com botão Imprimir/Salvar PDF)
  const gerarDrps = (sectorId: string) => {
    window.open(`/api/dashboard/reports/${sectorId}/pdf`, '_blank')
  }

  // Abre o PGR da empresa inteira em nova aba
  const gerarPgr = () => {
    window.open('/api/dashboard/pgr', '_blank')
  }

  // O PGR consolida a empresa toda: habilita se houver qualquer resposta
  const totalRespostas = sectors.reduce((acc, s) => acc + s.totalResponses, 0)

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Documentos</h1>
        <p className="text-gray-500 mt-1">
          Gere e baixe os documentos oficiais da sua adequação à NR-1.
        </p>
      </div>

      {/* ── DRPS ─────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
        <div className="flex items-start gap-4 mb-5">
          <span className="text-3xl flex-shrink-0">📋</span>
          <div className="flex-1">
            <h2 className="font-bold text-gray-900">DRPS — Diagnóstico de Riscos Psicossociais</h2>
            <p className="text-gray-500 text-sm mt-1">
              O laudo técnico com a matriz de risco e a análise dos 13 fatores, assinado eletronicamente
              pela psicóloga responsável. Gerado por setor, a partir das respostas dos colaboradores.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-7 h-7 border-4 border-primary-800 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sectors.length === 0 ? (
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-6 text-center">
            <p className="text-gray-500 text-sm">
              Nenhum setor criado ainda. Crie setores e colete respostas para gerar o DRPS.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {sectors.map((s) => {
              const badge = s.riskLevel ? riskBadge[s.riskLevel] : null
              const semRespostas = s.totalResponses === 0
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-3 border border-gray-100 rounded-xl px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{s.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">
                        {s.totalResponses} resposta{s.totalResponses !== 1 ? 's' : ''}
                      </span>
                      {badge && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg border ${badge.cls}`}>
                          {badge.label}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => gerarDrps(s.id)}
                    disabled={semRespostas}
                    title={semRespostas ? 'Este setor ainda não tem respostas' : 'Gerar o DRPS deste setor'}
                    className="flex-shrink-0 bg-primary-800 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    📄 Gerar DRPS
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── PGR ──────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
        <div className="flex items-start gap-4">
          <span className="text-3xl flex-shrink-0">📑</span>
          <div className="flex-1">
            <h2 className="font-bold text-gray-900">PGR — Programa de Gerenciamento de Riscos</h2>
            <p className="text-gray-500 text-sm mt-1">
              O programa-mãe da empresa: inventário de riscos consolidado, critérios, plano de ação,
              plano anual e cronograma de monitoramento. Reúne todos os setores em um único documento.
            </p>
          </div>
          <button
            onClick={gerarPgr}
            disabled={loading || totalRespostas === 0}
            title={totalRespostas === 0 ? 'É preciso ter respostas para gerar o PGR' : 'Gerar o PGR da empresa'}
            className="flex-shrink-0 bg-primary-800 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed self-center"
          >
            📑 Gerar PGR
          </button>
        </div>
      </div>

      {/* ── Plano de Ação (em breve) ─────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 flex items-start gap-4 opacity-90">
        <span className="text-3xl flex-shrink-0 mt-0.5">🎯</span>
        <div className="flex-1">
          <h2 className="font-semibold text-gray-900">Plano de Ação</h2>
          <p className="text-gray-500 text-sm mt-1">
            Documento com as medidas concretas para tratar cada fator de risco identificado.
          </p>
        </div>
        <span className="flex-shrink-0 text-xs bg-gray-100 text-gray-500 border border-gray-200 px-3 py-1 rounded-full font-medium self-center">
          Em breve
        </span>
      </div>
    </div>
  )
}
