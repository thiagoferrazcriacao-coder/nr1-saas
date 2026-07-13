'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { PROGRAMS } from '@/lib/programs'
import { slotsFor } from '@/lib/video-index'

type Trilha = 'gestor' | 'colaborador'
type Lesson = { id: string; programNum: number; program: string; trilha: Trilha; videoRef: string | null; title: string; description: string | null; videoUrl: string; active: boolean }

export default function AdminVideosPage() {
  const router = useRouter()
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [r2ok, setR2ok] = useState(true)
  const [loading, setLoading] = useState(true)

  const [uploadProgram, setUploadProgram] = useState<number | null>(null)
  const [uploadTrilha, setUploadTrilha] = useState<Trilha>('colaborador')
  const [uploadVideoRef, setUploadVideoRef] = useState<string>('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [fileWarning, setFileWarning] = useState('')   // aviso se o vídeo não tocar no navegador
  const [checking, setChecking] = useState(false)      // testando o vídeo escolhido
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<Lesson | null>(null) // vídeo aberto pra conferir
  const [editId, setEditId] = useState<string | null>(null)   // null = adicionar; id = substituir o vídeo dessa aula
  const [editTitle, setEditTitle] = useState('')              // título da aula que está sendo substituída (referência)

  const fetchLessons = useCallback(() => {
    fetch('/api/admin/lessons')
      .then((r) => { if (r.status === 401) { router.replace('/admin/login'); return null } return r.json() })
      .then((d) => { if (d) { setLessons(d.lessons ?? []); setR2ok(!!d.r2Configured) } })
      .finally(() => setLoading(false))
  }, [router])

  useEffect(() => { fetchLessons() }, [fetchLessons])

  const openUpload = (p: number) => { setEditId(null); setUploadProgram(p); setUploadTrilha('colaborador'); setUploadVideoRef(''); setTitle(''); setDescription(''); setFile(null); setFileWarning(''); setChecking(false); setProgress(0); setError('') }
  const openReplace = (l: Lesson) => { setEditId(l.id); setEditTitle(l.title); setUploadProgram(l.programNum); setUploadTrilha(l.trilha); setFile(null); setFileWarning(''); setChecking(false); setProgress(0); setError('') }
  const closeUpload = () => { if (!uploading) { setUploadProgram(null); setEditId(null) } }

  // Testa se o navegador consegue MOSTRAR a imagem do vídeo (pega .MOV/HEVC do iPhone, que só tem áudio)
  const checkPlayable = (f: File) => {
    setFileWarning('')
    const ext = (f.name.split('.').pop() || '').toLowerCase()
    const risky = ['mov', 'avi', 'wmv', 'mkv', 'flv', 'm4v', '3gp']
    const v = document.createElement('video')
    v.preload = 'metadata'
    let done = false
    const finish = (warn: string) => { if (done) return; done = true; try { URL.revokeObjectURL(v.src) } catch {}; setFileWarning(warn); setChecking(false) }
    const warnMsg = `⚠️ Este arquivo (.${ext}) pode não mostrar imagem no navegador — costuma ser vídeo de celular (iPhone/HEVC). Para garantir, envie em MP4 (H.264).`
    v.onloadeddata = () => finish(v.videoWidth > 0 ? '' : warnMsg)
    v.onerror = () => finish(`⚠️ Não foi possível ler este vídeo. Envie em MP4 (H.264) para tocar em qualquer aparelho.`)
    setTimeout(() => finish(v.videoWidth > 0 ? '' : (risky.includes(ext) ? warnMsg : '')), 5000)
    v.src = URL.createObjectURL(f)
  }

  const onPickFile = (f: File | null) => { setFile(f); setFileWarning(''); if (f) { setChecking(true); checkPlayable(f) } }

  const readDuration = (f: File): Promise<number> =>
    new Promise((resolve) => {
      try {
        const v = document.createElement('video'); v.preload = 'metadata'
        v.onloadedmetadata = () => { URL.revokeObjectURL(v.src); resolve(Math.round(v.duration || 0)) }
        v.onerror = () => resolve(0); v.src = URL.createObjectURL(f)
      } catch { resolve(0) }
    })

  // Envia o arquivo pro R2 e devolve a URL pública + duração
  const uploadToR2 = async (f: File): Promise<{ publicUrl: string; durationSec: number }> => {
    const urlRes = await fetch('/api/admin/lessons/upload-url', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filename: f.name, contentType: f.type || 'video/mp4' }) })
    const urlData = await urlRes.json()
    if (!urlRes.ok) throw new Error(urlData.error ?? 'Falha ao preparar o upload.')
    const durationSec = await readDuration(f)
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('PUT', urlData.uploadUrl); xhr.setRequestHeader('Content-Type', f.type || 'video/mp4')
      xhr.upload.onprogress = (ev) => { if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 100)) }
      xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error('Falha no envio.')))
      xhr.onerror = () => reject(new Error('Falha no envio.')); xhr.send(f)
    })
    return { publicUrl: urlData.publicUrl, durationSec }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    if (uploadProgram == null) return
    if (!file) { setError('Escolha um arquivo de vídeo.'); return }
    if (!editId && !title.trim()) { setError('Dê um título à aula.'); return }
    setUploading(true); setProgress(0)
    try {
      const { publicUrl, durationSec } = await uploadToR2(file)
      if (editId) {
        // Substituir o vídeo da aula (mantém título, posição, etc.)
        const res = await fetch(`/api/admin/lessons/${editId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ videoUrl: publicUrl, durationSec }) })
        if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Falha ao substituir.'); setUploading(false); return }
      } else {
        // Criar nova aula
        const res = await fetch('/api/admin/lessons', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ programNum: uploadProgram, trilha: uploadTrilha, videoRef: uploadVideoRef || undefined, title: title.trim(), description: description.trim() || undefined, videoUrl: publicUrl, durationSec }) })
        if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Falha ao salvar.'); setUploading(false); return }
      }
      setUploadProgram(null); setEditId(null); fetchLessons()
    } catch (err) { setError((err as Error).message || 'Erro no upload.') } finally { setUploading(false) }
  }

  const toggleActive = async (l: Lesson) => { await fetch(`/api/admin/lessons/${l.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !l.active }) }); fetchLessons() }
  const editLesson = async (l: Lesson) => {
    const t = window.prompt('Título da aula:', l.title); if (t === null) return
    const d = window.prompt('Descrição (opcional):', l.description ?? '')
    await fetch(`/api/admin/lessons/${l.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: t.trim() || l.title, description: (d ?? '').trim() || null }) }); fetchLessons()
  }
  const deleteLesson = async (l: Lesson) => { if (!confirm(`Excluir "${l.title}"? O progresso dos colaboradores nela também será removido.`)) return; await fetch(`/api/admin/lessons/${l.id}`, { method: 'DELETE' }); fetchLessons() }

  if (loading) {
    return <div className="flex justify-center py-24"><div className="w-10 h-10 border-4 border-primary-800 border-t-transparent rounded-full animate-spin" /></div>
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Gerenciar Vídeos</h1>
        <p className="text-gray-500 mt-1">A biblioteca de vídeo-aulas que <strong>todas as empresas</strong> assistem. Monte por tema.</p>
      </div>

      {!r2ok && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-amber-900 font-semibold text-sm">⚠️ Envio de vídeos indisponível</p>
          <p className="text-amber-800 text-sm mt-1">O armazenamento (R2) ainda não foi configurado.</p>
        </div>
      )}

      <div>
        <p className="text-gray-500 text-sm mb-3">{lessons.length} vídeo{lessons.length !== 1 ? 's' : ''} em {PROGRAMS.length} temas.</p>
        <div className="space-y-3">
          {PROGRAMS.map((p) => {
            const ls = lessons.filter((l) => l.programNum === p.num)
            return (
              <div key={p.num} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="flex items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-[#F6F9FC] to-white border-b border-gray-100">
                  <div className="min-w-0">
                    <p className="font-bold text-[#0E2A47] truncate">{p.num}. {p.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{ls.length} vídeo{ls.length !== 1 ? 's' : ''}</p>
                  </div>
                  <button onClick={() => openUpload(p.num)} disabled={!r2ok} className="flex-shrink-0 text-sm font-semibold text-[#109CA1] border border-[#CCEFF1] bg-[#F0FBFC] px-3 py-2 rounded-xl hover:bg-[#E0F5F6] transition-colors disabled:opacity-40">➕ Adicionar vídeo</button>
                </div>
                <div className="px-5 py-3">
                  {ls.length === 0 ? (
                    <p className="text-gray-400 text-sm py-1">Nenhum vídeo neste tema ainda.</p>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {ls.map((l, i) => (
                        <div key={l.id} className="flex items-center justify-between gap-3 py-2.5">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="w-7 h-7 rounded-lg bg-gray-100 text-gray-500 text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                            <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${l.trilha === 'gestor' ? 'bg-indigo-50 text-indigo-600' : 'bg-teal-50 text-teal-700'}`}>{l.trilha === 'gestor' ? '👔 Gestor' : '👥 Colab.'}</span>
                            <p className={`text-sm font-medium truncate ${l.active ? 'text-gray-800' : 'text-gray-400 line-through'}`}>{l.title}</p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button onClick={() => setPreview(l)} title="Ver o vídeo" className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-[#CCEFF1] bg-[#F0FBFC] text-[#109CA1] hover:bg-[#E0F5F6]">▶ Ver</button>
                            <button onClick={() => openReplace(l)} disabled={!r2ok} title="Substituir o vídeo" className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:opacity-40">🔄 Substituir</button>
                            <button onClick={() => toggleActive(l)} title={l.active ? 'Desativar' : 'Ativar'} className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50">{l.active ? '👁️' : '🚫'}</button>
                            <button onClick={() => editLesson(l)} title="Editar" className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50">✏️</button>
                            <button onClick={() => deleteLesson(l)} title="Excluir" className="text-xs px-2.5 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50">🗑️</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Conferir o vídeo cadastrado */}
      {preview && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-gray-100">
              <div className="min-w-0">
                <p className="text-xs text-[#109CA1] font-bold">{preview.program}</p>
                <h3 className="font-bold text-gray-900 truncate">{preview.title}</h3>
              </div>
              <button onClick={() => setPreview(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none flex-shrink-0">×</button>
            </div>
            <div className="bg-black">
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video key={preview.id} src={preview.videoUrl} controls autoPlay className="w-full max-h-[70vh]" />
            </div>
            <div className="px-5 py-3 flex items-center justify-between gap-3 flex-wrap">
              <a href={preview.videoUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-gray-600 break-all">{preview.videoUrl}</a>
              <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${preview.active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{preview.active ? 'Ativo' : 'Desativado'}</span>
            </div>
          </div>
        </div>
      )}

      {uploadProgram != null && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={closeUpload}>
          <form onSubmit={handleUpload} onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs text-[#109CA1] font-bold">{PROGRAMS.find((p) => p.num === uploadProgram)?.name}</p>
                <h3 className="font-bold text-gray-900">{editId ? 'Substituir vídeo' : 'Adicionar vídeo-aula'}</h3>
              </div>
              <button type="button" onClick={closeUpload} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            {editId ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 mb-4">
                <p className="text-amber-800 text-xs leading-relaxed">Trocando o vídeo da aula <strong>&quot;{editTitle}&quot;</strong>. O título e a posição continuam os mesmos — só o arquivo do vídeo muda.</p>
              </div>
            ) : (<>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Trilha</label>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button type="button" onClick={() => { setUploadTrilha('colaborador'); setUploadVideoRef('') }} className={`text-sm font-semibold py-2.5 rounded-xl border transition-colors ${uploadTrilha === 'colaborador' ? 'bg-teal-50 border-teal-300 text-teal-700' : 'bg-white border-gray-200 text-gray-500 hover:border-teal-200'}`}>👥 Colaborador</button>
                <button type="button" onClick={() => { setUploadTrilha('gestor'); setUploadVideoRef('') }} className={`text-sm font-semibold py-2.5 rounded-xl border transition-colors ${uploadTrilha === 'gestor' ? 'bg-indigo-50 border-indigo-300 text-indigo-600' : 'bg-white border-gray-200 text-gray-500 hover:border-indigo-200'}`}>👔 Gestor</button>
              </div>
              {uploadProgram != null && (
                <>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Aula do Índice de Vídeos <span className="font-normal text-gray-400">(vincula o vídeo ao tema planejado)</span></label>
                  <select value={uploadVideoRef} onChange={(e) => {
                    const ref = e.target.value
                    setUploadVideoRef(ref)
                    const slot = slotsFor(uploadProgram, uploadTrilha).find((s) => s.key === ref)
                    if (slot) setTitle(slot.title)
                  }} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mb-4 bg-white">
                    <option value="">— Avulso (sem vincular ao índice) —</option>
                    {slotsFor(uploadProgram, uploadTrilha).map((s) => (
                      <option key={s.key} value={s.key}>{s.key} · {s.author} — {s.title}</option>
                    ))}
                  </select>
                </>
              )}
              <label className="block text-xs font-semibold text-gray-500 mb-1">Título da aula</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Aula 1 — Introdução" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mb-4" />
              <label className="block text-xs font-semibold text-gray-500 mb-1">Descrição (opcional)</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mb-4 resize-none" />
            </>)}
            <label className="block text-xs font-semibold text-gray-500 mb-1">Arquivo de vídeo <span className="font-normal text-gray-400">(de preferência MP4)</span></label>
            <input type="file" accept="video/mp4,video/webm,video/*" onChange={(e) => onPickFile(e.target.files?.[0] ?? null)} className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-800 file:text-white file:text-sm file:font-semibold mb-2" />
            {checking && <div className="mb-4 text-xs text-gray-400">Verificando o vídeo…</div>}
            {!checking && fileWarning && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 mb-4">
                <p className="text-amber-800 text-xs leading-relaxed">{fileWarning}</p>
              </div>
            )}
            {!checking && !fileWarning && file && <div className="mb-4 text-xs text-green-600">✓ Vídeo compatível — vai tocar normalmente.</div>}
            {uploading && (
              <div className="mb-4">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-[#17C3C9] to-[#3F7DE0] transition-all" style={{ width: `${progress}%` }} /></div>
                <p className="text-xs text-gray-400 mt-1">Enviando… {progress}%</p>
              </div>
            )}
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={closeUpload} disabled={uploading} className="flex-1 border border-gray-200 text-gray-600 font-semibold text-sm py-2.5 rounded-xl hover:bg-gray-50 disabled:opacity-40">Cancelar</button>
              <button type="submit" disabled={uploading} className="flex-1 bg-gradient-to-r from-[#17C3C9] to-[#3F7DE0] text-white font-semibold text-sm py-2.5 rounded-xl hover:opacity-90 disabled:opacity-40">{uploading ? 'Enviando…' : editId ? '🔄 Substituir vídeo' : '⬆️ Enviar'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
