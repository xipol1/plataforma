import React from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'

export default function NavBar() {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()

  const onLogout = () => {
    logout()
    navigate('/auth/login')
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0d0d0d]/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="font-['Syne'] text-2xl font-extrabold tracking-tight text-white">
          Ad<span className="text-emerald-500">flow</span>
        </Link>
        <div className="hidden flex-1 items-center overflow-hidden rounded-lg border border-white/10 bg-[#1f1f1f] md:flex">
          <input
            type="text"
            readOnly
            placeholder="Busca canales de cripto, fitness, trading…"
            className="h-10 w-full bg-transparent px-4 text-sm text-gray-200 placeholder:text-gray-500 outline-none"
          />
          <button type="button" className="h-10 bg-emerald-500 px-4 text-sm font-semibold text-white">
            🔍
          </button>
        </div>
        <nav className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `text-sm ${isActive ? 'text-emerald-400' : 'text-gray-300'}`
                }
              >
                Dashboard
              </NavLink>
              <span className="hidden text-sm text-gray-500 md:inline">{user?.email}</span>
              <button
                type="button"
                onClick={onLogout}
                className="rounded-md border border-white/15 px-3 py-1.5 text-sm text-gray-300 hover:border-emerald-500 hover:text-emerald-400"
              >
                Salir
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/"
                className="hidden text-sm text-gray-400 transition hover:text-gray-100 md:inline"
              >
                Explorar
              </NavLink>
              <NavLink
                to="/auth/register"
                className="hidden text-sm text-gray-400 transition hover:text-gray-100 md:inline"
              >
                Vender
              </NavLink>
              <NavLink
                to="/auth/login"
                className="rounded-md border border-white/15 px-3 py-1.5 text-sm text-gray-300 hover:border-emerald-500 hover:text-emerald-400"
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
