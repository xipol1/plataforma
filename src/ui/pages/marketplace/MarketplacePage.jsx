import React, { useState, useMemo } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../auth/AuthContext'

const A  = '#8b5cf6'
const AD = '#7c3aed'
const AG = (o) => `rgba(139,92,246,${o})`

const PLAT = {
  wa: { color: '#25d366', bg: 'rgba(37,211,102,0.12)',  label: 'WhatsApp' },
  tg: { color: '#2aabee', bg: 'rgba(42,171,238,0.12)',  label: 'Telegram' },
  dc: { color: '#5865f2', bg: 'rgba(88,101,242,0.12)',  label: 'Discord'  },
  yt: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   label: 'YouTube'  },
  ig: { color: '#e1306c', bg: 'rgba(225,48,108,0.12)',  label: 'Instagram' },
  tt: { color: '#010101', bg: 'rgba(100,100,100,0.12)', label: 'TikTok'  },
}

const BADGE = {
  verified: { bg: AG(0.12), color: A,         border: AG(0.22) },
  trending: { bg: 'rgba(249,115,22,0.12)',  color: '#f97316', border: 'rgba(249,115,22,0.22)' },
  new:      { bg: 'rgba(59,130,246,0.12)',  color: '#3b82f6', border: 'rgba(59,130,246,0.22)' },
}

const ALL_LISTINGS = [
  { platCls: 'wa', platform: 'WhatsApp', category: 'Ecommerce', badge: 'TOP',   badgeType: 'verified', seller: 'ecomhub',      initials: 'EH', color: '#25d366', isPro: true,  title: 'Comunidad de compradores activos en ecommerce con alto poder adquisitivo',       rating: '5.0', reviews:  97, members: '12.400', price: '€320', icon: '🛒' },
  { platCls: 'wa', platform: 'WhatsApp', category: 'Fitness',   badge: 'Hot',   badgeType: 'trending', seller: 'fitcoach_lu',  initials: 'FT', color: '#25d366', isPro: true,  title: 'Canal fitness con audiencia comprometida, recetas, retos semanales y productos', rating: '4.9', reviews: 214, members: '8.700',  price: '€180', icon: '💪' },
  { platCls: 'tg', platform: 'Telegram', category: 'Marketing', badge: 'TOP',   badgeType: 'verified', seller: 'techpro',      initials: 'TP', color: '#2aabee', isPro: true,  title: 'Audiencia tech hispanohablante con alta tasa de engagement y conversión',        rating: '4.9', reviews: 312, members: '8.200',  price: '€450', icon: '💻' },
  { platCls: 'dc', platform: 'Discord',  category: 'Gaming',    badge: 'Nuevo', badgeType: 'new',      seller: 'gamermk',      initials: 'GM', color: '#5865f2', isPro: false, title: 'Servidor gaming con comunidad activa, torneos semanales y alto engagement',      rating: '4.8', reviews: 189, members: '4.500',  price: '€280', icon: '🎮' },
  { platCls: 'dc', platform: 'Discord',  category: 'IA & Tech', badge: 'TOP',   badgeType: 'verified', seller: 'ai_labs_co',   initials: 'AI', color: '#a855f7', isPro: true,  title: 'Comunidad IA: prompts, herramientas, automatizaciones y novedades del sector',  rating: '4.9', reviews: 421, members: '11.000', price: '€220', icon: '🤖' },
  { platCls: 'tg', platform: 'Telegram', category: 'Lifestyle', badge: null,    badgeType: null,       seller: 'lifestyle_co', initials: 'LS', color: '#f97316', isPro: false, title: 'Audiencia lifestyle con interés en moda, viajes y tendencias de consumo',        rating: '4.8', reviews: 138, members: '3.400',  price: '€150', icon: '💡' },
  { platCls: 'wa', platform: 'WhatsApp', category: 'Educación', badge: 'Nuevo', badgeType: 'new',      seller: 'eduhub_es',    initials: 'ED', color: '#25d366', isPro: false, title: 'Canal educativo con cursos, tutoriales y comunidad de estudiantes activos',      rating: '4.7', reviews:  63, members: '5.200',  price: '€120', icon: '📚' },
  { platCls: 'yt', platform: 'YouTube',  category: 'Marketing', badge: 'Hot',   badgeType: 'trending', seller: 'marketpro',    initials: 'MP', color: '#ef4444', isPro: true,  title: 'Canal de marketing digital con audiencia de profesionales y emprendedores',     rating: '4.8', reviews: 276, members: '22.000', price: '€600', icon: '📈' },
  { platCls: 'tg', platform: 'Telegram', category: 'Ecommerce', badge: 'TOP',   badgeType: 'verified', seller: 'dropship_es',  initials: 'DS', color: '#2aabee', isPro: true,  title: 'Comunidad dropshipping con proveedores, tendencias y soporte 24/7',             rating: '4.9', reviews: 501, members: '15.300', price: '€380', icon: '🛍️' },
  { platCls: 'dc', platform: 'Discord',  category: 'Gaming',    badge: null,    badgeType: null,       seller: 'rpg_guild',    initials: 'RG', color: '#5865f2', isPro: false, title: 'Servidor RPG con más de 4K jugadores activos, eventos diarios y tienda',        rating: '4.6', reviews:  98, members: '4.100',  price: '€160', icon: '⚔️' },
  { platCls: 'wa', platform: 'WhatsApp', category: 'Fitness',   badge: 'Hot',   badgeType: 'trending', seller: 'nutricoach',   initials: 'NC', color: '#25d366', isPro: true,  title: 'Canal nutrición y bienestar con planes de dieta personalizados y comunidad',    rating: '4.8', reviews: 183, members: '9.600',  price: '€210', icon: '🥗' },
  { platCls: 'tg', platform: 'Telegram', category: 'IA & Tech', badge: 'Nuevo', badgeType: 'new',      seller: 'ai_daily',     initials: 'AD', color: '#2aabee', isPro: false, title: 'Noticias y recursos de inteligencia artificial en español cada día',             rating: '4.7', reviews:  44, members: '6.800',  price: '€140', icon: '🧠' },
]

const PLATFORMS = ['Todos', 'WhatsApp', 'Telegram', 'Discord', 'YouTube', 'Instagram', 'TikTok']
const CATEGORIES = ['Todas', 'Ecommerce', 'Fitness', 'Marketing', 'Gaming', 'IA & Tech', 'Educación', 'Lifestyle']

export default function MarketplacePage() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '')
  const [hovCard, setHovCard] = useState(null)

  const activePlatform = searchParams.get('platform') || 'Todos'
  const activeCategory = searchParams.get('category') || 'Todas'
  const activeQ = searchParams.get('q') || ''

  const F = "'Inter', system-ui, sans-serif"
  const D = "'Sora', system-ui, sans-serif"

  const filtered = useMemo(() => {
    return ALL_LISTINGS.filter(l => {
      const matchPlat = activePlatform === 'Todos' || l.platform === activePlatform
      const matchCat  = activeCategory === 'Todas'  || l.category === activeCategory
      const matchQ    = !activeQ || l.title.toLowerCase().includes(activeQ.toLowerCase()) || l.seller.toLowerCase().includes(activeQ.toLowerCase())
      return matchPlat && matchCat && matchQ
    })
  }, [activePlatform, activeCategory, activeQ])

  const setFilter = (key, value) => {
    const next = new URLSearchParams(searchParams)
    if ((key === 'platform' && value === 'Todos') || (key === 'category' && value === 'Todas')) {
      next.delete(key)
    } else {
      next.set(key, value)
    }
    setSearchParams(next)
  }

  const handleSearch = () => {
    const next = new URLSearchParams(searchParams)
    if (searchInput.trim()) next.set('q', searchInput.trim())
    else next.delete('q')
    setSearchParams(next)
  }

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text)', fontFamily: F, minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg2)', padding: '32px 48px 24px' }}>
        <div style={{ maxWidth: '1160px', margin: '0 auto' }}>
          <h1 style={{ fontFamily: D, fontSize: '28px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '6px' }}>
            Explorar canales
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '20px' }}>
            {filtered.length} canales disponibles
          </p>

          {/* Search bar */}
          <div style={{
            display: 'flex', maxWidth: '560px',
            background: 'var(--surface)',
            border: '1px solid var(--border-med)',
            borderRadius: '10px', overflow: 'hidden', height: '44px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', flex: 1, padding: '0 14px', gap: '10px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                style={{ color: 'var(--muted2)', flexShrink: 0 }}>
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="Buscar canales, temáticas o vendedores..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '14px', color: 'var(--text)', fontFamily: F }}
              />
            </div>
            <button onClick={handleSearch} style={{
              background: A, color: '#fff', border: 'none', cursor: 'pointer',
              padding: '0 20px', fontSize: '13px', fontWeight: 600,
              transition: 'background .15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = AD}
              onMouseLeave={e => e.currentTarget.style.background = A}
            >Buscar</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1160px', margin: '0 auto', padding: '32px 48px' }}>

        {/* Platform filters */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
          {PLATFORMS.map(p => {
            const isActive = activePlatform === p || (p === 'Todos' && activePlatform === 'Todos')
            return (
              <button key={p} onClick={() => setFilter('platform', p)} style={{
                background: isActive ? A : 'var(--surface)',
                color: isActive ? '#fff' : 'var(--muted)',
                border: `1px solid ${isActive ? A : 'var(--border)'}`,
                borderRadius: '999px', padding: '5px 14px',
                fontSize: '13px', fontWeight: isActive ? 600 : 400,
                cursor: 'pointer', transition: 'all .15s',
              }}>{p}</button>
            )
          })}
        </div>

        {/* Category filters */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '32px' }}>
          {CATEGORIES.map(c => {
            const isActive = activeCategory === c || (c === 'Todas' && activeCategory === 'Todas')
            return (
              <button key={c} onClick={() => setFilter('category', c)} style={{
                background: isActive ? AG(0.12) : 'transparent',
                color: isActive ? A : 'var(--muted2)',
                border: `1px solid ${isActive ? AG(0.3) : 'transparent'}`,
                borderRadius: '6px', padding: '4px 12px',
                fontSize: '12px', fontWeight: isActive ? 600 : 400,
                cursor: 'pointer', transition: 'all .15s',
              }}>{c}</button>
            )
          })}
        </div>

        {/* Results grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--muted)' }}>
            <p style={{ fontSize: '18px', fontFamily: D, fontWeight: 600, marginBottom: '8px', color: 'var(--text)' }}>Sin resultados</p>
            <p style={{ fontSize: '14px' }}>Prueba con otros filtros o términos de búsqueda.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {filtered.map((l, i) => {
              const plat  = PLAT[l.platCls]
              const badge = l.badgeType ? BADGE[l.badgeType] : null
              const isHov = hovCard === i
              return (
                <div key={l.seller + i}
                  onMouseEnter={() => setHovCard(i)}
                  onMouseLeave={() => setHovCard(null)}
                  style={{
                    background: 'var(--surface)',
                    border: `1px solid ${isHov ? 'var(--border-med)' : 'var(--border)'}`,
                    borderRadius: '14px', overflow: 'hidden', cursor: 'pointer',
                    transition: 'all .2s',
                    transform: isHov ? 'translateY(-4px)' : 'none',
                    boxShadow: isHov ? '0 20px 48px rgba(0,0,0,0.3)' : 'none',
                  }}
                >
                  {/* Thumbnail */}
                  <div style={{
                    height: '120px', position: 'relative',
                    background: 'var(--bg3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderBottom: '1px solid var(--border)',
                  }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', background: plat.color }} />
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '11px',
                      background: plat.bg, border: `1px solid ${plat.color}25`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
                    }}>{l.icon}</div>
                    <div style={{
                      position: 'absolute', top: '10px', left: '16px',
                      background: plat.bg, color: plat.color,
                      borderRadius: '6px', padding: '3px 8px',
                      fontSize: '11px', fontWeight: 600,
                    }}>{plat.label}</div>
                    {badge && (
                      <div style={{
                        position: 'absolute', top: '10px', right: '10px',
                        background: badge.bg, color: badge.color,
                        border: `1px solid ${badge.border}`,
                        borderRadius: '6px', padding: '2px 8px',
                        fontSize: '10px', fontWeight: 700,
                      }}>{l.badge}</div>
                    )}
                  </div>

                  {/* Body */}
                  <div style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <div style={{
                        width: '26px', height: '26px', borderRadius: '50%',
                        background: `${l.color}20`, border: `1px solid ${l.color}40`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '10px', fontWeight: 700, color: l.color, flexShrink: 0,
                      }}>{l.initials}</div>
                      <span style={{ fontSize: '13px', fontWeight: 500 }}>
                        {l.seller}
                        {l.isPro && <span style={{ fontSize: '10px', background: AG(0.12), color: A, borderRadius: '4px', padding: '1px 6px', fontWeight: 600, marginLeft: '5px' }}>PRO</span>}
                      </span>
                    </div>

                    <p style={{
                      fontSize: '13px', lineHeight: 1.5, color: 'var(--text)', marginBottom: '12px',
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>{l.title}</p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: 'var(--muted)', marginBottom: '14px' }}>
                      <span style={{ color: '#f59e0b' }}>★ <span style={{ color: 'var(--text)', fontWeight: 600 }}>{l.rating}</span></span>
                      <span>({l.reviews})</span>
                      <span style={{ marginLeft: 'auto' }}>{l.members} seguidores</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                      <div>
                        <span style={{ fontFamily: D, fontSize: '18px', fontWeight: 700 }}>{l.price}</span>
                        <span style={{ fontSize: '11px', color: 'var(--muted)', marginLeft: '2px' }}>/post</span>
                      </div>
                      <Link to={isAuthenticated ? '/dashboard' : '/auth/login'} style={{
                        background: 'transparent', color: A,
                        border: `1px solid ${AG(0.3)}`,
                        borderRadius: '7px', padding: '6px 14px',
                        fontSize: '12px', fontWeight: 600,
                        textDecoration: 'none', transition: 'all .2s',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.background = A; e.currentTarget.style.color = '#fff' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = A }}
                      >{isAuthenticated ? 'Contratar' : 'Ver canal'}</Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
