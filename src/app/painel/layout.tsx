'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [checking, setChecking] = useState(true)
  const [assessmentDone, setAssessmentDone] = useState(true) // assume done até confirmar
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    fetch('/api/auth/refresh', { method: 'POST' })
      .then((r) => {
        if (!r.ok) { router.replace('/login'); return }
        // Descobre se é o dono do projeto (admin geral)
        fetch('/api/auth/whoami')
          .then((r) => r.json())
          .then((w) => setIsOwner(!!w.isOwner))
          .catch(() => {})
        // Verifica aceite de termos antes de liberar o painel
        fetch('/api/dashboard/accept-terms')
          .then((r) => r.json())
          .then((data) => {
            if (!data.accepted) { router.replace('/termos'); return }
            setChecking(false)
            fetch('/api/dashboard/company-assessment')
              .then((r) => r.json())
              .then((d) => setAssessmentDone(!!d.assessment))
              .catch(() => setAssessmentDone(false))
          })
          .catch(() => setChecking(false))
      })
      .catch(() => router.replace('/login'))
  }, [router])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.replace('/login')
  }

  const isAssessmentPage = pathname === '/painel/avaliacao-gestor'

  // Menu do dono do projeto (admin geral) × menu da empresa cliente
  const navItems = isOwner
    ? [
        { href: '/painel/empresas', label: 'Empresas', icon: '🏢' },
        { href: '/painel/vendas', label: 'Vendas', icon: '💰' },
        { href: '/painel/videos', label: 'Gerenciar Vídeos', icon: '🎬' },
        { href: '/painel/configuracoes', label: 'Configurações', icon: '⚙️' },
      ]
    : [
        { href: '/painel', label: 'Visão Geral', icon: '🏠' },
        {
          href: '/painel/avaliacao-gestor',
          label: 'Avaliação do Gestor',
          icon: '📋',
          badge: !assessmentDone ? 'Pendente' : undefined,
        },
        { href: '/painel/relatorio-geral', label: 'Relatório Geral', icon: '📊' },
        { href: '/painel/documentos', label: 'Documentos', icon: '📄' },
        { href: '/painel/material-didatico', label: 'Material Didático', icon: '🎓' },
        { href: '/painel/configuracoes', label: 'Configurações', icon: '⚙️' },
      ]

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-primary-800 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-30 transform transition-transform duration-200 lg:translate-x-0 lg:static lg:flex lg:flex-col ${
          sidebarOpen ? 'translate-x-0 flex flex-col' : '-translate-x-full'
        }`}
      >
        <div className="px-4 pt-5 pb-3 border-b border-gray-100 flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-zelo-3.png" alt="Zelo — Plataforma de NR1" className="w-full max-w-[210px] h-auto" />
        </div>

        <nav className="px-4 pt-2 pb-4 space-y-1 flex-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                pathname === item.href || (item.href !== '/painel' && pathname.startsWith(item.href))
                  ? 'bg-gradient-to-r from-[#17C3C9] to-[#3F7DE0] text-white shadow-sm shadow-[#17C3C9]/30'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center gap-3">
                <span>{item.icon}</span>
                {item.label}
              </span>
              {item.badge && (
                <span className="text-xs bg-orange-100 text-orange-700 border border-orange-300 px-2 py-0.5 rounded-full font-semibold">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 w-full transition-colors"
          >
            <span>🚪</span> Sair
          </button>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar mobile */}
        <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-zelo-3.png" alt="Zelo" className="h-12 w-auto" />
        </header>

        {/* Banner avaliação pendente */}
        {!isOwner && !assessmentDone && !isAssessmentPage && (
          <div className="bg-orange-50 border-b border-orange-200 px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
            <p className="text-sm text-orange-800 font-medium">
              ⚠️ Complete a <strong>Avaliação do Gestor</strong> para liberar todas as funcionalidades do sistema.
            </p>
            <Link
              href="/painel/avaliacao-gestor"
              className="text-xs bg-orange-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-orange-700 transition-colors flex-shrink-0"
            >
              Preencher agora
            </Link>
          </div>
        )}

        <main className="flex-1 p-4 lg:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
