'use client'

import { useEffect, useState, useCallback } from 'react'
import { PROGRAMS } from '@/lib/programs'

type Lesson = { id: string; programNum: number; program: string; title: string }
type PerLesson = { lessonId: string; title: string; program: string; percent: number; completed: boolean }
type EmployeeRow = { email: string; name: string | null; avgPercent: number; completedCount: number; perLesson: PerLesson[] }
type Report = { slug: string; totalLessons: number; employees: EmployeeRow[] }

export default function MaterialDidaticoPage() {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [linkOpen, setLinkOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState<string | null>(null)

  const fetchAll = useCallback(() => {
    Promise.all([
      fetch('/api/dashboard/material/lessons').then((r) => (r.ok ? r.json() : null)),
      fetch('/api/dashboard/material/report').then((r) => (r.ok ? r.json() : null)),
    ]).then(([lessonsData, reportData]) => {
      if (lessonsData) setLessons(lessonsData.lessons ?? [])
      if (reportData) setReport(reportData)
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const link = report ? `${typeof window !== 'undefined' ? window.location.origin : ''}/aprender/${report.slug}` : ''
  const copy = async () => { try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch {} }
  const barColor = (p: number) => (p >= 90 ? '#16a34a' : p >= 40 ? '#2563eb' : p > 0 ? '#ca8a04' : '#cbd5e1')

  if (loading) {
    return <div className="flex justify-center py-24"><div className="w-10 h-10 border-4 border-primary-800 border-t-transparent rounded-full animate-spin" /></div>
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Material Didático</h1>
          <p className="text-gray-500 mt-1">Vídeo-aulas de aplicação da NR-1 para o seu time, com acompanhamento de presença.</p>
        </div>
        <button onClick={() => setLinkOpen((v) => !v)} className="flex-shrink-0 bg-gradient-to-r from-[#17C3C9] to-[#3F7DE0] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity">
          📤 Enviar para colaboradores
        </button>
      </div>

      {linkOpen && (
        <div className="bg-[#F0FBFC] border border-[#CCEFF1] rounded-2xl p-4">
          <p className="text-sm text-[#0E2A47] font-medium mb-2">Compartilhe este link — cada colaborador cria a própria conta e assiste:</p>
          <div className="flex items-center gap-2 flex-wrap">
            <input readOnly value={link} onFocus={(e) => e.target.select()} className="flex-1 min-w-0 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 font-mono" />
            <button onClick={copy} className="flex-shrink-0 bg-primary-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-primary-700 transition-colors">{copied ? '✅ Copiado' : '📋 Copiar'}</button>
            <a href={link} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 bg-white text-primary-800 border border-primary-200 text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">Abrir</a>
          </div>
        </div>
      )}

      {/* Vídeos disponíveis (somente leitura) */}
      <div>
        <h2 className="font-bold text-gray-900 mb-1">Vídeos disponíveis</h2>
        <p className="text-gray-500 text-sm mb-4">{lessons.length} vídeo{lessons.length !== 1 ? 's' : ''} liberado{lessons.length !== 1 ? 's' : ''} para a sua equipe assistir.</p>
        {lessons.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-8 text-center">
            <p className="text-gray-500 text-sm">Os vídeos estão sendo preparados e aparecerão aqui em breve.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {PROGRAMS.filter((p) => lessons.some((l) => l.programNum === p.num)).map((p) => (
              <div key={p.num} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
                <p className="font-semibold text-[#0E2A47] text-sm mb-2">{p.num}. {p.name}</p>
                <div className="divide-y divide-gray-50">
                  {lessons.filter((l) => l.programNum === p.num).map((l, i) => (
                    <div key={l.id} className="flex items-center gap-3 py-2.5">
                      <span className="w-7 h-7 rounded-lg bg-[#F0FBFC] text-[#109CA1] text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                      <p className="text-sm font-medium text-gray-800 truncate">{l.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Relatório de presença */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
        <div className="flex items-start gap-3 mb-4">
          <span className="text-2xl">🧾</span>
          <div>
            <h2 className="font-bold text-gray-900">Relatório de presença</h2>
            <p className="text-gray-500 text-sm mt-1">Clique num colaborador para ver, aula por aula, o que ele assistiu. Concluído = 90% ou mais.</p>
          </div>
        </div>
        {!report || report.employees.length === 0 ? (
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-8 text-center"><p className="text-gray-500 text-sm">Nenhum colaborador entrou ainda. Use o botão &quot;Enviar para colaboradores&quot; lá em cima.</p></div>
        ) : (
          <div className="space-y-2">
            {report.employees.map((e) => {
              const isOpen = open === e.email
              return (
                <div key={e.email} className="border border-gray-100 rounded-xl overflow-hidden">
                  <button onClick={() => setOpen(isOpen ? null : e.email)} className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800 truncate">{e.name || e.email}</p>
                      <p className="text-xs text-gray-400 truncate">{e.email}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
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
                            <span className={`text-xs font-semibold w-16 text-right ${l.completed ? 'text-green-600' : 'text-gray-500'}`}>{l.completed ? '✅ 90%+' : `${l.percent}%`}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
