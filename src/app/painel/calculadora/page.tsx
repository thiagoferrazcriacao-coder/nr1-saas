'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const PLAN_PRICE_MONTHLY = 197

export default function CalculadoraPage() {
  const [employees, setEmployees] = useState(50)
  const [sectors, setSectors]     = useState(3)
  const [hasInfractions, setHasInfractions] = useState(false)
  const [loadedEmployees, setLoadedEmployees] = useState(false)

  useEffect(() => {
    fetch('/api/dashboard/company-settings')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.company?.employeeCount) {
          setEmployees(data.company.employeeCount)
          setLoadedEmployees(true)
        }
      })
      .catch(() => {})
    fetch('/api/dashboard/sectors')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setSectors(data.length)
      })
      .catch(() => {})
  }, [])

  // Cálculos
  const minFine      = 5000   // R$ 5.000 mínimo por autuação NR-1
  const maxFine      = 50000  // R$ 50.000 máximo
  const finePerSector = Math.round(minFine + (employees / 200) * (maxFine - minFine) / 4)
  const totalRisk     = finePerSector * sectors
  const annualCost    = PLAN_PRICE_MONTHLY * 12
  const annualSaving  = totalRisk - annualCost
  const roi           = Math.round((annualSaving / annualCost) * 100)
  const costPerEmployee = (PLAN_PRICE_MONTHLY / Math.max(1, employees)).toFixed(2)

  const fmtBRL = (n: number) =>
    n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/painel" className="text-gray-400 hover:text-gray-600 text-sm">← Voltar</Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calculadora de Conformidade NR-1</h1>
          <p className="text-gray-500 text-sm mt-0.5">Simule o risco financeiro de não conformidade vs o custo do NR-1 Risk</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Painel de configuração */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
          <h2 className="font-bold text-gray-800 text-sm uppercase tracking-wide">Perfil da Empresa</h2>

          {/* Funcionários */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">Funcionários CLT</label>
              <span className="text-lg font-bold text-primary-800">{employees}</span>
            </div>
            <input
              type="range"
              min={5} max={500} step={5}
              value={employees}
              onChange={(e) => setEmployees(Number(e.target.value))}
              className="w-full accent-blue-700"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>5</span><span>500</span>
            </div>
            {loadedEmployees && (
              <p className="text-xs text-green-600 mt-1">✅ Pré-preenchido com os dados da sua empresa</p>
            )}
          </div>

          {/* Setores */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">Setores avaliados</label>
              <span className="text-lg font-bold text-primary-800">{sectors}</span>
            </div>
            <input
              type="range"
              min={1} max={20} step={1}
              value={sectors}
              onChange={(e) => setSectors(Number(e.target.value))}
              className="w-full accent-blue-700"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>1</span><span>20</span>
            </div>
          </div>

          {/* Checkbox infração */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={hasInfractions}
                onChange={(e) => setHasInfractions(e.target.checked)}
                className="mt-0.5 accent-amber-600"
              />
              <div>
                <p className="text-sm font-medium text-amber-800">Empresa já teve autuação da Fiscalização?</p>
                <p className="text-xs text-amber-600 mt-0.5">Reincidência multiplica as multas em até 3×</p>
              </div>
            </label>
          </div>

          {/* Fonte legal */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-500 font-medium mb-1">Base legal utilizada</p>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• NR-1 (Portaria MTE nº 1.419/2024) — vigência jan/2025</li>
              <li>• Multas entre R$5.000 e R$50.000 por infração (art. 201 CLT)</li>
              <li>• Por setor sem GRO psicossocial documentado</li>
            </ul>
          </div>
        </div>

        {/* Painel de resultados */}
        <div className="space-y-4">

          {/* Risco de não conformidade */}
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
            <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1">⚠️ Risco de Autuação</p>
            <p className="text-4xl font-black text-red-700">
              {fmtBRL(hasInfractions ? totalRisk * 3 : totalRisk)}
            </p>
            <p className="text-sm text-red-500 mt-1">
              estimativa de multas por {sectors} setor{sectors !== 1 ? 'es' : ''} sem GRO
              {hasInfractions ? ' (reincidência ×3)' : ''}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="bg-white/60 rounded-xl p-3">
                <p className="text-xs text-red-400">Mínimo/setor</p>
                <p className="text-sm font-bold text-red-700">{fmtBRL(minFine)}</p>
              </div>
              <div className="bg-white/60 rounded-xl p-3">
                <p className="text-xs text-red-400">Estimado/setor</p>
                <p className="text-sm font-bold text-red-700">{fmtBRL(finePerSector)}</p>
              </div>
            </div>
          </div>

          {/* Custo NR-1 Risk */}
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
            <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1">✅ Custo de Conformidade</p>
            <p className="text-4xl font-black text-green-700">{fmtBRL(PLAN_PRICE_MONTHLY)}<span className="text-lg font-normal">/mês</span></p>
            <p className="text-sm text-green-500 mt-1">NR-1 Risk — diagnóstico completo com DRPS assinado</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="bg-white/60 rounded-xl p-3">
                <p className="text-xs text-green-400">Custo anual</p>
                <p className="text-sm font-bold text-green-700">{fmtBRL(annualCost)}</p>
              </div>
              <div className="bg-white/60 rounded-xl p-3">
                <p className="text-xs text-green-400">Por colaborador/mês</p>
                <p className="text-sm font-bold text-green-700">R$ {costPerEmployee}</p>
              </div>
            </div>
          </div>

          {/* ROI */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white">
            <p className="text-xs font-semibold text-indigo-200 uppercase tracking-wide mb-3">Seu ROI de Conformidade</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-3xl font-black">+{roi > 999 ? '999' : roi}%</p>
                <p className="text-xs text-indigo-200 mt-0.5">ROI anual estimado</p>
              </div>
              <div>
                <p className="text-3xl font-black">{fmtBRL(annualSaving > 0 ? annualSaving : 0)}</p>
                <p className="text-xs text-indigo-200 mt-0.5">Economia anual estimada</p>
              </div>
            </div>
            <div className="mt-4 bg-white/10 rounded-xl p-3">
              <p className="text-xs text-indigo-100">
                Para cada <strong>R$1,00</strong> investido no NR-1 Risk, você evita até{' '}
                <strong>R${(totalRisk / annualCost).toFixed(0)},00</strong> em multas potenciais.
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">Comece agora e fique em conformidade</p>
              <p className="text-xs text-gray-400 mt-0.5">Relatório DRPS assinado pela Psicóloga Annie Talma — CRP/05/44595</p>
            </div>
            <Link
              href="/painel"
              className="flex-shrink-0 bg-primary-800 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors"
            >
              Ver Setores →
            </Link>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center mt-6">
        * Simulação baseada na legislação trabalhista brasileira. Multas reais dependem da análise da fiscalização do MTE.
        Valores de referência: Portaria MTE nº 1.419/2024 e art. 201 da CLT.
      </p>
    </div>
  )
}
