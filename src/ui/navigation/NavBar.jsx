import React from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'

export default function NavBar({ theme = 'dark', onToggleTheme = () => {} }) {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()
  const onLogout = () => { logout(); navigate('/auth/login') }

  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 48px', height: '72px',
      background: '#fff',
      borderBottom: '1px solid #e4e5e7',
      position: 'sticky', top: 0, zIndex: 100,
    }}>
      {/* Logo */}
      <Link to="/" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '22px', letterSpacing: '-0.5px', textDecoration: 'none', color: '#222' }}>
        Ad<span style={{ color: '#1dbf73' }}>flow</span>
      </Link>

      {/* Secondary search */}
      {!isAuthenticated && (
        <div style={{ display: 'flex', alignItems: 'center', background: '#f5f5f5', border: '1px solid #e4e5e7', borderRadius: '8px', height: '38px', width: '240px', opacity: 0.7, overflow: 'hidden' }}>
          <span style={{ padding: '0 10px', color: '#999', fontSize: '14px', flexShrink: 0 }}>🔍</span>
          <input type="text" placeholder="Buscar audiencias, canales o temáticas..." style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '13px', color: '#555', fontFamily: "'Inter', sans-serif", minWidth: 0 }} />
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
