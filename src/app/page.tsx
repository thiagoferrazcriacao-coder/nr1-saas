import Link from 'next/link'

export const metadata = {
  title: 'NR-1 Risk — Adequação Psicossocial para Empresas',
  description: 'A NR-1 já está em vigor. Toda empresa com funcionário CLT é obrigada a fazer o diagnóstico de riscos psicossociais. Adeque sua empresa em poucos dias com laudo assinado por psicóloga.',
}

export default function LandingPage() {
  return (
    <div className="font-sans text-gray-900 bg-white">

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#1e3a5f] rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">🧠</span>
            </div>
            <span className="font-bold text-[#1e3a5f] text-lg">NR-1 Risk</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="#precos" className="hidden sm:block text-sm text-gray-500 hover:text-gray-800 transition-colors">Ver preços</a>
            <Link href="/login" className="bg-[#1e3a5f] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#162d4a] transition-colors">
              Acessar Plataforma
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="bg-[#1e3a5f] text-white pt-28 pb-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-red-500/20 border border-red-400/40 text-red-300 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse inline-block" />
            NORMA EM VIGOR DESDE 26/05/2026 — FISCALIZAÇÃO ATIVA
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-6">
            A NR-1 já está em vigor.<br />
            <span className="text-[#f97316]">Sua empresa está em risco?</span>
          </h1>

          <p className="text-xl text-blue-100 max-w-3xl mb-8 leading-relaxed">
            Toda empresa com <strong className="text-white">ao menos 1 funcionário CLT</strong> é obrigada por lei a realizar o diagnóstico de riscos psicossociais.
            Quem não cumprir responde com multa, passivo trabalhista e ação judicial com presunção de culpa.
          </p>

          <div className="flex flex-wrap gap-3 mb-10">
            {[
              { icon: '⚠️', text: '1+ CLT já basta para a obrigação existir' },
              { icon: '💰', text: 'Multa de até R$ 6.708 por item autuado' },
              { icon: '📅', text: 'Documentação válida por 20 anos' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-sm font-medium">
                <span>{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 bg-[#f97316] hover:bg-[#ea6c0a] text-white px-8 py-4 rounded-xl font-bold text-lg transition-colors shadow-lg shadow-orange-500/30"
            >
              Adequar Minha Empresa Agora →
            </Link>
            <a
              href="#como-funciona"
              className="inline-flex items-center justify-center gap-2 border border-white/30 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/10 transition-colors"
            >
              Como funciona
            </a>
          </div>
        </div>
      </section>

      {/* URGÊNCIA STRIPE */}
      <div className="bg-red-600 text-white text-center py-3 px-4">
        <p className="text-sm font-semibold">
          🚨 A fiscalização chega por denúncia de funcionário ou ex-funcionário — não avisa e não dá segunda chance.
          <a href="#riscos" className="underline ml-2 hover:no-underline">Ver casos reais →</a>
        </p>
      </div>

      {/* SEÇÃO: MUDANÇA HISTÓRICA */}
      <section className="bg-[#f5f3ef] py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-black text-[#1e3a5f] mb-3">
            Uma mudança histórica nas obrigações do empregador
          </h2>
          <div className="w-16 h-1 bg-[#f97316] mb-8" />

          <div className="grid sm:grid-cols-2 gap-8 mb-10">
            <p className="text-gray-700 text-lg leading-relaxed">
              Na década de 70, o Brasil foi campeão mundial de acidentes de trabalho. A resposta foram as Normas Regulamentadoras e os EPIs: capacete, óculos, protetor auricular.
              <strong className="text-[#1e3a5f]"> Cinquenta anos depois, a história se repete — agora com a mente.</strong>
            </p>
            <p className="text-gray-700 text-lg leading-relaxed">
              Transtornos mentais estão entre as maiores causas de afastamento do trabalho no país. A NR-1 atualizada (Portaria MTE 1.419/2024) passou a exigir que toda empresa com funcionários CLT inclua os <strong className="text-[#1e3a5f]">fatores de riscos psicossociais no seu GRO.</strong>
            </p>
          </div>

          <div className="bg-white border-l-4 border-[#f97316] rounded-xl p-6 shadow-sm">
            <div className="inline-flex items-center gap-2 bg-[#f97316] text-white text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
              O que são riscos psicossociais
            </div>
            <p className="text-gray-700 text-lg leading-relaxed mb-4">
              Em linguagem simples: <strong>assédio, sobrecarga, metas abusivas, falta de clareza na função, falta de apoio da chefia, comunicação falha.</strong> Não são problemas novos — são situações que o ambiente de trabalho normalizou, como um dia se normalizou fumar em restaurante fechado.
            </p>
            <div className="flex flex-wrap gap-2">
              {['ASSÉDIO', 'SOBRECARGA', 'METAS ABUSIVAS', 'FALTA DE CLAREZA', 'FALTA DE APOIO', 'COMUNICAÇÃO FALHA'].map((tag) => (
                <span key={tag} className="border border-[#1e3a5f] text-[#1e3a5f] text-xs font-bold px-3 py-1 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <p className="mt-8 text-xl font-bold text-[#1e3a5f] text-center">
            Não há exceção de porte ou setor. Micro, pequena, média ou grande: com um CLT, a obrigação existe.
          </p>
        </div>
      </section>

      {/* SEÇÃO: RISCOS REAIS */}
      <section id="riscos" className="bg-[#1e3a5f] py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
            A multa é o menor dos problemas
          </h2>
          <div className="w-16 h-1 bg-[#f97316] mb-6" />
          <p className="text-blue-200 text-lg max-w-3xl mb-10 leading-relaxed">
            A fiscalização chega por denúncia de funcionário ou ex-funcionário, não por sorteio. O risco maior não é o auto de infração: é o <strong className="text-white">passivo trabalhista.</strong> Sem a avaliação psicossocial documentada, um afastamento por ansiedade, depressão ou burnout vira ação judicial com <strong className="text-white">presunção de nexo contra a empresa.</strong> E a documentação exigida vale — ou condena — por 20 anos.
          </p>

          <div className="grid sm:grid-cols-2 gap-4 mb-10">
            {[
              {
                valor: 'Reintegração obrigatória',
                desc: 'TST (2025): dispensa de gerente em licença por burnout foi declarada nula, com reintegração imediata determinada.',
              },
              {
                valor: 'Nexo causal automático',
                desc: 'TRT-4 (RS): gerente comercial desenvolveu burnout por condições abusivas. O laudo apontou que o trabalho não precisa ser a causa única — basta contribuir (nexo concausal).',
              },
              {
                valor: 'R$ 3,4 milhões',
                desc: 'Justiça do Trabalho de Recife (2026): condenação por assédio moral organizacional após inquérito do MPT, dano moral coletivo.',
              },
              {
                valor: 'Multa diária de R$ 20 mil',
                desc: 'Clínica de porte médio foi obrigada judicialmente a implantar política de prevenção e canal de denúncias, sob multa diária por descumprimento.',
              },
            ].map((item, i) => (
              <div key={i} className="bg-[#162d4a] border border-white/10 rounded-xl p-5">
                <p className="text-[#f97316] text-xl font-black mb-2">{item.valor}</p>
                <p className="text-blue-200 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-[#f97316] rounded-2xl p-6 text-center">
            <p className="text-white text-2xl font-black">
              A empresa pode se adequar por escolha hoje,<br className="hidden sm:block" /> ou por ordem judicial amanhã.
            </p>
          </div>
        </div>
      </section>

      {/* SEÇÃO: CUSTO OCULTO */}
      <section className="bg-[#f5f3ef] py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-black text-[#1e3a5f] mb-3">
            O custo do descaso já está na sua folha
          </h2>
          <div className="w-16 h-1 bg-[#f97316] mb-10" />

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: '🏥',
                titulo: 'Afastamentos',
                desc: 'Transtornos mentais estão entre as maiores causas de afastamento pelo INSS. Cada afastamento impacta o FAP, encarecendo a folha.',
              },
              {
                icon: '🔄',
                titulo: 'Rotatividade',
                desc: 'Ambiente que adoece é ambiente que perde gente. Recrutar e treinar de novo custa caro — e você já sabe disso.',
              },
              {
                icon: '💊',
                titulo: 'Plano de saúde',
                desc: 'Sinistralidade alta vira reajuste acima da inflação. Prevenção é o único caminho de reversão sustentável.',
              },
              {
                icon: '📢',
                titulo: 'Reputação',
                desc: 'Processo trabalhista e exposição pública afastam clientes e talentos. Em cidade pequena, todo mundo se conhece.',
              },
            ].map((item, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
                <span className="text-3xl mb-3 block">{item.icon}</span>
                <h3 className="font-bold text-[#1e3a5f] mb-2">{item.titulo}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SEÇÃO: O QUE ESTÁ INCLUÍDO */}
      <section className="bg-white py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-black text-[#1e3a5f] mb-3">
            Adequação NR-1 completa, em poucos dias
          </h2>
          <div className="w-16 h-1 bg-[#f97316] mb-4" />
          <p className="text-gray-600 text-lg mb-10 max-w-2xl">
            Tudo feito pela plataforma. Sem consultores presenciais, sem paralisar a operação, sem burocracia.
          </p>

          <div className="grid sm:grid-cols-2 gap-3 mb-8">
            {[
              { icon: '📋', item: 'Diagnóstico de Riscos Psicossociais (DRPS) assinado por psicóloga com CRP' },
              { icon: '📊', item: 'Inventário completo de Riscos Psicossociais por setor' },
              { icon: '🔢', item: 'Matriz de Risco compatível com a NR-1 (Gravidade × Probabilidade)' },
              { icon: '📁', item: 'Documento de Critérios adotados no GRO' },
              { icon: '🎯', item: 'Plano de Ação com recomendações priorizadas por análise técnica' },
              { icon: '🗄️', item: 'Orientação de guarda da documentação (20 anos) e comunicados internos prontos' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 bg-[#f0f7ff] border border-blue-100 rounded-xl p-4">
                <span className="text-2xl flex-shrink-0 mt-0.5">{item.icon}</span>
                <p className="text-[#1e3a5f] font-medium text-sm leading-relaxed">{item.item}</p>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2d5a8f] text-white rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-bold text-lg">Tudo isso por um valor único.</p>
              <p className="text-blue-200 text-sm mt-1">Para referência: uma multa por item autuado pode chegar a R$ 6.708. Uma condenação trabalhista supera o investimento de toda a adequação.</p>
            </div>
            <a href="#precos" className="flex-shrink-0 bg-[#f97316] hover:bg-[#ea6c0a] text-white px-6 py-3 rounded-xl font-bold text-sm transition-colors whitespace-nowrap">
              Ver investimento →
            </a>
          </div>
        </div>
      </section>

      {/* SEÇÃO: COMO FUNCIONA */}
      <section id="como-funciona" className="bg-[#1e3a5f] py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
            Cinco passos. Poucos dias.
          </h2>
          <div className="w-16 h-1 bg-[#f97316] mb-4" />
          <p className="text-blue-200 text-lg mb-12 max-w-2xl">
            O colaborador responde de onde estiver. O gestor acompanha tudo em tempo real. Ninguém para a operação.
          </p>

          <div className="grid sm:grid-cols-5 gap-4">
            {[
              { n: '1', titulo: 'Acesso', desc: 'Empresa cria a conta na plataforma e cadastra seus dados.' },
              { n: '2', titulo: 'Cadastro', desc: 'Cria os setores e gera links únicos ou QR codes para cada equipe.' },
              { n: '3', titulo: 'Equipe responde', desc: 'Colaboradores respondem 50 perguntas anônimas pelo celular, de onde estiverem.' },
              { n: '4', titulo: 'Análise Técnica', desc: 'A plataforma gera diagnóstico automático por setor, fundamentado em modelos científicos validados internacionalmente, e identifica os pontos críticos.' },
              { n: '5', titulo: 'Documentos', desc: 'DRPS assinado pela psicóloga é liberado para download. Empresa está em conformidade.' },
            ].map((step) => (
              <div key={step.n} className="text-center">
                <div className="w-12 h-12 bg-[#f97316] rounded-full flex items-center justify-center text-white font-black text-lg mx-auto mb-3">
                  {step.n}
                </div>
                <h3 className="font-bold text-white mb-1">{step.titulo}</h3>
                <p className="text-blue-300 text-xs leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 bg-white/10 border border-white/20 rounded-xl p-5 text-center">
            <p className="text-white font-semibold">
              🔒 100% anônimo para o colaborador · Nenhum dado pessoal é vinculado às respostas · Conformidade com a LGPD
            </p>
          </div>
        </div>
      </section>

      {/* SEÇÃO: EQUIPE */}
      <section className="bg-[#f5f3ef] py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-black text-[#1e3a5f] mb-3">
            Responsabilidade técnica completa
          </h2>
          <div className="w-16 h-1 bg-[#f97316] mb-4" />
          <p className="text-gray-600 text-lg mb-10 max-w-2xl">
            Quem assina conhece as empresas da região e responde juridicamente pelo que entrega.
          </p>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                iniciais: 'RC',
                nome: 'Rafael Coelho',
                cargo: 'Gestão de Projetos',
                desc: 'Responsável pela condução e entrega do programa de adequação.',
                destaque: false,
              },
              {
                iniciais: 'AT',
                nome: 'Annie Talma Ferreira Coelho',
                cargo: 'Psicóloga Responsável Técnica — CRP/05/44595',
                desc: 'Assina o DRPS e garante a validade legal do diagnóstico perante o MTE e a Justiça do Trabalho.',
                destaque: true,
              },
              {
                iniciais: 'TF',
                nome: 'Thiago Ferraz',
                cargo: 'Tecnologia e Plataforma',
                desc: 'Responsável pelo desenvolvimento e operação do sistema NR-1 Risk.',
                destaque: false,
              },
            ].map((pessoa) => (
              <div key={pessoa.nome} className={`bg-white rounded-2xl p-6 border shadow-sm ${pessoa.destaque ? 'border-[#f97316] shadow-orange-100' : 'border-gray-100'}`}>
                <div className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-lg mb-4 ${pessoa.destaque ? 'bg-[#f97316] text-white' : 'bg-[#1e3a5f]/10 text-[#1e3a5f]'}`}>
                  {pessoa.iniciais}
                </div>
                <h3 className="font-bold text-[#1e3a5f] mb-1">{pessoa.nome}</h3>
                <p className={`text-xs font-semibold mb-3 ${pessoa.destaque ? 'text-[#f97316]' : 'text-gray-500'}`}>{pessoa.cargo}</p>
                <p className="text-gray-600 text-sm leading-relaxed">{pessoa.desc}</p>
                {pessoa.destaque && (
                  <div className="mt-3 bg-orange-50 border border-orange-200 rounded-lg p-2 text-xs text-orange-700 font-medium">
                    ✅ Assina o DRPS com validade legal
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SEÇÃO: PREÇOS */}
      <section id="precos" className="bg-white py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-black text-[#1e3a5f] mb-3">
            Investimento por porte da empresa
          </h2>
          <div className="w-16 h-1 bg-[#f97316] mb-4" />
          <p className="text-gray-600 text-lg mb-8 max-w-2xl">
            Valor único pela adequação completa. Pagamento e aceite direto na plataforma, sem intermediários.
          </p>

          <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm mb-6">
            <table className="w-full">
              <thead>
                <tr className="bg-[#1e3a5f] text-white">
                  <th className="text-left px-6 py-4 font-semibold text-sm">Colaboradores CLT</th>
                  <th className="text-left px-6 py-4 font-semibold text-sm">Investimento único</th>
                  <th className="text-left px-6 py-4 font-semibold text-sm text-[#f97316]">Economia vs. 1 multa</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { faixa: 'Até 10', valor: 'R$ 1.497', economia: 'Poupa até R$ 5.211' },
                  { faixa: '11 a 30', valor: 'R$ 1.997', economia: 'Poupa até R$ 4.711' },
                  { faixa: '31 a 50', valor: 'R$ 2.497', economia: 'Poupa até R$ 4.211' },
                  { faixa: '51 a 100', valor: 'R$ 2.997', economia: 'Poupa até R$ 3.711' },
                  { faixa: 'Acima de 100', valor: 'Sob consulta', economia: 'Condição especial' },
                ].map((row, i) => (
                  <tr key={i} className={`border-t border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-6 py-4 font-medium text-gray-800">{row.faixa}</td>
                    <td className="px-6 py-4 font-bold text-[#1e3a5f] text-lg">{row.valor}</td>
                    <td className="px-6 py-4 text-green-600 font-semibold text-sm">{row.economia}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 mb-10">
            <strong>Para referência:</strong> uma multa por um único item autuado pode chegar a <strong>R$ 6.708,08</strong> (art. 201 da CLT). Uma única condenação trabalhista por passivo psicossocial supera o investimento de toda a adequação — muitas vezes.
          </div>

          {/* CTA principal */}
          <div className="bg-gradient-to-br from-[#1e3a5f] to-[#163050] rounded-2xl p-8 text-center text-white">
            <h3 className="text-2xl sm:text-3xl font-black mb-3">
              Sua empresa pode estar em risco agora.
            </h3>
            <p className="text-blue-200 mb-6 text-lg max-w-xl mx-auto">
              A adequação leva poucos dias. O processo trabalhista pode levar anos — e custar muito mais do que você imagina.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-[#f97316] hover:bg-[#ea6c0a] text-white px-10 py-4 rounded-xl font-bold text-xl transition-colors shadow-lg shadow-orange-500/30"
            >
              Começar Adequação Agora →
            </Link>
            <p className="text-blue-300 text-sm mt-4">
              Plataforma 100% online · Sem contrato de longo prazo · Suporte incluso
            </p>
          </div>
        </div>
      </section>

      {/* SEÇÃO: MAIS QUE CONFORMIDADE */}
      <section className="bg-[#1e3a5f] py-16 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            Mais que conformidade:<br />
            <span className="text-[#f97316]">ambientes que protegem</span>
          </h2>
          <p className="text-blue-200 text-lg leading-relaxed">
            A NR-1 obriga, mas a verdadeira entrega é outra: empresas onde as pessoas trabalham melhor, adoecem menos e ficam mais.
            O colaborador satisfeito é o primeiro cliente da empresa — e o melhor argumento contra qualquer processo trabalhista.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0f1e30] text-blue-300 py-10 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#1e3a5f] rounded-lg flex items-center justify-center">
              <span className="text-white text-xs">🧠</span>
            </div>
            <span className="font-bold text-white">NR-1 Risk</span>
          </div>
          <p className="text-sm text-center">
            Adequação baseada na Portaria MTE 1.419/2024 · Responsável técnica: Annie Talma Ferreira Coelho — CRP/05/44595
          </p>
          <Link href="/login" className="text-sm text-[#f97316] hover:underline font-semibold">
            Acessar plataforma →
          </Link>
        </div>
      </footer>

    </div>
  )
}
