import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Radio, Inbox, Wallet, Settings, LogOut, Menu, Bell } from 'lucide-react'
import { useAuth } from '../../../../auth/AuthContext'
import { MOCK_REQUESTS } from './mockDataCreator'

const A  = '#8b5cf6'
const AG = (o) => `rgba(139,92,246,${o})`
const WA = '#25d366'
const F  = "'Inter', system-ui, sans-serif"
const D  = "'Sora', system-ui, sans-serif"

const NAV = [
  { to: '/creator',           icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/creator/channels',  icon: Radio,           label: 'Mis Canales' },
  { to: '/creator/requests',  icon: Inbox,           label: 'Solicitudes' },
  { to: '/creator/earnings',  icon: Wallet,          label: 'Ganancias' },
]

function SidebarLink({ to, icon: Icon, label, end, collapsed, badge }) {
  return (
    <NavLink to={to} end={end} style={{ textDecoration: 'none' }}>
      {({ isActive }) => (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: collapsed ? '11px' : '10px 14px',
          borderRadius: '10px', cursor: 'pointer',
          justifyContent: collapsed ? 'center' : 'flex-start',
          background: isActive ? AG(0.12) : 'transparent',
          borderLeft: `3px solid ${isActive ? A : 'transparent'}`,
          color: isActive ? A : 'var(--muted)',
          fontFamily: F, fontSize: '14px', fontWeight: isActive ? 600 : 400,
          transition: 'all .15s', position: 'relative',
        }}
          onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.color = 'var(--text)' } }}
          onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted)' } }}
        >
          <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} style={{ flexShrink: 0 }} />
          {!collapsed && label}
          {badge > 0 && (
            <span style={{
              marginLeft: 'auto', background: WA, color: '#fff',
              borderRadius: '20px', padding: '1px 7px', fontSize: '11px', fontWeight: 700,
              flexShrink: 0,
            }}>{badge}</span>
          )}
        </div>
      )}
    </NavLink>
  )
}

export default function CreatorLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)

  const nombre = user?.nombre || 'Creador'
  const email  = user?.email  || ''
  const initials = nombre.slice(0, 2).toUpperCase()
  const pendingRequests = MOCK_REQUESTS.filter(r => r.status === 'pendiente').length

  const onLogout = () => { logout(); navigate('/') }
  const sw = collapsed ? 68 : 240

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', fontFamily: F }}>

      {/* ── Sidebar ───────────────────────────────── */}
      <aside style={{
        width: `${sw}px`, flexShrink: 0,
        background: 'var(--surface)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh',
        transition: 'width .25s cubic-bezier(.4,0,.2,1)',
        overflow: 'hidden', zIndex: 30,
      }}>
        {/* Logo + toggle */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between',
          padding: collapsed ? '18px 12px' : '18px 20px',
          borderBottom: '1px solid var(--border)', minHeight: '64px',
        }}>
          {!collapsed && (
            <span style={{ fontFamily: D, fontWeight: 800, fontSize: '20px', letterSpacing: '-0.4px', color: 'var(--text)' }}>
              Ad<span style={{ color: A }}>flow</span>
            </span>
          )}
          <button onClick={() => setCollapsed(!collapsed)} style={{
            background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '8px',
            padding: '6px', cursor: 'pointer', color: 'var(--muted)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Menu size={16} />
          </button>
        </div>

        {/* User */}
        {!collapsed ? (
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
                background: 'rgba(37,211,102,0.15)', border: '1.5px solid rgba(37,211,102,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', fontWeight: 700, color: WA, fontFamily: D,
              }}>{initials}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nombre}</div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{email}</div>
                <span style={{ fontSize: '10px', background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.25)', color: WA, borderRadius: '10px', padding: '1px 7px', fontWeight: 600 }}>Creador</span>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: '12px', display: 'flex', justifyContent: 'center', borderBottom: '1px solid var(--border)' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(37,211,102,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: WA }}>{initials}</div>
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
          {NAV.map(item => <SidebarLink key={item.to} {...item} collapsed={collapsed} badge={item.to === '/creator/requests' ? pendingRequests : 0} />)}
        </nav>

        {/* Bottom */}
        <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <SidebarLink to="/creator/settings" icon={Settings} label="Configuración" collapsed={collapsed} />
          <button onClick={onLogout} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: collapsed ? '11px' : '10px 14px', justifyContent: collapsed ? 'center' : 'flex-start',
            borderRadius: '10px', borderLeft: '3px solid transparent',
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'var(--muted)', fontSize: '14px', fontFamily: F, width: '100%', transition: 'all .15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#ef4444' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted)' }}
          >
            <LogOut size={18} strokeWidth={1.8} style={{ flexShrink: 0 }} />
            {!collapsed && 'Cerrar sesión'}
          </button>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top bar */}
        <header style={{
          height: '60px', background: 'var(--surface)', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          padding: '0 24px', gap: '12px', position: 'sticky', top: 0, zIndex: 20,
        }}>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setNotifOpen(!notifOpen)} style={{
              background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '10px',
              padding: '8px', cursor: 'pointer', color: 'var(--muted)', display: 'flex', position: 'relative',
            }}>
              <Bell size={18} />
              {pendingRequests > 0 && (
                <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: WA, color: '#fff', borderRadius: '50%', width: '16px', height: '16px', fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{pendingRequests}</span>
              )}
            </button>
          </div>
          <span style={{ background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.25)', borderRadius: '20px', padding: '3px 10px', fontSize: '11px', fontWeight: 600, color: WA }}>Creador</span>
        </header>

        <main style={{ flex: 1, padding: '28px', overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
