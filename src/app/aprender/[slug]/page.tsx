'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'

type Lesson = {
  id: string
  programNum: number
  program: string
  title: string
  description: string | null
  videoUrl: string
  percent: number
  completed: boolean
}

export default function AprenderPage() {
  const params = useParams()
  const slug = params.slug as string

  const [step, setStep] = useState<'carregando' | 'auth' | 'curso'>('carregando')
  const [mode, setMode] = useState<'login' | 'signup'>('signup')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const [companyName, setCompanyName] = useState('')
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [current, setCurrent] = useState<Lesson | null>(null)

  const applyPayload = (data: { companyName: string; lessons: Lesson[] }) => {
    setCompanyName(data.companyName)
    setLessons(data.lessons)
    setStep('curso')
  }

  // Sessão já existente?
  useEffect(() => {
    fetch(`/api/aprender/${slug}/me`)
      .then((r) => r.json())
      .then((d) => { if (d.loggedIn) applyPayload(d); else setStep('auth') })
      .catch(() => setStep('auth'))
  }, [slug])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password) { setError('Preencha e-mail e senha.'); return }
    if (mode === 'signup' && !name.trim()) { setError('Digite seu nome.'); return }
    setBusy(true)
    try {
      const endpoint = mode === 'signup' ? 'signup' : 'login'
      const body = mode === 'signup'
        ? { name: name.trim(), email: email.trim(), password }
        : { email: email.trim(), password }
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

  // Ao abrir o vídeo: retoma de onde parou e impede avançar além do já assistido
  const onLoadedMetadata = useCallback(() => {
    const v = videoRef.current
    if (!v || !current || !v.duration) return
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
    if (v.currentTime > maxWatched.current) { maxWatched.current = v.currentTime; setMaxSec(v.currentTime) } // avança o ponto assistido
    setCurTime(v.currentTime)
    const pct = Math.min(100, Math.round((v.currentTime / v.duration) * 100))
    const now = Date.now()
    if (pct >= lastSent.current.pct + 3 && now - lastSent.current.at > 4000) {
      lastSent.current = { pct, at: now }
      void sendProgress(current.id, pct)
    }
  }, [current, sendProgress])

  const onEnded = useCallback(() => {
    if (current) { lastSent.current = { pct: 100, at: Date.now() }; void sendProgress(current.id, 100) }
  }, [current, sendProgress])

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
            <div style={{ fontSize: 34 }}>🎓</div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0E2A47', marginTop: 6 }}>Material Didático NR-1</h1>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
              {mode === 'signup' ? 'Crie sua conta para assistir aos vídeos.' : 'Entre na sua conta.'}
            </p>
          </div>

          {mode === 'signup' && (<>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Seu nome</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo"
              style={{ width: '100%', padding: '11px 14px', border: '1px solid #e2e8f0', borderRadius: 10, marginTop: 5, marginBottom: 14, fontSize: 14 }} />
          </>)}

          <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>E-mail</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="voce@empresa.com" required
            style={{ width: '100%', padding: '11px 14px', border: '1px solid #e2e8f0', borderRadius: 10, marginTop: 5, marginBottom: 14, fontSize: 14 }} />

          <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Senha</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••" required
            style={{ width: '100%', padding: '11px 14px', border: '1px solid #e2e8f0', borderRadius: 10, marginTop: 5, fontSize: 14 }} />

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
          <button onClick={() => setCurrent(null)} style={{ background: 'none', border: 'none', color: '#7dd3fc', fontSize: 14, cursor: 'pointer', padding: '8px 0' }}>← Voltar aos vídeos</button>
          <div ref={wrapRef} style={{ position: 'relative', background: '#000', borderRadius: 12, overflow: 'hidden' }}>
            <video ref={videoRef} src={current.videoUrl} playsInline
              onClick={togglePlay} onContextMenu={(e) => e.preventDefault()}
              onLoadedMetadata={onLoadedMetadata} onSeeking={onSeeking} onTimeUpdate={onTimeUpdate} onEnded={onEnded}
              onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
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

  // Agrupa por tema (as aulas já vêm ordenadas por programa)
  const modules: { programNum: number; program: string; items: Lesson[] }[] = []
  for (const l of lessons) {
    let m = modules.find((x) => x.programNum === l.programNum)
    if (!m) { m = { programNum: l.programNum, program: l.program, items: [] }; modules.push(m) }
    m.items.push(l)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 16px 48px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, gap: 12 }}>
          <div>
            <p style={{ fontSize: 13, color: '#64748b' }}>{companyName} · Material Didático NR-1</p>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', marginTop: 2 }}>Sua jornada de aprendizado</h1>
          </div>
          <button onClick={logout} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 10, padding: '7px 14px', fontSize: 13, color: '#64748b', cursor: 'pointer', flexShrink: 0 }}>Sair</button>
        </div>

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

        {total === 0 ? (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 32, textAlign: 'center', color: '#64748b', fontSize: 14 }}>
            Ainda não há aulas disponíveis. Volte em breve!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {modules.map((m, mi) => {
              const mTotal = m.items.length
              const mDone = m.items.filter((l) => l.completed).length
              const mPct = mTotal ? Math.round(m.items.reduce((s, l) => s + l.percent, 0) / mTotal) : 0
              return (
                <div key={m.programNum}>
                  {/* Cabeçalho do módulo */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px' }}>Módulo {mi + 1}</p>
                      <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>{m.program}</h2>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span style={{ fontSize: 12, color: '#64748b' }}>{mDone}/{mTotal} · {mPct}%</span>
                      <div style={{ width: 110, height: 6, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden', marginTop: 4 }}>
                        <div style={{ width: `${mPct}%`, height: '100%', background: mPct >= 90 ? '#22c55e' : '#17C3C9' }} />
                      </div>
                    </div>
                  </div>

                  {/* Aulas do módulo */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {m.items.map((l, i) => (
                      <button key={l.id} onClick={() => openLesson(l)} style={{ textAlign: 'left', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 14, cursor: 'pointer', display: 'flex', gap: 13, alignItems: 'center' }}>
                        <div style={{ width: 42, height: 42, borderRadius: 11, background: l.completed ? '#dcfce7' : '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 20 }}>{l.completed ? '✅' : '▶️'}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}><span style={{ color: '#94a3b8' }}>Aula {i + 1} · </span>{l.title}</p>
                          <div style={{ marginTop: 7, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ flex: 1, height: 6, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}><div style={{ width: `${l.percent}%`, height: '100%', background: l.completed ? '#22c55e' : '#17C3C9' }} /></div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: l.completed ? '#16a34a' : '#64748b', minWidth: 38, textAlign: 'right' }}>{l.percent}%</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
