import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Search, Zap, Megaphone, Wallet, Settings, LogOut, Menu, X, Bell } from 'lucide-react'
import { useAuth } from '../../../../auth/AuthContext'
import { MOCK_USER, MOCK_NOTIFICATIONS } from './mockData'

const A  = '#8b5cf6'
const AG = (o) => `rgba(139,92,246,${o})`
const F  = "'Inter', system-ui, sans-serif"
const D  = "'Sora', system-ui, sans-serif"

const NAV = [
  { to: '/advertiser',          icon: LayoutDashboard, label: 'Dashboard',  end: true },
  { to: '/advertiser/explore',  icon: Search,          label: 'Explorar'         },
  { to: '/advertiser/autobuy',  icon: Zap,             label: 'Auto-Buy'         },
  { to: '/advertiser/ads',      icon: Megaphone,       label: 'Mis Anuncios'     },
  { to: '/advertiser/finances', icon: Wallet,          label: 'Finanzas'         },
]

const BOTTOM_NAV = [
  { to: '/advertiser/settings', icon: Settings, label: 'Configuración' },
]

function SidebarLink({ to, icon: Icon, label, end, collapsed }) {
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
          transition: 'all .15s',
        }}
          onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.color = 'var(--text)' } }}
          onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted)' } }}
        >
          <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} style={{ flexShrink: 0 }} />
          {!collapsed && label}
        </div>
      )}
    </NavLink>
  )
}

export default function AdvertiserLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const unread = MOCK_NOTIFICATIONS.filter(n => !n.read).length

  const nombre = user?.nombre || MOCK_USER.name
  const email  = user?.email  || MOCK_USER.email
  const initials = nombre.slice(0, 2).toUpperCase()

  const onLogout = () => { logout(); navigate('/') }
  const sw = collapsed ? 68 : 240

  const notifIcon = { success: '✅', info: 'ℹ️', warning: '⚠️' }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', fontFamily: F, position: 'relative' }}>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40,
        }} />
      )}

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
          borderBottom: '1px solid var(--border)',
          minHeight: '64px',
        }}>
          {!collapsed && (
            <span style={{ fontFamily: D, fontWeight: 800, fontSize: '20px', letterSpacing: '-0.4px', color: 'var(--text)' }}>
              Ad<span style={{ color: A }}>flow</span>
            </span>
          )}
          <button onClick={() => setCollapsed(!collapsed)} style={{
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: '8px', padding: '6px', cursor: 'pointer', color: 'var(--muted)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Menu size={16} />
          </button>
        </div>

        {/* User avatar */}
        {!collapsed && (
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
                background: AG(0.2), border: `1.5px solid ${AG(0.4)}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', fontWeight: 700, color: A, fontFamily: D,
              }}>{initials}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nombre}</div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{email}</div>
              </div>
            </div>
          </div>
        )}
        {collapsed && (
          <div style={{ padding: '12px', display: 'flex', justifyContent: 'center', borderBottom: '1px solid var(--border)' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: AG(0.2), display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '13px', fontWeight: 700, color: A,
            }}>{initials}</div>
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
          {NAV.map(item => <SidebarLink key={item.to} {...item} collapsed={collapsed} />)}
        </nav>

        {/* Bottom nav */}
        <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {BOTTOM_NAV.map(item => <SidebarLink key={item.to} {...item} collapsed={collapsed} />)}
          <button onClick={onLogout} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: collapsed ? '11px' : '10px 14px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            borderRadius: '10px', borderLeft: '3px solid transparent',
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'var(--muted)', fontSize: '14px', fontFamily: F, width: '100%',
            transition: 'all .15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#ef4444' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted)' }}
          >
            <LogOut size={18} strokeWidth={1.8} style={{ flexShrink: 0 }} />
            {!collapsed && 'Cerrar sesión'}
          </button>
        </div>
      </aside>

      {/* ── Main area ───────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

        {/* Top bar */}
        <header style={{
          height: '60px', background: 'var(--surface)', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          padding: '0 24px', gap: '12px', position: 'sticky', top: 0, zIndex: 20,
        }}>
          {/* Notifications */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setNotifOpen(!notifOpen)} style={{
              background: 'var(--bg)', border: '1px solid var(--border)',
              borderRadius: '10px', padding: '8px', cursor: 'pointer',
              color: 'var(--muted)', display: 'flex', position: 'relative',
            }}>
              <Bell size={18} />
              {unread > 0 && (
                <span style={{
                  position: 'absolute', top: '-4px', right: '-4px',
                  background: A, color: '#fff', borderRadius: '50%',
                  width: '16px', height: '16px', fontSize: '10px', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{unread}</span>
              )}
            </button>

            {notifOpen && (
              <div style={{
                position: 'absolute', top: '44px', right: 0,
                width: '340px', background: 'var(--surface)',
                border: '1px solid var(--border)', borderRadius: '14px',
                boxShadow: '0 16px 40px rgba(0,0,0,0.25)', zIndex: 100,
                overflow: 'hidden',
              }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: D, fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}>Notificaciones</span>
                  <button style={{ background: 'none', border: 'none', fontSize: '12px', color: A, cursor: 'pointer', fontFamily: F }}>Marcar todas leídas</button>
                </div>
                {MOCK_NOTIFICATIONS.map(n => (
                  <div key={n.id} style={{
                    padding: '12px 16px', borderBottom: '1px solid var(--border)',
                    background: n.read ? 'transparent' : AG(0.04),
                    display: 'flex', gap: '10px', alignItems: 'flex-start',
                  }}>
                    <span style={{ fontSize: '16px', flexShrink: 0 }}>{notifIcon[n.type]}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '2px' }}>{n.title}</div>
                      <div style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.4 }}>{n.desc}</div>
                      <div style={{ fontSize: '11px', color: 'var(--muted2)', marginTop: '4px' }}>{n.time}</div>
                    </div>
                    {!n.read && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: A, flexShrink: 0, marginTop: '4px' }} />}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Theme toggle hint */}
          <div style={{ fontSize: '12px', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              background: AG(0.1), border: `1px solid ${AG(0.25)}`,
              borderRadius: '20px', padding: '3px 10px', fontSize: '11px', fontWeight: 600, color: A,
            }}>Anunciante</span>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: '28px', overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
