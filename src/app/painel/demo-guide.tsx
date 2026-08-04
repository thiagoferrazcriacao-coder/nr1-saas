'use client'

import { useEffect, useState } from 'react'

export default function DemoGuide({ companyConfigured, assessmentDone, teamLinkSent }: { companyConfigured: boolean; assessmentDone: boolean; teamLinkSent: boolean }) {
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState('')
  const [learnLinks, setLearnLinks] = useState<{ colaborador: string; gestor: string }>({ colaborador: '', gestor: '' })

  useEffect(() => {
    fetch('/api/dashboard/material/report')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (!d?.slug) return
        const origin = window.location.origin
        setLearnLinks({ colaborador: `${origin}/aprender/${d.slug}?demo=1`, gestor: d.gestorCode ? `${origin}/aprender/${d.gestorCode}?demo=1` : '' })
      })
      .catch(() => {})
  }, [])

  const fill = async (step: string) => {
    setBusy(step); setMessage('')
    try {
      const res = await fetch('/api/demo/step', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ step }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Não foi possível preencher.')
      setMessage('Etapa preenchida. Atualizando…')
      window.location.reload()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível preencher.')
      setBusy('')
    }
  }

  return (
    <div className="sticky top-0 z-40 bg-[#0E2A47] text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center gap-2">
        <span className="text-xs font-black tracking-wide text-cyan-200 mr-1">🎬 MODO DEMONSTRAÇÃO</span>
        <button onClick={() => fill('empresa')} disabled={!!busy || companyConfigured} className="text-xs px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed">🏢 {busy === 'empresa' ? 'Preenchendo…' : 'Preencher empresa'}</button>
        <button onClick={() => fill('gestor')} disabled={!!busy || !companyConfigured || assessmentDone} className="text-xs px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed">📋 {busy === 'gestor' ? 'Preenchendo…' : 'Preencher gestor'}</button>
        <button onClick={() => fill('time')} disabled={!!busy || !assessmentDone} className="text-xs px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed">📨 {busy === 'time' ? 'Atualizando…' : teamLinkSent ? 'Atualizar resultados' : 'Preencher respostas do time'}</button>
        {learnLinks.gestor && <button onClick={() => window.open(learnLinks.gestor, '_blank', 'noopener,noreferrer')} className="text-xs px-3 py-2 rounded-lg bg-indigo-500/80 hover:bg-indigo-500">👔 Tela do gestor</button>}
        {learnLinks.colaborador && <button onClick={() => window.open(learnLinks.colaborador, '_blank', 'noopener,noreferrer')} className="text-xs px-3 py-2 rounded-lg bg-emerald-500/80 hover:bg-emerald-500">🎓 Tela do funcionário</button>}
        <button onClick={() => { window.location.href = '/demo' }} disabled={!!busy} className="text-xs px-3 py-2 rounded-lg bg-rose-500/80 hover:bg-rose-500 disabled:opacity-40">↺ Zerar demo</button>
        {message && <span className="text-xs text-cyan-100 ml-auto">{message}</span>}
      </div>
    </div>
  )
}
