import React from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'

export default function NavBar({ theme = 'dark', onToggleTheme = () => {} }) {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()
  const isDark = theme === 'dark'

  const onLogout = () => {
    logout()
    navigate('/auth/login')
  }

  return (
    <header className={isDark ? 'sticky top-0 z-50 border-b border-white/10 bg-[#0d0d0d]/95 backdrop-blur' : 'sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur'}>
      <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className={isDark ? "font-['Syne'] text-2xl font-extrabold tracking-tight text-white" : "font-['Syne'] text-2xl font-extrabold tracking-tight text-slate-900"}>
          Ad<span className="text-emerald-500">flow</span>
        </Link>
        <div className={isDark ? 'hidden flex-1 items-center overflow-hidden rounded-lg border border-white/10 bg-[#1f1f1f] md:flex' : 'hidden flex-1 items-center overflow-hidden rounded-lg border border-slate-200 bg-slate-100 md:flex'}>
          <input
            type="text"
            readOnly
            placeholder="Busca canales de cripto, fitness, trading…"
            className={isDark ? 'h-10 w-full bg-transparent px-4 text-sm text-gray-200 placeholder:text-gray-500 outline-none' : 'h-10 w-full bg-transparent px-4 text-sm text-slate-700 placeholder:text-slate-400 outline-none'}
          />
          <button type="button" className="h-10 bg-emerald-500 px-4 text-sm font-semibold text-white">
            🔍
          </button>
        </div>
        <nav className="flex items-center gap-4">
          <button
            type="button"
            onClick={onToggleTheme}
            className={isDark ? 'rounded-md border border-white/20 px-2.5 py-1 text-xs text-gray-200 hover:border-emerald-400' : 'rounded-md border border-slate-300 px-2.5 py-1 text-xs text-slate-700 hover:border-emerald-500'}
          >
            {isDark ? '☀️ Light' : '🌙 Dark'}
          </button>
          {isAuthenticated ? (
            <>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `text-sm ${isActive ? 'text-emerald-400' : isDark ? 'text-gray-300' : 'text-slate-700'}`
                }
              >
                Dashboard
              </NavLink>
              <span className={isDark ? 'hidden text-sm text-gray-500 md:inline' : 'hidden text-sm text-slate-500 md:inline'}>{user?.email}</span>
              <button
                type="button"
                onClick={onLogout}
                className={isDark ? 'rounded-md border border-white/15 px-3 py-1.5 text-sm text-gray-300 hover:border-emerald-500 hover:text-emerald-400' : 'rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:border-emerald-500 hover:text-emerald-600'}
              >
                Salir
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/#categories"
                className={isDark ? 'hidden text-sm text-gray-400 transition hover:text-gray-100 md:inline' : 'hidden text-sm text-slate-500 transition hover:text-slate-900 md:inline'}
              >
                Explorar
              </NavLink>
              <NavLink
                to="/auth/register"
                className={isDark ? 'hidden text-sm text-gray-400 transition hover:text-gray-100 md:inline' : 'hidden text-sm text-slate-500 transition hover:text-slate-900 md:inline'}
              >
                Vender
              </NavLink>
              <NavLink
                to="/auth/login"
                className={isDark ? 'rounded-md border border-white/15 px-3 py-1.5 text-sm text-gray-300 hover:border-emerald-500 hover:text-emerald-400' : 'rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:border-emerald-500 hover:text-emerald-600'}
              >
                Entrar
              </NavLink>
              <NavLink
                to="/auth/register"
                className="rounded-md bg-emerald-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-600"
              >
                Registrarse
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
