import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import NavBar from '../navigation/NavBar'

export default function AppLayout() {
  const { pathname } = useLocation()
  const isLanding = pathname === '/'
  const isDashboard = pathname.startsWith('/dashboard')
  const [theme, setTheme] = React.useState(() => {
    if (typeof window === 'undefined') return 'dark'
    return localStorage.getItem('adflow-theme') || 'dark'
  })

  React.useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('adflow-theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))

  return (
    <div className={theme === 'dark' ? 'min-h-screen bg-[#0d0d0d] text-gray-100' : 'min-h-screen bg-slate-50 text-slate-900'}>
      <NavBar theme={theme} onToggleTheme={toggleTheme} />
      <main className={isLanding ? 'w-full' : `mx-auto w-full px-4 py-6 ${isDashboard ? 'max-w-7xl' : 'max-w-5xl'}`}>
        <Outlet context={{ theme }} />
      </main>
    </div>
  )
}
