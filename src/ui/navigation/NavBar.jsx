import React from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'

const S = {
  nav: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 48px', height: '72px',
    background: 'rgba(13,13,13,0.92)',
    borderBottom: '1px solid var(--border)',
    position: 'sticky', top: 0, zIndex: 100,
    backdropFilter: 'blur(16px)',
  },
  logo: {
    fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '22px',
    letterSpacing: '-0.5px', textDecoration: 'none', color: 'var(--text)',
  },
  logoAccent: { color: 'var(--green)' },
  search: {
    display: 'flex', alignItems: 'center',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '8px', overflow: 'hidden', flex: 1, maxWidth: '480px',
    margin: '0 32px',
  },
  searchInput: {
    flex: 1, background: 'transparent', border: 'none', outline: 'none',
    padding: '10px 16px', color: 'var(--text)', fontFamily: "'DM Sans', sans-serif",
    fontSize: '14px',
  },
  searchBtn: {
    background: 'var(--green)', border: 'none', padding: '10px 18px',
    cursor: 'pointer', color: '#fff', fontSize: '15px', transition: 'background .2s',
  },
  links: { display: 'flex', alignItems: 'center', gap: '24px', fontSize: '14px' },
  linkMuted: { color: 'var(--muted)', transition: 'color .2s', textDecoration: 'none' },
  btnOutline: {
    border: '1px solid var(--border)', borderRadius: '6px', padding: '7px 16px',
    transition: 'border-color .2s, color .2s', color: 'var(--muted)',
    background: 'transparent', cursor: 'pointer', fontSize: '14px',
    textDecoration: 'none',
  },
  btnGreen: {
    background: 'var(--green)', borderRadius: '6px', padding: '7px 18px',
    color: '#fff', fontWeight: 500, transition: 'background .2s',
    border: 'none', cursor: 'pointer', fontSize: '14px', textDecoration: 'none',
  },
}

export default function NavBar({ theme = 'dark', onToggleTheme = () => {} }) {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()

  const onLogout = () => { logout(); navigate('/auth/login') }

  return (
    <header style={S.nav}>
      <Link to="/" style={S.logo}>
        Ad<span style={S.logoAccent}>flow</span>
      </Link>

      <div style={S.search}>
        <input
          type="text"
          placeholder="Buscar audiencias, canales o temáticas..."
          style={S.searchInput}
          readOnly
        />
        <button type="button" style={S.searchBtn}>🔍</button>
      </div>

      <nav style={S.links}>
        {isAuthenticated ? (
          <>
            <NavLink to="/dashboard" style={({ isActive }) => ({ ...S.linkMuted, color: isActive ? 'var(--green)' : 'var(--muted)' })}>
              Dashboard
            </NavLink>
            <span style={{ ...S.linkMuted, fontSize: '13px' }}>{user?.email}</span>
            <button type="button" onClick={onLogout} style={S.btnOutline}>Salir</button>
          </>
        ) : (
          <>
            <NavLink to="/#categories" style={S.linkMuted}>Explorar</NavLink>
            <NavLink to="/auth/register" style={S.linkMuted}>Vender</NavLink>
            <NavLink to="/auth/login" style={S.btnOutline}>Entrar</NavLink>
            <NavLink to="/auth/register" style={S.btnGreen}>Registrarse</NavLink>
          </>
        )}
        <button
          type="button"
          onClick={onToggleTheme}
          style={{ ...S.btnOutline, padding: '5px 10px', fontSize: '12px' }}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </nav>
    </header>
  )
}
