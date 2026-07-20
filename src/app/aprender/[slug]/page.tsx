'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { FACTOR_NAMES, FACTOR_NUMS, slotsFor } from '@/lib/video-index'

type Lesson = {
  id: string
  programNum: number
  program: string
  trilha?: string
  videoRef?: string | null
  title: string
  description: string | null
  videoUrl: string
  percent: number
  completed: boolean
}

type MaterialKind = 'video' | 'youtube' | 'ebook' | 'image' | 'file' | 'link'
type Material = { id: string; kind: MaterialKind; title: string; description: string | null; url: string; opened: boolean }
const materialIcon: Record<MaterialKind, string> = { video: '🎬', youtube: '▶️', ebook: '📕', image: '🖼️', file: '📎', link: '🔗' }

export default function AprenderPage() {
  const params = useParams()
  const slug = params.slug as string

  // Material Didático liberado só a partir de 27/07/2026
  const locked = Date.now() < new Date('2026-07-27T00:00:00-03:00').getTime()

  const [step, setStep] = useState<'carregando' | 'auth' | 'curso'>('carregando')
  const [mode, setMode] = useState<'login' | 'signup'>('signup')
  const [name, setName] = useState('')
  const [cpf, setCpf] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [identifier, setIdentifier] = useState('') // login: e-mail OU CPF
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const [companyName, setCompanyName] = useState('')
  const [role, setRole] = useState<'gestor' | 'colaborador'>('colaborador')
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [current, setCurrent] = useState<Lesson | null>(null)

  const applyPayload = (data: { companyName: string; lessons: Lesson[]; materials?: Material[]; role?: string }) => {
    setCompanyName(data.companyName)
    setRole(data.role === 'gestor' ? 'gestor' : 'colaborador')
    setLessons(data.lessons)
    setMaterials(data.materials ?? [])
    setStep('curso')
  }

  const openMaterial = (m: Material) => {
    window.open(m.url, '_blank', 'noopener,noreferrer')
    fetch('/api/aprender/material-open', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ materialId: m.id }),
    }).catch(() => {})
    setMaterials((prev) => prev.map((x) => (x.id === m.id ? { ...x, opened: true } : x)))
  }

  // Sessão já existente?
  useEffect(() => {
    fetch(`/api/aprender/${slug}/me`)
      .then((r) => r.json())
      .then((d) => {
        if (d.role) setRole(d.role === 'gestor' ? 'gestor' : 'colaborador')
        if (d.companyName) setCompanyName(d.companyName)
        if (d.loggedIn) applyPayload(d); else setStep('auth')
      })
      .catch(() => setStep('auth'))
  }, [slug])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (mode === 'signup') {
      if (!name.trim()) { setError('Digite seu nome completo.'); return }
      if (!cpf.trim()) { setError('Informe o CPF.'); return }
      if (!phone.trim()) { setError('Informe o WhatsApp.'); return }
      if (!email.trim() || !password) { setError('Preencha e-mail e senha.'); return }
    } else {
      if (!identifier.trim() || !password) { setError('Informe e-mail ou CPF e a senha.'); return }
    }
    setBusy(true)
    try {
      const endpoint = mode === 'signup' ? 'signup' : 'login'
      const body = mode === 'signup'
        ? { name: name.trim(), cpf: cpf.trim(), phone: phone.trim(), email: email.trim(), password }
        : { identifier: identifier.trim(), password }
      const res = await fetch(`/api/aprender/${slug}/${endpoint}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Não foi possível continuar.'); return }
      applyPayload(data)
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setBusy(false)
    }
  }

  const logout = async () => {
    await fetch(`/api/aprender/${slug}/me`, { method: 'POST' })
    setLessons([]); setCurrent(null); setEmail(''); setPassword(''); setName(''); setStep('auth')
  }

  // ─── Player ────────────────────────────────────────────────────────────────
  const videoRef = useRef<HTMLVideoElement>(null)
  const lastSent = useRef<{ pct: number; at: number }>({ pct: 0, at: 0 })
  const maxWatched = useRef(0) // ponto máximo (em segundos) realmente assistido — trava o "pular pra frente"
  const wrapRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const draggingBar = useRef(false)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [curTime, setCurTime] = useState(0)
  const [dur, setDur] = useState(0)
  const [maxSec, setMaxSec] = useState(0) // até onde já assistiu (pra liberar rever só essa parte)

  const fmt = (s: number) => { if (!isFinite(s) || s < 0) return '0:00'; const m = Math.floor(s / 60); const ss = Math.floor(s % 60); return `${m}:${ss < 10 ? '0' : ''}${ss}` }
  const togglePlay = () => { const v = videoRef.current; if (!v) return; if (v.paused) void v.play(); else v.pause() }
  const toggleMute = () => { const v = videoRef.current; if (!v) return; v.muted = !v.muted; setMuted(v.muted) }
  const toggleFs = () => { const el = wrapRef.current; if (!el) return; if (document.fullscreenElement) void document.exitFullscreen(); else void el.requestFullscreen?.() }

  // Clicar/arrastar a barra: só deixa ir até o ponto já assistido (rever, sim; pular, não)
  const seekFromX = (clientX: number) => {
    const el = barRef.current, v = videoRef.current
    if (!el || !v || !v.duration) return
    const rect = el.getBoundingClientRect()
    const frac = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const target = Math.min(frac * v.duration, maxWatched.current) // trava no máximo assistido
    try { v.currentTime = target } catch {}
    setCurTime(target)
  }
  const onBarDown = (e: React.PointerEvent) => { draggingBar.current = true; try { (e.currentTarget as Element).setPointerCapture(e.pointerId) } catch {}; seekFromX(e.clientX) }
  const onBarMove = (e: React.PointerEvent) => { if (draggingBar.current) seekFromX(e.clientX) }
  const onBarUp = () => { draggingBar.current = false }

  // Trava a velocidade em 1x (bloqueia "acelerar" — inclusive no player nativo do iOS)
  const lockRate = useCallback(() => {
    const v = videoRef.current
    if (v && v.playbackRate !== 1) v.playbackRate = 1
  }, [])

  // Ao abrir o vídeo: retoma de onde parou e impede avançar além do já assistido
  const onLoadedMetadata = useCallback(() => {
    const v = videoRef.current
    if (!v || !current || !v.duration) return
    v.playbackRate = 1
    setDur(v.duration)
    setMuted(v.muted)
    if (current.completed) { maxWatched.current = v.duration; setMaxSec(v.duration); return } // já concluiu: pode rever à vontade
    const resume = (current.percent / 100) * v.duration
    maxWatched.current = resume
    setMaxSec(resume)
    if (resume > 1) { try { v.currentTime = resume } catch {} }
  }, [current])

  // Bloqueia arrastar a barra pra frente (só deixa rever o que já viu)
  const onSeeking = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    if (v.currentTime > maxWatched.current + 1.5) {
      try { v.currentTime = maxWatched.current } catch {}
    }
  }, [])

  const sendProgress = useCallback(async (lessonId: string, percent: number) => {
    try {
      const res = await fetch('/api/aprender/progress', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, percent }),
      })
      if (res.ok) {
        const d = await res.json()
        setLessons((prev) => prev.map((l) => l.id === lessonId ? { ...l, percent: d.percent, completed: d.completed } : l))
        setCurrent((c) => c && c.id === lessonId ? { ...c, percent: d.percent, completed: d.completed } : c)
      }
    } catch {}
  }, [])

  const onTimeUpdate = useCallback(() => {
    const v = videoRef.current
    if (!v || !current || !v.duration) return
    if (v.playbackRate !== 1) v.playbackRate = 1 // garante 1x continuamente (iOS)
    if (v.currentTime > maxWatched.current) { maxWatched.current = v.currentTime; setMaxSec(v.currentTime) } // avança o ponto assistido
    setCurTime(v.currentTime)
    const pct = Math.min(100, Math.round((v.currentTime / v.duration) * 100))
    const now = Date.now()
    if (pct >= lastSent.current.pct + 2 && now - lastSent.current.at > 2500) {
      lastSent.current = { pct, at: now }
      void sendProgress(current.id, pct)
    }
  }, [current, sendProgress])

  // Grava o progresso atual imediatamente (ao pausar / sair / fechar) — não perde o que foi assistido
  const flushProgress = useCallback(() => {
    const v = videoRef.current
    if (!v || !current || !v.duration) return
    const pct = Math.min(100, Math.round((v.currentTime / v.duration) * 100))
    if (pct > lastSent.current.pct) { lastSent.current = { pct, at: Date.now() }; void sendProgress(current.id, pct) }
  }, [current, sendProgress])

  const onEnded = useCallback(() => {
    if (current) { lastSent.current = { pct: 100, at: Date.now() }; void sendProgress(current.id, 100) }
  }, [current, sendProgress])

  // Salva ao trocar de aba/minimizar (mobile fecha o vídeo nessas horas)
  useEffect(() => {
    const onHide = () => { if (document.visibilityState === 'hidden') flushProgress() }
    document.addEventListener('visibilitychange', onHide)
    return () => document.removeEventListener('visibilitychange', onHide)
  }, [flushProgress])

  const openLesson = (l: Lesson) => { lastSent.current = { pct: l.percent, at: 0 }; maxWatched.current = 0; setMaxSec(0); setPlaying(false); setCurTime(0); setDur(0); setCurrent(l) }

  // ─── Telas ───────────────────────────────────────────────────────────────────
  if (step === 'carregando') {
    return <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 36, height: 36, border: '4px solid #cbd5e1', borderTopColor: '#17C3C9', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  }

  if (step === 'auth') {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <form onSubmit={submit} style={{ background: '#fff', borderRadius: 18, boxShadow: '0 10px 40px rgba(0,0,0,.06)', padding: 28, width: '100%', maxWidth: 390 }}>
          <div style={{ textAlign: 'center', marginBottom: 18 }}>
            <div style={{ fontSize: 34 }}>{role === 'gestor' ? '👔' : '🎓'}</div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0E2A47', marginTop: 6 }}>
              {role === 'gestor' ? 'Trilha do Gestor · NR-1' : 'Material Didático NR-1'}
            </h1>
            {companyName && <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{companyName}</p>}
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
              {mode === 'signup'
                ? (role === 'gestor' ? 'Crie sua conta de gestor/líder para assistir.' : 'Crie sua conta para assistir aos vídeos.')
                : 'Entre na sua conta.'}
            </p>
          </div>

          {mode === 'signup' ? (<>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Nome completo</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome completo"
              style={{ width: '100%', padding: '11px 14px', border: '1px solid #e2e8f0', borderRadius: 10, marginTop: 5, marginBottom: 14, fontSize: 14 }} />

            <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>CPF</label>
            <input value={cpf} onChange={(e) => setCpf(e.target.value)} inputMode="numeric" placeholder="000.000.000-00"
              style={{ width: '100%', padding: '11px 14px', border: '1px solid #e2e8f0', borderRadius: 10, marginTop: 5, marginBottom: 14, fontSize: 14 }} />

            <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>WhatsApp</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="(00) 00000-0000"
              style={{ width: '100%', padding: '11px 14px', border: '1px solid #e2e8f0', borderRadius: 10, marginTop: 5, marginBottom: 14, fontSize: 14 }} />

            <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>E-mail</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="voce@empresa.com"
              style={{ width: '100%', padding: '11px 14px', border: '1px solid #e2e8f0', borderRadius: 10, marginTop: 5, marginBottom: 14, fontSize: 14 }} />

            <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Senha</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••"
              style={{ width: '100%', padding: '11px 14px', border: '1px solid #e2e8f0', borderRadius: 10, marginTop: 5, fontSize: 14 }} />
          </>) : (<>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>E-mail ou CPF</label>
            <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="voce@empresa.com ou seu CPF"
              style={{ width: '100%', padding: '11px 14px', border: '1px solid #e2e8f0', borderRadius: 10, marginTop: 5, marginBottom: 14, fontSize: 14 }} />

            <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Senha</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••"
              style={{ width: '100%', padding: '11px 14px', border: '1px solid #e2e8f0', borderRadius: 10, marginTop: 5, fontSize: 14 }} />
          </>)}

          {error && <p style={{ color: '#dc2626', fontSize: 12, marginTop: 10 }}>{error}</p>}

          <button type="submit" disabled={busy}
            style={{ width: '100%', marginTop: 18, background: 'linear-gradient(90deg,#17C3C9,#3F7DE0)', color: '#fff', border: 'none', padding: 12, borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: busy ? .6 : 1 }}>
            {busy ? 'Aguarde…' : mode === 'signup' ? 'Criar conta e entrar' : 'Entrar'}
          </button>

          <p style={{ fontSize: 13, color: '#64748b', marginTop: 14, textAlign: 'center' }}>
            {mode === 'signup' ? 'Já tem conta?' : 'Ainda não tem conta?'}{' '}
            <button type="button" onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setError('') }}
              style={{ background: 'none', border: 'none', color: '#109CA1', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
              {mode === 'signup' ? 'Entrar' : 'Criar conta'}
            </button>
          </p>
          <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 12, textAlign: 'center' }}>Seu progresso é registrado para comprovação de treinamento.</p>
        </form>
      </div>
    )
  }

  // Player aberto
  if (current) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f1e2e', color: '#fff' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '16px 16px 40px' }}>
          <button onClick={() => { flushProgress(); setCurrent(null) }} style={{ background: 'none', border: 'none', color: '#7dd3fc', fontSize: 14, cursor: 'pointer', padding: '8px 0' }}>← Voltar aos vídeos</button>
          <div ref={wrapRef} style={{ position: 'relative', background: '#000', borderRadius: 12, overflow: 'hidden' }}>
            <video ref={videoRef} src={current.videoUrl} playsInline
              onClick={togglePlay} onContextMenu={(e) => e.preventDefault()}
              onLoadedMetadata={onLoadedMetadata} onSeeking={onSeeking} onTimeUpdate={onTimeUpdate} onEnded={onEnded}
              onRateChange={lockRate}
              onPlay={() => { setPlaying(true); lockRate() }} onPause={() => { setPlaying(false); flushProgress() }}
              style={{ width: '100%', display: 'block', maxHeight: '70vh', background: '#000', cursor: 'pointer' }} />

            {/* Controles próprios — SEM barra de arrastar (não dá pra pular pra frente) */}
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '20px 14px 10px', background: 'linear-gradient(transparent, rgba(0,0,0,.75))', display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={togglePlay} aria-label={playing ? 'Pausar' : 'Tocar'} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', lineHeight: 1, width: 28 }}>{playing ? '⏸' : '▶'}</button>
              <span style={{ color: '#fff', fontSize: 12, fontVariantNumeric: 'tabular-nums', minWidth: 78 }}>{fmt(curTime)} / {fmt(dur)}</span>
              {/* barra clicável — só deixa rever (até onde já assistiu); o resto fica travado */}
              <div ref={barRef} onPointerDown={onBarDown} onPointerMove={onBarMove} onPointerUp={onBarUp} onPointerCancel={onBarUp}
                style={{ flex: 1, height: 16, display: 'flex', alignItems: 'center', cursor: 'pointer', touchAction: 'none' }}>
                <div style={{ position: 'relative', width: '100%', height: 5, background: 'rgba(255,255,255,.22)', borderRadius: 3 }}>
                  {/* parte já assistida — liberada pra rever */}
                  <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: dur ? `${Math.min(100, (maxSec / dur) * 100)}%` : '0%', background: 'rgba(255,255,255,.4)', borderRadius: 3 }} />
                  {/* posição atual */}
                  <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: dur ? `${Math.min(100, (curTime / dur) * 100)}%` : '0%', background: '#17C3C9', borderRadius: 3 }} />
                </div>
              </div>
              <button onClick={toggleMute} aria-label="Som" style={{ background: 'none', border: 'none', color: '#fff', fontSize: 16, cursor: 'pointer', lineHeight: 1 }}>{muted ? '🔇' : '🔊'}</button>
              <button onClick={toggleFs} aria-label="Tela cheia" style={{ background: 'none', border: 'none', color: '#fff', fontSize: 16, cursor: 'pointer', lineHeight: 1 }}>⛶</button>
            </div>
          </div>
          <p style={{ fontSize: 12, color: '#7dd3fc', marginTop: 8 }}>🔒 Para registrar sua presença, assista do início — não é possível pular para frente. Rever o que já passou, pode.</p>
          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 12, color: '#7dd3fc', textTransform: 'uppercase', letterSpacing: '.5px' }}>{current.program}</p>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginTop: 4 }}>{current.title}</h2>
            {current.description && <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 8, lineHeight: 1.6 }}>{current.description}</p>}
            <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,.12)', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ width: `${current.percent}%`, height: '100%', background: current.completed ? '#22c55e' : '#17C3C9', transition: 'width .4s' }} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: current.completed ? '#22c55e' : '#cbd5e1', minWidth: 96, textAlign: 'right' }}>
                {current.completed ? '✅ Concluído' : `${current.percent}% assistido`}
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Área de membros (estilo plataforma de estudo)
  const total = lessons.length
  const concluidos = lessons.filter((l) => l.completed).length
  const overall = total ? Math.round(lessons.reduce((s, l) => s + l.percent, 0) / total) : 0

  // Mapa videoRef → aula publicada (para casar com o catálogo do Índice de Vídeos)
  const byRef = new Map(lessons.filter((l) => l.videoRef).map((l) => [l.videoRef as string, l]))
  const authorColor: Record<string, string> = { Rafael: '#4B5CC9', Annie: '#0E8F95', Thiago: '#0E2A47' }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 16px 48px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, gap: 12 }}>
          <div>
            <p style={{ fontSize: 13, color: '#64748b' }}>{companyName} · {role === 'gestor' ? 'Trilha do Gestor' : 'Material Didático'} NR-1</p>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', marginTop: 2 }}>Sua jornada de aprendizado</h1>
          </div>
          <button onClick={logout} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 10, padding: '7px 14px', fontSize: 13, color: '#64748b', cursor: 'pointer', flexShrink: 0 }}>Sair</button>
        </div>

        {locked && (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 40, textAlign: 'center', marginBottom: 22 }}>
            <div style={{ fontSize: 44, marginBottom: 10 }}>🔒</div>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0E2A47' }}>Material Didático em breve</h2>
            <p style={{ color: '#475569', fontSize: 14, marginTop: 8 }}>A partir do dia <strong>27/07/2026</strong>, o material didático estará liberado.</p>
          </div>
        )}

        {!locked && (<>
        {/* Progresso geral do curso */}
        <div style={{ background: 'linear-gradient(120deg,#0E2A47,#143A5E)', borderRadius: 18, padding: 22, color: '#fff', marginBottom: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <div>
              <p style={{ fontSize: 12, color: '#9FC2D6', textTransform: 'uppercase', letterSpacing: '.5px' }}>Seu progresso no curso</p>
              <p style={{ fontSize: 13, color: '#cfe2f0', marginTop: 4 }}>{concluidos} de {total} aula{total !== 1 ? 's' : ''} concluída{concluidos !== 1 ? 's' : ''} · concluído = 90%</p>
            </div>
            <span style={{ fontSize: 34, fontWeight: 900, lineHeight: 1 }}>{overall}%</span>
          </div>
          <div style={{ height: 10, background: 'rgba(255,255,255,.15)', borderRadius: 6, overflow: 'hidden' }}>
            <div style={{ width: `${overall}%`, height: '100%', background: 'linear-gradient(90deg,#17C3C9,#3F7DE0)', transition: 'width .5s' }} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {FACTOR_NUMS.map((num) => {
            const slots = slotsFor(num, role)
            const items = slots.map((s) => ({ slot: s, lesson: byRef.get(s.key) }))
            const avail = items.filter((x) => x.lesson)
            const mPct = avail.length ? Math.round(avail.reduce((s, x) => s + (x.lesson?.percent ?? 0), 0) / avail.length) : 0
            return (
              <div key={num}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px' }}>Fator {num}</p>
                    <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>{FACTOR_NAMES[num]}</h2>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span style={{ fontSize: 12, color: '#64748b' }}>{avail.length}/{slots.length} disponível{avail.length !== 1 ? 'is' : ''}</span>
                    <div style={{ width: 110, height: 6, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden', marginTop: 4 }}>
                      <div style={{ width: `${mPct}%`, height: '100%', background: mPct >= 90 ? '#22c55e' : '#17C3C9' }} />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {items.map(({ slot, lesson }, i) => lesson ? (
                    <button key={slot.key} onClick={() => openLesson(lesson)} style={{ textAlign: 'left', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 14, cursor: 'pointer', display: 'flex', gap: 13, alignItems: 'center' }}>
                      <div style={{ width: 42, height: 42, borderRadius: 11, background: lesson.completed ? '#dcfce7' : '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 20 }}>{lesson.completed ? '✅' : '▶️'}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}><span style={{ color: '#94a3b8' }}>Aula {i + 1} · </span>{slot.title}</p>
                        <p style={{ fontSize: 12, marginTop: 2 }}><span style={{ color: authorColor[slot.author], fontWeight: 700 }}>{slot.author}</span></p>
                        <div style={{ marginTop: 7, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 6, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}><div style={{ width: `${lesson.percent}%`, height: '100%', background: lesson.completed ? '#22c55e' : '#17C3C9' }} /></div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: lesson.completed ? '#16a34a' : '#64748b', minWidth: 38, textAlign: 'right' }}>{lesson.percent}%</span>
                        </div>
                      </div>
                    </button>
                  ) : (
                    <div key={slot.key} style={{ background: '#fff', border: '1px dashed #e2e8f0', borderRadius: 14, padding: 14, display: 'flex', gap: 13, alignItems: 'center', opacity: .7 }}>
                      <div style={{ width: 42, height: 42, borderRadius: 11, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>⏳</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: '#475569' }}><span style={{ color: '#94a3b8' }}>Aula {i + 1} · </span>{slot.title}</p>
                        <p style={{ fontSize: 12, marginTop: 2, color: '#94a3b8' }}><span style={{ color: authorColor[slot.author], fontWeight: 700 }}>{slot.author}</span> · em breve</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        </>)}

        {/* Materiais complementares (ebooks e extras enviados pela empresa) */}
        {!locked && materials.length > 0 && (
          <div style={{ marginTop: 28 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>📎 Materiais complementares</h2>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>Conteúdos extras enviados pela empresa. Abrir registra a sua leitura.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {materials.map((m) => (
                <button key={m.id} onClick={() => openMaterial(m)} style={{ textAlign: 'left', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 14, cursor: 'pointer', display: 'flex', gap: 13, alignItems: 'center' }}>
                  <div style={{ width: 42, height: 42, borderRadius: 11, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 20 }}>{materialIcon[m.kind]}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{m.title}</p>
                    {m.description && <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{m.description}</p>}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: m.opened ? '#16a34a' : '#94a3b8', flexShrink: 0 }}>{m.opened ? '✅ aberto' : 'abrir →'}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
