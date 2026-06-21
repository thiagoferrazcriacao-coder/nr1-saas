'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PROGRAMS } from '@/lib/programs'

type Lesson = {
  id: string
  programNum: number
  program: string
  title: string
  description: string | null
  videoUrl: string
  durationSec: number
  order: number
  active: boolean
}

export default function AdminVideosPage() {
  const router = useRouter()
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [r2ok, setR2ok] = useState(true)

  // formulário de upload
  const [programNum, setProgramNum] = useState(1)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')

  const fetchLessons = useCallback(() => {
    fetch('/api/admin/lessons')
      .then((r) => {
        if (r.status === 401) { router.replace('/admin/login'); return null }
        return r.json()
      })
      .then((data) => {
        if (data) { setLessons(data.lessons ?? []); setR2ok(!!data.r2Configured) }
      })
      .finally(() => setLoading(false))
  }, [router])

  useEffect(() => { fetchLessons() }, [fetchLessons])

  // Lê a duração do vídeo escolhido (para guardar junto)
  const readDuration = (f: File): Promise<number> =>
    new Promise((resolve) => {
      try {
        const v = document.createElement('video')
        v.preload = 'metadata'
        v.onloadedmetadata = () => { URL.revokeObjectURL(v.src); resolve(Math.round(v.duration || 0)) }
        v.onerror = () => resolve(0)
        v.src = URL.createObjectURL(f)
      } catch { resolve(0) }
    })

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!file) { setError('Escolha um arquivo de vídeo.'); return }
    if (!title.trim()) { setError('Dê um título à aula.'); return }

    setUploading(true)
    setProgress(0)
    try {
      // 1) Pede o link de upload
      const urlRes = await fetch('/api/admin/lessons/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type || 'video/mp4' }),
      })
      const urlData = await urlRes.json()
      if (!urlRes.ok) { setError(urlData.error ?? 'Falha ao preparar o upload.'); setUploading(false); return }

      const durationSec = await readDuration(file)

      // 2) Envia o arquivo direto ao R2 (com barra de progresso)
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('PUT', urlData.uploadUrl)
        xhr.setRequestHeader('Content-Type', file.type || 'video/mp4')
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 100))
        }
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error('Falha no envio.')))
        xhr.onerror = () => reject(new Error('Falha no envio.'))
        xhr.send(file)
      })

      // 3) Cria a aula no sistema
      const createRes = await fetch('/api/admin/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programNum, title: title.trim(),
          description: description.trim() || undefined,
          videoUrl: urlData.publicUrl, durationSec,
        }),
      })
      if (!createRes.ok) { const d = await createRes.json(); setError(d.error ?? 'Falha ao salvar a aula.'); setUploading(false); return }

      setTitle(''); setDescription(''); setFile(null); setProgress(0)
      fetchLessons()
    } catch (err) {
      setError((err as Error).message || 'Erro no upload.')
    } finally {
      setUploading(false)
    }
  }

  const toggleActive = async (l: Lesson) => {
    await fetch(`/api/admin/lessons/${l.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !l.active }),
    })
    fetchLessons()
  }

  const editLesson = async (l: Lesson) => {
    const novoTitulo = window.prompt('Título da aula:', l.title)
    if (novoTitulo === null) return
    const novaDesc = window.prompt('Descrição (opcional):', l.description ?? '')
    await fetch(`/api/admin/lessons/${l.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: novoTitulo.trim() || l.title, description: (novaDesc ?? '').trim() || null }),
    })
    fetchLessons()
  }

  const deleteLesson = async (l: Lesson) => {
    if (!confirm(`Excluir a aula "${l.title}"? O progresso dos colaboradores nela também será removido.`)) return
    await fetch(`/api/admin/lessons/${l.id}`, { method: 'DELETE' })
    fetchLessons()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center"><span className="text-lg">🎬</span></div>
          <div>
            <p className="font-bold text-white text-sm">Material Didático</p>
            <p className="text-slate-400 text-xs">Biblioteca de vídeos (compartilhada)</p>
          </div>
        </div>
        <Link href="/admin" className="text-slate-400 hover:text-white text-sm transition-colors">← Empresas</Link>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {!r2ok && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-6">
            <p className="text-amber-300 font-semibold text-sm">⚠️ Armazenamento de vídeos não configurado</p>
            <p className="text-amber-200/80 text-sm mt-1">
              Para fazer upload, é preciso configurar as chaves do Cloudflare R2 nas variáveis de ambiente
              (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL).
            </p>
          </div>
        )}

        {/* Formulário de upload */}
        <form onSubmit={handleUpload} className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-8">
          <h2 className="font-bold text-lg mb-4">➕ Adicionar vídeo</h2>
          <label className="block text-xs font-semibold text-slate-400 mb-1">Programa</label>
          <select value={programNum} onChange={(e) => setProgramNum(Number(e.target.value))}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm mb-4">
            {PROGRAMS.map((p) => <option key={p.num} value={p.num}>{p.num}. {p.name}</option>)}
          </select>

          <label className="block text-xs font-semibold text-slate-400 mb-1">Título da aula</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Aula 1 — Reconhecendo o estresse"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm mb-4" />

          <label className="block text-xs font-semibold text-slate-400 mb-1">Descrição (opcional)</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm mb-4 resize-none" />

          <label className="block text-xs font-semibold text-slate-400 mb-1">Arquivo de vídeo</label>
          <input type="file" accept="video/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm text-slate-300 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white file:text-sm file:font-semibold mb-4" />

          {uploading && (
            <div className="mb-4">
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-slate-400 mt-1">Enviando… {progress}%</p>
            </div>
          )}
          {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

          <button type="submit" disabled={uploading || !r2ok}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            {uploading ? 'Enviando…' : '⬆️ Enviar vídeo'}
          </button>
        </form>

        {/* Biblioteca por programa */}
        <h2 className="font-bold text-lg mb-4">📚 Biblioteca ({lessons.length} vídeos)</h2>
        <div className="space-y-5">
          {PROGRAMS.map((p) => {
            const ls = lessons.filter((l) => l.programNum === p.num)
            return (
              <div key={p.num} className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
                <p className="font-semibold text-sm text-indigo-300 mb-3">{p.num}. {p.name}</p>
                {ls.length === 0 ? (
                  <p className="text-slate-500 text-sm">Nenhum vídeo neste programa ainda.</p>
                ) : (
                  <div className="space-y-2">
                    {ls.map((l) => (
                      <div key={l.id} className="flex items-center justify-between gap-3 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3">
                        <div className="min-w-0">
                          <p className={`text-sm font-medium truncate ${l.active ? 'text-white' : 'text-slate-500 line-through'}`}>{l.title}</p>
                          {l.description && <p className="text-xs text-slate-500 truncate">{l.description}</p>}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => toggleActive(l)} title={l.active ? 'Desativar' : 'Ativar'}
                            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700">
                            {l.active ? '👁️' : '🚫'}
                          </button>
                          <button onClick={() => editLesson(l)} title="Editar"
                            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700">✏️</button>
                          <button onClick={() => deleteLesson(l)} title="Excluir"
                            className="text-xs px-2.5 py-1.5 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10">🗑️</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
