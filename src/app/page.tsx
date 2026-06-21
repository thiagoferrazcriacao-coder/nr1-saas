import Link from 'next/link'

export const metadata = {
  title: 'Zelo — Plataforma de Adequação à NR-1 (Riscos Psicossociais)',
  description: 'A NR-1 já está em vigor. Toda empresa com funcionário CLT precisa do diagnóstico de riscos psicossociais. Adeque sua empresa em poucos dias com laudo (DRPS) assinado por psicóloga.',
}

// Paleta Zelo
// navy #0E2A47 · teal #17C3C9 · azul #5B8DEF

export default function LandingPage() {
  return (
    <div className="font-sans text-[#0E2A47] bg-white">

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-zelo.png" alt="Zelo — Plataforma de NR1" className="h-9 w-auto" />
          <div className="flex items-center gap-4">
            <a href="#precos" className="hidden sm:block text-sm font-medium text-gray-500 hover:text-[#0E2A47] transition-colors">Preços</a>
            <a href="#como-funciona" className="hidden sm:block text-sm font-medium text-gray-500 hover:text-[#0E2A47] transition-colors">Como funciona</a>
            <Link href="/login" className="bg-gradient-to-r from-[#17C3C9] to-[#3F7DE0] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm">
              Acessar Plataforma
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-28 pb-16 px-4 bg-gradient-to-b from-[#F0FBFC] to-white">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          {/* Texto */}
          <div>
            <div className="inline-flex items-center gap-2 bg-[#FFF4E5] border border-[#FFD8A8] text-[#B5651D] text-xs font-bold px-3 py-1.5 rounded-full mb-6">
              <span className="w-2 h-2 bg-[#F08C00] rounded-full animate-pulse inline-block" />
              NORMA EM VIGOR — FISCALIZAÇÃO ATIVA
            </div>

            <h1 className="text-4xl sm:text-5xl font-black leading-[1.1] mb-5 text-[#0E2A47]">
              Sua empresa em conformidade com a{' '}
              <span className="bg-gradient-to-r from-[#17C3C9] to-[#3F7DE0] bg-clip-text text-transparent">NR-1</span>,
              em poucos dias.
            </h1>

            <p className="text-lg text-gray-600 mb-7 leading-relaxed max-w-xl">
              Toda empresa com <strong className="text-[#0E2A47]">ao menos 1 funcionário CLT</strong> é obrigada a fazer
              o diagnóstico de riscos psicossociais. O Zelo cuida de tudo: avaliação anônima, laudo assinado por psicóloga
              e plano de ação — sem paralisar a operação.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <Link href="/login" className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#17C3C9] to-[#3F7DE0] text-white px-7 py-3.5 rounded-xl font-bold text-base hover:opacity-90 transition-opacity shadow-lg shadow-[#17C3C9]/25">
                Adequar minha empresa →
              </Link>
              <a href="#como-funciona" className="inline-flex items-center justify-center gap-2 border border-gray-200 text-[#0E2A47] px-7 py-3.5 rounded-xl font-semibold text-base hover:bg-gray-50 transition-colors">
                Ver como funciona
              </a>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {['1+ CLT já obriga', 'Laudo com validade legal', '100% online'].map((t) => (
                <span key={t} className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="text-[#17C3C9] font-bold">✓</span> {t}
                </span>
              ))}
            </div>
          </div>

          {/* Card de destaque (lado direito) */}
          <div className="bg-white rounded-3xl shadow-xl shadow-[#0E2A47]/10 border border-gray-100 p-7">
            <div className="inline-flex items-center gap-2 bg-[#F0FBFC] text-[#109CA1] text-xs font-bold px-3 py-1 rounded-full mb-5">
              ✦ ADEQUAÇÃO COMPLETA
            </div>
            <h3 className="text-xl font-black text-[#0E2A47] mb-4">Tudo o que sua empresa recebe</h3>
            <ul className="space-y-3 mb-6">
              {[
                'DRPS — laudo assinado por psicóloga (CRP)',
                'Inventário de Riscos por setor',
                'Matriz de Risco NR-1',
                'PGR — Programa de Gerenciamento de Riscos',
                'Plano de Ação com prazos e responsáveis',
                'Treinamentos em vídeo com comprovação',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-r from-[#17C3C9] to-[#3F7DE0] text-white text-xs flex items-center justify-center mt-0.5">✓</span>
                  <span className="text-sm text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
            <Link href="/login" className="block text-center bg-[#0E2A47] text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#0A1F36] transition-colors">
              Começar agora
            </Link>
            <p className="text-center text-xs text-gray-400 mt-3">Sem contrato de longo prazo · Suporte incluso</p>
          </div>
        </div>
      </section>

      {/* FAIXA DE ALERTA */}
      <div className="bg-[#0E2A47] text-white text-center py-3 px-4">
        <p className="text-sm">
          <span className="font-semibold">A fiscalização chega por denúncia de funcionário ou ex-funcionário</span> — não avisa e não dá segunda chance.
          <a href="#riscos" className="text-[#5BD9DD] underline ml-2 hover:no-underline">Ver casos reais →</a>
        </p>
      </div>

      {/* MUDANÇA HISTÓRICA */}
      <section className="bg-white py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-black text-[#0E2A47] mb-3">
            Uma mudança histórica nas obrigações do empregador
          </h2>
          <div className="w-16 h-1.5 rounded-full bg-gradient-to-r from-[#17C3C9] to-[#5B8DEF] mb-8" />

          <div className="grid sm:grid-cols-2 gap-8 mb-10">
            <p className="text-gray-600 text-lg leading-relaxed">
              Na década de 70, o Brasil foi campeão mundial de acidentes de trabalho. A resposta foram as Normas Regulamentadoras e os EPIs.
              <strong className="text-[#0E2A47]"> Cinquenta anos depois, a história se repete — agora com a mente.</strong>
            </p>
            <p className="text-gray-600 text-lg leading-relaxed">
              Transtornos mentais estão entre as maiores causas de afastamento do país. A NR-1 atualizada (Portaria MTE 1.419/2024) passou a exigir que toda empresa com CLT inclua os <strong className="text-[#0E2A47]">fatores de risco psicossocial no seu GRO.</strong>
            </p>
          </div>

          <div className="bg-[#F0FBFC] border border-[#CCEFF1] rounded-2xl p-6">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#17C3C9] to-[#3F7DE0] text-white text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
              O que são riscos psicossociais
            </div>
            <p className="text-gray-700 text-lg leading-relaxed mb-4">
              Em linguagem simples: <strong>assédio, sobrecarga, metas abusivas, falta de clareza na função, falta de apoio da chefia, comunicação falha.</strong> Situações que o ambiente de trabalho normalizou — como um dia se normalizou fumar em ambiente fechado.
            </p>
            <div className="flex flex-wrap gap-2">
              {['ASSÉDIO', 'SOBRECARGA', 'METAS ABUSIVAS', 'FALTA DE CLAREZA', 'FALTA DE APOIO', 'COMUNICAÇÃO FALHA'].map((tag) => (
                <span key={tag} className="border border-[#17C3C9] text-[#109CA1] text-xs font-bold px-3 py-1 rounded-full">{tag}</span>
              ))}
            </div>
          </div>

          <p className="mt-8 text-xl font-bold text-[#0E2A47] text-center">
            Não há exceção de porte ou setor. Micro, pequena, média ou grande: com um CLT, a obrigação existe.
          </p>
        </div>
      </section>

      {/* RISCOS REAIS */}
      <section id="riscos" className="bg-[#0E2A47] py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">A multa é o menor dos problemas</h2>
          <div className="w-16 h-1.5 rounded-full bg-gradient-to-r from-[#17C3C9] to-[#5B8DEF] mb-6" />
          <p className="text-[#9FC2D6] text-lg max-w-3xl mb-10 leading-relaxed">
            O risco maior não é o auto de infração: é o <strong className="text-white">passivo trabalhista.</strong> Sem a avaliação psicossocial documentada, um afastamento por ansiedade, depressão ou burnout vira ação judicial com <strong className="text-white">presunção de nexo contra a empresa</strong> — e a documentação exigida vale, ou condena, por 20 anos.
          </p>

          <div className="grid sm:grid-cols-2 gap-4 mb-10">
            {[
              { valor: 'Reintegração obrigatória', desc: 'TST (2025): dispensa de gerente em licença por burnout declarada nula, com reintegração imediata.' },
              { valor: 'Nexo causal automático', desc: 'TRT-4 (RS): burnout por condições abusivas. O trabalho não precisa ser a causa única — basta contribuir.' },
              { valor: 'R$ 3,4 milhões', desc: 'Justiça do Trabalho de Recife (2026): condenação por assédio moral organizacional após inquérito do MPT.' },
              { valor: 'R$ 20 mil por dia', desc: 'Clínica de médio porte obrigada judicialmente a implantar política de prevenção e canal de denúncias.' },
            ].map((item, i) => (
              <div key={i} className="bg-[#11324F] border border-white/10 rounded-2xl p-5">
                <p className="text-[#5BD9DD] text-xl font-black mb-2">{item.valor}</p>
                <p className="text-[#9FC2D6] text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-r from-[#17C3C9] to-[#3F7DE0] rounded-2xl p-6 text-center">
            <p className="text-white text-2xl font-black">
              A empresa pode se adequar por escolha hoje,<br className="hidden sm:block" /> ou por ordem judicial amanhã.
            </p>
          </div>
        </div>
      </section>

      {/* CUSTO OCULTO */}
      <section className="bg-[#F6F9FC] py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-black text-[#0E2A47] mb-3">O custo do descaso já está na sua folha</h2>
          <div className="w-16 h-1.5 rounded-full bg-gradient-to-r from-[#17C3C9] to-[#5B8DEF] mb-10" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: '🏥', titulo: 'Afastamentos', desc: 'Transtornos mentais estão entre as maiores causas de afastamento pelo INSS. Cada um impacta o FAP e encarece a folha.' },
              { icon: '🔄', titulo: 'Rotatividade', desc: 'Ambiente que adoece é ambiente que perde gente. Recrutar e treinar de novo custa caro.' },
              { icon: '💊', titulo: 'Plano de saúde', desc: 'Sinistralidade alta vira reajuste acima da inflação. Prevenção é o caminho sustentável.' },
              { icon: '📢', titulo: 'Reputação', desc: 'Processo e exposição pública afastam clientes e talentos. Em cidade pequena, todo mundo se conhece.' },
            ].map((item, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <span className="text-3xl mb-3 block">{item.icon}</span>
                <h3 className="font-bold text-[#0E2A47] mb-2">{item.titulo}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* O QUE ESTÁ INCLUÍDO */}
      <section className="bg-white py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-black text-[#0E2A47] mb-3">Adequação completa, sem burocracia</h2>
          <div className="w-16 h-1.5 rounded-full bg-gradient-to-r from-[#17C3C9] to-[#5B8DEF] mb-4" />
          <p className="text-gray-500 text-lg mb-10 max-w-2xl">Tudo feito pela plataforma. Sem consultores presenciais, sem paralisar a operação.</p>

          <div className="grid sm:grid-cols-2 gap-3 mb-8">
            {[
              { icon: '📋', item: 'DRPS assinado por psicóloga com CRP' },
              { icon: '📊', item: 'Inventário completo de Riscos Psicossociais por setor' },
              { icon: '🔢', item: 'Matriz de Risco compatível com a NR-1 (Gravidade × Probabilidade)' },
              { icon: '📑', item: 'PGR — Programa de Gerenciamento de Riscos' },
              { icon: '🎯', item: 'Plano de Ação priorizado, com prazos e responsáveis' },
              { icon: '🎓', item: 'Treinamentos em vídeo com comprovação de quem assistiu' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 bg-[#F0FBFC] border border-[#CCEFF1] rounded-xl p-4">
                <span className="text-2xl flex-shrink-0 mt-0.5">{item.icon}</span>
                <p className="text-[#0E2A47] font-medium text-sm leading-relaxed">{item.item}</p>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-r from-[#0E2A47] to-[#11324F] text-white rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-bold text-lg">Tudo isso por um valor único.</p>
              <p className="text-[#9FC2D6] text-sm mt-1">Uma multa por item autuado pode chegar a R$ 6.708. Uma condenação trabalhista supera o investimento de toda a adequação.</p>
            </div>
            <a href="#precos" className="flex-shrink-0 bg-gradient-to-r from-[#17C3C9] to-[#3F7DE0] text-white px-6 py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity whitespace-nowrap">
              Ver investimento →
            </a>
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como-funciona" className="bg-[#0E2A47] py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">Cinco passos. Poucos dias.</h2>
          <div className="w-16 h-1.5 rounded-full bg-gradient-to-r from-[#17C3C9] to-[#5B8DEF] mb-4" />
          <p className="text-[#9FC2D6] text-lg mb-12 max-w-2xl">O colaborador responde de onde estiver. O gestor acompanha tudo em tempo real.</p>

          <div className="grid sm:grid-cols-5 gap-4">
            {[
              { n: '1', titulo: 'Acesso', desc: 'A empresa cria a conta e cadastra seus dados.' },
              { n: '2', titulo: 'Setores', desc: 'Cria os setores e gera links ou QR codes por equipe.' },
              { n: '3', titulo: 'Equipe responde', desc: 'Colaboradores respondem 50 perguntas anônimas pelo celular.' },
              { n: '4', titulo: 'Análise Técnica', desc: 'Diagnóstico automático por setor, em modelos validados internacionalmente.' },
              { n: '5', titulo: 'Documentos', desc: 'DRPS assinado liberado para download. Empresa em conformidade.' },
            ].map((step) => (
              <div key={step.n} className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-[#17C3C9] to-[#3F7DE0] rounded-full flex items-center justify-center text-white font-black text-lg mx-auto mb-3">{step.n}</div>
                <h3 className="font-bold text-white mb-1">{step.titulo}</h3>
                <p className="text-[#7FA6BE] text-xs leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 bg-white/5 border border-white/10 rounded-xl p-5 text-center">
            <p className="text-white font-semibold">
              🔒 100% anônimo para o colaborador · Nenhum dado pessoal vinculado às respostas · Conformidade com a LGPD
            </p>
          </div>
        </div>
      </section>

      {/* EQUIPE */}
      <section className="bg-[#F6F9FC] py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-black text-[#0E2A47] mb-3">Responsabilidade técnica completa</h2>
          <div className="w-16 h-1.5 rounded-full bg-gradient-to-r from-[#17C3C9] to-[#5B8DEF] mb-4" />
          <p className="text-gray-500 text-lg mb-10 max-w-2xl">Quem assina conhece as empresas da região e responde juridicamente pelo que entrega.</p>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { iniciais: 'RC', nome: 'Rafael Coelho', cargo: 'Gestão de Projetos', desc: 'Responsável pela condução e entrega do programa de adequação.', destaque: false },
              { iniciais: 'AT', nome: 'Annie Talma Ferreira Coelho', cargo: 'Psicóloga Responsável Técnica — CRP/05/44595', desc: 'Assina o DRPS e garante a validade legal do diagnóstico perante o MTE e a Justiça do Trabalho.', destaque: true },
              { iniciais: 'TF', nome: 'Thiago Ferraz', cargo: 'Tecnologia e Plataforma', desc: 'Responsável pelo desenvolvimento e operação da plataforma Zelo.', destaque: false },
            ].map((pessoa) => (
              <div key={pessoa.nome} className={`bg-white rounded-2xl p-6 border shadow-sm ${pessoa.destaque ? 'border-[#17C3C9] shadow-[#17C3C9]/10' : 'border-gray-100'}`}>
                <div className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-lg mb-4 ${pessoa.destaque ? 'bg-gradient-to-r from-[#17C3C9] to-[#3F7DE0] text-white' : 'bg-[#0E2A47]/10 text-[#0E2A47]'}`}>
                  {pessoa.iniciais}
                </div>
                <h3 className="font-bold text-[#0E2A47] mb-1">{pessoa.nome}</h3>
                <p className={`text-xs font-semibold mb-3 ${pessoa.destaque ? 'text-[#109CA1]' : 'text-gray-400'}`}>{pessoa.cargo}</p>
                <p className="text-gray-500 text-sm leading-relaxed">{pessoa.desc}</p>
                {pessoa.destaque && (
                  <div className="mt-3 bg-[#F0FBFC] border border-[#CCEFF1] rounded-lg p-2 text-xs text-[#109CA1] font-medium">
                    ✅ Assina o DRPS com validade legal
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PREÇOS */}
      <section id="precos" className="bg-white py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-black text-[#0E2A47] mb-3">Investimento por porte da empresa</h2>
          <div className="w-16 h-1.5 rounded-full bg-gradient-to-r from-[#17C3C9] to-[#5B8DEF] mb-4" />
          <p className="text-gray-500 text-lg mb-8 max-w-2xl">Valor único pela adequação completa. Pagamento e aceite direto na plataforma.</p>

          <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm mb-6">
            <table className="w-full">
              <thead>
                <tr className="bg-[#0E2A47] text-white">
                  <th className="text-left px-6 py-4 font-semibold text-sm">Colaboradores CLT</th>
                  <th className="text-left px-6 py-4 font-semibold text-sm">Investimento único</th>
                  <th className="text-left px-6 py-4 font-semibold text-sm text-[#5BD9DD]">Economia vs. 1 multa</th>
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
                  <tr key={i} className={`border-t border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-[#F6F9FC]'}`}>
                    <td className="px-6 py-4 font-medium text-gray-700">{row.faixa}</td>
                    <td className="px-6 py-4 font-bold text-[#0E2A47] text-lg">{row.valor}</td>
                    <td className="px-6 py-4 text-[#109CA1] font-semibold text-sm">{row.economia}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-[#FFF9F0] border border-[#FFE3B3] rounded-xl p-4 text-sm text-[#8A5A00] mb-10">
            <strong>Para referência:</strong> uma multa por um único item autuado pode chegar a <strong>R$ 6.708,08</strong> (art. 201 da CLT). Uma única condenação trabalhista por passivo psicossocial supera o investimento de toda a adequação.
          </div>

          {/* CTA principal */}
          <div className="bg-gradient-to-br from-[#0E2A47] to-[#11324F] rounded-3xl p-8 text-center text-white">
            <h3 className="text-2xl sm:text-3xl font-black mb-3">Sua empresa pode estar em risco agora.</h3>
            <p className="text-[#9FC2D6] mb-6 text-lg max-w-xl mx-auto">
              A adequação leva poucos dias. O processo trabalhista pode levar anos — e custar muito mais.
            </p>
            <Link href="/login" className="inline-flex items-center gap-2 bg-gradient-to-r from-[#17C3C9] to-[#3F7DE0] text-white px-10 py-4 rounded-xl font-bold text-xl hover:opacity-90 transition-opacity shadow-lg shadow-[#17C3C9]/25">
              Começar adequação agora →
            </Link>
            <p className="text-[#7FA6BE] text-sm mt-4">Plataforma 100% online · Sem contrato de longo prazo · Suporte incluso</p>
          </div>
        </div>
      </section>

      {/* MAIS QUE CONFORMIDADE */}
      <section className="bg-gradient-to-r from-[#17C3C9] to-[#3F7DE0] py-16 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            Mais que conformidade: ambientes que protegem
          </h2>
          <p className="text-white/90 text-lg leading-relaxed">
            A NR-1 obriga, mas a verdadeira entrega é outra: empresas onde as pessoas trabalham melhor, adoecem menos e ficam mais.
            O colaborador satisfeito é o primeiro cliente da empresa — e o melhor argumento contra qualquer processo trabalhista.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0A1F36] text-[#9FC2D6] py-10 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-black text-white text-xl">Zelo</span>
            <span className="text-[#5BD9DD] text-sm ml-2">Plataforma de NR-1</span>
          </div>
          <p className="text-sm text-center">
            Adequação baseada na Portaria MTE 1.419/2024 · Responsável técnica: Annie Talma Ferreira Coelho — CRP/05/44595
          </p>
          <Link href="/login" className="text-sm text-[#5BD9DD] hover:underline font-semibold">
            Acessar plataforma →
          </Link>
        </div>
      </footer>

    </div>
  )
}
