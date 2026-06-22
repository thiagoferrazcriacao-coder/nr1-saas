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

  useEffect(() => {
    fetch('/api/auth/refresh', { method: 'POST' })
      .then((r) => {
        if (!r.ok) { router.replace('/login'); return }
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

  const navItems = [
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
    <div className="min-h-screen bg-[#F4F7FB] flex">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-[#0E2A47] z-30 transform transition-transform duration-200 lg:translate-x-0 lg:static lg:flex lg:flex-col ${
          sidebarOpen ? 'translate-x-0 flex flex-col' : '-translate-x-full'
        }`}
      >
        {/* Marca */}
        <div className="px-5 pt-6 pb-5 border-b border-white/10 flex items-center gap-2.5">
          <svg width="34" height="34" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="zsb" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#19C6C9" />
                <stop offset="1" stopColor="#5B8DEF" />
              </linearGradient>
            </defs>
            <path d="M18 17 H46 V25 L30 39 H46 V47 H18 V39 L34 25 H18 Z" fill="url(#zsb)" />
          </svg>
          <div className="leading-none">
            <span className="text-white font-black text-xl">Zelo</span>
            <span className="block text-[9px] text-[#5BD9DD] tracking-[0.15em] mt-1 font-semibold">PLATAFORMA DE NR1</span>
          </div>
        </div>

        <nav className="px-3 pt-4 pb-4 space-y-1 flex-1">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== '/painel' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-white text-[#0E2A47] font-semibold shadow-sm'
                    : 'text-[#9FB6CE] hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </span>
                {item.badge && (
                  <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full font-semibold">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-[#9FB6CE] hover:bg-red-500/10 hover:text-red-300 w-full transition-colors"
          >
            <span className="text-base">🚪</span> Sair
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
        {!assessmentDone && !isAssessmentPage && (
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
