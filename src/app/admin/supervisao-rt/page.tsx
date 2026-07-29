'use client'

import { useEffect, useState } from 'react'

type Case = { id: string; name: string; drpsStatus: string; completedAt?: string; adjusted: boolean }
export default function RtSupervisionPage() {
  const [sample, setSample] = useState(5)
  const [adjusted, setAdjusted] = useState(false)
  const [cases, setCases] = useState<Case[]>([])
  const [total, setTotal] = useState(0)
  const [findings, setFindings] = useState('')
  const [actions, setActions] = useState('')
  const [selected, setSelected] = useState('')
  const [message, setMessage] = useState('')
  const load = () => fetch(`/api/admin/rt-supervision?sample=${sample}&adjusted=${adjusted}`).then((r) => r.ok ? r.json() : null).then((d) => { if (d) { setCases(d.sample); setTotal(d.total) } })
  useEffect(() => { load() }, [sample, adjusted])
  const save = async () => { const r = await fetch('/api/admin/rt-supervision', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ companyId: selected, sampleSize: cases.length || sample, findings, actions }) }); setMessage(r.ok ? 'Ata registrada com sucesso.' : 'Não foi possível registrar a ata.'); if (r.ok) { setFindings(''); setActions('') } }
  return <div className="max-w-5xl mx-auto space-y-6"><div><h1 className="text-2xl font-bold text-gray-900">Supervisão técnica da RT</h1><p className="text-sm text-gray-500 mt-1">A emissão do DRPS não aguarda revisão humana. Esta área serve para revisão amostral e registro mensal.</p></div><div className="bg-white border rounded-2xl p-5 flex flex-wrap items-end gap-4"><label className="text-sm text-gray-600">Tamanho da amostra<input type="number" min="1" max="50" value={sample} onChange={(e) => setSample(Number(e.target.value))} className="block mt-1 border rounded-lg px-3 py-2 w-28" /></label><label className="flex gap-2 items-center text-sm text-gray-600"><input type="checkbox" checked={adjusted} onChange={(e) => setAdjusted(e.target.checked)} />Somente com ajuste prudencial</label><button onClick={load} className="bg-primary-800 text-white px-4 py-2 rounded-xl text-sm font-semibold">Sortear amostra</button><span className="text-xs text-gray-400">{total} diagnóstico(s) elegível(is)</span></div><div className="bg-white border rounded-2xl p-5"><h2 className="font-bold mb-3">Amostra selecionada</h2><div className="space-y-2">{cases.map((c) => <label key={c.id} className="flex gap-3 items-center border rounded-lg p-3 text-sm"><input type="radio" name="company" checked={selected === c.id} onChange={() => setSelected(c.id)} /><span className="font-medium">{c.name}</span><span className="text-xs text-gray-400">{c.adjusted ? 'Ajuste prudencial' : 'Sem ajuste'} · {c.drpsStatus}</span></label>)}{!cases.length && <p className="text-sm text-gray-400">Nenhum diagnóstico encontrado.</p>}</div></div><div className="bg-white border rounded-2xl p-5"><h2 className="font-bold mb-3">Registrar ata da revisão</h2><textarea value={findings} onChange={(e) => setFindings(e.target.value)} placeholder="Data, amostra revisada e achados" className="w-full border rounded-xl p-3 text-sm min-h-28" /><textarea value={actions} onChange={(e) => setActions(e.target.value)} placeholder="Providências (opcional)" className="w-full border rounded-xl p-3 text-sm min-h-20 mt-3" /><button disabled={!selected || !findings} onClick={save} className="mt-3 bg-primary-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold disabled:bg-gray-200 disabled:text-gray-400">Salvar ata</button>{message && <p className="text-sm text-green-700 mt-3">{message}</p>}</div></div>
}
