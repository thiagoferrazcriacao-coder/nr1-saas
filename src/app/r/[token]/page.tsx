'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'

type Question = {
  code: string
  topic: string
  topicNum: number
  text: string
  hint: string | null
  order: number
}

type QuestionnaireData = {
  sectorName: string
  companyName: string
  questions: Question[]
}

const SCALE = [
  { value: 0, emoji: '😌', label: 'Nunca' },
  { value: 1, emoji: '🙂', label: 'Raramente' },
  { value: 2, emoji: '😐', label: 'Às vezes' },
  { value: 3, emoji: '😟', label: 'Frequentemente' },
  { value: 4, emoji: '😰', label: 'Sempre' },
]

type ScreenState = 'loading' | 'intro' | 'questions' | 'submitting' | 'success' | 'error'

export default function QuestionnairePage() {
  const params = useParams()
  const token = params.token as string

  const [screen, setScreen] = useState<ScreenState>('loading')
  const [data, setData] = useState<QuestionnaireData | null>(null)
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    fetch(`/api/r/${token}`)
      .then((r) => {
        if (!r.ok) throw new Error('Link inválido ou expirado.')
        return r.json()
      })
      .then((d: QuestionnaireData) => {
        setData(d)
        setScreen('intro')
      })
      .catch((e) => {
        setErrorMsg(e.message)
        setScreen('error')
      })
  }, [token])

  const question = data?.questions[current]
  const total = data?.questions.length ?? 0
  const progress = total > 0 ? Math.round(((current + 1) / total) * 100) : 0
  const answered = question ? answers[question.code] !== undefined : false
  const isLast = current === total - 1

  const handleAnswer = (value: number) => {
    if (!question) return
    setAnswers((prev) => ({ ...prev, [question.code]: value }))
  }

  const handleNext = () => {
    if (isLast) return handleSubmit()
    setCurrent((c) => c + 1)
    window.scrollTo(0, 0)
  }

  const handlePrev = () => {
    setCurrent((c) => Math.max(0, c - 1))
    window.scrollTo(0, 0)
  }

  const handleSubmit = useCallback(async () => {
    if (!data) return
    setScreen('submitting')

    const payload = data.questions.map((q) => ({
      questionCode: q.code,
      value: answers[q.code] ?? 0,
    }))

    try {
      const res = await fetch(`/api/r/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: payload }),
      })
      if (!res.ok) throw new Error()
      setScreen('success')
    } catch {
      setErrorMsg('Erro ao enviar respostas. Tente novamente.')
      setScreen('questions')
    }
  }, [answers, data, token])

  if (screen === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary-800 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Carregando questionário...</p>
        </div>
      </div>
    )
  }

  if (screen === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-6">
        <div className="text-center">
          <div className="text-5xl mb-4">❌</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Link inválido</h1>
          <p className="text-gray-500 text-sm">{errorMsg}</p>
        </div>
      </div>
    )
  }

  if (screen === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-6">
        <div className="text-center max-w-sm">
          <div className="text-7xl mb-6 animate-bounce">✅</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-3">Obrigado!</h1>
          <p className="text-gray-600 mb-2">
            Suas respostas foram registradas com sucesso.
          </p>
          <p className="text-gray-400 text-sm">
            🔒 Suas respostas são 100% anônimas e contribuem para um ambiente de trabalho mais saudável.
          </p>
        </div>
      </div>
    )
  }

  if (screen === 'intro' && data) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="bg-primary-800 text-white px-6 py-8 text-center">
          <p className="text-primary-200 text-sm mb-1">{data.companyName}</p>
          <h1 className="text-2xl font-bold">Avaliação de Risco Psicossocial</h1>
          <p className="text-primary-200 text-sm mt-1">Setor: {data.sectorName}</p>
        </div>

        <div className="flex-1 px-6 py-8 flex flex-col gap-6">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🔒</span>
              <h2 className="font-bold text-blue-900">Suas respostas são 100% anônimas</h2>
            </div>
            <p className="text-blue-800 text-sm leading-relaxed">
              Nenhum dado pessoal é coletado. Não sabemos quem você é — apenas o setor ao qual este link pertence.
            </p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-5">
            <h3 className="font-semibold text-gray-800 mb-3">Como responder</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2"><span>📋</span><span>{total} perguntas sobre seu ambiente de trabalho</span></li>
              <li className="flex items-start gap-2"><span>⏱️</span><span>Leva aproximadamente 5–8 minutos</span></li>
              <li className="flex items-start gap-2"><span>🎯</span><span>Responda com base na sua experiência real</span></li>
              <li className="flex items-start gap-2"><span>↩️</span><span>Você pode voltar e alterar respostas anteriores</span></li>
            </ul>
          </div>

          <div className="space-y-2">
            {SCALE.map((s) => (
              <div key={s.value} className="flex items-center gap-3 text-sm text-gray-600">
                <span className="text-2xl w-8">{s.emoji}</span>
                <span className="font-medium w-28">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 pb-10 safe-bottom">
          <button
            onClick={() => setScreen('questions')}
            className="w-full bg-primary-800 text-white py-4 rounded-2xl font-bold text-lg active:scale-95 transition-transform"
          >
            Iniciar Avaliação →
          </button>
        </div>
      </div>
    )
  }

  if (!question || !data) return null

  const topicQuestions = data.questions.filter((q) => q.topicNum === question.topicNum)
  const questionInTopic = topicQuestions.findIndex((q) => q.code === question.code) + 1

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header com progresso */}
      <div className="bg-primary-800 text-white px-4 pt-safe-top pb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-primary-200 text-xs">{data.sectorName}</span>
          <span className="text-primary-200 text-xs font-medium">{current + 1} / {total}</span>
        </div>
        <div className="w-full bg-primary-700 rounded-full h-2">
          <div
            className="bg-white rounded-full h-2 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Tópico */}
      <div className="bg-blue-50 px-5 py-3 border-b border-blue-100">
        <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">
          Tópico {question.topicNum} — {question.topic}
        </p>
        <p className="text-xs text-blue-400 mt-0.5">
          Pergunta {questionInTopic} de {topicQuestions.length}
        </p>
      </div>

      {/* Pergunta */}
      <div className="flex-1 px-5 py-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
          <p className="text-gray-900 text-base font-medium leading-relaxed mb-3">
            {question.text}
          </p>
          {question.hint && (
            <p className="text-gray-400 text-xs italic leading-relaxed">
              {question.hint}
            </p>
          )}
        </div>

        {/* Escala de resposta */}
        <div className="space-y-3">
          {SCALE.map((option) => {
            const selected = answers[question.code] === option.value
            return (
              <button
                key={option.value}
                onClick={() => handleAnswer(option.value)}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 transition-all duration-150 active:scale-95 ${
                  selected
                    ? 'bg-primary-800 border-primary-800 text-white shadow-lg'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-primary-300'
                }`}
              >
                <span className="text-2xl">{option.emoji}</span>
                <span className="font-medium text-sm">{option.label}</span>
                {selected && (
                  <span className="ml-auto text-white text-lg">✓</span>
                )}
              </button>
            )
          })}
        </div>

        {errorMsg && (
          <p className="text-red-500 text-sm text-center mt-4">{errorMsg}</p>
        )}
      </div>

      {/* Navegação */}
      <div className="px-5 pb-10 safe-bottom flex gap-3">
        {current > 0 && (
          <button
            onClick={handlePrev}
            className="flex-1 py-4 rounded-2xl border-2 border-gray-300 text-gray-600 font-semibold active:scale-95 transition-transform"
          >
            ← Anterior
          </button>
        )}
        <button
          onClick={handleNext}
          disabled={!answered || screen === 'submitting'}
          className={`flex-1 py-4 rounded-2xl font-bold text-white transition-all active:scale-95 ${
            answered && screen !== 'submitting'
              ? 'bg-primary-800 shadow-lg'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          {screen === 'submitting'
            ? 'Enviando...'
            : isLast
            ? '✅ Enviar Respostas'
            : 'Próxima →'}
        </button>
      </div>
    </div>
  )
}
