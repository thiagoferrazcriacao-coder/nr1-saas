'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

type CompanyGate = {
  employeeCount: number | null
  cnpj: string | null
  responsible: string | null
  gestorTutorialCompletedAt: string | null
  teamLinkSentAt: string | null
}

type SectorGate = { totalResponses: number }

type NavItem = { href: string; label: string; icon: string; enabled: boolean; reason?: string; badge?: string }

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [checking, setChecking] = useState(true)
  const [company, setCompany] = useState<CompanyGate | null>(null)
  const [sectors, setSectors] = useState<SectorGate[]>([])
  const [assessmentDone, setAssessmentDone] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const auth = await fetch('/api/auth/refresh', { method: 'POST' })
        if (!auth.ok) { router.replace('/login'); return }
        const terms = await fetch('/api/dashboard/accept-terms').then((r) => r.json())
        if (!terms.accepted) { router.replace('/termos'); return }
        const [settingsRes, sectorsRes, assessmentRes] = await Promise.all([
          fetch('/api/dashboard/company-settings'),
          fetch('/api/dashboard/sectors'),
          fetch('/api/dashboard/company-assessment'),
        ])
        if (settingsRes.ok) setCompany((await settingsRes.json()).company ?? null)
        if (sectorsRes.ok) setSectors(await sectorsRes.json())
        if (assessmentRes.ok) setAssessmentDone(!!(await assessmentRes.json()).assessment)
      } catch {
        router.replace('/login')
      } finally {
        setChecking(false)
      }
    }
    load()
  }, [router])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.replace('/login')
  }

  const tutorialDone = !!company?.gestorTutorialCompletedAt
  const companyConfigured = !!company?.employeeCount && !!company?.cnpj && !!company?.responsible
  const teamLinkSent = !!company?.teamLinkSentAt
  const totalResponses = sectors.reduce((sum, sector) => sum + sector.totalResponses, 0)
  const participation = company?.employeeCount ? Math.min(100, Math.round((totalResponses / company.employeeCount) * 100)) : 0
  const participationReady = participation >= 80
  const isAssessmentPage = pathname === '/painel/avaliacao-gestor'

  const navItems: NavItem[] = [
    { href: '/painel', label: 'Visão Geral', icon: '🏠', enabled: true },
    { href: '/painel/configuracoes', label: 'Dados da Empresa', icon: '🏢', enabled: tutorialDone, reason: 'Assista ao tutorial inicial primeiro.' },
    { href: '/painel/avaliacao-gestor', label: 'Avaliação do Gestor', icon: '📋', enabled: tutorialDone && companyConfigured, reason: !tutorialDone ? 'Assista ao tutorial inicial.' : 'Preencha os Dados da Empresa.', badge: !assessmentDone && tutorialDone && companyConfigured ? 'Pendente' : undefined },
    { href: '/painel/avaliacao-time', label: 'Avaliação do Time', icon: '📨', enabled: tutorialDone && companyConfigured && assessmentDone, reason: !companyConfigured ? 'Complete os Dados da Empresa.' : 'Complete a Avaliação do Gestor.', badge: teamLinkSent ? 'Enviado' : undefined },
    { href: '/painel/relatorio-geral', label: 'Relatório Geral', icon: '📊', enabled: teamLinkSent, reason: 'Confirme o envio do link ao time.' },
    { href: '/painel/documentos', label: 'Documentos', icon: '📄', enabled: teamLinkSent, reason: 'Confirme o envio do link ao time.' },
    { href: '/painel/historico', label: 'Histórico', icon: '📦', enabled: teamLinkSent, reason: 'Confirme o envio do link ao time.' },
    { href: '/painel/material-didatico', label: 'Material Didático', icon: '🎓', enabled: teamLinkSent, reason: 'Confirme o envio do link ao time.' },
  ]

  if (checking) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="w-8 h-8 border-4 border-primary-800 border-t-transparent rounded-full animate-spin" /></div>

  const nextStep = !tutorialDone
    ? { text: 'Assista ao tutorial inicial para começar.', href: '/painel', label: 'Abrir tutorial' }
    : !companyConfigured
      ? { text: 'Preencha os Dados da Empresa para liberar a Avaliação do Gestor.', href: '/painel/configuracoes', label: 'Preencher dados' }
      : !assessmentDone
        ? { text: 'Responda a Avaliação do Gestor para liberar a Avaliação do Time.', href: '/painel/avaliacao-gestor', label: 'Responder agora' }
        : !teamLinkSent
          ? { text: 'Envie o link na Avaliação do Time para liberar as demais áreas.', href: '/painel/avaliacao-time', label: 'Enviar link' }
          : !participationReady
            ? { text: `Aguardando 80% de respostas do time — agora ${participation}%.`, href: '/painel/avaliacao-time', label: 'Acompanhar respostas' }
            : null

  const routeIs = (prefix: string) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  let pageLock: { reason: string; href: string; label: string } | null = null
  if (routeIs('/painel/configuracoes') && !tutorialDone) pageLock = { reason: 'Assista ao tutorial inicial antes de preencher os dados da empresa.', href: '/painel', label: 'Abrir tutorial' }
  else if (routeIs('/painel/avaliacao-gestor') && (!tutorialDone || !companyConfigured)) pageLock = { reason: !tutorialDone ? 'Assista ao tutorial inicial primeiro.' : 'Preencha os Dados da Empresa primeiro.', href: !tutorialDone ? '/painel' : '/painel/configuracoes', label: !tutorialDone ? 'Abrir tutorial' : 'Preencher dados' }
  else if (routeIs('/painel/avaliacao-time') && (!companyConfigured || !assessmentDone)) pageLock = { reason: !companyConfigured ? 'Complete os Dados da Empresa primeiro.' : 'Complete a Avaliação do Gestor primeiro.', href: !companyConfigured ? '/painel/configuracoes' : '/painel/avaliacao-gestor', label: !companyConfigured ? 'Preencher dados' : 'Responder avaliação' }
  else if ((routeIs('/painel/relatorio-geral') || routeIs('/painel/documentos') || routeIs('/painel/historico') || routeIs('/painel/material-didatico') || routeIs('/painel/setor')) && !teamLinkSent) pageLock = { reason: 'Confirme o envio do link aos funcionários na Avaliação do Time.', href: '/painel/avaliacao-time', label: 'Abrir Avaliação do Time' }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-30 transform transition-transform duration-200 lg:translate-x-0 lg:static lg:flex lg:flex-col ${sidebarOpen ? 'translate-x-0 flex flex-col' : '-translate-x-full'}`}>
        <div className="px-4 pt-5 pb-3 border-b border-gray-100 flex justify-center"><img src="/logo-zelo-3.png" alt="Zelo — Plataforma de NR1" className="w-full max-w-[210px] h-auto" /></div>
        <nav className="px-4 pt-2 pb-4 space-y-1 flex-1">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== '/painel' && pathname.startsWith(item.href))
            const className = `flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${active ? 'bg-gradient-to-r from-[#17C3C9] to-[#3F7DE0] text-white shadow-sm shadow-[#17C3C9]/30' : item.enabled ? 'text-gray-600 hover:bg-gray-50' : 'text-gray-300 cursor-not-allowed'}`
            const content = <><span className="flex items-center gap-3"><span>{item.icon}</span>{item.label}</span>{item.badge && <span className="text-xs bg-orange-100 text-orange-700 border border-orange-300 px-2 py-0.5 rounded-full font-semibold">{item.badge}</span>}{!item.enabled && <span className="text-xs">🔒</span>}</>
            return item.enabled ? <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)} className={className}>{content}</Link> : <span key={item.href} title={item.reason} className={className}>{content}</span>
          })}
        </nav>
        <div className="p-4 border-t border-gray-100"><button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 w-full transition-colors"><span>🚪</span>Sair</button></div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3"><button onClick={() => setSidebarOpen(true)} className="text-gray-500 hover:text-gray-700"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg></button><img src="/logo-zelo-3.png" alt="Zelo" className="h-12 w-auto" /></header>
        {nextStep && !isAssessmentPage && <div className="bg-orange-50 border-b border-orange-200 px-4 py-3 flex items-center justify-between gap-4 flex-wrap"><p className="text-sm text-orange-800 font-medium">⚠️ {nextStep.text}</p><Link href={nextStep.href} className="text-xs bg-orange-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-orange-700">{nextStep.label}</Link></div>}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <div className={pageLock ? 'relative min-h-[420px]' : ''}>
            {children}
            {pageLock && (
              <div className="absolute inset-0 z-10 bg-gray-50/95 flex items-start justify-center pt-16 p-4">
                <div className="max-w-md text-center bg-white border border-gray-200 rounded-2xl shadow-lg p-7">
                  <div className="text-4xl mb-3">🔒</div>
                  <h2 className="text-lg font-bold text-gray-900">Área bloqueada</h2>
                  <p className="text-sm text-gray-500 mt-2">{pageLock.reason}</p>
                  <Link href={pageLock.href} className="inline-flex mt-5 bg-gradient-to-r from-[#17C3C9] to-[#3F7DE0] text-white px-5 py-2.5 rounded-xl text-sm font-bold">{pageLock.label} →</Link>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
