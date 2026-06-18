export default function MaterialDidaticoPage() {
  // Aba de Material Didático — placeholder da Fase 1.
  // Na Fase 5, aqui ficará a plataforma de vídeos (10 programas / 52 semanas),
  // com cadastro do colaborador por e-mail e medição de % assistido por pessoa.
  const recursos = [
    {
      icon: '🎬',
      titulo: 'Biblioteca de vídeos',
      desc: 'Conteúdos organizados nos 10 programas e nas 52 semanas do protocolo NR-1.',
    },
    {
      icon: '📧',
      titulo: 'Cadastro do colaborador',
      desc: 'Cada funcionário acessa com o e-mail e assiste aos vídeos liberados para a equipe dele.',
    },
    {
      icon: '📈',
      titulo: 'Medição de presença',
      desc: 'O sistema mede quanto cada pessoa assistiu (90% ou mais = concluído).',
    },
    {
      icon: '🧾',
      titulo: 'Relatório de comprovação',
      desc: 'Relatório de quem assistiu quanto — a prova de que a empresa está agindo.',
    },
  ]

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Material Didático</h1>
        <p className="text-gray-500 mt-1">
          A escola online da sua empresa: vídeos de aplicação da NR-1 com acompanhamento de presença.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">🚧</span>
        <div>
          <p className="font-semibold text-blue-900">Em construção</p>
          <p className="text-blue-800 text-sm mt-1">
            A plataforma de vídeos está sendo preparada. Em breve seus colaboradores vão poder
            assistir aos conteúdos e você vai acompanhar o progresso de cada um.
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {recursos.map((r, i) => (
          <div
            key={i}
            className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 flex items-start gap-4"
          >
            <span className="text-3xl flex-shrink-0 mt-0.5">{r.icon}</span>
            <div className="flex-1">
              <h2 className="font-semibold text-gray-900">{r.titulo}</h2>
              <p className="text-gray-500 text-sm mt-1">{r.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
