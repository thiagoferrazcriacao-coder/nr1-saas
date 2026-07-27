'use client'

import { useRef, useState } from 'react'

// O autoplay começa mudo porque iOS/Android bloqueiam autoplay com áudio.
// No toque do usuário, o som é ativado removendo também o defaultMuted/atributo muted.
export default function HeroVideo({ src, poster, loop = false }: { src?: string; poster?: string; loop?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [muted, setMuted] = useState(true)
  const [showControls, setShowControls] = useState(false)

  const enableSound = async () => {
    const v = videoRef.current
    if (!v) return
    v.defaultMuted = false
    v.removeAttribute('muted')
    v.muted = false
    v.volume = 1
    setMuted(false)
    setShowControls(true)
    try { await v.play() } catch {}
  }

  const toggleSound = async () => {
    const v = videoRef.current
    if (!v) return
    if (v.muted) return enableSound()
    v.muted = true
    v.defaultMuted = true
    v.setAttribute('muted', '')
    setMuted(true)
  }

  if (!src) {
    return (
      <div className="relative w-full aspect-video rounded-2xl border border-[#CCEFF1] bg-gradient-to-br from-[#0E2A47] to-[#11324F] shadow-2xl shadow-[#0E2A47]/20 flex flex-col items-center justify-center text-center px-6">
        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-3">
          <span className="text-3xl">▶️</span>
        </div>
        <p className="text-white font-bold text-lg">Vídeo de apresentação</p>
        <p className="text-[#9FC2D6] text-sm mt-1">Assista e entenda a plataforma em 1 minuto.</p>
      </div>
    )
  }

  return (
    <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl shadow-[#0E2A47]/25 border border-gray-100 bg-black">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay
        muted
        loop={loop}
        playsInline
        controls={showControls}
        className="w-full h-auto block"
      />
      <button
        type="button"
        onClick={() => { void toggleSound() }}
        aria-label={muted ? 'Ativar som do vídeo' : 'Silenciar vídeo'}
        className="absolute bottom-3 right-3 flex items-center gap-2 bg-black/70 hover:bg-black/85 text-white text-sm font-semibold px-4 py-2 rounded-full backdrop-blur transition-colors"
      >
        {muted ? '🔊 Ativar som' : '🔇 Silenciar'}
      </button>
    </div>
  )
}
