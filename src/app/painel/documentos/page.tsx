'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type SectorOverview = {
  id: string
  name: string
  totalResponses: number
  riskLevel: string | null
}

export default function DocumentosPage() {
  const router = useRouter()
  const [sectors, setSectors] = useState<SectorOverview[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/reports/company')
      .then((r) => r.json())
      .then((d) => setSectors(Array.isArray(d.sectors) ? d.sectors : []))
      .catch(() => setSectors([]))
      .finally(() => setLoading(false))
  }, [])

  // Abre o DRPS ÚNICO da empresa (documento HTML com botão Imprimir/Salvar PDF)
  const gerarDrps = () => {
    window.open('/api/dashboard/drps', '_blank')
  }

  // Abre o PGR da empresa inteira em nova aba
  const gerarPgr = () => {
    window.open('/api/dashboard/pgr', '_blank')
  }

  // Abre o Plano de Ação Vivo do setor (esquema interativo — de lá gera o PDF)
  const abrirPlano = (sectorId: string) => {
    router.push(`/painel/setor/${sectorId}/plano-de-acao`)
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
        <div className="flex items-start gap-4">
          <span className="text-3xl flex-shrink-0">📋</span>
          <div className="flex-1">
            <h2 className="font-bold text-gray-900">DRPS — Diagnóstico de Riscos Psicossociais</h2>
            <p className="text-gray-500 text-sm mt-1">
              O laudo técnico completo da <strong>empresa</strong>, assinado pela psicóloga responsável: introdução,
              metodologia, matriz de risco e a análise dos 13 fatores — com uma seção e gráficos <strong>por setor</strong>
              avaliado. Se houver um único setor, o resultado é apresentado como a empresa como um todo.
            </p>
            {!loading && sectors.length > 0 && (
              <p className="text-xs text-gray-400 mt-2">
                {sectors.filter((s) => s.totalResponses > 0).length} setor(es) com respostas · {totalRespostas} resposta{totalRespostas !== 1 ? 's' : ''} no total
              </p>
            )}
          </div>
          <button
            onClick={gerarDrps}
            disabled={loading || totalRespostas === 0}
            title={totalRespostas === 0 ? 'É preciso ter respostas para gerar o DRPS' : 'Gerar o DRPS da empresa'}
            className="flex-shrink-0 bg-primary-800 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed self-center"
          >
            📄 Gerar DRPS
          </button>
        </div>
        {!loading && sectors.length === 0 && (
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-6 text-center mt-4">
            <p className="text-gray-500 text-sm">Nenhum setor criado ainda. Crie setores e colete respostas para gerar o DRPS.</p>
          </div>
        )}
      </div>

      {/* ── PGR ──────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
        <div className="flex items-start gap-4">
          <span className="text-3xl flex-shrink-0">📑</span>
          <div className="flex-1">
            <h2 className="font-bold text-gray-900">Anexo para o PGR</h2>
            <p className="text-gray-500 text-sm mt-1">
              O documento técnico consolidado (todos os setores) para você <strong>anexar ao PGR</strong> da sua
              empresa: inventário de riscos psicossociais, critérios e integração ao plano de ação. O PGR em si é
              elaborado pela sua empresa/SESMT — nós fornecemos o anexo de riscos psicossociais.
            </p>
          </div>
          <button
            onClick={gerarPgr}
            disabled={loading || totalRespostas === 0}
            title={totalRespostas === 0 ? 'É preciso ter respostas para gerar o anexo' : 'Gerar o Anexo para o PGR'}
            className="flex-shrink-0 bg-primary-800 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed self-center"
          >
            📑 Gerar Anexo
          </button>
        </div>
      </div>

      {/* ── Plano de Ação ────────────────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
        <div className="flex items-start gap-4 mb-5">
          <span className="text-3xl flex-shrink-0">🎯</span>
          <div className="flex-1">
            <h2 className="font-bold text-gray-900">Plano de Ação Vivo</h2>
            <p className="text-gray-500 text-sm mt-1">
              Abra o plano do setor para <strong>montar e acompanhar</strong> as medidas de cada fator, o
              cronograma de treinamentos (vídeos liberados ao time nas 52 semanas) e anexar as evidências.
              Lá dentro você também <strong>gera o documento em PDF</strong> quando quiser.
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
              Nenhum setor criado ainda. Crie setores e colete respostas para gerar o Plano de Ação.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {sectors.map((s) => {
              const semRespostas = s.totalResponses === 0
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-3 border border-gray-100 rounded-xl px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{s.name}</p>
                    <span className="text-xs text-gray-400">
                      {s.totalResponses} resposta{s.totalResponses !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <button
                    onClick={() => abrirPlano(s.id)}
                    disabled={semRespostas}
                    title={semRespostas ? 'Este setor ainda não tem respostas' : 'Abrir o Plano de Ação deste setor'}
                    className="flex-shrink-0 bg-primary-800 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    🎯 Abrir Plano de Ação
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
