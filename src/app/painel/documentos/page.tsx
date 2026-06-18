export default function DocumentosPage() {
  // Aba de Documentos — placeholder da Fase 1.
  // Nas próximas fases, aqui serão gerados e baixados o DRPS, o PGR e o Plano de Ação.
  const docs = [
    {
      icon: '📋',
      titulo: 'DRPS — Diagnóstico de Riscos Psicossociais',
      desc: 'O laudo técnico com a matriz de risco e a análise dos 13 fatores, assinado pela psicóloga responsável.',
    },
    {
      icon: '📑',
      titulo: 'PGR — Programa de Gerenciamento de Riscos',
      desc: 'O programa-mãe com inventário de riscos, critérios, plano de ação e cronograma de monitoramento.',
    },
    {
      icon: '🎯',
      titulo: 'Plano de Ação',
      desc: 'Documento com as medidas concretas para tratar cada fator de risco identificado.',
    },
  ]

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Documentos</h1>
        <p className="text-gray-500 mt-1">
          Aqui você vai gerar e baixar os documentos oficiais da sua adequação à NR-1.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">🚧</span>
        <div>
          <p className="font-semibold text-blue-900">Em construção</p>
          <p className="text-blue-800 text-sm mt-1">
            A geração automática dos documentos está sendo preparada. Em breve você vai poder
            gerar cada documento com um clique, a partir dos resultados da avaliação.
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {docs.map((d, i) => (
          <div
            key={i}
            className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 flex items-start gap-4"
          >
            <span className="text-3xl flex-shrink-0 mt-0.5">{d.icon}</span>
            <div className="flex-1">
              <h2 className="font-semibold text-gray-900">{d.titulo}</h2>
              <p className="text-gray-500 text-sm mt-1">{d.desc}</p>
            </div>
            <span className="flex-shrink-0 text-xs bg-gray-100 text-gray-500 border border-gray-200 px-3 py-1 rounded-full font-medium self-center">
              Em breve
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
