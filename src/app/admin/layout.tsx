'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

const navItems = [
  { href: '/admin',        label: 'Empresas',         icon: '🏢' },
  { href: '/admin/vendas', label: 'Vendas',           icon: '💰' },
  { href: '/admin/videos', label: 'Gerenciar Vídeos', icon: '🎬' },
  { href: '/admin/ebooks', label: 'Ebooks',           icon: '📚' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [checking, setChecking] = useState(true)

  const isLogin = pathname === '/admin/login'

  useEffect(() => {
    if (isLogin) { setChecking(false); return }
    fetch('/api/admin/companies')
      .then((r) => { if (r.status === 401) router.replace('/admin/login'); else setChecking(false) })
      .catch(() => setChecking(false))
  }, [router, isLogin])

  const handleLogout = async () => { await fetch('/api/admin/login', { method: 'DELETE' }); router.replace('/admin/login') }

  if (isLogin) return <>{children}</>

  if (checking) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F4F7FB]"><div className="w-8 h-8 border-4 border-primary-800 border-t-transparent rounded-full animate-spin" /></div>
  }

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex">
      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-30 transform transition-transform duration-200 lg:translate-x-0 lg:static lg:flex lg:flex-col ${sidebarOpen ? 'translate-x-0 flex flex-col' : '-translate-x-full'}`}>
        <div className="px-4 pt-5 pb-3 border-b border-gray-100 flex flex-col items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-zelo-3.png" alt="Zelo" className="w-full max-w-[200px] h-auto" />
          <span className="mt-2 text-[10px] font-bold tracking-wide text-[#109CA1] bg-[#F0FBFC] border border-[#CCEFF1] px-2 py-0.5 rounded-full">ADMINISTRADOR</span>
        </div>

        <nav className="px-4 pt-3 pb-4 space-y-1 flex-1">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${active ? 'bg-gradient-to-r from-[#17C3C9] to-[#3F7DE0] text-white shadow-sm shadow-[#17C3C9]/30' : 'text-gray-600 hover:bg-gray-50'}`}>
                <span>{item.icon}</span> {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 w-full transition-colors">
            <span>🚪</span> Sair
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-zelo-3.png" alt="Zelo" className="h-11 w-auto" />
        </header>
        <main className="flex-1 p-4 lg:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
