'use client'

import { useEffect, useRef, useState } from 'react'

// Vitrine "Veja a plataforma por dentro": telas do produto trocando sozinhas,
// com moldura de navegador e transição suave. Passa por Diagnóstico, Plano de Ação e Biblioteca.

const TABS = [
  { key: 'diag', label: '📊 Diagnóstico', url: 'app.zelo.com.br/painel' },
  { key: 'plano', label: '🎯 Plano de Ação', url: 'app.zelo.com.br/plano-de-acao' },
  { key: 'bib', label: '🎓 Biblioteca de vídeos', url: 'app.zelo.com.br/material-didatico' },
] as const

const riskColor = { critico: '#dc2626', alto: '#ea580c', moderado: '#ca8a04', baixo: '#16a34a' }

export default function PlatformShowcase() {
  const [active, setActive] = useState(0)
  const paused = useRef(false)

  useEffect(() => {
    const id = setInterval(() => { if (!paused.current) setActive((a) => (a + 1) % TABS.length) }, 4500)
    return () => clearInterval(id)
  }, [])

  return (
    <div onMouseEnter={() => { paused.current = true }} onMouseLeave={() => { paused.current = false }}>
      {/* Abas */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {TABS.map((t, i) => (
          <button key={t.key} onClick={() => setActive(i)}
            className={`text-sm font-semibold px-4 py-2 rounded-full border transition-all ${active === i ? 'bg-gradient-to-r from-[#17C3C9] to-[#3F7DE0] text-white border-transparent shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:border-[#17C3C9] hover:text-[#109CA1]'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Moldura de navegador */}
      <div className="rounded-2xl border border-gray-200 shadow-2xl shadow-[#0E2A47]/20 overflow-hidden max-w-4xl mx-auto bg-white">
        <div className="bg-[#0E2A47] px-4 py-3 flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#ff5f57] inline-block" />
          <span className="w-3 h-3 rounded-full bg-[#febc2e] inline-block" />
          <span className="w-3 h-3 rounded-full bg-[#28c840] inline-block" />
          <div className="ml-3 flex-1 bg-white/10 rounded-md px-3 py-1 text-xs text-[#9FC2D6] truncate transition-all">{TABS[active].url}</div>
        </div>

        <div className="relative bg-[#F8FAFC] min-h-[420px]">
          <Screen show={active === 0}><Diagnostico /></Screen>
          <Screen show={active === 1}><PlanoDeAcao /></Screen>
          <Screen show={active === 2}><Biblioteca /></Screen>
        </div>
      </div>

      {/* Bolinhas de navegação */}
      <div className="flex justify-center gap-2 mt-5">
        {TABS.map((t, i) => (
          <button key={t.key} onClick={() => setActive(i)} aria-label={t.label}
            className={`h-2 rounded-full transition-all ${active === i ? 'w-7 bg-[#17C3C9]' : 'w-2 bg-gray-300 hover:bg-gray-400'}`} />
        ))}
      </div>
    </div>
  )
}

// Wrapper com transição de fade + leve slide
function Screen({ show, children }: { show: boolean; children: React.ReactNode }) {
  return (
    <div className={`absolute inset-0 p-5 sm:p-6 transition-all duration-500 ${show ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 translate-x-4 pointer-events-none'}`}>
      {children}
    </div>
  )
}

// ── Tela 1: Diagnóstico (13 riscos ordenados, com rank e mês) ────────────────
function Diagnostico() {
  const rows = [
    { r: 1, f: 'Baixa justiça organizacional', pct: 66, lvl: 'alto',     mes: 1 },
    { r: 2, f: 'Sobrecarga de trabalho',        pct: 62, lvl: 'alto',     mes: 2 },
    { r: 3, f: 'Assédio de qualquer natureza',  pct: 58, lvl: 'moderado', mes: 3 },
    { r: 4, f: 'Baixas recompensas',            pct: 47, lvl: 'moderado', mes: 4 },
    { r: 5, f: 'Suporte e apoio',               pct: 34, lvl: 'moderado', mes: 5 },
    { r: 6, f: 'Trabalho remoto e isolado',     pct: 18, lvl: 'baixo',    mes: 6 },
  ] as const
  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wide">Visão geral da empresa</p>
          <h3 className="text-lg font-black text-[#0E2A47]">Os 13 riscos psicossociais</h3>
        </div>
        <span className="text-xs font-bold px-3 py-1 rounded-lg bg-orange-50 text-orange-700 border border-orange-200">Do pior ao menos grave</span>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-2.5">
        {rows.map((row) => (
          <div key={row.r} className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-lg bg-[#0E2A47] text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">{row.r}º</span>
            <div className="w-40 sm:w-52 flex-shrink-0 min-w-0">
              <span className="block text-xs text-gray-700 truncate">{row.f}</span>
              <span className="block text-[10px] text-[#109CA1] font-semibold">🗓️ Mês {row.mes}</span>
            </div>
            <div className="flex-1 h-4 bg-gray-100 rounded-md overflow-hidden">
              <div className="h-full rounded-md transition-all duration-700" style={{ width: `${row.pct}%`, background: riskColor[row.lvl] }} />
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-4">
        <span className="bg-gradient-to-r from-[#17C3C9] to-[#3F7DE0] text-white text-xs font-semibold px-4 py-2 rounded-lg">📄 Gerar DRPS</span>
        <span className="bg-white border border-gray-200 text-[#0E2A47] text-xs font-semibold px-4 py-2 rounded-lg">📑 Anexo p/ PGR</span>
      </div>
    </div>
  )
}

// ── Tela 2: Plano de Ação (12 meses) ──────────────────────────────────────────
function PlanoDeAcao() {
  const meses = [
    { m: 1, mes: 'Julho/2026',    f: 'Baixa justiça organizacional', lvl: 'alto' },
    { m: 2, mes: 'Agosto/2026',   f: 'Sobrecarga de trabalho',        lvl: 'alto' },
    { m: 3, mes: 'Setembro/2026', f: 'Assédio de qualquer natureza',  lvl: 'moderado' },
    { m: 4, mes: 'Outubro/2026',  f: 'Baixas recompensas',            lvl: 'moderado' },
  ] as const
  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wide">Gestão viva · 12 meses</p>
          <h3 className="text-lg font-black text-[#0E2A47]">Plano de Ação por mês</h3>
        </div>
        <span className="text-xs font-bold px-3 py-1 rounded-lg bg-[#F0FBFC] text-[#109CA1] border border-[#CCEFF1]">🖱️ arraste para reordenar</span>
      </div>
      <div className="space-y-2">
        {meses.map((m, i) => (
          <div key={m.m} className={`bg-white rounded-xl border p-3 flex items-center gap-3 ${i === 0 ? 'border-[#17C3C9] ring-1 ring-[#17C3C9]/30' : 'border-gray-100'}`}>
            <span className="text-gray-300 text-lg select-none">⠿</span>
            <span className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#17C3C9] to-[#3F7DE0] text-white text-xs font-black flex flex-col items-center justify-center leading-none flex-shrink-0">
              <span className="text-[8px] opacity-80">MÊS</span>{m.m}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-[#0E2A47] truncate">Mês {m.m} ({m.mes})</p>
              <p className="text-[11px] text-gray-500 truncate">{m.f}</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded border flex-shrink-0" style={{ color: riskColor[m.lvl], borderColor: `${riskColor[m.lvl]}55`, background: `${riskColor[m.lvl]}0d` }}>{m.lvl === 'alto' ? 'Alto' : 'Médio'}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-4">
        <span className="bg-[#0E2A47] text-white text-xs font-semibold px-4 py-2 rounded-lg">📎 Anexar evidências</span>
        <span className="bg-white border border-gray-200 text-[#0E2A47] text-xs font-semibold px-4 py-2 rounded-lg">📄 Gerar ata</span>
      </div>
    </div>
  )
}

// ── Tela 3: Biblioteca de vídeos ─────────────────────────────────────────────
function Biblioteca() {
  const videos = [
    { t: 'Assédio: dever de apurar e provar', a: 'Rafael', trilha: 'Gestor',      pct: 100 },
    { t: 'Liderança que previne o assédio',   a: 'Rafael', trilha: 'Gestor',      pct: 70 },
    { t: 'Reconhecer o que se está vivendo',  a: 'Annie',  trilha: 'Colaborador', pct: 100 },
    { t: 'Como relatar com segurança',        a: 'Thiago', trilha: 'Colaborador', pct: 40 },
  ] as const
  const authorColor: Record<string, string> = { Rafael: '#4B5CC9', Annie: '#0E8F95', Thiago: '#0E2A47' }
  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wide">Treinamentos com comprovação</p>
          <h3 className="text-lg font-black text-[#0E2A47]">Biblioteca de vídeos e ebooks</h3>
        </div>
        <span className="text-xs font-bold px-3 py-1 rounded-lg bg-green-50 text-green-700 border border-green-200">✅ registra quem assistiu</span>
      </div>
      <div className="grid sm:grid-cols-2 gap-2.5">
        {videos.map((v, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-3 flex gap-3 items-center">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-lg ${v.pct >= 90 ? 'bg-green-50' : 'bg-blue-50'}`}>{v.pct >= 90 ? '✅' : '▶️'}</div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-[#0E2A47] truncate">{v.t}</p>
              <p className="text-[10px] mt-0.5">
                <span style={{ color: authorColor[v.a], fontWeight: 700 }}>{v.a}</span>
                <span className="text-gray-400"> · {v.trilha}</span>
              </p>
              <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${v.pct}%`, background: v.pct >= 90 ? '#22c55e' : '#17C3C9' }} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 bg-[#F0FBFC] border border-[#CCEFF1] rounded-lg px-3 py-2 text-[11px] text-[#0E2A47]">
        📊 Relatório mostra <strong>quem assistiu e quem não assistiu</strong> — a prova auditável para a fiscalização.
      </div>
    </div>
  )
}
