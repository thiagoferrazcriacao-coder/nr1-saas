'use client'

import { useState } from 'react'

export default function DemoEntryPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const enter = async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/demo/login', { method: 'POST' })
      if (!res.ok) throw new Error('Não foi possível preparar o ambiente.')
      window.location.href = '/painel'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível preparar o ambiente.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-5">
      <section className="w-full max-w-xl bg-white rounded-2xl border border-slate-200 shadow-sm p-7 sm:p-10">
        <div className="flex items-center gap-3 mb-7"><div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#17C3C9] to-[#3F7DE0] text-white flex items-center justify-center text-xl font-black">Z</div><div><p className="font-black text-xl">Zelo</p><p className="text-xs text-slate-500">Ambiente real de demonstração</p></div></div>
        <span className="text-xs font-black tracking-wider text-[#109CA1]">AMBIENTE ISOLADO</span>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">Entrar no Zelo como empresa demonstrativa</h1>
        <p className="text-slate-500 mt-3 leading-relaxed">Este acesso abre as páginas reais do painel em um ambiente fictício. A demonstração começa vazia e libera cada etapa progressivamente: você clica em um botão para preencher os dados da empresa, a avaliação do gestor e as respostas do time.</p>
        <div className="mt-6 rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800"><strong>Conta demonstrativa:</strong> Alvorada Serviços Industriais Ltda.<br /><span className="text-xs">Nenhuma informação pertence a uma empresa real.</span></div>
        <button onClick={enter} disabled={loading} className="mt-7 w-full px-5 py-3.5 rounded-xl bg-gradient-to-r from-[#17C3C9] to-[#3F7DE0] text-white font-bold disabled:opacity-50">{loading ? 'Preparando ambiente...' : 'Entrar nas páginas reais do Zelo →'}</button>
        {error && <p className="text-sm text-red-600 mt-4">{error}</p>}
        <p className="text-xs text-slate-400 mt-5 text-center">Após entrar, use o menu real do painel: Avaliação do Gestor, Avaliação do Time, Relatório, DRPS e Plano de Ação.</p>
      </section>
    </main>
  )
}
