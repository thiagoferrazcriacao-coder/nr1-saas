'use client'

import { useEffect, useState } from 'react'

type Tutorial = {
  title: string
  description: string | null
  videoUrl: string
}

export default function TutorialPage() {
  const [tutorial, setTutorial] = useState<Tutorial | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/material/lessons')
      .then((res) => res.ok ? res.json() : { lessons: [] })
      .then(({ lessons }) => {
        const item = (lessons ?? []).find((lesson: Tutorial & { isOnboardingTutorial?: boolean; active: boolean }) => lesson.isOnboardingTutorial && lesson.active)
        setTutorial(item ? { title: item.title, description: item.description, videoUrl: item.videoUrl } : null)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-wider text-[#1769AA]">Material de apoio</p>
        <h1 className="text-2xl font-black text-gray-900 mt-1">Tutorial</h1>
        <p className="text-gray-500 mt-1">Reveja o passo a passo sempre que surgir alguma dúvida.</p>
      </div>

      <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-7">
        {loading ? (
          <div className="aspect-video rounded-2xl bg-slate-100 animate-pulse" />
        ) : tutorial ? (
          <>
            <div className="aspect-video rounded-2xl overflow-hidden bg-black">
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video src={tutorial.videoUrl} controls playsInline className="w-full h-full object-contain" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mt-5">{tutorial.title}</h2>
            {tutorial.description && <p className="text-sm text-gray-500 mt-2 whitespace-pre-line">{tutorial.description}</p>}
          </>
        ) : (
          <div className="aspect-video rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-center p-6">
            <span className="text-5xl mb-3">🎬</span>
            <p className="font-bold text-slate-700">O tutorial ainda não foi publicado</p>
            <p className="text-sm text-slate-500 mt-2 max-w-md">Assim que o administrador publicar o vídeo, ele aparecerá aqui para você revisitar.</p>
          </div>
        )}
      </section>
    </div>
  )
}
