'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function TermosPage() {
  const router  = useRouter()
  const [loading, setLoading]   = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    // Se já aceitou, vai direto pro painel
    fetch('/api/dashboard/accept-terms')
      .then((r) => r.json())
      .then((data) => {
        if (data.accepted) router.replace('/painel')
        else setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [router])

  const handleAccept = async () => {
    setAccepting(true)
    try {
      await fetch('/api/dashboard/accept-terms', { method: 'POST' })
      router.replace('/painel')
    } finally {
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F0FBFC] to-white">
        <div className="w-8 h-8 border-4 border-[#17C3C9] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0FBFC] to-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-zelo-3.png" alt="Zelo — Plataforma de NR1" className="h-12 w-auto mx-auto" />
          <p className="text-gray-500 text-sm mt-3">Termos de Uso e Política de Privacidade</p>
        </div>

        {/* Caixa de termos */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-[#0E2A47]/10 overflow-hidden">
          <div
            className="h-80 overflow-y-auto p-6 text-sm text-gray-600 leading-relaxed space-y-4"
            onScroll={(e) => {
              const el = e.currentTarget
              if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) setScrolled(true)
            }}
          >
            <h2 className="font-bold text-gray-900 text-base">1. Objeto e Aceitação</h2>
            <p>
              Ao utilizar a plataforma Zelo, a empresa contratante ("Cliente") concorda com os presentes
              Termos de Uso e com a Política de Privacidade, formando contrato válido entre as partes.
              O aceite é registrado eletronicamente com data, hora e endereço IP, conforme art. 10 da MP 2.200-2/2001,
              substituindo assinatura física para fins de validade jurídica.
            </p>

            <h2 className="font-bold text-gray-900 text-base">2. Escopo do Serviço</h2>
            <p>
              A plataforma realiza o diagnóstico de riscos psicossociais exigido pela NR-1 (Portaria MTE 1.419/2024),
              gerando: Diagnóstico de Riscos Psicossociais (DRPS), Inventário de Riscos, Matriz de Risco
              (Gravidade × Probabilidade), Documento de Critérios adotados no GRO e Plano de Ação.
            </p>
            <p>
              <strong>Fora do escopo:</strong> execução do Plano de Ação, assessoria jurídica trabalhista,
              intervenções diretas com colaboradores e consultoria presencial (salvo contratação específica).
            </p>

            <h2 className="font-bold text-gray-900 text-base">3. Responsabilidades do Cliente</h2>
            <p>
              O Cliente é responsável por: (a) garantir que os colaboradores respondam ao questionário de forma
              voluntária e anônima; (b) informar corretamente os dados cadastrais da empresa; (c) guardar os
              documentos gerados pelo prazo legal de 20 anos, conforme obrigação do empregador na NR-1;
              (d) utilizar o Plano de Ação como documento de conformidade, sendo a execução de sua exclusiva responsabilidade.
            </p>

            <h2 className="font-bold text-gray-900 text-base">4. Anonimato e Proteção de Dados (LGPD)</h2>
            <p>
              Os questionários respondidos pelos colaboradores são 100% anônimos. A plataforma não armazena
              nome, CPF, IP, e-mail ou qualquer dado que permita identificar o respondente individual.
              Os dados coletados referem-se exclusivamente ao grupo/setor avaliado.
            </p>
            <p>
              Os dados da empresa são tratados conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018),
              sendo utilizados somente para prestação do serviço contratado e geração dos documentos de conformidade.
            </p>

            <h2 className="font-bold text-gray-900 text-base">5. Validade dos Documentos</h2>
            <p>
              O DRPS gerado pela plataforma é elaborado sob orientação técnica de profissional habilitado
              (psicólogo registrado no CRP) e constitui evidência documental para fins de conformidade com a NR-1.
              A empresa é responsável por complementar o GRO com demais riscos do seu segmento conforme exigido.
            </p>

            <h2 className="font-bold text-gray-900 text-base">6. Limitação de Responsabilidade</h2>
            <p>
              A Zelo não é escritório de advocacia e não presta assessoria jurídica. Os documentos
              gerados são instrumentos técnicos de conformidade trabalhista. Em caso de fiscalização ou
              litígio, recomendamos consultar advogado especializado em direito do trabalho.
            </p>

            <h2 className="font-bold text-gray-900 text-base">7. Guarda de Documentação</h2>
            <p>
              A empresa deve guardar todos os documentos gerados por no mínimo 20 (vinte) anos, conforme
              orientação técnica alinhada às exigências do GRO/NR-1 e às melhores práticas de conformidade
              trabalhista vigentes.
            </p>

            <h2 className="font-bold text-gray-900 text-base">8. Disposições Gerais</h2>
            <p>
              Este instrumento é regido pelas leis brasileiras. O foro eleito é o da comarca de Barra Mansa/RJ.
              Dúvidas: contato@plataformazelo.com.br
            </p>

            <p className="text-gray-400 text-xs pt-2">Versão 1.0 — 10/06/2026</p>
          </div>

          {/* Botão de aceite */}
          <div className="border-t border-gray-100 p-5 bg-gray-50">
            {!scrolled && (
              <p className="text-xs text-gray-400 text-center mb-3">
                Role até o final para habilitar o aceite
              </p>
            )}
            <button
              onClick={handleAccept}
              disabled={!scrolled || accepting}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#17C3C9] to-[#3F7DE0] text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {accepting
                ? 'Registrando aceite...'
                : '✅ Li e aceito os Termos de Uso e a Política de Privacidade'}
            </button>
            <p className="text-xs text-gray-400 text-center mt-2">
              O aceite é registrado eletronicamente com data, hora e IP — validade jurídica conforme MP 2.200-2/2001
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
