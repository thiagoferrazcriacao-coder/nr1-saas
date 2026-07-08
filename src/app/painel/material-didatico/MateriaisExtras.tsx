'use client'

import { useEffect, useState, useCallback, useRef } from 'react'

type Kind = 'video' | 'youtube' | 'ebook' | 'image' | 'file' | 'link'
type Material = { id: string; companyId: string | null; kind: Kind; title: string; description: string | null; url: string; opened: boolean; openPercent: number }

const kindMeta: Record<Kind, { icon: string; label: string }> = {
  video:    { icon: '🎬', label: 'Vídeo' },
  youtube:  { icon: '▶️', label: 'YouTube' },
  ebook:    { icon: '📕', label: 'E-book' },
  image:    { icon: '🖼️', label: 'Foto' },
  file:     { icon: '📎', label: 'Arquivo' },
  link:     { icon: '🔗', label: 'Link' },
}
// Tipos que exigem upload de arquivo (vs. colar um link)
const UPLOAD_KINDS: Kind[] = ['video', 'ebook', 'image', 'file']
const acceptFor: Record<string, string> = { video: 'video/*', ebook: 'application/pdf', image: 'image/*', file: '*/*' }

export default function MateriaisExtras() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [kind, setKind] = useState<Kind>('youtube')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const fetchMaterials = useCallback(() => {
    fetch('/api/dashboard/materials')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setMaterials(d.materials ?? []) })
      .finally(() => setLoading(false))
  }, [])
  useEffect(() => { fetchMaterials() }, [fetchMaterials])

  // Só os extras da empresa (com companyId) podem ser removidos pelo gestor
  const ownExtras = materials.filter((m) => m.companyId)
  const officialEbooks = materials.filter((m) => !m.companyId)

  const reset = () => { setKind('youtube'); setTitle(''); setDescription(''); setLinkUrl(''); setFile(null); setProgress(0); setError('') }
  const openAdd = () => { reset(); setAdding(true) }

  const uploadToR2 = async (f: File): Promise<string> => {
    const urlRes = await fetch('/api/dashboard/materials/upload-url', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: f.name, contentType: f.type || 'application/octet-stream' }),
    })
    const urlData = await urlRes.json()
    if (!urlRes.ok) throw new Error(urlData.error ?? 'Falha ao preparar o upload.')
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('PUT', urlData.uploadUrl); xhr.setRequestHeader('Content-Type', f.type || 'application/octet-stream')
      xhr.upload.onprogress = (ev) => { if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 100)) }
      xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error('Falha no envio.')))
      xhr.onerror = () => reject(new Error('Falha no envio.')); xhr.send(f)
    })
    return urlData.publicUrl
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    if (!title.trim()) { setError('Dê um título ao material.'); return }
    const needsFile = UPLOAD_KINDS.includes(kind)
    if (needsFile && !file) { setError('Escolha um arquivo.'); return }
    if (!needsFile && !linkUrl.trim()) { setError('Cole o link.'); return }
    setBusy(true); setProgress(0)
    try {
      const url = needsFile ? await uploadToR2(file as File) : linkUrl.trim()
      const res = await fetch('/api/dashboard/materials', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, title: title.trim(), description: description.trim() || undefined, url }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Falha ao salvar.'); return }
      setAdding(false); reset(); fetchMaterials()
    } catch (err) { setError((err as Error).message || 'Erro.') } finally { setBusy(false) }
  }

  const remove = async (m: Material) => {
    if (!confirm(`Remover "${m.title}"?`)) return
    await fetch(`/api/dashboard/materials/${m.id}`, { method: 'DELETE' }); fetchMaterials()
  }

  const openMaterial = (m: Material) => {
    window.open(m.url, '_blank', 'noopener,noreferrer')
    fetch(`/api/dashboard/materials/${m.id}/open`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).catch(() => {})
    setMaterials((prev) => prev.map((x) => (x.id === m.id ? { ...x, opened: true, openPercent: 100 } : x)))
  }

  const row = (m: Material, canDelete: boolean) => (
    <div key={m.id} className="flex items-center justify-between gap-3 px-4 py-3 border border-gray-100 rounded-xl">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-lg flex-shrink-0">{kindMeta[m.kind].icon}</span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">{m.title}</p>
          {m.description && <p className="text-xs text-gray-400 truncate">{m.description}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {m.opened && <span className="text-[11px] font-semibold text-green-600">✅ aberto</span>}
        <button onClick={() => openMaterial(m)} className="text-xs font-semibold text-white bg-gradient-to-r from-[#17C3C9] to-[#3F7DE0] px-3 py-1.5 rounded-lg hover:opacity-90">Abrir</button>
        {canDelete && <button onClick={() => remove(m)} className="text-xs px-2 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50">🗑️</button>}
      </div>
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
        <div className="flex items-center gap-2">
          <span className="text-lg">📎</span>
          <h2 className="font-bold text-gray-900">Materiais complementares</h2>
        </div>
        <button onClick={openAdd} className="text-sm font-semibold text-[#109CA1] border border-[#CCEFF1] bg-[#F0FBFC] px-3 py-2 rounded-xl hover:bg-[#E0F5F6]">➕ Adicionar material</button>
      </div>
      <p className="text-gray-500 text-sm mb-4">Ebooks oficiais e o que <strong>você</strong> quiser acrescentar (vídeo, YouTube, ebook, foto, arquivo, link). O que você adiciona também aparece para a sua equipe, com registro de quem abriu.</p>

      {loading ? (
        <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-[#17C3C9] border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-4">
          {officialEbooks.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">📚 Ebooks oficiais Zelo</p>
              <div className="space-y-2">{officialEbooks.map((m) => row(m, false))}</div>
            </div>
          )}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">✨ Seus materiais</p>
            {ownExtras.length === 0 ? (
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-6 text-center"><p className="text-gray-400 text-sm">Você ainda não adicionou materiais. Clique em &quot;Adicionar material&quot;.</p></div>
            ) : (
              <div className="space-y-2">{ownExtras.map((m) => row(m, true))}</div>
            )}
          </div>
        </div>
      )}

      {adding && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => !busy && setAdding(false)}>
          <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-bold text-gray-900">Adicionar material</h3>
              <button type="button" onClick={() => !busy && setAdding(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            <label className="block text-xs font-semibold text-gray-500 mb-1">Tipo</label>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {(Object.keys(kindMeta) as Kind[]).map((k) => (
                <button key={k} type="button" onClick={() => { setKind(k); setFile(null); setLinkUrl('') }}
                  className={`text-xs font-semibold py-2 rounded-xl border transition-colors ${kind === k ? 'bg-[#F0FBFC] border-[#17C3C9] text-[#109CA1]' : 'bg-white border-gray-200 text-gray-500 hover:border-[#CCEFF1]'}`}>
                  {kindMeta[k].icon} {kindMeta[k].label}
                </button>
              ))}
            </div>

            <label className="block text-xs font-semibold text-gray-500 mb-1">Título</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Palestra sobre assédio" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mb-4" />

            {UPLOAD_KINDS.includes(kind) ? (
              <>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Arquivo</label>
                <input ref={fileRef} type="file" accept={acceptFor[kind] ?? '*/*'} onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-800 file:text-white file:text-sm file:font-semibold mb-4" />
              </>
            ) : (
              <>
                <label className="block text-xs font-semibold text-gray-500 mb-1">{kind === 'youtube' ? 'Link do YouTube' : 'Link'}</label>
                <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://…" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mb-4" />
              </>
            )}

            <label className="block text-xs font-semibold text-gray-500 mb-1">Descrição (opcional)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mb-4 resize-none" />

            {busy && progress > 0 && (
              <div className="mb-4"><div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-[#17C3C9] to-[#3F7DE0] transition-all" style={{ width: `${progress}%` }} /></div><p className="text-xs text-gray-400 mt-1">Enviando… {progress}%</p></div>
            )}
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={() => !busy && setAdding(false)} disabled={busy} className="flex-1 border border-gray-200 text-gray-600 font-semibold text-sm py-2.5 rounded-xl hover:bg-gray-50 disabled:opacity-40">Cancelar</button>
              <button type="submit" disabled={busy} className="flex-1 bg-gradient-to-r from-[#17C3C9] to-[#3F7DE0] text-white font-semibold text-sm py-2.5 rounded-xl hover:opacity-90 disabled:opacity-40">{busy ? 'Salvando…' : 'Adicionar'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
