import React from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'

export default function NavBar({ theme = 'dark', onToggleTheme = () => {} }) {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()
  const onLogout = () => { logout(); navigate('/auth/login') }

  return (
    <header className={isDark ? 'sticky top-0 z-50 border-b border-white/10 bg-[#0d0d0d]/95 backdrop-blur' : 'sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur'}>
      <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className={isDark ? "font-['Sora'] text-2xl font-bold tracking-tight text-white" : "font-['Sora'] text-2xl font-bold tracking-tight text-slate-900"}>
          Ad<span className="text-emerald-500">flow</span>
        </Link>
        <div className={isDark ? 'hidden w-full max-w-[360px] items-center overflow-hidden rounded-lg border border-white/10 bg-[#1f1f1f] opacity-70 md:flex' : 'hidden w-full max-w-[360px] items-center overflow-hidden rounded-lg border border-slate-200 bg-slate-100 opacity-70 md:flex'}>
          <input
            type="text"
            readOnly
            placeholder="Buscar audiencias, canales o temáticas..."
            className={isDark ? 'h-10 w-full bg-transparent px-4 text-sm text-gray-200 placeholder:text-gray-500 outline-none' : 'h-10 w-full bg-transparent px-4 text-sm text-slate-700 placeholder:text-slate-400 outline-none'}
          />
          <button type="button" className="h-10 bg-emerald-500 px-4 text-sm font-semibold text-white">
            🔍
          </button>
        </div>
      )}

      {/* Nav links */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
        {isAuthenticated ? (
          <>
            <NavLink to="/dashboard" style={({ isActive }) => ({ color: isActive ? '#1dbf73' : '#62646a', textDecoration: 'none', padding: '8px 12px' })}>
              Dashboard
            </NavLink>
            <span style={{ color: '#62646a', padding: '8px 12px', fontSize: '13px' }}>{user?.email}</span>
            <button onClick={onLogout} style={{ border: '1px solid #222', borderRadius: '4px', padding: '7px 16px', background: 'transparent', cursor: 'pointer', fontSize: '14px', fontWeight: 500, color: '#222' }}>
              Salir
            </button>
          </>
        ) : (
          <>
            <NavLink to="/#categories" style={{ color: '#62646a', textDecoration: 'none', padding: '8px 12px', transition: 'color .15s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#222'}
              onMouseLeave={e => e.currentTarget.style.color = '#62646a'}
            >
              Explorar
            </NavLink>
            <NavLink to="/auth/register" style={{ color: '#62646a', textDecoration: 'none', padding: '8px 12px', transition: 'color .15s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#222'}
              onMouseLeave={e => e.currentTarget.style.color = '#62646a'}
            >
              Vender
            </NavLink>
            <NavLink to="/auth/login" style={{ color: '#62646a', textDecoration: 'none', padding: '7px 16px', transition: 'color .15s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#222'}
              onMouseLeave={e => e.currentTarget.style.color = '#62646a'}
            >
              Iniciar sesión
            </NavLink>
            <NavLink to="/auth/register" style={{ border: '1px solid #222', borderRadius: '4px', padding: '7px 20px', color: '#222', textDecoration: 'none', fontWeight: 500, transition: 'background .15s, color .15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#222'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#222' }}
            >
              Únete
            </NavLink>
          </>
        )}
        <button onClick={onToggleTheme} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '16px', padding: '8px', marginLeft: '4px' }}>
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </nav>
    </header>
  )
}
