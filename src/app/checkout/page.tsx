import Link from 'next/link'

export const metadata = {
  title: 'Checkout — Zelo',
  description: 'Finalize a contratação da adequação à NR-1 com o Zelo.',
}

type Plan = { faixa: string; valor: string; economia: string; consulta?: boolean }

const PLANS: Record<string, Plan> = {
  'ate-10':    { faixa: 'Até 10 colaboradores CLT',     valor: 'R$ 1.497', economia: 'Poupa até R$ 5.211 vs. 1 multa' },
  '11-30':     { faixa: '11 a 30 colaboradores CLT',    valor: 'R$ 1.997', economia: 'Poupa até R$ 4.711 vs. 1 multa' },
  '31-50':     { faixa: '31 a 50 colaboradores CLT',    valor: 'R$ 2.497', economia: 'Poupa até R$ 4.211 vs. 1 multa' },
  '51-100':    { faixa: '51 a 100 colaboradores CLT',   valor: 'R$ 2.997', economia: 'Poupa até R$ 3.711 vs. 1 multa' },
  'acima-100': { faixa: 'Acima de 100 colaboradores',   valor: 'Sob consulta', economia: 'Condição especial', consulta: true },
}

const INCLUI = [
  'DRPS — laudo assinado por psicóloga (CRP)',
  'Inventário de Riscos por setor',
  'Matriz de Risco NR-1',
  'PGR — Programa de Gerenciamento de Riscos',
  'Plano de Ação com prazos e responsáveis',
  'Treinamentos em vídeo com comprovação',
  'Suporte incluso',
]

export default function CheckoutPage({ searchParams }: { searchParams: { plano?: string } }) {
  const plan = (searchParams.plano && PLANS[searchParams.plano]) || PLANS['11-30']

  return (
    <div className="min-h-screen bg-[#F6F9FC] text-[#0E2A47]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-zelo-3.png" alt="Zelo" className="h-12 w-auto" />
          </Link>
          <Link href="/#precos" className="text-sm text-gray-500 hover:text-[#0E2A47]">← Voltar aos planos</Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-[#F0FBFC] text-[#109CA1] text-xs font-bold px-3 py-1 rounded-full mb-3">🔒 CHECKOUT SEGURO</div>
          <h1 className="text-2xl sm:text-3xl font-black">Falta pouco para sua empresa ficar em conformidade</h1>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Resumo do pedido */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-lg mb-4">Resumo do pedido</h2>
            <div className="bg-[#F6F9FC] rounded-xl p-4 mb-4">
              <p className="text-sm text-gray-500">Adequação NR-1 completa</p>
              <p className="font-bold text-[#0E2A47]">{plan.faixa}</p>
              <div className="flex items-end justify-between mt-3">
                <span className="text-3xl font-black text-[#0E2A47]">{plan.valor}</span>
                {!plan.consulta && <span className="text-xs text-gray-400">pagamento único</span>}
              </div>
              <div className="mt-2 inline-flex items-center gap-1 bg-[#F0FBFC] text-[#109CA1] text-xs font-bold px-2.5 py-1 rounded-lg">💸 {plan.economia}</div>
            </div>
            <p className="text-sm font-semibold text-gray-500 mb-2">Está incluído:</p>
            <ul className="space-y-1.5">
              {INCLUI.map((i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-[#17C3C9] font-bold">✓</span> {i}
                </li>
              ))}
            </ul>
          </div>

          {/* Pagamento */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            {plan.consulta ? (
              <>
                <h2 className="font-bold text-lg mb-3">Plano personalizado</h2>
                <p className="text-gray-500 text-sm mb-5">
                  Para empresas acima de 100 colaboradores, montamos uma proposta sob medida. Nossa equipe entra em contato para alinhar tudo.
                </p>
                <a href="mailto:contato@zelo.com.br?subject=Proposta%20Zelo%20-%20acima%20de%20100%20colaboradores"
                  className="block text-center bg-gradient-to-r from-[#17C3C9] to-[#3F7DE0] text-white px-6 py-3.5 rounded-xl font-bold hover:opacity-90 transition-opacity">
                  Solicitar proposta →
                </a>
              </>
            ) : (
              <>
                <h2 className="font-bold text-lg mb-3">Pagamento</h2>
                <div className="bg-[#FFF9F0] border border-[#FFE3B3] rounded-xl p-4 text-sm text-[#8A5A00] mb-5">
                  💳 A finalização do pagamento (cartão e Pix) está sendo integrada. Em breve você conclui a compra aqui mesmo, com toda a segurança.
                </div>
                <div className="space-y-3 mb-5 opacity-60 pointer-events-none select-none">
                  <div className="h-11 rounded-xl border border-gray-200 bg-gray-50 flex items-center px-4 text-sm text-gray-400">Número do cartão</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-11 rounded-xl border border-gray-200 bg-gray-50 flex items-center px-4 text-sm text-gray-400">Validade</div>
                    <div className="h-11 rounded-xl border border-gray-200 bg-gray-50 flex items-center px-4 text-sm text-gray-400">CVV</div>
                  </div>
                </div>
                <Link href={`/obrigado?plano=${searchParams.plano ?? '11-30'}`}
                  className="block text-center bg-gradient-to-r from-[#17C3C9] to-[#3F7DE0] text-white px-6 py-3.5 rounded-xl font-bold hover:opacity-90 transition-opacity">
                  Finalizar e liberar acesso →
                </Link>
                <p className="text-center text-xs text-gray-400 mt-3">🔒 Ambiente seguro · Seus dados são protegidos</p>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
