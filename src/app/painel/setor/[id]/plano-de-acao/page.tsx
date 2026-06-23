'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'

type RiskLevel = 'baixo' | 'moderado' | 'alto' | 'critico'
type ItemStatus = 'pendente' | 'em_andamento' | 'concluida'
type Cadence = 'semanal' | 'quinzenal' | 'mensal' | 'bimestral' | 'trimestral' | 'continuo'
type Intervention = 'semanal' | 'mensal' | 'bimestral'
type Evidence = { url: string; name?: string; note?: string; at: string }

type PlanItem = {
  id: string
  topicNum: number
  factor: string
  riskLevel: RiskLevel
  level: 1 | 2 | 3
  title: string
  how: string
  who: string
  startWeek: number
  dueWeek: number
  cadence: Cadence
  howMuch?: string
  evidenceHint: string
  status: ItemStatus
  evidences: Evidence[]
}

const riskCfg: Record<RiskLevel, { label: string; bg: string; text: string; border: string; dot: string }> = {
  critico:  { label: 'Crítico', bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200',    dot: '#dc2626' },
  alto:     { label: 'Alto',    bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: '#ea580c' },
  moderado: { label: 'Médio',   bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', dot: '#ca8a04' },
  baixo:    { label: 'Baixo',   bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200',  dot: '#16a34a' },
}
const levelCfg: Record<number, { label: string; emoji: string; color: string }> = {
  1: { label: 'Origem — eliminar/reduzir', emoji: '🔴', color: 'text-red-600' },
  2: { label: 'Recursos às pessoas',       emoji: '🟠', color: 'text-orange-600' },
  3: { label: 'Acolher consequências',     emoji: '🟢', color: 'text-green-600' },
}
const statusCfg: Record<ItemStatus, { label: string; icon: string; bg: string; text: string }> = {
  pendente:     { label: 'Pendente',     icon: '⏳', bg: 'bg-gray-100',  text: 'text-gray-600' },
  em_andamento: { label: 'Em andamento', icon: '🔄', bg: 'bg-blue-100',  text: 'text-blue-700' },
  concluida:    { label: 'Concluída',    icon: '✅', bg: 'bg-green-100', text: 'text-green-700' },
}
const cadLabel: Record<Cadence, string> = { semanal: 'Semanal', quinzenal: 'Quinzenal', mensal: 'Mensal', bimestral: 'Bimestral', trimestral: 'Trimestral', continuo: 'Contínuo' }
const interventionOptions: { key: Intervention; emoji: string; title: string; desc: string }[] = [
  { key: 'semanal',   emoji: '⚡', title: 'Intervenções semanais',  desc: 'Ritmo intenso — uma ação por semana. Para quem quer resolver rápido e tem time dedicado.' },
  { key: 'mensal',    emoji: '📅', title: 'Intervenções mensais',   desc: 'Ritmo equilibrado — uma ação por mês ao longo do ano. O mais comum para a maioria das empresas.' },
  { key: 'bimestral', emoji: '🗓️', title: 'Intervenções bimestrais', desc: 'Ritmo leve — uma ação a cada 2 meses. Para operações enxutas, sem perder a conformidade.' },
]
const whenLabel = (i: PlanItem) => (i.dueWeek === 0 ? 'Contínuo' : `Semana ${i.startWeek}–${i.dueWeek}`)

type Trend = 'melhorou' | 'estavel' | 'piorou' | 'sem_dados'
type Comparison = { topicNum: number; factor: string; baseline: RiskLevel; current: RiskLevel | null; trend: Trend }
type Milestone = { month: number; date: string; status: 'futura' | 'pendente' | 'feita' }
type Reaval = { hasPlan: boolean; startDate?: string; reavaliada?: boolean; milestones?: Milestone[]; comparison?: Comparison[]; linkToken?: string }

const trendCfg: Record<Trend, { label: string; icon: string; cls: string }> = {
  melhorou:  { label: 'Melhorou',  icon: '↓', cls: 'text-green-600' },
  estavel:   { label: 'Estável',   icon: '=', cls: 'text-gray-500' },
  piorou:    { label: 'Piorou',    icon: '↑', cls: 'text-red-600' },
  sem_dados: { label: 'Aguardando', icon: '•', cls: 'text-gray-400' },
}
const msStatusCfg: Record<Milestone['status'], { label: string; cls: string }> = {
  futura:   { label: 'A vencer',  cls: 'bg-gray-100 text-gray-500' },
  pendente: { label: 'Pendente',  cls: 'bg-yellow-50 text-yellow-700 border border-yellow-200' },
  feita:    { label: 'Reavaliada', cls: 'bg-green-50 text-green-700 border border-green-200' },
}

export default function PlanoDeAcaoPage() {
  const params = useParams()
  const router = useRouter()
  const sectorId = params.id as string

  const [items, setItems] = useState<PlanItem[]>([])
  const [sectorName, setSectorName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [hasPlan, setHasPlan] = useState(false)
  const [openFactors, setOpenFactors] = useState<Set<number>>(new Set())
  const [reaval, setReaval] = useState<Reaval | null>(null)
  const [copied, setCopied] = useState(false)
  const [needsCadence, setNeedsCadence] = useState(false)
  const [noData, setNoData] = useState(false)
  const [cadence, setCadence] = useState<Intervention | null>(null)
  const [generating, setGenerating] = useState(false)

  const loadReaval = useCallback(() => {
    fetch(`/api/dashboard/action-plans/${sectorId}/reavaliacao`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setReaval(d))
      .catch(() => {})
  }, [sectorId])

  const applyData = (d: { plan?: { items: PlanItem[]; interventionCadence?: Intervention | null }; suggested?: PlanItem[]; needsCadence?: boolean; noData?: boolean; chosenCadence?: Intervention; sectorName?: string }) => {
    setSectorName(d.sectorName ?? '')
    setNoData(!!d.noData)
    setNeedsCadence(!!d.needsCadence)
    const planOk = !!d.plan?.items?.length && d.plan.items[0]?.topicNum != null && (d.plan.items[0] as PlanItem)?.level != null
    if (planOk && d.plan) {
      setItems(d.plan.items); setHasPlan(true); setCadence(d.plan.interventionCadence ?? null)
    } else if (d.suggested?.length) {
      setItems(d.suggested); setHasPlan(false); if (d.chosenCadence) setCadence(d.chosenCadence)
    }
    const first = (d.plan?.items ?? d.suggested ?? [])[0]
    if (first) setOpenFactors(new Set([first.topicNum]))
  }

  useEffect(() => {
    fetch(`/api/dashboard/action-plans/${sectorId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && applyData(d))
      .finally(() => setLoading(false))
    loadReaval()
  }, [sectorId, loadReaval])

  // Empresa escolheu o ritmo → gera o plano nesse compasso
  const chooseCadence = async (c: Intervention) => {
    setCadence(c); setGenerating(true)
    try {
      const r = await fetch(`/api/dashboard/action-plans/${sectorId}?cadence=${c}`)
      const d = await r.json()
      if (r.ok) applyData(d)
    } finally { setGenerating(false) }
  }

  const copyLink = async () => {
    const url = `${window.location.origin}/r/${reaval?.linkToken ?? ''}`
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch {}
  }

  const patch = useCallback((id: string, fields: Partial<PlanItem>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...fields } : it)))
    setSaved(false)
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/dashboard/action-plans/${sectorId}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, interventionCadence: cadence ?? undefined }),
      })
      if (res.ok) { setHasPlan(true); setSaved(true); loadReaval() }
    } finally { setSaving(false) }
  }

  if (loading) {
    return <div className="flex justify-center py-24"><div className="w-10 h-10 border-4 border-primary-800 border-t-transparent rounded-full animate-spin" /></div>
  }

  const total = items.length
  const done = items.filter((i) => i.status === 'concluida').length
  const progresso = total ? Math.round((done / total) * 100) : 0

  // Agrupa por fator preservando a ordem (já vem priorizado por gravidade)
  const groups: { topicNum: number; factor: string; risk: RiskLevel; items: PlanItem[] }[] = []
  for (const it of items) {
    let g = groups.find((x) => x.topicNum === it.topicNum)
    if (!g) { g = { topicNum: it.topicNum, factor: it.factor, risk: it.riskLevel, items: [] }; groups.push(g) }
    g.items.push(it)
  }
  const toggle = (n: number) => setOpenFactors((prev) => { const s = new Set(prev); s.has(n) ? s.delete(n) : s.add(n); return s })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <button onClick={() => router.back()} className="text-gray-400 text-sm hover:text-gray-600 mb-2">← Voltar ao relatório</button>
          <h1 className="text-2xl font-black text-gray-900">Plano de Ação Vivo</h1>
          <p className="text-gray-500 text-sm mt-1">
            {sectorName} · plano de 52 semanas
            {cadence ? ` · intervenções ${cadLabel[cadence].toLowerCase()}` : ''}
            {total > 0 ? ` · ${groups.length} fatores · ${total} ações` : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-green-600 text-sm font-medium">✅ Salvo</span>}
          {!hasPlan && total > 0 && (
            <>
              <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-xl font-medium">Gerado automaticamente — revise e salve</span>
              <button onClick={() => { setItems([]); setNeedsCadence(true) }} className="text-xs text-gray-500 hover:text-gray-700 underline">↻ trocar ritmo</button>
            </>
          )}
          {hasPlan && (
            <button onClick={() => window.open(`/api/dashboard/action-plans/${sectorId}/pdf`, '_blank')}
              className="bg-white text-[#0E2A47] border border-gray-200 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50">
              📄 Baixar documento
            </button>
          )}
          <button onClick={handleSave} disabled={saving || total === 0}
            className="bg-gradient-to-r from-[#17C3C9] to-[#3F7DE0] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50">
            {saving ? 'Salvando…' : hasPlan ? '💾 Salvar alterações' : '💾 Criar Plano de Ação'}
          </button>
        </div>
      </div>

      {/* Progresso do ano */}
      {total > 0 && (
        <div className="bg-gradient-to-br from-[#0E2A47] to-[#143A5E] rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-[#9FC2D6]">Execução do plano (52 semanas)</p>
              <p className="text-sm text-[#cfe2f0] mt-1">{done} de {total} ações concluídas · gestão viva para a fiscalização</p>
            </div>
            <span className="text-3xl font-black">{progresso}%</span>
          </div>
          <div className="h-2.5 bg-white/15 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#17C3C9] to-[#3F7DE0] transition-all duration-700" style={{ width: `${progresso}%` }} />
          </div>
        </div>
      )}

      {/* Reavaliação (meses 3/6/12) */}
      {hasPlan && reaval?.hasPlan && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
            <div>
              <h2 className="font-bold text-gray-900">🔄 Reavaliação do plano</h2>
              <p className="text-gray-500 text-sm mt-0.5">Reaplique o questionário nos meses 3, 6 e 12 para comprovar que o risco caiu.</p>
            </div>
            <button onClick={copyLink} className="flex-shrink-0 text-sm font-semibold text-[#109CA1] border border-[#CCEFF1] bg-[#F0FBFC] px-4 py-2 rounded-xl hover:bg-[#E0F5F6]">
              {copied ? '✅ Link copiado' : '📋 Reenviar questionário'}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            {reaval.milestones?.map((m) => (
              <div key={m.month} className="border border-gray-100 rounded-xl px-3 py-2 text-center">
                <p className="text-xs text-gray-400">Mês {m.month}</p>
                <p className="text-xs text-gray-600">{new Date(m.date).toLocaleDateString('pt-BR')}</p>
                <span className={`inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded ${msStatusCfg[m.status].cls}`}>{msStatusCfg[m.status].label}</span>
              </div>
            ))}
          </div>

          {reaval.reavaliada ? (
            <div className="space-y-1.5">
              <p className="text-xs text-gray-400 mb-1">Evolução por fator (início → agora):</p>
              {reaval.comparison?.filter((c) => c.baseline !== 'baixo').map((c) => (
                <div key={c.topicNum} className="flex items-center justify-between gap-2 text-sm border-t border-gray-50 pt-1.5 first:border-0">
                  <span className="text-gray-700 truncate min-w-0">{c.factor}</span>
                  <span className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs font-semibold ${riskCfg[c.baseline].text}`}>{riskCfg[c.baseline].label}</span>
                    <span className="text-gray-300">→</span>
                    <span className={`text-xs font-semibold ${c.current ? riskCfg[c.current].text : 'text-gray-400'}`}>{c.current ? riskCfg[c.current].label : '—'}</span>
                    <span className={`text-xs font-bold w-24 text-right ${trendCfg[c.trend].cls}`}>{trendCfg[c.trend].icon} {trendCfg[c.trend].label}</span>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#F0FBFC] border border-[#CCEFF1] rounded-xl px-4 py-3 text-sm text-[#0E2A47]">
              Ainda não houve reavaliação. Quando chegar o mês 3, use o botão <strong>Reenviar questionário</strong> para a equipe responder de novo — aí o sistema compara o risco e mostra a evolução aqui. 📈
            </div>
          )}
        </div>
      )}

      {/* Sem respostas ainda */}
      {noData && total === 0 && (
        <div className="bg-gray-50 rounded-2xl border border-gray-100 p-12 text-center">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-gray-500 font-medium">Plano ainda não disponível</p>
          <p className="text-gray-400 text-sm mt-1">Ele é gerado automaticamente depois que os colaboradores deste setor responderem ao questionário.</p>
        </div>
      )}

      {/* Seletor de ritmo das intervenções (antes de gerar o plano) */}
      {needsCadence && total === 0 && !noData && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="text-center mb-5">
            <h2 className="text-lg font-black text-gray-900">Como você pretende fazer suas intervenções?</h2>
            <p className="text-gray-500 text-sm mt-1">Escolha o ritmo. O plano de 52 semanas é montado exatamente nesse compasso.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {interventionOptions.map((o) => (
              <button key={o.key} onClick={() => chooseCadence(o.key)} disabled={generating}
                className={`text-left border rounded-2xl p-4 transition-all disabled:opacity-50 ${cadence === o.key ? 'border-[#17C3C9] ring-2 ring-[#17C3C9]/30' : 'border-gray-200 hover:border-[#17C3C9]'}`}>
                <div className="text-2xl mb-1">{o.emoji}</div>
                <p className="font-bold text-[#0E2A47]">{o.title}</p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{o.desc}</p>
              </button>
            ))}
          </div>
          {generating && <p className="text-center text-sm text-gray-400 mt-4">Montando seu plano…</p>}
        </div>
      )}

      {/* Fatores (accordion) */}
      {groups.map((g) => {
        const cfg = riskCfg[g.risk]
        const isOpen = openFactors.has(g.topicNum)
        const gdone = g.items.filter((i) => i.status === 'concluida').length
        return (
          <div key={g.topicNum} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <button onClick={() => toggle(g.topicNum)} className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-gray-50 transition-colors text-left">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
                <div className="min-w-0">
                  <p className="font-bold text-[#0E2A47] truncate">{g.factor}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{gdone}/{g.items.length} ações · acompanhamento {cadLabel[g.items[0]?.cadence ?? 'mensal'].toLowerCase()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${cfg.bg} ${cfg.text} ${cfg.border}`}>{cfg.label}</span>
                <span className={`text-gray-400 text-xs transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-gray-100 divide-y divide-gray-50">
                {g.items.map((it) => (
                  <ActionCard key={it.id} item={it} sectorId={sectorId} onPatch={patch} />
                ))}
              </div>
            )}
          </div>
        )
      })}

      {total > 0 && (
        <p className="text-xs text-gray-400 text-center">
          🔒 Anexe as evidências de cada ação ao longo do ano. Esse registro é a prova de que o plano está sendo praticado — exatamente o que a fiscalização do MTE exige.
        </p>
      )}
    </div>
  )
}

function ActionCard({ item, sectorId, onPatch }: { item: PlanItem; sectorId: string; onPatch: (id: string, f: Partial<PlanItem>) => void }) {
  const lvl = levelCfg[item.level]
  const st = statusCfg[item.status]
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
      onPatch(item.id, { evidences: [...item.evidences, ev] })
    } catch { alert('Erro no envio. Tente novamente.') } finally { setUploading(false); if (fileRef.current) fileRef.current.value = '' }
  }

  const removeEv = (url: string) => onPatch(item.id, { evidences: item.evidences.filter((e) => e.url !== url) })

  return (
    <div className="px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`text-[11px] font-bold ${lvl.color}`}>{lvl.emoji} {lvl.label}</p>
          <p className="text-sm font-semibold text-gray-800 mt-0.5">{item.title}</p>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.how}</p>
        </div>
        <select value={item.status} onChange={(e) => onPatch(item.id, { status: e.target.value as ItemStatus })}
          className={`flex-shrink-0 text-xs font-semibold rounded-lg border border-gray-200 px-2 py-1.5 ${st.bg} ${st.text}`}>
          {(Object.keys(statusCfg) as ItemStatus[]).map((k) => <option key={k} value={k}>{statusCfg[k].icon} {statusCfg[k].label}</option>)}
        </select>
      </div>

      {/* 5W2H resumido */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-xs">
        <div className="bg-gray-50 rounded-lg px-3 py-2">
          <p className="text-gray-400">Responsável</p>
          <input value={item.who} onChange={(e) => onPatch(item.id, { who: e.target.value })}
            className="w-full bg-transparent font-semibold text-gray-700 focus:outline-none mt-0.5" />
        </div>
        <div className="bg-gray-50 rounded-lg px-3 py-2"><p className="text-gray-400">Quando</p><p className="font-semibold text-gray-700 mt-0.5">{whenLabel(item)}</p></div>
        <div className="bg-gray-50 rounded-lg px-3 py-2"><p className="text-gray-400">Acompanhar</p><p className="font-semibold text-gray-700 mt-0.5">{cadLabel[item.cadence]}</p></div>
        <div className="bg-gray-50 rounded-lg px-3 py-2"><p className="text-gray-400">Custo</p><p className="font-semibold text-gray-700 mt-0.5">{item.howMuch ?? 'Tempo de gestão'}</p></div>
      </div>

      {/* Evidências */}
      <div className="mt-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-xs text-gray-400">📎 Evidências <span className="text-gray-300">(ex.: {item.evidenceHint})</span></p>
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            className="text-xs font-semibold text-[#109CA1] border border-[#CCEFF1] bg-[#F0FBFC] px-3 py-1.5 rounded-lg hover:bg-[#E0F5F6] disabled:opacity-50">
            {uploading ? 'Enviando…' : '＋ Anexar'}
          </button>
          <input ref={fileRef} type="file" className="hidden" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
        </div>
        {item.evidences.length > 0 && (
          <div className="mt-2 space-y-1">
            {item.evidences.map((e) => (
              <div key={e.url} className="flex items-center justify-between gap-2 bg-green-50 border border-green-100 rounded-lg px-3 py-1.5">
                <a href={e.url} target="_blank" rel="noopener noreferrer" className="text-xs text-green-700 font-medium truncate hover:underline">✓ {e.name ?? 'arquivo'}</a>
                <button onClick={() => removeEv(e.url)} className="text-xs text-gray-400 hover:text-red-500 flex-shrink-0">remover</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
