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

  const [step, setStep] = useState<'login' | 'curso'>('login')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [companyName, setCompanyName] = useState('')
  const [employeeId, setEmployeeId] = useState('')
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [current, setCurrent] = useState<Lesson | null>(null)

  // Reentra automaticamente se já cadastrou neste aparelho
  useEffect(() => {
    const saved = localStorage.getItem(`aprender:${slug}`)
    if (saved) {
      try {
        const { email: e, name: n } = JSON.parse(saved)
        if (e) { setEmail(e); setName(n ?? ''); void doRegister(e, n) }
      } catch { /* ignora */ }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  const doRegister = useCallback(async (e: string, n?: string) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/aprender/${slug}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: e, name: n }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Não foi possível entrar.'); return }
      setCompanyName(data.companyName)
      setEmployeeId(data.employeeId)
      setLessons(data.lessons)
      setStep('curso')
      localStorage.setItem(`aprender:${slug}`, JSON.stringify({ email: e, name: n ?? data.employeeName ?? '' }))
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }, [slug])

  const handleLogin = (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!email.trim()) { setError('Digite seu e-mail.'); return }
    void doRegister(email.trim(), name.trim() || undefined)
  }

  // ─── Player com medição de progresso ──────────────────────────────────────
  const videoRef = useRef<HTMLVideoElement>(null)
  const lastSent = useRef<{ pct: number; at: number }>({ pct: 0, at: 0 })

  const sendProgress = useCallback(async (lessonId: string, percent: number) => {
    try {
      const res = await fetch('/api/aprender/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId, lessonId, percent }),
      })
      if (res.ok) {
        const d = await res.json()
        setLessons((prev) => prev.map((l) => l.id === lessonId ? { ...l, percent: d.percent, completed: d.completed } : l))
        setCurrent((c) => c && c.id === lessonId ? { ...c, percent: d.percent, completed: d.completed } : c)
      }
    } catch { /* silencioso */ }
  }, [employeeId])

  const onTimeUpdate = useCallback(() => {
    const v = videoRef.current
    if (!v || !current || !v.duration) return
    const pct = Math.min(100, Math.round((v.currentTime / v.duration) * 100))
    const now = Date.now()
    // envia quando sobe >=3% e passaram >=4s (evita excesso de chamadas)
    if (pct >= lastSent.current.pct + 3 && now - lastSent.current.at > 4000) {
      lastSent.current = { pct, at: now }
      void sendProgress(current.id, pct)
    }
  }, [current, sendProgress])

  const onEnded = useCallback(() => {
    if (current) { lastSent.current = { pct: 100, at: Date.now() }; void sendProgress(current.id, 100) }
  }, [current, sendProgress])

  const openLesson = (l: Lesson) => {
    lastSent.current = { pct: l.percent, at: 0 }
    setCurrent(l)
  }

  // ─── Telas ─────────────────────────────────────────────────────────────────

  if (step === 'login') {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <form onSubmit={handleLogin} style={{ background: '#fff', borderRadius: 18, boxShadow: '0 10px 40px rgba(0,0,0,.06)', padding: 28, width: '100%', maxWidth: 380 }}>
          <div style={{ textAlign: 'center', marginBottom: 18 }}>
            <div style={{ fontSize: 34 }}>🎓</div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1e3a8a', marginTop: 6 }}>Material Didático NR-1</h1>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Entre com seu e-mail para assistir aos vídeos.</p>
          </div>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Seu nome</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo"
            style={{ width: '100%', padding: '11px 14px', border: '1px solid #e2e8f0', borderRadius: 10, marginTop: 5, marginBottom: 14, fontSize: 14 }} />
          <label style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Seu e-mail *</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="voce@empresa.com" required
            style={{ width: '100%', padding: '11px 14px', border: '1px solid #e2e8f0', borderRadius: 10, marginTop: 5, fontSize: 14 }} />
          {error && <p style={{ color: '#dc2626', fontSize: 12, marginTop: 10 }}>{error}</p>}
          <button type="submit" disabled={loading}
            style={{ width: '100%', marginTop: 18, background: '#1e40af', color: '#fff', border: 'none', padding: '12px', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: loading ? .6 : 1 }}>
            {loading ? 'Entrando...' : 'Entrar e assistir'}
          </button>
          <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 14, textAlign: 'center' }}>
            Seu progresso é registrado para fins de comprovação de treinamento.
          </p>
        </form>
      </div>
    )
  }

  // Player aberto
  if (current) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f1e2e', color: '#fff' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '16px 16px 40px' }}>
          <button onClick={() => setCurrent(null)} style={{ background: 'none', border: 'none', color: '#93c5fd', fontSize: 14, cursor: 'pointer', padding: '8px 0' }}>
            ← Voltar aos vídeos
          </button>
          <div style={{ background: '#000', borderRadius: 12, overflow: 'hidden' }}>
            <video ref={videoRef} src={current.videoUrl} controls playsInline onTimeUpdate={onTimeUpdate} onEnded={onEnded}
              style={{ width: '100%', display: 'block', maxHeight: '60vh', background: '#000' }} />
          </div>
          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 12, color: '#7dd3fc', textTransform: 'uppercase', letterSpacing: '.5px' }}>Programa {current.programNum} · {current.program}</p>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginTop: 4 }}>{current.title}</h2>
            {current.description && <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 8, lineHeight: 1.6 }}>{current.description}</p>}
            <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,.12)', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ width: `${current.percent}%`, height: '100%', background: current.completed ? '#22c55e' : '#3b82f6', transition: 'width .4s' }} />
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

  // Lista de vídeos
  const concluidos = lessons.filter((l) => l.completed).length
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px 48px' }}>
        <div style={{ marginBottom: 18 }}>
          <p style={{ fontSize: 13, color: '#64748b' }}>{companyName} · Material Didático NR-1</p>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', marginTop: 2 }}>Seus vídeos</h1>
          <p style={{ fontSize: 13, color: '#475569', marginTop: 6 }}>
            {concluidos} de {lessons.length} concluído{concluidos !== 1 ? 's' : ''} · um vídeo conta como concluído ao atingir 90%.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {lessons.map((l) => (
            <button key={l.id} onClick={() => openLesson(l)}
              style={{ textAlign: 'left', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 16, cursor: 'pointer', display: 'flex', gap: 14, alignItems: 'center' }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: l.completed ? '#dcfce7' : '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 22 }}>
                {l.completed ? '✅' : '▶️'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 11, color: '#2563eb', fontWeight: 600 }}>Programa {l.programNum} · {l.program}</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>{l.title}</p>
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 6, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${l.percent}%`, height: '100%', background: l.completed ? '#22c55e' : '#3b82f6' }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: l.completed ? '#16a34a' : '#64748b', minWidth: 38, textAlign: 'right' }}>{l.percent}%</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
