'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MANAGER_QUESTIONS, ManagerAnswer, managerIsComplete } from '@/lib/manager-assessment'

type StoredAssessment = { items?: { answers?: ManagerAnswer[] }[]; openingAcceptedAt?: string | null }

const openingText = `Este questionário faz parte do diagnóstico exigido pela NR-1. As suas respostas serão usadas, junto com as respostas da sua equipe, para classificar os riscos psicossociais da empresa e gerar os documentos oficiais do programa.\n\nResponda com base em fatos: o que de fato aconteceu, o que está registrado e o que a empresa realmente tem hoje. Não responda pensando no resultado que gostaria de ver.\n\nSuas respostas são a declaração oficial da empresa e constarão da documentação que pode ser examinada por auditores do trabalho e pela Justiça. Não há resposta certa ou errada: um risco médio ou alto apenas define por onde o plano de ação começa. O que protege a empresa é um diagnóstico honesto seguido de ação registrada.`

export default function AvaliacaoGestorPage() {
  const router = useRouter()
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [accepted, setAccepted] = useState(false)
  const [started, setStarted] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/dashboard/company-assessment').then((r) => r.json()).then((data: { assessment?: StoredAssessment }) => {
      const existingAnswers = data.assessment?.items?.flatMap((item) => item.answers ?? []) ?? []
      if (existingAnswers.length) {
        setAnswers(Object.fromEntries(existingAnswers.map((a) => [a.code, a.value])))
        setStarted(true)
        setAccepted(true)
      }
    }).finally(() => setLoading(false))
  }, [])

  const visibleQuestions = useMemo(() => MANAGER_QUESTIONS.filter((q) => !(q.topicNum === 13 && q.code !== 'G13.1' && answers['G13.1'] === 0)), [answers])
  const completed = visibleQuestions.filter((q) => Number.isInteger(answers[q.code])).length
  const allDone = managerIsComplete(visibleQuestions.map((q) => ({ code: q.code, value: answers[q.code] })))
  const groups = Array.from({ length: 13 }, (_, i) => i + 1)

  const setAnswer = (code: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [code]: value }))
    setSaved(false)
  }

  const handleSubmit = async () => {
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/dashboard/company-assessment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ answers: Object.entries(answers).map(([code, value]) => ({ code, value })), openingAccepted: true, confirmation: true }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Não foi possível salvar.')
      setSaved(true); setConfirmOpen(false); setTimeout(() => router.push('/painel'), 1200)
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível salvar.') } finally { setSaving(false) }
  }

  if (loading) return <div className="flex justify-center py-24"><div className="w-9 h-9 border-4 border-primary-800 border-t-transparent rounded-full animate-spin" /></div>

  if (!started) return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 lg:p-10">
        <span className="text-xs font-bold uppercase tracking-wide text-primary-700">Antes de começar</span>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Avaliação do Gestor</h1>
        <p className="text-sm text-gray-500 mt-2">São 39 perguntas objetivas sobre fatos da organização. O sistema calcula automaticamente a probabilidade de cada fator; você não escolhe Baixa, Média ou Alta.</p>
        <div className="whitespace-pre-line text-sm leading-7 text-gray-700 bg-blue-50 border border-blue-200 rounded-xl p-5 mt-6">{openingText}</div>
        <label className="flex items-start gap-3 mt-6 text-sm text-gray-700 cursor-pointer"><input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-1 h-4 w-4" /><span>Declaro que li e entendi que minhas respostas constituem declaração oficial da empresa e me comprometo a respondê-las com veracidade.</span></label>
        <button disabled={!accepted} onClick={() => setStarted(true)} className="mt-7 w-full sm:w-auto bg-primary-800 text-white px-6 py-3 rounded-xl font-semibold disabled:bg-gray-200 disabled:text-gray-400">Ler e iniciar avaliação →</button>
      </div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto pb-28">
      <div className="mb-6"><h1 className="text-2xl font-bold text-gray-900">Avaliação do Gestor</h1><p className="text-sm text-gray-500 mt-1">Responda com base na realidade da empresa. A classificação será calculada automaticamente.</p><div className="mt-4 flex items-center gap-3"><div className="flex-1 h-2 bg-gray-100 rounded-full"><div className="h-2 bg-primary-800 rounded-full transition-all" style={{ width: `${(completed / visibleQuestions.length) * 100}%` }} /></div><span className="text-sm font-semibold text-gray-600">{completed}/{visibleQuestions.length}</span></div></div>
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border border-gray-200 rounded-xl px-4 py-3 mb-5 text-xs text-gray-600">Suas respostas integram a documentação oficial da empresa (NR-1).</div>
      <div className="space-y-5">
        {groups.map((num) => {
          const qs = visibleQuestions.filter((q) => q.topicNum === num)
          return <section key={num} className="bg-white rounded-2xl border border-gray-200 p-5 lg:p-6"><div className="flex gap-3 items-center mb-5"><span className="w-8 h-8 rounded-full bg-primary-50 text-primary-800 flex items-center justify-center font-bold">{num}</span><h2 className="font-bold text-gray-900">{qs[0]?.factor}</h2></div><div className="space-y-6">{qs.map((q, index) => <div key={q.code}><p className="text-sm font-semibold text-gray-800"><span className="text-primary-700 mr-2">{index + 1}.</span>{q.text}</p><div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">{q.options.map((option) => <button key={option.value} type="button" onClick={() => setAnswer(q.code, option.value)} className={`text-left text-sm px-3 py-3 rounded-xl border transition-colors ${answers[q.code] === option.value ? 'border-primary-700 bg-primary-50 text-primary-900 font-semibold' : 'border-gray-200 hover:border-primary-300 text-gray-600'}`}><span className="inline-flex w-5 h-5 rounded-full border border-current items-center justify-center mr-2 text-[10px]">{answers[q.code] === option.value ? '✓' : ''}</span>{option.label}</button>)}</div></div>)}</div></section>
        })}
      </div>
      {error && <div className="mt-5 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm">{error}</div>}
      <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white border-t border-gray-200 p-3 z-20"><div className="max-w-4xl mx-auto flex items-center justify-between gap-4"><p className="text-xs text-gray-500">{allDone ? '✅ Tudo preenchido. Revise antes de enviar.' : `Faltam ${visibleQuestions.length - completed} respostas.`}</p><button disabled={!allDone || saving || saved} onClick={() => setConfirmOpen(true)} className="bg-primary-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold disabled:bg-gray-200 disabled:text-gray-400">{saved ? '✓ Enviado' : 'Revisar e confirmar'}</button></div></div>
      {confirmOpen && <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"><div className="bg-white rounded-2xl max-w-lg p-6 shadow-xl"><h2 className="text-lg font-bold text-gray-900">Confirme o envio</h2><p className="text-sm leading-6 text-gray-600 mt-3">Ao confirmar, você declara que as informações prestadas correspondem à realidade da empresa nesta data. Elas passarão a integrar o diagnóstico e a documentação do programa.</p><div className="flex justify-end gap-3 mt-6"><button onClick={() => setConfirmOpen(false)} className="px-4 py-2 rounded-xl text-sm text-gray-600">Voltar e revisar</button><button disabled={saving} onClick={handleSubmit} className="px-4 py-2 rounded-xl bg-primary-800 text-white text-sm font-bold">{saving ? 'Enviando...' : 'Confirmar e enviar'}</button></div></div></div>}
    </div>
  )
}
