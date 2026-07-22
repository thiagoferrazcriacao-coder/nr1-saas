'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'

type RiskLevel = 'baixo' | 'moderado' | 'alto' | 'critico'
type SchedVideo = { key: string; title: string; author: string }
type SimpleAction = { title: string; how: string; who: string; evidence: string; howMuch?: string }
type MonthFactor = {
  topicNum: number; factor: string; riskLevel: RiskLevel; score: number
  simpleAction: SimpleAction | null; extraMeasure?: string
  gestorVideos: SchedVideo[]; colabVideos: SchedVideo[]
}
type Evidence = { url: string; name?: string; at: string }
type ChangeNote = { from: number; to: number; reason: string }
type PlanMonth = {
  monthNum: number; key: string; label: string; isDouble: boolean; reapplyDrps: boolean
  factors: MonthFactor[]; done: boolean; ataSummary: string; evidences: Evidence[]; changeNote: ChangeNote | null
}

const riskCfg: Record<RiskLevel, { label: string; bg: string; text: string; border: string; dot: string }> = {
  critico:  { label: 'Crítico', bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200',    dot: '#dc2626' },
  alto:     { label: 'Alto',    bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: '#ea580c' },
  moderado: { label: 'Médio',   bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', dot: '#ca8a04' },
  baixo:    { label: 'Baixo',   bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200',  dot: '#16a34a' },
}

function arrayMove<T>(arr: T[], from: number, to: number): T[] {
  const a = [...arr]; const [x] = a.splice(from, 1); a.splice(to, 0, x); return a
}

export default function PlanoDeAcaoPage() {
  const params = useParams()
  const router = useRouter()
  const sectorId = params.id as string

  const [months, setMonths] = useState<PlanMonth[]>([])
  const [sectorName, setSectorName] = useState('')
  const [planStarted, setPlanStarted] = useState(false)
  const [noData, setNoData] = useState(false)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState<number | null>(null)
  const dragFrom = useRef<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)
  // modal de justificativa da alteração (arrastar)
  const [pending, setPending] = useState<{ from: number; to: number; dragKey: string; newOrder: string[] } | null>(null)
  const [reason, setReason] = useState('')

  const load = useCallback(() => {
    fetch(`/api/dashboard/action-plans/${sectorId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return
        setSectorName(d.sectorName ?? '')
        setNoData(!!d.noData)
        setPlanStarted(!!d.planStarted)
        setMonths(d.months ?? [])
      })
      .finally(() => setLoading(false))
  }, [sectorId])

  useEffect(() => { load() }, [load])

  // Salva evidências/ata/status (por chave estável do mês) — ativa o plano na 1ª vez
  const saveMonthData = useCallback(async (next: PlanMonth[]) => {
    const monthData: Record<string, { done: boolean; ataSummary: string; evidences: Evidence[] }> = {}
    for (const m of next) monthData[m.key] = { done: m.done, ataSummary: m.ataSummary, evidences: m.evidences }
    await fetch(`/api/dashboard/action-plans/${sectorId}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ monthData }),
    }).then(() => setPlanStarted(true)).catch(() => {})
  }, [sectorId])

  const patchMonth = (monthNum: number, fields: Partial<PlanMonth>) => {
    setMonths((prev) => {
      const next = prev.map((m) => (m.monthNum === monthNum ? { ...m, ...fields } : m))
      void saveMonthData(next)
      return next
    })
  }

  // Soltou a caixinha: prepara a alteração e abre o modal de justificativa
  const onDrop = (toIdx: number) => {
    const fromIdx = dragFrom.current
    dragFrom.current = null; setDragOver(null)
    if (fromIdx == null || fromIdx === toIdx) return
    const dragKey = months[fromIdx].key
    const newOrder = arrayMove(months, fromIdx, toIdx).map((m) => m.key)
    setReason('')
    setPending({ from: months[fromIdx].monthNum, to: toIdx + 1, dragKey, newOrder })
  }

  const confirmMove = async () => {
    if (!pending || !reason.trim()) return
    const notes: Record<string, ChangeNote> = {}
    for (const m of months) if (m.changeNote) notes[m.key] = m.changeNote
    notes[pending.dragKey] = { from: pending.from, to: pending.to, reason: reason.trim() }
    await fetch(`/api/dashboard/action-plans/${sectorId}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ layout: { order: pending.newOrder, notes } }),
    }).catch(() => {})
    setPending(null); setReason(''); setPlanStarted(true); load()
  }

  const recomecar = async () => {
    if (!confirm('Recomeçar o plano? O plano atual e suas evidências serão arquivados e você monta um novo de 12 meses.')) return
    await fetch(`/api/dashboard/action-plans/${sectorId}`, { method: 'DELETE' })
    load()
  }

  if (loading) {
    return <div className="flex justify-center py-24"><div className="w-10 h-10 border-4 border-primary-800 border-t-transparent rounded-full animate-spin" /></div>
  }

  const doneCount = months.filter((m) => m.done).length
  const progresso = months.length ? Math.round((doneCount / months.length) * 100) : 0

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <button onClick={() => router.back()} className="text-gray-400 text-sm hover:text-gray-600 mb-2">← Voltar</button>
          <h1 className="text-2xl font-black text-gray-900">Plano de Ação — 12 meses</h1>
          <p className="text-gray-500 text-sm mt-1">
            {sectorName} · 13 fatores da NR-1 distribuídos em 12 meses, do mais grave ao menos grave.
          </p>
        </div>
        {planStarted && (
          <button onClick={recomecar} className="text-xs text-red-500 hover:text-red-600 border border-red-200 hover:bg-red-50 px-3 py-2 rounded-xl font-medium">↻ Recomeçar</button>
        )}
      </div>

      {noData ? (
        <div className="bg-gray-50 rounded-2xl border border-gray-100 p-12 text-center">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-gray-500 font-medium">Plano ainda não disponível</p>
          <p className="text-gray-400 text-sm mt-1">Ele é gerado automaticamente depois que os colaboradores deste setor responderem ao questionário.</p>
        </div>
      ) : (
        <>
          {planStarted && (
            <div className="bg-gradient-to-br from-[#0E2A47] to-[#143A5E] rounded-2xl p-5 text-white">
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#9FC2D6]">Execução do plano (12 meses)</p>
                  <p className="text-sm text-[#cfe2f0] mt-1">{doneCount} de {months.length} meses concluídos · gestão viva para a fiscalização</p>
                </div>
                <span className="text-3xl font-black">{progresso}%</span>
              </div>
              <div className="h-2.5 bg-white/15 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#17C3C9] to-[#3F7DE0] transition-all duration-700" style={{ width: `${progresso}%` }} />
              </div>
            </div>
          )}

          <div className="bg-[#F0FBFC] border border-[#CCEFF1] rounded-xl px-4 py-3 text-sm text-[#0E2A47]">
            🖱️ Você pode <strong>arrastar</strong> uma caixinha para outro mês (pelo ícone ⠿). Ao soltar, o sistema pede a <strong>justificativa</strong> da mudança e registra na caixinha.
          </div>

          {/* 12 caixinhas — uma por mês (arrastáveis) */}
          <div className="space-y-2.5">
            {months.map((m, idx) => {
              const isOpen = open === m.monthNum
              const order: RiskLevel[] = ['baixo', 'moderado', 'alto', 'critico']
              const topRisk = m.factors.reduce<RiskLevel>((acc, f) => (order.indexOf(f.riskLevel) > order.indexOf(acc) ? f.riskLevel : acc), 'baixo')
              const cfg = riskCfg[topRisk]
              return (
                <div key={m.key}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(idx) }}
                  onDrop={() => onDrop(idx)}
                  className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${dragOver === idx ? 'border-[#17C3C9] ring-2 ring-[#17C3C9]/30' : 'border-gray-100'}`}>
                  <div className="w-full flex items-center gap-2 px-3 sm:px-5 py-4">
                    <span draggable
                      onDragStart={() => { dragFrom.current = idx }}
                      onDragEnd={() => { dragFrom.current = null; setDragOver(null) }}
                      title="Arrastar para outro mês"
                      className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 text-lg select-none px-1">⠿</span>
                    <button onClick={() => setOpen(isOpen ? null : m.monthNum)} className="flex-1 flex items-center justify-between gap-3 text-left min-w-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#17C3C9] to-[#3F7DE0] text-white text-sm font-black flex flex-col items-center justify-center flex-shrink-0 leading-none">
                          <span className="text-[9px] font-semibold opacity-80">MÊS</span>{m.monthNum}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-[#0E2A47] truncate">{m.label}</p>
                          <p className="text-xs text-gray-500 mt-0.5 truncate">
                            {m.factors.map((f) => f.factor).join('  +  ')}{m.isDouble ? ' (mês duplo)' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {m.changeNote && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-200">✎ alterado</span>}
                        {m.done && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">✅ feito</span>}
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${cfg.bg} ${cfg.text} ${cfg.border}`}>{cfg.label}</span>
                        <span className={`text-gray-400 text-xs transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
                      </div>
                    </button>
                  </div>

                  {/* Aviso de alteração (arrastar) */}
                  {m.changeNote && (
                    <div className="mx-3 sm:mx-5 mb-1 bg-purple-50 border border-purple-100 rounded-lg px-3 py-2 text-xs text-purple-800">
                      ✎ Este mês teve alteração do <strong>mês {m.changeNote.from}</strong> para o <strong>mês {m.changeNote.to}</strong>. <span className="text-purple-600">Motivo:</span> {m.changeNote.reason}
                    </div>
                  )}

                  {isOpen && (
                    <div className="border-t border-gray-100 px-5 py-4 space-y-5">
                      {m.reapplyDrps && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
                          🔁 <strong>Último mês do ciclo.</strong> Agora reaplique o DRPS (refaça os questionários) para gerar o próximo plano de 12 meses.
                        </div>
                      )}
                      {m.factors.map((f) => (<FactorBlock key={f.topicNum} f={f} />))}
                      <MonthActions month={m} sectorId={sectorId} patchMonth={patchMonth} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Modal: justificar a alteração da ordem */}
      {pending && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setPending(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-black text-gray-900 text-lg">Justifique a alteração</h3>
            <p className="text-sm text-gray-500 mt-1">Você está movendo esta ação do <strong>mês {pending.from}</strong> para o <strong>mês {pending.to}</strong>. Explique o porquê — isso fica registrado na caixinha.</p>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} autoFocus
              placeholder="Ex.: Aconteceu um caso na empresa e preciso tratar este fator agora."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mt-3 resize-none" />
            <div className="flex gap-2 mt-4">
              <button onClick={() => setPending(null)} className="flex-1 border border-gray-200 text-gray-600 font-semibold text-sm py-2.5 rounded-xl hover:bg-gray-50">Cancelar</button>
              <button onClick={confirmMove} disabled={!reason.trim()}
                className="flex-1 bg-gradient-to-r from-[#17C3C9] to-[#3F7DE0] text-white font-semibold text-sm py-2.5 rounded-xl hover:opacity-90 disabled:opacity-40">Aceitar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Um fator dentro do mês: vídeos + ação simples sugerida + medida extra (se houver)
function FactorBlock({ f }: { f: MonthFactor }) {
  const cfg = riskCfg[f.riskLevel]
  return (
    <div className="border border-gray-100 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-2 h-2 rounded-full" style={{ background: cfg.dot }} />
        <p className="font-bold text-[#0E2A47] text-sm">{f.factor}</p>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${cfg.bg} ${cfg.text} ${cfg.border}`}>{cfg.label}</span>
      </div>
      {f.extraMeasure && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700 mb-3">⚠️ {f.extraMeasure}</div>
      )}
      <div className="grid gap-3 sm:grid-cols-2 mb-3">
        <div>
          <p className="text-[11px] font-bold text-indigo-600 mb-1">👔 Gestor assiste</p>
          <div className="space-y-1">
            {f.gestorVideos.map((v) => (
              <div key={v.key} className="text-[11px] text-gray-700 bg-gray-50 rounded px-2 py-1 truncate" title={v.title}><span className="text-gray-400">{v.key}</span> {v.title}</div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[11px] font-bold text-teal-700 mb-1">👥 Equipe assiste</p>
          <div className="space-y-1">
            {f.colabVideos.map((v) => (
              <div key={v.key} className="text-[11px] text-gray-700 bg-gray-50 rounded px-2 py-1 truncate" title={v.title}><span className="text-gray-400">{v.key}</span> {v.title}</div>
            ))}
          </div>
        </div>
      </div>
      {f.simpleAction && (
        <div className="bg-[#F0FBFC] border border-[#CCEFF1] rounded-lg px-3 py-2.5">
          <p className="text-[11px] font-bold text-[#0E2A47]">✅ Ação sugerida</p>
          <p className="text-sm font-semibold text-gray-800 mt-0.5">{f.simpleAction.title}</p>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">{f.simpleAction.how}</p>
          <p className="text-[11px] text-gray-400 mt-1">Responsável sugerido: {f.simpleAction.who} · Evidência: {f.simpleAction.evidence}</p>
        </div>
      )}
    </div>
  )
}

// Botões do mês: anexar evidências (fotos/PDF) + gerar ata + marcar como feito
function MonthActions({ month, sectorId, patchMonth }: { month: PlanMonth; sectorId: string; patchMonth: (n: number, f: Partial<PlanMonth>) => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const onFile = async (file: File | null) => {
    if (!file) return
    setUploading(true)
    try {
      const r = await fetch(`/api/dashboard/action-plans/${sectorId}/upload-url`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type || 'application/octet-stream' }),
      })
      const d = await r.json()
      if (!r.ok) { alert(d.error ?? 'Falha ao preparar o upload.'); return }
      await fetch(d.uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type || 'application/octet-stream' }, body: file })
      const ev: Evidence = { url: d.publicUrl, name: file.name, at: new Date().toISOString() }
      patchMonth(month.monthNum, { evidences: [...month.evidences, ev] })
    } catch { alert('Erro no envio.') } finally { setUploading(false); if (fileRef.current) fileRef.current.value = '' }
  }
  const removeEv = (url: string) => patchMonth(month.monthNum, { evidences: month.evidences.filter((e) => e.url !== url) })

  return (
    <div className="border-t border-gray-100 pt-4">
      <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
        <p className="text-xs font-bold text-gray-600">📎 Evidências do mês <span className="font-normal text-gray-400">(fotos de palestras, conversas, eventos, PDFs)</span></p>
        <button onClick={() => fileRef.current?.click()} disabled={uploading}
          className="text-xs font-semibold text-[#109CA1] border border-[#CCEFF1] bg-[#F0FBFC] px-3 py-1.5 rounded-lg hover:bg-[#E0F5F6] disabled:opacity-50">
          {uploading ? 'Enviando…' : '＋ Anexar evidências'}
        </button>
        <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
      </div>
      {month.evidences.length > 0 && (
        <div className="space-y-1 mb-3">
          {month.evidences.map((e) => (
            <div key={e.url} className="flex items-center justify-between gap-2 bg-green-50 border border-green-100 rounded-lg px-3 py-1.5">
              <a href={e.url} target="_blank" rel="noopener noreferrer" className="text-xs text-green-700 font-medium truncate hover:underline">✓ {e.name ?? 'arquivo'}</a>
              <button onClick={() => removeEv(e.url)} className="text-xs text-gray-400 hover:text-red-500 flex-shrink-0">remover</button>
            </div>
          ))}
        </div>
      )}

      <label className="block text-xs font-bold text-gray-600 mb-1">📝 Resumo do que foi feito (entra na ata)</label>
      <textarea value={month.ataSummary} onChange={(e) => patchMonth(month.monthNum, { ataSummary: e.target.value })} rows={2}
        placeholder="Ex.: Realizada palestra sobre o fator com toda a equipe; distribuído material; abertas conversas 1:1."
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mb-3 resize-none" />

      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => window.open(`/api/dashboard/action-plans/${sectorId}/ata?month=${month.monthNum}`, '_blank')}
          className="bg-[#0E2A47] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#143A5E]">📄 Gerar ata</button>
        <label className="flex items-center gap-2 text-sm text-gray-600 ml-auto cursor-pointer">
          <input type="checkbox" checked={month.done} onChange={(e) => patchMonth(month.monthNum, { done: e.target.checked })} className="w-4 h-4" />
          Marcar mês como concluído
        </label>
      </div>
    </div>
  )
}
