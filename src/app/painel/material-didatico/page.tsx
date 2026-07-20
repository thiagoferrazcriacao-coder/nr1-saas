'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { FACTOR_NAMES, FACTOR_NUMS, FACTOR_WEIGHT, slotsFor, type Trilha as SlotTrilha } from '@/lib/video-index'
import MateriaisExtras from './MateriaisExtras'

type Trilha = SlotTrilha
type Lesson = { id: string; programNum: number; program: string; trilha: Trilha; videoRef: string | null; title: string; description: string | null; videoUrl: string }
type GestorProgress = Record<string, { percent: number; completed: boolean }>
type PerLesson = { lessonId: string; title: string; program: string; programNum: number; percent: number; completed: boolean; updatedAt: string | null }
type EmployeeRow = { email: string; name: string | null; cpf: string | null; phone: string | null; role: 'gestor' | 'colaborador'; totalLessons: number; avgPercent: number; completedCount: number; activeCount: number; perLesson: PerLesson[] }
type Report = { slug: string; gestorCode?: string; totalLessons: number; lessons: { id: string; title: string; program: string; programNum: number }[]; employees: EmployeeRow[]; period: { from: string | null; to: string | null } }

const PERIODS = [
  { label: 'Últimos 7 dias',  days: 7 },
  { label: 'Últimos 30 dias', days: 30 },
  { label: 'Últimos 3 meses', days: 90 },
  { label: 'Últimos 6 meses', days: 180 },
  { label: 'Todo o período',  days: 0 },
]

function periodToUrl(days: number) {
  if (!days) return '/api/dashboard/material/report'
  const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  return `/api/dashboard/material/report?from=${encodeURIComponent(from)}`
}

export default function MaterialDidaticoPage() {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [gestorProgress, setGestorProgress] = useState<GestorProgress>({})
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [reportLoading, setReportLoading] = useState(false)
  const [linkOpen, setLinkOpen] = useState(false)
  const [open, setOpen] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null) // `${trilha}-${num}`
  const [activeTrilha, setActiveTrilha] = useState<Trilha>('gestor')
  const [video, setVideo] = useState<Lesson | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState(1)

  const fetchLessons = useCallback(() => {
    fetch('/api/dashboard/material/lessons')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) { setLessons(d.lessons ?? []); setGestorProgress(d.gestorProgress ?? {}) } })
      .finally(() => setLoading(false))
  }, [])

  const fetchReport = useCallback((periodIdx: number) => {
    setReportLoading(true)
    fetch(periodToUrl(PERIODS[periodIdx].days))
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setReport(d) })
      .finally(() => setReportLoading(false))
  }, [])

  useEffect(() => { fetchLessons(); fetchReport(selectedPeriod) }, [fetchLessons, fetchReport, selectedPeriod])

  const handlePeriodChange = (idx: number) => { setSelectedPeriod(idx); fetchReport(idx) }

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const link = report ? `${origin}/aprender/${report.slug}` : ''
  const gestorLink = report?.gestorCode ? `${origin}/aprender/${report.gestorCode}` : ''
  const [copiedWhich, setCopiedWhich] = useState<'colab' | 'gestor' | null>(null)
  const copyLink = async (url: string, which: 'colab' | 'gestor') => { try { await navigator.clipboard.writeText(url); setCopiedWhich(which); setTimeout(() => setCopiedWhich(null), 2000) } catch {} }
  const barColor = (p: number) => (p >= 90 ? '#16a34a' : p >= 40 ? '#2563eb' : p > 0 ? '#ca8a04' : '#cbd5e1')

  // Salva a comprovação do gestor (trilha do gestor). Só sobe.
  const saveGestorProgress = useCallback((lessonId: string, percent: number) => {
    setGestorProgress((prev) => {
      const cur = prev[lessonId]?.percent ?? 0
      if (percent <= cur) return prev
      return { ...prev, [lessonId]: { percent, completed: percent >= 90 } }
    })
    fetch('/api/dashboard/material/gestor-progress', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId, percent }),
    }).catch(() => {})
  }, [])

  const exportCsv = () => {
    if (!report) return
    const periodLabel = PERIODS[selectedPeriod].label
    const header = ['Nome', 'Papel', 'CPF', 'WhatsApp', 'E-mail', 'Período', 'Aulas com atividade', 'Concluídas (90%+)', 'Média geral (%)', ...report.lessons.map((l) => `${l.program} — ${l.title} (%)`)]
    const rows = report.employees.map((e) => [
      e.name ?? '', e.role === 'gestor' ? 'Gestor' : 'Colaborador', e.cpf ?? '', e.phone ?? '', e.email, periodLabel, String(e.activeCount), String(e.completedCount), String(e.avgPercent),
      ...report.lessons.map((l) => String(e.perLesson.find((p) => p.lessonId === l.id)?.percent ?? 0)),
    ])
    const csv = [header, ...rows].map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'relatorio-material-didatico.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return <div className="flex justify-center py-24"><div className="w-10 h-10 border-4 border-primary-800 border-t-transparent rounded-full animate-spin" /></div>
  }

  // Cores por autor e peso do fator
  const authorColor: Record<string, string> = { Rafael: '#4B5CC9', Annie: '#0E8F95', Thiago: '#0E2A47' }
  const weightCls: Record<string, string> = { ALTO: 'bg-red-50 text-red-600 border-red-200', 'MÉDIO': 'bg-amber-50 text-amber-700 border-amber-200', BAIXO: 'bg-green-50 text-green-700 border-green-200' }

  // Material Didático liberado só a partir de 27/07/2026 — até lá, mostra apenas o aviso
  const RELEASE_DATE = new Date('2026-07-27T00:00:00-03:00')
  const locked = Date.now() < RELEASE_DATE.getTime()

  // Quantos vídeos da trilha já estão no ar (vinculados por videoRef) x total planejado.
  const trilhaCount = (trilha: Trilha) => {
    const refs = new Set(lessons.filter((l) => l.videoRef).map((l) => l.videoRef as string))
    let filled = 0, total = 0
    FACTOR_NUMS.forEach((num) => slotsFor(num, trilha).forEach((s) => { total++; if (refs.has(s.key)) filled++ }))
    return { filled, total }
  }

  // Renderiza o catálogo (13 fatores) de uma trilha, com as aulas planejadas do Índice de Vídeos.
  // Cada aula toca se o vídeo já foi publicado (vinculado por videoRef); senão, mostra "em breve".
  const renderTrilha = (trilha: Trilha) => {
    const byRef = new Map(lessons.filter((l) => l.videoRef).map((l) => [l.videoRef as string, l]))
    return (
      <div className="space-y-2.5">
        {FACTOR_NUMS.map((num) => {
          const slots = slotsFor(num, trilha)
          const key = `${trilha}-${num}`
          const isExpanded = expanded === key
          const filled = slots.filter((s) => byRef.has(s.key))
          const doneCount = trilha === 'gestor' ? filled.filter((s) => gestorProgress[byRef.get(s.key)!.id]?.completed).length : 0
          const w = FACTOR_WEIGHT[num]
          return (
            <div key={key} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <button onClick={() => setExpanded(isExpanded ? null : key)} className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-gray-50 transition-colors text-left">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#17C3C9] to-[#3F7DE0] text-white text-sm font-black flex items-center justify-center flex-shrink-0">{num}</span>
                  <div className="min-w-0">
                    <p className="font-bold text-[#0E2A47] truncate">{FACTOR_NAMES[num]}</p>
                    <p className="text-xs text-gray-400 mt-0.5">🎬 {filled.length}/{slots.length} disponível{filled.length !== 1 ? 'is' : ''}{trilha === 'gestor' && doneCount > 0 ? ` · ✅ ${doneCount} concluída${doneCount !== 1 ? 's' : ''}` : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${weightCls[w]}`}>{w}</span>
                  <span className={`text-gray-400 text-xs transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                </div>
              </button>
              {isExpanded && (
                <div className="border-t border-gray-100 divide-y divide-gray-50">
                  {slots.map((s, i) => {
                    const lesson = byRef.get(s.key)
                    const gp = lesson ? gestorProgress[lesson.id] : undefined
                    return (
                      <div key={s.key} className="px-5 py-3.5">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="w-8 h-8 rounded-lg bg-[#F0FBFC] text-[#109CA1] text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-800">{s.title}</p>
                              <p className="text-[11px] mt-0.5"><span style={{ color: authorColor[s.author], fontWeight: 700 }}>{s.author}</span> <span className="text-gray-400">· {s.camada}</span></p>
                            </div>
                          </div>
                          {lesson ? (
                            <button onClick={() => setVideo(lesson)} className="flex-shrink-0 flex items-center gap-1.5 bg-gradient-to-r from-[#17C3C9] to-[#3F7DE0] text-white text-xs font-semibold px-3.5 py-2 rounded-lg hover:opacity-90 transition-opacity">▶ Assistir</button>
                          ) : (
                            <span className="flex-shrink-0 text-[11px] font-semibold text-gray-400 bg-gray-50 border border-gray-100 px-3 py-2 rounded-lg">em breve</span>
                          )}
                        </div>
                        {trilha === 'gestor' && lesson && (
                          <div className="flex items-center gap-2 mt-2 pl-11">
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${gp?.percent ?? 0}%`, background: barColor(gp?.percent ?? 0) }} /></div>
                            <span className={`text-[11px] font-semibold w-20 text-right ${gp?.completed ? 'text-green-600' : gp?.percent ? 'text-yellow-600' : 'text-gray-400'}`}>{gp?.completed ? '✅ Concluído' : gp?.percent ? `${gp.percent}%` : 'não assistido'}</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Material Didático</h1>
          <p className="text-gray-500 mt-1">Vídeo-aulas da NR-1 em duas trilhas: uma para você (gestor) e uma para o seu time.</p>
        </div>
        <button onClick={() => setLinkOpen((v) => !v)} className="flex-shrink-0 bg-gradient-to-r from-[#17C3C9] to-[#3F7DE0] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity">
          📤 Links de acesso
        </button>
      </div>

      {!locked && (
        <div className="bg-[#F0FBFC] border border-[#CCEFF1] rounded-2xl p-4 flex items-start gap-3">
          <span className="text-xl flex-shrink-0">🎬</span>
          <div>
            <p className="font-bold text-[#0E2A47] text-sm">Conteúdo liberado</p>
            <p className="text-gray-500 text-sm mt-0.5">As vídeo-aulas e os materiais da NR-1 já estão disponíveis nas trilhas abaixo.</p>
          </div>
        </div>
      )}

      {linkOpen && (
        <div className="bg-[#F0FBFC] border border-[#CCEFF1] rounded-2xl p-4 space-y-4">
          <p className="text-xs text-[#0E2A47]">Cada pessoa cria a própria conta (nome, CPF, WhatsApp, e-mail e senha) e a presença fica registrada nas comprovações abaixo. São <strong>dois links</strong> — mande o certo para cada público:</p>

          {/* Link do colaborador */}
          <div>
            <p className="text-sm text-[#0E2A47] font-medium mb-2">👥 <strong>Trilha do Colaborador</strong> — para o time:</p>
            <div className="flex items-center gap-2 flex-wrap">
              <input readOnly value={link} onFocus={(e) => e.target.select()} className="flex-1 min-w-0 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 font-mono" />
              <button onClick={() => copyLink(link, 'colab')} className="flex-shrink-0 bg-primary-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-primary-700 transition-colors">{copiedWhich === 'colab' ? '✅ Copiado' : '📋 Copiar'}</button>
              <a href={link} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 bg-white text-primary-800 border border-primary-200 text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">Abrir</a>
            </div>
          </div>

          {/* Link do gestor/líder */}
          {gestorLink && (
            <div>
              <p className="text-sm text-[#0E2A47] font-medium mb-2">👔 <strong>Trilha do Gestor</strong> — para líderes, gerentes e donos:</p>
              <div className="flex items-center gap-2 flex-wrap">
                <input readOnly value={gestorLink} onFocus={(e) => e.target.select()} className="flex-1 min-w-0 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 font-mono" />
                <button onClick={() => copyLink(gestorLink, 'gestor')} className="flex-shrink-0 bg-indigo-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-indigo-500 transition-colors">{copiedWhich === 'gestor' ? '✅ Copiado' : '📋 Copiar'}</button>
                <a href={gestorLink} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 bg-white text-indigo-600 border border-indigo-200 text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">Abrir</a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Trava até 27/07/2026 — mostra apenas o aviso, sem nenhuma trilha */}
      {locked && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-10 text-center">
          <div className="text-5xl mb-3">🔒</div>
          <h2 className="text-xl font-black text-[#0E2A47]">Material Didático em breve</h2>
          <p className="text-gray-600 mt-2 max-w-md mx-auto">A partir do dia <strong>27/07/2026</strong>, o material didático estará liberado.</p>
        </div>
      )}

      {/* SELETOR DE TRILHA — escolhe uma trilha por vez pra não poluir a tela */}
      {!locked && (
      <div>
        <div className="grid grid-cols-2 gap-3 mb-5">
          {([
            { t: 'gestor' as Trilha, icon: '👔', title: 'Trilha do Gestor', sub: 'Para você', active: 'border-indigo-300 bg-indigo-50', dot: 'bg-indigo-500' },
            { t: 'colaborador' as Trilha, icon: '👥', title: 'Trilha do Colaborador', sub: 'Para o seu time', active: 'border-teal-300 bg-teal-50', dot: 'bg-teal-500' },
          ]).map((tab) => {
            const done = trilhaCount(tab.t)
            const isActive = activeTrilha === tab.t
            return (
              <button key={tab.t} onClick={() => { setActiveTrilha(tab.t); setExpanded(null) }}
                className={`text-left rounded-2xl border-2 px-5 py-4 transition-all ${isActive ? `${tab.active} shadow-sm` : 'border-gray-100 bg-white hover:border-gray-200'}`}>
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{tab.icon}</span>
                  <div className="min-w-0">
                    <p className="font-bold text-[#0E2A47] leading-tight">{tab.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{tab.sub}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-3">
                  <span className={`w-1.5 h-1.5 rounded-full ${done.filled > 0 ? tab.dot : 'bg-gray-300'}`} />
                  <span className="text-xs font-semibold text-gray-600">{done.filled}/{done.total} vídeos no ar</span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Descrição da trilha ativa */}
        {activeTrilha === 'gestor' ? (
          <div className="flex items-start gap-2.5 mb-4 bg-indigo-50/60 border border-indigo-100 rounded-xl px-4 py-3">
            <span className="text-base flex-shrink-0">👔</span>
            <p className="text-sm text-[#0E2A47]">Os vídeos que <strong>você</strong> precisa assistir. A barra abaixo de cada aula <strong>comprova</strong> que a liderança fez o treinamento.</p>
          </div>
        ) : (
          <div className="flex items-start gap-2.5 mb-4 bg-teal-50/60 border border-teal-100 rounded-xl px-4 py-3">
            <span className="text-base flex-shrink-0">👥</span>
            <p className="text-sm text-[#0E2A47]">Os vídeos que o seu time assiste pelo link. Você pode conferir aqui — mas <strong>esta visualização não conta</strong> como presença. A presença dos colaboradores aparece no relatório abaixo.</p>
          </div>
        )}

        {/* Abra cada fator pra ver as aulas */}
        <p className="text-xs text-gray-400 mb-2.5 pl-1">Toque num fator de risco para abrir as aulas 👇</p>
        {renderTrilha(activeTrilha)}
      </div>
      )}

      {/* Materiais complementares (ebooks oficiais + extras do gestor) */}
      {!locked && <MateriaisExtras />}

      {/* Relatório de presença dos colaboradores */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🧾</span>
            <div>
              <h2 className="font-bold text-gray-900">Comprovações de treinamento (gestores e colaboradores)</h2>
              <p className="text-gray-500 text-sm mt-1">Clique numa pessoa para ver aula por aula. Concluído = 90% ou mais. O CPF confirma quem assistiu.</p>
            </div>
          </div>
          {report && report.employees.length > 0 && (
            <button onClick={exportCsv} className="flex-shrink-0 flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded-xl transition-colors">⬇ Exportar CSV</button>
          )}
        </div>

        <div className="flex gap-2 flex-wrap mb-5">
          {PERIODS.map((p, i) => (
            <button key={i} onClick={() => handlePeriodChange(i)} className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${selectedPeriod === i ? 'bg-[#17C3C9] border-[#17C3C9] text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-[#17C3C9] hover:text-[#17C3C9]'}`}>{p.label}</button>
          ))}
        </div>

        {reportLoading ? (
          <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-[#17C3C9] border-t-transparent rounded-full animate-spin" /></div>
        ) : !report || report.employees.length === 0 ? (
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-8 text-center"><p className="text-gray-500 text-sm">Nenhum colaborador entrou ainda. Use o botão &quot;Enviar para colaboradores&quot; lá em cima.</p></div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-[#F0FBFC] rounded-xl p-3 text-center"><p className="text-2xl font-black text-[#109CA1]">{report.employees.length}</p><p className="text-xs text-gray-500 mt-0.5">pessoas (gestores + time)</p></div>
              <div className="bg-[#F0FBFC] rounded-xl p-3 text-center"><p className="text-2xl font-black text-[#109CA1]">{report.employees.filter((e) => e.activeCount > 0).length}</p><p className="text-xs text-gray-500 mt-0.5">ativos no período</p></div>
              <div className="bg-[#F0FBFC] rounded-xl p-3 text-center"><p className="text-2xl font-black text-[#109CA1]">{report.employees.reduce((s, e) => s + e.completedCount, 0)}</p><p className="text-xs text-gray-500 mt-0.5">conclusões (90%+)</p></div>
            </div>

            <div className="space-y-2">
              {report.employees.map((e) => {
                const isOpen = open === e.email
                return (
                  <div key={e.email} className="border border-gray-100 rounded-xl overflow-hidden">
                    <button onClick={() => setOpen(isOpen ? null : e.email)} className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${e.role === 'gestor' ? 'bg-indigo-50 text-indigo-600' : 'bg-teal-50 text-teal-700'}`}>{e.role === 'gestor' ? '👔 Gestor' : '👥 Colab.'}</span>
                          <p className="font-semibold text-gray-800 truncate">{e.name || e.email}</p>
                        </div>
                        <p className="text-xs text-gray-400 truncate">{e.email}{e.cpf ? ` · CPF ${e.cpf}` : ''}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {e.activeCount === 0 && <span className="text-xs text-gray-400 italic">sem atividade</span>}
                        <div className="text-right">
                          <span className="text-xs text-gray-400">{e.completedCount}/{e.totalLessons} concluídos</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${e.avgPercent}%`, background: barColor(e.avgPercent) }} /></div>
                            <span className="text-sm font-bold text-gray-700 w-10 text-right">{e.avgPercent}%</span>
                          </div>
                        </div>
                        <span className="text-gray-300 text-sm">{isOpen ? '▲' : '▼'}</span>
                      </div>
                    </button>
                    {isOpen && (
                      <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-3 space-y-1.5">
                        {e.perLesson.length === 0 ? (
                          <p className="text-xs text-gray-400">Nenhuma aula disponível ainda.</p>
                        ) : e.perLesson.map((l) => (
                          <div key={l.lessonId} className="flex items-center justify-between gap-3">
                            <p className="text-sm text-gray-600 truncate min-w-0"><span className="text-gray-400">{l.program} · </span>{l.title}</p>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${l.percent}%`, background: barColor(l.percent) }} /></div>
                              <span className={`text-xs font-semibold w-16 text-right ${l.completed ? 'text-green-600' : l.percent > 0 ? 'text-yellow-600' : 'text-gray-400'}`}>{l.completed ? '✅ 90%+' : l.percent > 0 ? `${l.percent}%` : '—'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Player */}
      {video && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setVideo(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-gray-100">
              <div className="min-w-0">
                <p className="text-xs text-[#109CA1] font-bold">{video.program} · {video.trilha === 'gestor' ? 'Trilha do Gestor' : 'Trilha do Colaborador'}</p>
                <h3 className="font-bold text-gray-900 truncate">{video.title}</h3>
              </div>
              <button onClick={() => setVideo(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none flex-shrink-0">×</button>
            </div>
            <LockedPlayer key={video.id} src={video.videoUrl} onProgress={video.trilha === 'gestor' ? (pct) => saveGestorProgress(video.id, pct) : undefined} />
            {video.description && <p className="px-5 py-4 text-sm text-gray-600">{video.description}</p>}
            <div className="px-5 py-3 bg-[#F0FBFC] border-t border-[#CCEFF1]">
              {video.trilha === 'gestor' ? (
                <p className="text-xs text-[#0E2A47]">✅ Esta é a <strong>sua</strong> trilha — o quanto você assistir fica registrado como comprovação de que a liderança fez o treinamento.</p>
              ) : (
                <p className="text-xs text-[#0E2A47]">👀 Você está assistindo como gestor — esta visualização <strong>não</strong> entra na contagem de presença dos colaboradores.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Player com trava: sem adiantar (só rever) e sem acelerar.
// onProgress (opcional) é chamado com o maior % já assistido — usado para comprovar a trilha do gestor.
function LockedPlayer({ src, onProgress }: { src: string; onProgress?: (pct: number) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const maxWatched = useRef(0)
  const dragging = useRef(false)
  const lastSaved = useRef(0)      // último % enviado
  const lastSaveAt = useRef(0)     // timestamp do último envio
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [cur, setCur] = useState(0)
  const [dur, setDur] = useState(0)
  const [maxSec, setMaxSec] = useState(0)

  const fmt = (s: number) => { if (!isFinite(s) || s < 0) return '0:00'; const m = Math.floor(s / 60); const ss = Math.floor(s % 60); return `${m}:${ss < 10 ? '0' : ''}${ss}` }
  const lockRate = () => { const v = videoRef.current; if (v && v.playbackRate !== 1) v.playbackRate = 1 }
  const togglePlay = () => { const v = videoRef.current; if (!v) return; if (v.paused) void v.play(); else v.pause() }
  const toggleMute = () => { const v = videoRef.current; if (!v) return; v.muted = !v.muted; setMuted(v.muted) }
  const toggleFs = () => { const el = wrapRef.current; if (!el) return; if (document.fullscreenElement) void document.exitFullscreen(); else void el.requestFullscreen?.() }
  const onLoaded = () => { const v = videoRef.current; if (!v || !v.duration) return; v.playbackRate = 1; setDur(v.duration); setMuted(v.muted) }
  const onSeeking = () => { const v = videoRef.current; if (!v) return; if (v.currentTime > maxWatched.current + 1.5) { try { v.currentTime = maxWatched.current } catch {} } }

  const pct = () => { const v = videoRef.current; if (!v || !v.duration) return 0; return Math.min(100, Math.round((maxWatched.current / v.duration) * 100)) }
  const flush = useCallback((force = false) => {
    if (!onProgress) return
    const p = pct()
    const now = Date.now()
    if (force || (p >= lastSaved.current + 2 && now - lastSaveAt.current > 2500)) {
      lastSaved.current = p; lastSaveAt.current = now; onProgress(p)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onProgress])

  const onTime = () => {
    const v = videoRef.current; if (!v) return
    if (v.playbackRate !== 1) v.playbackRate = 1
    if (v.currentTime > maxWatched.current) { maxWatched.current = v.currentTime; setMaxSec(v.currentTime) }
    setCur(v.currentTime)
    flush(false)
  }

  // Salva ao sair da aba / desmontar
  useEffect(() => {
    const onHide = () => { if (document.visibilityState === 'hidden') flush(true) }
    document.addEventListener('visibilitychange', onHide)
    return () => { document.removeEventListener('visibilitychange', onHide); flush(true) }
  }, [flush])

  const seekFromX = (clientX: number) => {
    const el = barRef.current, v = videoRef.current
    if (!el || !v || !v.duration) return
    const rect = el.getBoundingClientRect()
    const frac = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const target = Math.min(frac * v.duration, maxWatched.current)
    try { v.currentTime = target } catch {}
    setCur(target)
  }
  const onDown = (e: React.PointerEvent) => { dragging.current = true; try { (e.currentTarget as Element).setPointerCapture(e.pointerId) } catch {}; seekFromX(e.clientX) }
  const onMove = (e: React.PointerEvent) => { if (dragging.current) seekFromX(e.clientX) }
  const onUp = () => { dragging.current = false }

  return (
    <div ref={wrapRef} className="relative bg-black">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video ref={videoRef} src={src} playsInline autoPlay onClick={togglePlay} onContextMenu={(e) => e.preventDefault()}
        onLoadedMetadata={onLoaded} onSeeking={onSeeking} onTimeUpdate={onTime} onRateChange={lockRate}
        onPlay={() => { setPlaying(true); lockRate() }} onPause={() => { setPlaying(false); flush(true) }}
        className="w-full max-h-[70vh] block cursor-pointer" />
      <div className="absolute left-0 right-0 bottom-0 px-3 pt-5 pb-2 flex items-center gap-3" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,.75))' }}>
        <button onClick={togglePlay} className="text-white text-lg w-7 flex-shrink-0">{playing ? '⏸' : '▶'}</button>
        <span className="text-white text-xs flex-shrink-0" style={{ minWidth: 78, fontVariantNumeric: 'tabular-nums' }}>{fmt(cur)} / {fmt(dur)}</span>
        <div ref={barRef} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} className="flex-1 flex items-center cursor-pointer" style={{ height: 16, touchAction: 'none' }}>
          <div className="relative w-full rounded" style={{ height: 5, background: 'rgba(255,255,255,.22)' }}>
            <div className="absolute left-0 top-0 h-full rounded" style={{ width: dur ? `${Math.min(100, (maxSec / dur) * 100)}%` : '0%', background: 'rgba(255,255,255,.4)' }} />
            <div className="absolute left-0 top-0 h-full rounded" style={{ width: dur ? `${Math.min(100, (cur / dur) * 100)}%` : '0%', background: '#17C3C9' }} />
          </div>
        </div>
        <button onClick={toggleMute} className="text-white text-base flex-shrink-0">{muted ? '🔇' : '🔊'}</button>
        <button onClick={toggleFs} className="text-white text-base flex-shrink-0">⛶</button>
      </div>
    </div>
  )
}
