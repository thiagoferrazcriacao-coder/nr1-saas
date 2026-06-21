import Link from 'next/link'

export const metadata = {
  title: 'Obrigado! — Zelo',
  description: 'Sua contratação foi concluída. Crie seu acesso e comece a adequação à NR-1.',
}

export default function ObrigadoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F0FBFC] to-white text-[#0E2A47] flex flex-col">
      <header className="px-4 py-4">
        <div className="max-w-5xl mx-auto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-zelo-3.png" alt="Zelo" className="h-12 w-auto" />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-[#0E2A47]/10 p-8 sm:p-10 max-w-lg w-full text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#17C3C9] to-[#3F7DE0] flex items-center justify-center text-3xl mx-auto mb-5">
            ✓
          </div>
          <h1 className="text-2xl sm:text-3xl font-black mb-3">Tudo certo! Bem-vindo ao Zelo 🎉</h1>
          <p className="text-gray-500 mb-6 leading-relaxed">
            Sua contratação foi concluída. Agora é só criar o seu acesso para começar a adequação da sua empresa à NR-1 —
            cadastrar setores, coletar as respostas e gerar os documentos.
          </p>

          <div className="bg-[#F6F9FC] rounded-2xl p-5 mb-6 text-left">
            <p className="text-sm font-semibold text-[#0E2A47] mb-3">Seus próximos passos:</p>
            <ol className="space-y-2 text-sm text-gray-600">
              {[
                'Crie seu acesso à plataforma',
                'Preencha a Avaliação do Gestor',
                'Gere os links e envie ao seu time',
                'Baixe o DRPS e os documentos prontos',
              ].map((s, i) => (
                <li key={s} className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-r from-[#17C3C9] to-[#3F7DE0] text-white text-xs flex items-center justify-center">{i + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
          </div>

          <Link href="/cadastro"
            className="block text-center bg-gradient-to-r from-[#17C3C9] to-[#3F7DE0] text-white px-6 py-3.5 rounded-xl font-bold text-lg hover:opacity-90 transition-opacity shadow-lg shadow-[#17C3C9]/25">
            Criar meu acesso →
          </Link>
          <p className="text-sm text-gray-400 mt-4">
            Já tem conta? <Link href="/login" className="text-[#109CA1] font-semibold hover:underline">Entrar</Link>
          </p>
        </div>
      </main>
    </div>
  )
}
