'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Probability = 'baixa' | 'media' | 'alta'

type TopicItem = {
  topicNum: number
  topic: string
  description: string
  probability: Probability | null
}

const TOPICS: Omit<TopicItem, 'probability'>[] = [
  { topicNum: 1,  topic: 'Assédio de Qualquer Natureza',             description: 'Ocorrência de assédio moral, sexual ou conduta desrespeitosa no ambiente de trabalho.' },
  { topicNum: 2,  topic: 'Suporte e Apoio no Ambiente de Trabalho',  description: 'Percepção de apoio da liderança, colegas e RH diante de dificuldades.' },
  { topicNum: 3,  topic: 'Má Gestão de Mudanças Organizacionais',    description: 'Comunicação inadequada durante reestruturações, demissões ou mudanças internas.' },
  { topicNum: 4,  topic: 'Baixa Clareza de Papel ou Função',         description: 'Falta de clareza sobre responsabilidades, metas e expectativas do cargo.' },
  { topicNum: 5,  topic: 'Baixas Recompensas e Reconhecimento',      description: 'Ausência de reconhecimento, feedback positivo ou valorização pelo trabalho realizado.' },
  { topicNum: 6,  topic: 'Baixo Controle no Trabalho / Falta de Autonomia', description: 'Excesso de supervisão, controle ou burocracia que limita a autonomia do colaborador.' },
  { topicNum: 7,  topic: 'Baixa Justiça Organizacional',             description: 'Percepção de injustiça nas avaliações, promoções ou decisões de desligamento.' },
  { topicNum: 8,  topic: 'Eventos Violentos ou Traumáticos',         description: 'Exposição a situações de violência, acidentes graves ou episódios traumáticos no trabalho.' },
  { topicNum: 9,  topic: 'Baixa Demanda no Trabalho / Subcarga',     description: 'Falta de tarefas, subutilização de habilidades ou trabalho repetitivo sem desafios.' },
  { topicNum: 10, topic: 'Excesso de Demandas / Sobrecarga',         description: 'Volume de trabalho excessivo, horas extras frequentes e sintomas de esgotamento.' },
  { topicNum: 11, topic: 'Maus Relacionamentos no Local de Trabalho',description: 'Conflitos frequentes, rivalidade ou clima negativo entre colegas e liderança.' },
  { topicNum: 12, topic: 'Trabalho em Condições de Difícil Comunicação', description: 'Barreiras físicas, de turno ou organizacionais que dificultam a troca de informações.' },
  { topicNum: 13, topic: 'Trabalho Remoto e Isolado',                description: 'Sensação de afastamento, solidão ou falta de suporte no trabalho à distância.' },
]

const probConfig = {
  baixa: { label: 'Baixa',  bg: 'bg-green-100',  text: 'text-green-700',  border: 'border-green-400',  ring: 'ring-green-400' },
  media: { label: 'Média',  bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-400', ring: 'ring-yellow-400' },
  alta:  { label: 'Alta',   bg: 'bg-red-100',    text: 'text-red-700',    border: 'border-red-400',    ring: 'ring-red-400' },
}

export default function AvaliacaoGestorPage() {
  const router = useRouter()
  const [items, setItems] = useState<TopicItem[]>(
    TOPICS.map((t) => ({ ...t, probability: null }))
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  // Carrega avaliação existente
  useEffect(() => {
    fetch('/api/dashboard/company-assessment')
      .then((r) => r.json())
      .then((data) => {
        if (data.assessment?.items) {
          const existing = data.assessment.items as { topicNum: number; probability: Probability }[]
          setItems((prev) =>
            prev.map((item) => {
              const found = existing.find((e) => e.topicNum === item.topicNum)
              return found ? { ...item, probability: found.probability } : item
            })
          )
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const setProb = (topicNum: number, probability: Probability) => {
    setItems((prev) =>
      prev.map((item) => (item.topicNum === topicNum ? { ...item, probability } : item))
    )
    setSaved(false)
  }

  const completed = items.filter((i) => i.probability !== null).length
  const allDone = completed === 13

  const handleSave = async () => {
    if (!allDone) return
    setSaving(true)
    try {
      const res = await fetch('/api/dashboard/company-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({
            topicNum: i.topicNum,
            topic: i.topic,
            probability: i.probability,
          })),
        }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => router.push('/painel'), 1200)
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-4 border-primary-800 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Cabeçalho */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Avaliação do Gestor</h1>
        <p className="text-gray-500 text-sm mt-1">
          Para cada um dos 13 riscos psicossociais mapeados pela NR-1, avalie a <strong>probabilidade de ocorrência</strong> na sua empresa.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 bg-gray-100 rounded-full h-2">
            <div
              className="bg-primary-800 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(completed / 13) * 100}%` }}
            />
          </div>
          <span className="text-sm font-medium text-gray-600">{completed}/13</span>
        </div>
      </div>

      {/* Legenda */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6 text-sm text-blue-800">
        <strong>Como avaliar:</strong> Considere a realidade atual da sua empresa. Selecione a probabilidade de ocorrência de cada risco com base na sua percepção como gestor.
        <div className="flex gap-4 mt-2 flex-wrap">
          <span className="text-green-700 font-semibold">🟢 Baixa</span> — Raro ou improvável acontecer
          <span className="text-yellow-700 font-semibold">🟡 Média</span> — Pode ocorrer ocasionalmente
          <span className="text-red-700 font-semibold">🔴 Alta</span> — Ocorre ou tem grande chance de ocorrer
        </div>
      </div>

      {/* Lista de tópicos */}
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.topicNum}
            className={`bg-white rounded-2xl border p-5 transition-all ${
              item.probability ? 'border-gray-200' : 'border-orange-200'
            }`}
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-lg">
                    {String(item.topicNum).padStart(2, '0')}
                  </span>
                  <h3 className="font-semibold text-gray-900 text-sm">{item.topic}</h3>
                </div>
                <p className="text-xs text-gray-500">{item.description}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {(['baixa', 'media', 'alta'] as Probability[]).map((p) => {
                  const cfg = probConfig[p]
                  const selected = item.probability === p
                  return (
                    <button
                      key={p}
                      onClick={() => setProb(item.topicNum, p)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold border-2 transition-all ${
                        selected
                          ? `${cfg.bg} ${cfg.text} ${cfg.border} ring-2 ${cfg.ring} ring-offset-1`
                          : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {cfg.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Botão salvar */}
      <div className="mt-8 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {allDone ? '✅ Todos os tópicos avaliados' : `⚠️ ${13 - completed} tópico(s) pendente(s)`}
        </p>
        <button
          onClick={handleSave}
          disabled={!allDone || saving || saved}
          className={`px-8 py-3 rounded-xl font-semibold text-sm transition-all ${
            saved
              ? 'bg-green-600 text-white'
              : allDone
              ? 'bg-primary-800 text-white hover:bg-primary-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {saved ? '✓ Salvo! Redirecionando...' : saving ? 'Salvando...' : 'Salvar Avaliação'}
        </button>
      </div>
    </div>
  )
}
