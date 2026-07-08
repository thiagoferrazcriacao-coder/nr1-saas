'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { PROGRAMS } from '@/lib/programs'
import MateriaisExtras from './MateriaisExtras'

type Trilha = 'gestor' | 'colaborador'
type Lesson = { id: string; programNum: number; program: string; trilha: Trilha; title: string; description: string | null; videoUrl: string }
type GestorProgress = Record<string, { percent: number; completed: boolean }>
type PerLesson = { lessonId: string; title: string; program: string; programNum: number; percent: number; completed: boolean; updatedAt: string | null }
type EmployeeRow = { email: string; name: string | null; avgPercent: number; completedCount: number; activeCount: number; perLesson: PerLesson[] }
type Report = { slug: string; totalLessons: number; lessons: { id: string; title: string; program: string; programNum: number }[]; employees: EmployeeRow[]; period: { from: string | null; to: string | null } }

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
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null) // `${trilha}-${num}`
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

  const link = report ? `${typeof window !== 'undefined' ? window.location.origin : ''}/aprender/${report.slug}` : ''
  const copy = async () => { try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch {} }
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
    const header = ['Colaborador', 'E-mail', 'Período', 'Aulas com atividade', 'Concluídas (90%+)', 'Média geral (%)', ...report.lessons.map((l) => `${l.program} — ${l.title} (%)`)]
    const rows = report.employees.map((e) => [
      e.name ?? '', e.email, periodLabel, String(e.activeCount), String(e.completedCount), String(e.avgPercent),
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

  const gestorLessons = lessons.filter((l) => l.trilha === 'gestor')
  const colabLessons  = lessons.filter((l) => l.trilha === 'colaborador')

  // Renderiza um accordion de vídeos por fator, para uma trilha
  const renderTrilha = (trilha: Trilha, list: Lesson[]) => {
    const progs = PROGRAMS.filter((p) => list.some((l) => l.programNum === p.num))
    if (progs.length === 0) {
      return (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 text-center">
          <p className="text-gray-400 text-sm">Os vídeos desta trilha estão sendo preparados e aparecerão aqui em breve.</p>
        </div>
      )
    }
    return (
      <div className="space-y-2.5">
        {progs.map((p) => {
          const ls = list.filter((l) => l.programNum === p.num)
          const key = `${trilha}-${p.num}`
          const isExpanded = expanded === key
          const doneCount = trilha === 'gestor' ? ls.filter((l) => (gestorProgress[l.id]?.completed)).length : 0
          return (
            <div key={key} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <button onClick={() => setExpanded(isExpanded ? null : key)} className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-gray-50 transition-colors text-left">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#17C3C9] to-[#3F7DE0] text-white text-sm font-black flex items-center justify-center flex-shrink-0">{p.num}</span>
                  <div className="min-w-0">
                    <p className="font-bold text-[#0E2A47] truncate">{p.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">🎬 {ls.length} aula{ls.length !== 1 ? 's' : ''}{trilha === 'gestor' && doneCount > 0 ? ` · ✅ ${doneCount} concluída${doneCount !== 1 ? 's' : ''}` : ''}</p>
                  </div>
                </div>
                <span className={`text-gray-400 text-xs flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
              </button>
              {isExpanded && (
                <div className="border-t border-gray-100 divide-y divide-gray-50">
                  {ls.map((l, i) => {
                    const gp = gestorProgress[l.id]
                    return (
                      <div key={l.id} className="px-5 py-3.5">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="w-8 h-8 rounded-lg bg-[#F0FBFC] text-[#109CA1] text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate">{l.title}</p>
                              {l.description && <p className="text-xs text-gray-400 truncate">{l.description}</p>}
                            </div>
                          </div>
                          <button onClick={() => setVideo(l)} className="flex-shrink-0 flex items-center gap-1.5 bg-gradient-to-r from-[#17C3C9] to-[#3F7DE0] text-white text-xs font-semibold px-3.5 py-2 rounded-lg hover:opacity-90 transition-opacity">
                            ▶ Assistir
                          </button>
                        </div>
                        {/* Barra de comprovação do gestor (só na trilha do gestor) */}
                        {trilha === 'gestor' && (
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
          📤 Enviar para colaboradores
        </button>
      </div>

      {linkOpen && (
        <div className="bg-[#F0FBFC] border border-[#CCEFF1] rounded-2xl p-4">
          <p className="text-sm text-[#0E2A47] font-medium mb-2">Link da <strong>Trilha do Colaborador</strong> — cada colaborador cria a própria conta e assiste (a barra registra a presença):</p>
          <div className="flex items-center gap-2 flex-wrap">
            <input readOnly value={link} onFocus={(e) => e.target.select()} className="flex-1 min-w-0 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 font-mono" />
            <button onClick={copy} className="flex-shrink-0 bg-primary-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-primary-700 transition-colors">{copied ? '✅ Copiado' : '📋 Copiar'}</button>
            <a href={link} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 bg-white text-primary-800 border border-primary-200 text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">Abrir</a>
          </div>
        </div>
      )}

      {/* TRILHA DO GESTOR */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">👔</span>
          <h2 className="font-bold text-gray-900">Trilha do Gestor</h2>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">você</span>
        </div>
        <p className="text-gray-500 text-sm mb-4">Os vídeos que <strong>você</strong> precisa assistir. A barra abaixo de cada aula <strong>comprova</strong> que você fez o treinamento.</p>
        {renderTrilha('gestor', gestorLessons)}
      </div>

      {/* TRILHA DO COLABORADOR */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">👥</span>
          <h2 className="font-bold text-gray-900">Trilha do Colaborador</h2>
        </div>
        <p className="text-gray-500 text-sm mb-4">Os vídeos que o seu time assiste pelo link. Você pode conferir aqui — mas <strong>esta visualização não conta</strong> como presença. A presença dos colaboradores aparece no relatório abaixo.</p>
        {renderTrilha('colaborador', colabLessons)}
      </div>

      {/* Materiais complementares (ebooks oficiais + extras do gestor) */}
      <MateriaisExtras />

      {/* Relatório de presença dos colaboradores */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🧾</span>
            <div>
              <h2 className="font-bold text-gray-900">Relatório de presença (colaboradores)</h2>
              <p className="text-gray-500 text-sm mt-1">Clique num colaborador para ver aula por aula. Concluído = 90% ou mais.</p>
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
              <div className="bg-[#F0FBFC] rounded-xl p-3 text-center"><p className="text-2xl font-black text-[#109CA1]">{report.employees.length}</p><p className="text-xs text-gray-500 mt-0.5">colaboradores</p></div>
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
                        <p className="font-semibold text-gray-800 truncate">{e.name || e.email}</p>
                        <p className="text-xs text-gray-400 truncate">{e.email}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {e.activeCount === 0 && <span className="text-xs text-gray-400 italic">sem atividade</span>}
                        <div className="text-right">
                          <span className="text-xs text-gray-400">{e.completedCount}/{report.totalLessons} concluídos</span>
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
