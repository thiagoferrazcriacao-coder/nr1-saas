'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

type Trilha = 'gestor' | 'colaborador'
type Material = { id: string; kind: string; trilha: Trilha; title: string; description: string | null; url: string; active: boolean }

export default function AdminEbooksPage() {
  const router = useRouter()
  const [materials, setMaterials] = useState<Material[]>([])
  const [r2ok, setR2ok] = useState(true)
  const [loading, setLoading] = useState(true)

  const [adding, setAdding] = useState(false)
  const [trilha, setTrilha] = useState<Trilha>('gestor')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')

  const fetchMaterials = useCallback(() => {
    fetch('/api/admin/materials')
      .then((r) => { if (r.status === 401) { router.replace('/admin/login'); return null } return r.json() })
      .then((d) => { if (d) { setMaterials(d.materials ?? []); setR2ok(!!d.r2Configured) } })
      .finally(() => setLoading(false))
  }, [router])
  useEffect(() => { fetchMaterials() }, [fetchMaterials])

  const reset = () => { setTrilha('gestor'); setTitle(''); setDescription(''); setFile(null); setProgress(0); setError('') }

  const uploadToR2 = async (f: File): Promise<string> => {
    const urlRes = await fetch('/api/admin/materials/upload-url', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: f.name, contentType: f.type || 'application/pdf' }),
    })
    const urlData = await urlRes.json()
    if (!urlRes.ok) throw new Error(urlData.error ?? 'Falha ao preparar o upload.')
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('PUT', urlData.uploadUrl); xhr.setRequestHeader('Content-Type', f.type || 'application/pdf')
      xhr.upload.onprogress = (ev) => { if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 100)) }
      xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error('Falha no envio.')))
      xhr.onerror = () => reject(new Error('Falha no envio.')); xhr.send(f)
    })
    return urlData.publicUrl
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    if (!title.trim()) { setError('Dê um título ao ebook.'); return }
    if (!file) { setError('Escolha o arquivo PDF.'); return }
    setBusy(true); setProgress(0)
    try {
      const url = await uploadToR2(file)
      const res = await fetch('/api/admin/materials', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'ebook', trilha, title: title.trim(), description: description.trim() || undefined, url }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Falha ao salvar.'); return }
      setAdding(false); reset(); fetchMaterials()
    } catch (err) { setError((err as Error).message || 'Erro.') } finally { setBusy(false) }
  }

  const remove = async (m: Material) => { if (!confirm(`Excluir "${m.title}"?`)) return; await fetch(`/api/admin/materials/${m.id}`, { method: 'DELETE' }); fetchMaterials() }
  const toggleActive = async (m: Material) => { await fetch(`/api/admin/materials/${m.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !m.active }) }); fetchMaterials() }

  if (loading) return <div className="flex justify-center py-24"><div className="w-10 h-10 border-4 border-primary-800 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Ebooks oficiais</h1>
          <p className="text-gray-500 mt-1">Os ebooks que <strong>todas as empresas</strong> recebem no Material Didático. Suba em PDF, por trilha.</p>
        </div>
        <button onClick={() => { reset(); setAdding(true) }} disabled={!r2ok} className="flex-shrink-0 text-sm font-semibold text-white bg-gradient-to-r from-[#17C3C9] to-[#3F7DE0] px-4 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-40">➕ Adicionar ebook</button>
      </div>

      {!r2ok && <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4"><p className="text-amber-800 text-sm">⚠️ Armazenamento (R2) não configurado — upload indisponível.</p></div>}

      {materials.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-8 text-center"><p className="text-gray-500 text-sm">Nenhum ebook ainda. Clique em &quot;Adicionar ebook&quot;.</p></div>
      ) : (
        <div className="space-y-2">
          {materials.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-3 bg-white border border-gray-100 rounded-2xl shadow-sm px-5 py-3.5">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xl flex-shrink-0">📕</span>
                <div className="min-w-0">
                  <p className={`text-sm font-semibold truncate ${m.active ? 'text-gray-800' : 'text-gray-400 line-through'}`}>{m.title}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${m.trilha === 'gestor' ? 'bg-indigo-50 text-indigo-600' : 'bg-teal-50 text-teal-700'}`}>{m.trilha === 'gestor' ? '👔 Gestor' : '👥 Colaborador'}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <a href={m.url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-[#CCEFF1] bg-[#F0FBFC] text-[#109CA1] hover:bg-[#E0F5F6]">👁 Ver</a>
                <button onClick={() => toggleActive(m)} className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50">{m.active ? '👁️' : '🚫'}</button>
                <button onClick={() => remove(m)} className="text-xs px-2.5 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {adding && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => !busy && setAdding(false)}>
          <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-start justify-between mb-4"><h3 className="font-bold text-gray-900">Adicionar ebook</h3><button type="button" onClick={() => !busy && setAdding(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button></div>

            <label className="block text-xs font-semibold text-gray-500 mb-1">Trilha</label>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button type="button" onClick={() => setTrilha('gestor')} className={`text-sm font-semibold py-2.5 rounded-xl border transition-colors ${trilha === 'gestor' ? 'bg-indigo-50 border-indigo-300 text-indigo-600' : 'bg-white border-gray-200 text-gray-500'}`}>👔 Gestor</button>
              <button type="button" onClick={() => setTrilha('colaborador')} className={`text-sm font-semibold py-2.5 rounded-xl border transition-colors ${trilha === 'colaborador' ? 'bg-teal-50 border-teal-300 text-teal-700' : 'bg-white border-gray-200 text-gray-500'}`}>👥 Colaborador</button>
            </div>

            <label className="block text-xs font-semibold text-gray-500 mb-1">Título</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Guia do Gestor" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mb-4" />

            <label className="block text-xs font-semibold text-gray-500 mb-1">Arquivo PDF</label>
            <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-800 file:text-white file:text-sm file:font-semibold mb-4" />

            <label className="block text-xs font-semibold text-gray-500 mb-1">Descrição (opcional)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mb-4 resize-none" />

            {busy && progress > 0 && <div className="mb-4"><div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-[#17C3C9] to-[#3F7DE0]" style={{ width: `${progress}%` }} /></div><p className="text-xs text-gray-400 mt-1">Enviando… {progress}%</p></div>}
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={() => !busy && setAdding(false)} disabled={busy} className="flex-1 border border-gray-200 text-gray-600 font-semibold text-sm py-2.5 rounded-xl hover:bg-gray-50 disabled:opacity-40">Cancelar</button>
              <button type="submit" disabled={busy} className="flex-1 bg-gradient-to-r from-[#17C3C9] to-[#3F7DE0] text-white font-semibold text-sm py-2.5 rounded-xl hover:opacity-90 disabled:opacity-40">{busy ? 'Enviando…' : 'Adicionar'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
