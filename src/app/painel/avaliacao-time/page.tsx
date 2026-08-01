'use client'

import { useCallback, useEffect, useState } from 'react'

 type Sector = {
  id: string
  name: string
  shareUrl: string
  totalResponses: number
}

type Company = { employeeCount: number | null; teamLinkSentAt: string | null }

const messageFor = (sector: Sector) => `Olá! A empresa está realizando a Avaliação de Risco Psicossocial pela Zelo.\n\nSua participação é importante e as respostas são tratadas de forma anônima e agrupada. Acesse o questionário do seu time pelo link abaixo:\n\n${sector.shareUrl}\n\nReserve alguns minutos para responder com atenção. Obrigado!`
const isGeneralSector = (sector: Sector) => ['geral', 'empresa inteira', 'empresa toda'].includes(sector.name.trim().toLocaleLowerCase('pt-BR'))

export default function AvaliacaoTimePage() {
  const [sectors, setSectors] = useState<Sector[]>([])
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)
  const [markedSent, setMarkedSent] = useState(false)
  const [saving, setSaving] = useState(false)
  const [creatingGeneral, setCreatingGeneral] = useState(false)
  const [createError, setCreateError] = useState('')
  const [newSectorName, setNewSectorName] = useState('')
  const [creatingSector, setCreatingSector] = useState(false)

  const load = useCallback(async () => {
    const [sectorsRes, settingsRes] = await Promise.all([
      fetch('/api/dashboard/sectors'),
      fetch('/api/dashboard/company-settings'),
    ])
    if (sectorsRes.ok) setSectors(await sectorsRes.json())
    if (settingsRes.ok) {
      const data = await settingsRes.json()
      setCompany(data.company ?? null)
      setMarkedSent(!!data.company?.teamLinkSentAt)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const copy = async (value: string, id: string) => {
    await navigator.clipboard.writeText(value)
    setCopied(id)
    window.setTimeout(() => setCopied(null), 2200)
  }

  const createGeneralSector = async () => {
    setCreatingGeneral(true)
    setCreateError('')
    try {
      const res = await fetch('/api/dashboard/sectors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Empresa inteira' }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setCreateError(data.error || 'Não foi possível criar o link geral.')
        return
      }
      await load()
    } finally {
      setCreatingGeneral(false)
    }
  }

  const createSector = async (event: React.FormEvent) => {
    event.preventDefault()
    const name = newSectorName.trim()
    if (!name) return
    setCreatingSector(true)
    setCreateError('')
    try {
      const res = await fetch('/api/dashboard/sectors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setCreateError(data.error || 'Não foi possível criar o setor.')
        return
      }
      setNewSectorName('')
      await load()
    } finally {
      setCreatingSector(false)
    }
  }

  const markAsSent = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/dashboard/team-link', { method: 'POST' })
      if (res.ok) {
        setMarkedSent(true)
        window.dispatchEvent(new Event('zelo:gate-updated'))
      }
    } finally {
      setSaving(false)
    }
  }

  const total = sectors.reduce((sum, sector) => sum + sector.totalResponses, 0)
  const target = company?.employeeCount ?? 0
  const progress = target ? Math.min(100, Math.round((total / target) * 100)) : 0
  const ready = progress >= 80

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-[#109CA1]">Próxima etapa do onboarding</p>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">Avaliação do Time</h1>
        <p className="text-gray-500 text-sm mt-1">Escolha entre um link para a empresa inteira ou um link separado para cada setor.</p>
      </div>

      <div className="bg-gradient-to-br from-[#F0FBFC] to-white border border-[#CCEFF1] rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl">📨</span>
          <div>
            <h2 className="font-bold text-[#0E2A47]">Link para o seu time</h2>
            <p className="text-sm text-gray-600 mt-1">Copie o link ou a mensagem pronta e encaminhe para os funcionários. A meta para avançar é de <strong>80% de respostas</strong>.</p>
          </div>
        </div>
        <div className="mt-4 h-2 bg-white rounded-full overflow-hidden border border-[#CCEFF1]">
          <div className={`h-full rounded-full transition-all ${ready ? 'bg-green-500' : 'bg-[#17C3C9]'}`} style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between text-xs mt-2 text-gray-500"><span>{total} resposta{total === 1 ? '' : 's'}</span><span>{target ? `${progress}% de ${target} funcionários` : 'Informe o número de funcionários em Dados da Empresa'}</span></div>
        {ready && <p className="text-sm font-semibold text-green-700 mt-3">✅ Meta de 80% atingida. O DRPS e o Plano de Ação podem avançar.</p>}
      </div>

      {loading ? <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary-800 border-t-transparent rounded-full animate-spin" /></div> : sectors.length === 0 ? (
        <div className="space-y-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 text-center">
            <p className="font-bold text-gray-900">Link para a empresa inteira</p>
            <p className="text-sm text-gray-500 mt-2">Todos os colaboradores responderão pelo mesmo link e o resultado será agrupado para a empresa.</p>
            <button onClick={createGeneralSector} disabled={creatingGeneral} className="mt-5 px-5 py-3 rounded-xl bg-gradient-to-r from-[#17C3C9] to-[#3F7DE0] text-white text-sm font-bold disabled:opacity-50">
              {creatingGeneral ? 'Criando link...' : 'Criar link para a empresa inteira'}
            </button>
            {createError && <p className="text-sm text-red-600 mt-3">{createError}</p>}
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
            <h2 className="font-bold text-gray-900">Criar links por setor</h2>
            <p className="text-sm text-gray-500 mt-1">Cadastre cada setor e gere um link exclusivo para a equipe correspondente.</p>
            <form onSubmit={createSector} className="flex gap-2 mt-4 flex-col sm:flex-row">
              <input value={newSectorName} onChange={(event) => setNewSectorName(event.target.value)} placeholder="Ex.: Administrativo, Produção, Comercial" className="min-w-0 flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
              <button type="submit" disabled={creatingSector || !newSectorName.trim()} className="px-4 py-2.5 rounded-xl bg-primary-800 text-white text-sm font-semibold disabled:opacity-50">
                {creatingSector ? 'Criando...' : 'Criar setor e link'}
              </button>
            </form>
            {createError && <p className="text-sm text-red-600 mt-3">{createError}</p>}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {sectors.length === 1 && isGeneralSector(sectors[0]) && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-sm text-emerald-800">
              <strong>Link único da empresa inteira:</strong> todos os colaboradores devem responder pelo mesmo link abaixo. As respostas serão analisadas de forma agrupada para toda a empresa.
            </div>
          )}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
            <h2 className="font-bold text-gray-900">Criar links por setor</h2>
            <p className="text-sm text-gray-500 mt-1">Cadastre cada setor e gere um link exclusivo para a equipe correspondente.</p>
            <form onSubmit={createSector} className="flex gap-2 mt-4 flex-col sm:flex-row">
              <input
                value={newSectorName}
                onChange={(event) => setNewSectorName(event.target.value)}
                placeholder="Ex.: Administrativo, Produção, Comercial"
                className="min-w-0 flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
              />
              <button type="submit" disabled={creatingSector || !newSectorName.trim()} className="px-4 py-2.5 rounded-xl bg-primary-800 text-white text-sm font-semibold disabled:opacity-50">
                {creatingSector ? 'Criando...' : 'Criar setor e link'}
              </button>
            </form>
            {createError && <p className="text-sm text-red-600 mt-3">{createError}</p>}
          </div>
          {sectors.length > 1 && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-800">
              <strong>Um link por setor:</strong> envie cada link somente para a equipe correspondente. Os relatórios ficarão separados por setor.
            </div>
          )}
          {sectors.map((sector) => {
            const message = messageFor(sector)
            return <div key={sector.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div><h2 className="font-bold text-gray-900">{sector.name}</h2><p className="text-xs text-gray-500 mt-1">{sector.totalResponses} resposta{sector.totalResponses === 1 ? '' : 's'} recebida{sector.totalResponses === 1 ? '' : 's'}</p></div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">Avaliação do time</span>
              </div>
              <label className="block text-xs font-semibold text-gray-500 mt-5 mb-1">Link do funcionário</label>
              <div className="flex gap-2">
                <input readOnly value={sector.shareUrl} className="min-w-0 flex-1 px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-xs text-gray-600" />
                <button onClick={() => copy(sector.shareUrl, `link-${sector.id}`)} className="flex-shrink-0 px-3 py-2 rounded-xl bg-primary-800 text-white text-xs font-semibold">{copied === `link-${sector.id}` ? '✅ Copiado' : 'Copiar link'}</button>
              </div>
              <label className="block text-xs font-semibold text-gray-500 mt-4 mb-1">Mensagem pronta para WhatsApp ou e-mail</label>
              <textarea readOnly value={message} rows={7} className="w-full px-3 py-3 rounded-xl border border-gray-200 bg-gray-50 text-xs text-gray-600 resize-none" />
              <button onClick={() => copy(message, `message-${sector.id}`)} className="mt-2 px-4 py-2 rounded-xl border border-[#CCEFF1] bg-[#F0FBFC] text-[#109CA1] text-xs font-bold">{copied === `message-${sector.id}` ? '✅ Mensagem copiada' : 'Copiar mensagem completa'}</button>
            </div>
          })}
        </div>
      )}

      <div className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap">
        <div><p className="font-bold text-gray-900">Você já enviou o link ao time?</p><p className="text-sm text-gray-500 mt-1">Confirme para liberar Vídeos, Relatório Geral, Documentos e Material Didático.</p></div>
        <button onClick={markAsSent} disabled={saving || markedSent} className={`px-5 py-3 rounded-xl font-bold text-sm ${markedSent ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gradient-to-r from-[#17C3C9] to-[#3F7DE0] text-white'}`}>{markedSent ? '✅ Link enviado — áreas liberadas' : saving ? 'Salvando...' : 'Confirmar envio do link'}</button>
      </div>
    </div>
  )
}
