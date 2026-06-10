'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'

type ActionStatus = 'pendente' | 'em_andamento' | 'concluido'
type ActionPriority = 'baixa' | 'media' | 'alta' | 'urgente'
type ActionType = 'imediata' | 'preventiva'

type ActionItem = {
  id: string
  topico: string
  acao: string
  tipo: ActionType
  responsavel: string
  prazo: string
  status: ActionStatus
  prioridade: ActionPriority
}

const statusConfig: Record<ActionStatus, { label: string; bg: string; text: string; icon: string }> = {
  pendente:      { label: 'Pendente',       bg: 'bg-gray-100',   text: 'text-gray-600',   icon: '⏳' },
  em_andamento:  { label: 'Em andamento',   bg: 'bg-blue-100',   text: 'text-blue-700',   icon: '🔄' },
  concluido:     { label: 'Concluído',      bg: 'bg-green-100',  text: 'text-green-700',  icon: '✅' },
}

const prioridadeConfig: Record<ActionPriority, { label: string; bg: string; text: string; border: string }> = {
  baixa:   { label: 'Baixa',   bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200' },
  media:   { label: 'Média',   bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  alta:    { label: 'Alta',    bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  urgente: { label: 'Urgente', bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200' },
}

export default function PlanoDeAcaoPage() {
  const params   = useParams()
  const router   = useRouter()
  const sectorId = params.id as string

  const [items, setItems]         = useState<ActionItem[]>([])
  const [sectorName, setSectorName] = useState('')
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)
  const [hasPlan, setHasPlan]     = useState(false)

  useEffect(() => {
    Promise.all([
      fetch(`/api/dashboard/action-plans/${sectorId}`).then((r) => r.ok ? r.json() : null),
      fetch(`/api/dashboard/reports/${sectorId}`).then((r) => r.ok ? r.json() : null),
    ]).then(([planData, reportData]) => {
      if (reportData) setSectorName(reportData.sector?.name ?? '')
      if (planData) {
        if (planData.plan) {
          setItems(planData.plan.items as ActionItem[])
          setHasPlan(true)
        } else if (planData.suggested?.length) {
          setItems(planData.suggested as ActionItem[])
          setHasPlan(false)
        }
      }
    }).finally(() => setLoading(false))
  }, [sectorId])

  const updateItem = useCallback((id: string, field: keyof ActionItem, value: string) => {
    setItems((prev) => prev.map((item) => item.id === id ? { ...item, [field]: value } : item))
    setSaved(false)
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/dashboard/action-plans/${sectorId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      if (res.ok) { setHasPlan(true); setSaved(true) }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="w-10 h-10 border-4 border-primary-800 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const concluidos  = items.filter((i) => i.status === 'concluido').length
  const total       = items.length
  const progresso   = total > 0 ? Math.round((concluidos / total) * 100) : 0
  const imediatas   = items.filter((i) => i.tipo === 'imediata')
  const preventivas = items.filter((i) => i.tipo === 'preventiva')

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <button onClick={() => router.back()} className="text-gray-400 text-sm hover:text-gray-600 mb-2 flex items-center gap-1">
            ← Voltar ao relatório
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Plano de Ação</h1>
          <p className="text-gray-500 text-sm mt-1">{sectorName} · {total} ações mapeadas</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-green-600 text-sm font-medium">✅ Salvo</span>}
          {!hasPlan && items.length > 0 && (
            <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-xl font-medium">
              Sugestão da IA — revise e salve
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving || items.length === 0}
            className="bg-primary-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Salvando...' : hasPlan ? '💾 Salvar alterações' : '💾 Criar Plano de Ação'}
          </button>
        </div>
      </div>

      {/* Progresso */}
      {hasPlan && total > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-gray-900">Progresso Geral</h2>
            <span className="text-2xl font-black text-primary-800">{progresso}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div
              className="bg-primary-800 h-3 rounded-full transition-all duration-700"
              style={{ width: `${progresso}%` }}
            />
          </div>
          <div className="flex gap-4 mt-3 text-xs text-gray-500">
            <span>{concluidos} concluídas</span>
            <span>{items.filter((i) => i.status === 'em_andamento').length} em andamento</span>
            <span>{items.filter((i) => i.status === 'pendente').length} pendentes</span>
          </div>
        </div>
      )}

      {/* Sem ações */}
      {items.length === 0 && (
        <div className="bg-gray-50 rounded-2xl border border-gray-100 p-12 text-center">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-gray-500 font-medium">Nenhuma ação disponível</p>
          <p className="text-gray-400 text-sm mt-1">
            O Plano de Ação é gerado automaticamente após a análise de IA do questionário dos colaboradores.
          </p>
        </div>
      )}

      {/* Ações Imediatas */}
      {imediatas.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-red-600 text-lg">🚨</span>
            <h2 className="font-bold text-gray-900">Ações Imediatas</h2>
            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">{imediatas.length}</span>
          </div>
          {imediatas.map((item) => (
            <ActionCard key={item.id} item={item} onChange={updateItem} />
          ))}
        </div>
      )}

      {/* Ações Preventivas */}
      {preventivas.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-yellow-600 text-lg">🛡️</span>
            <h2 className="font-bold text-gray-900">Ações Preventivas</h2>
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-semibold">{preventivas.length}</span>
          </div>
          {preventivas.map((item) => (
            <ActionCard key={item.id} item={item} onChange={updateItem} />
          ))}
        </div>
      )}
    </div>
  )
}

function ActionCard({
  item,
  onChange,
}: {
  item: ActionItem
  onChange: (id: string, field: keyof ActionItem, value: string) => void
}) {
  const prio   = prioridadeConfig[item.prioridade]
  const status = statusConfig[item.status]

  return (
    <div className={`bg-white rounded-2xl border-l-4 border border-gray-100 shadow-sm p-5 ${
      item.prioridade === 'urgente' ? 'border-l-red-500' :
      item.prioridade === 'alta'    ? 'border-l-orange-400' :
      item.prioridade === 'media'   ? 'border-l-yellow-400' : 'border-l-green-400'
    }`}>
      {/* Tópico + prioridade */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{item.topico}</p>
          <p className="text-sm font-semibold text-gray-800 mt-0.5 leading-snug">{item.acao}</p>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-xl border flex-shrink-0 ${prio.bg} ${prio.text} ${prio.border}`}>
          {prio.label}
        </span>
      </div>

      {/* Campos editáveis */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Responsável</label>
          <input
            type="text"
            value={item.responsavel}
            onChange={(e) => onChange(item.id, 'responsavel', e.target.value)}
            placeholder="Nome ou cargo"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-800"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Prazo</label>
          <input
            type="date"
            value={item.prazo}
            onChange={(e) => onChange(item.id, 'prazo', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-800"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
          <select
            value={item.status}
            onChange={(e) => onChange(item.id, 'status', e.target.value as ActionStatus)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-800 bg-white"
          >
            {(Object.entries(statusConfig) as [ActionStatus, typeof statusConfig[ActionStatus]][]).map(([k, v]) => (
              <option key={k} value={k}>{v.icon} {v.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Badge de status */}
      <div className="mt-3 flex justify-end">
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${status.bg} ${status.text}`}>
          {status.icon} {status.label}
        </span>
      </div>
    </div>
  )
}
