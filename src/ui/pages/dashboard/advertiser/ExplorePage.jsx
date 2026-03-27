import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, X, CheckCircle, Users, TrendingUp, Star, Grid, List,
  Filter, SlidersHorizontal, ChevronDown, ExternalLink, Zap,
} from 'lucide-react'
import { MOCK_CHANNELS, PLATFORM_COLORS } from './mockData'

const A  = '#8b5cf6'
const AG = (o) => `rgba(139,92,246,${o})`
const F  = "'Inter', system-ui, sans-serif"
const D  = "'Sora', system-ui, sans-serif"
const OK = '#10b981'

const fmtAudience = (n) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1000)      return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K`
  return String(n)
}

// ─── Platform badge ────────────────────────────────────────────────────────────
const PlatformBadge = ({ platform }) => {
  const color = PLATFORM_COLORS[platform] || A
  return (
    <span style={{
      background: `${color}18`, color, border: `1px solid ${color}35`,
      borderRadius: '6px', padding: '2px 8px', fontSize: '11px', fontWeight: 600,
      whiteSpace: 'nowrap',
    }}>
      {platform}
    </span>
  )
}

// ─── Star rating ───────────────────────────────────────────────────────────────
const StarRating = ({ rating = 4.7 }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
    {[1, 2, 3, 4, 5].map(i => (
      <Star key={i} size={10}
        fill={i <= Math.round(rating) ? '#f59e0b' : 'none'}
        color={i <= Math.round(rating) ? '#f59e0b' : 'var(--muted2)'}
        strokeWidth={1.5}
      />
    ))}
    <span style={{ fontSize: '11px', color: 'var(--muted)', marginLeft: '2px' }}>{rating}</span>
  </div>
)

// ─── Grid channel card ─────────────────────────────────────────────────────────
const ChannelCardGrid = ({ ch, onDetail, onHire }) => {
  const [hovered, setHovered] = useState(false)
  const platColor = PLATFORM_COLORS[ch.platform] || A

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--surface)',
        border: `1px solid ${hovered ? AG(0.4) : 'var(--border)'}`,
        borderRadius: '16px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'border-color .18s, transform .18s, box-shadow .18s',
        transform: hovered ? 'translateY(-3px)' : 'none',
        boxShadow: hovered ? `0 12px 40px ${AG(0.12)}` : '0 1px 4px rgba(0,0,0,0.05)',
      }}
    >
      {/* Color bar */}
      <div style={{ height: '3px', background: platColor }} />

      {/* Card body */}
      <div style={{ padding: '18px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: D, fontSize: '15px', fontWeight: 700, color: 'var(--text)', lineHeight: 1.3, marginBottom: '5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {ch.name}
            </div>
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', alignItems: 'center' }}>
              <PlatformBadge platform={ch.platform} />
              <span style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '5px', padding: '2px 7px', fontSize: '11px', color: 'var(--muted)' }}>
                {ch.category}
              </span>
            </div>
          </div>
          {ch.verified && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', background: `${OK}12`, border: `1px solid ${OK}25`, borderRadius: '6px', padding: '3px 8px', flexShrink: 0 }}>
              <CheckCircle size={10} color={OK} strokeWidth={2.5} />
              <span style={{ fontSize: '10px', fontWeight: 700, color: OK }}>Verificado</span>
            </div>
          )}
        </div>

        {/* Star rating */}
        <StarRating rating={ch.rating || 4.6} />

        {/* Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          {[
            { label: 'Audiencia', val: fmtAudience(ch.audience) },
            { label: 'Engagement', val: `${ch.engagement}%` },
            { label: 'Freq/sem', val: ch.freq.split('/')[0] },
          ].map(({ label, val }) => (
            <div key={label} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '9px', padding: '9px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', fontFamily: D }}>{val}</div>
              <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '1px' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Description snippet */}
        {ch.description && (
          <p style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', margin: 0 }}>
            {ch.description}
          </p>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '14px 18px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
        <div>
          <div style={{ fontFamily: D, fontSize: '20px', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>
            €{ch.pricePerPost}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--muted)' }}>por publicación</div>
        </div>
        <div style={{ display: 'flex', gap: '7px' }}>
          <button
            onClick={() => onDetail(ch)}
            style={{
              background: 'var(--bg)', border: '1px solid var(--border-med)',
              borderRadius: '9px', padding: '8px 13px', fontSize: '12px', fontWeight: 600,
              color: 'var(--text)', cursor: 'pointer', fontFamily: F, transition: 'border-color .15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = AG(0.5) }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-med)' }}
          >
            Ver
          </button>
          <button
            onClick={() => onHire(ch)}
            style={{
              background: A, border: 'none', borderRadius: '9px',
              padding: '8px 14px', fontSize: '12px', fontWeight: 600,
              color: '#fff', cursor: 'pointer', fontFamily: F,
              boxShadow: `0 3px 10px ${AG(0.3)}`,
              transition: 'background .15s, box-shadow .15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#7c3aed'; e.currentTarget.style.boxShadow = `0 4px 14px ${AG(0.4)}` }}
            onMouseLeave={e => { e.currentTarget.style.background = A; e.currentTarget.style.boxShadow = `0 3px 10px ${AG(0.3)}` }}
          >
            Contratar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── List channel row ──────────────────────────────────────────────────────────
const ChannelRowList = ({ ch, onDetail, onHire, isLast }) => {
  const [hovered, setHovered] = useState(false)
  const platColor = PLATFORM_COLORS[ch.platform] || A

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '16px',
        padding: '16px 20px',
        borderBottom: isLast ? 'none' : '1px solid var(--border)',
        background: hovered ? 'var(--bg2)' : 'transparent',
        transition: 'background .12s',
      }}
    >
      {/* Platform indicator */}
      <div style={{ width: '4px', alignSelf: 'stretch', borderRadius: '2px', background: platColor, flexShrink: 0 }} />

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: D, fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>{ch.name}</span>
          <PlatformBadge platform={ch.platform} />
          {ch.verified && <CheckCircle size={13} color={OK} strokeWidth={2.5} />}
          <span style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '5px', padding: '1px 7px', fontSize: '11px', color: 'var(--muted)' }}>{ch.category}</span>
        </div>
        <StarRating rating={ch.rating || 4.6} />
      </div>

      {/* Stats */}
      {[
        { label: 'Audiencia', val: fmtAudience(ch.audience) },
        { label: 'Engagement', val: `${ch.engagement}%` },
      ].map(({ label, val }) => (
        <div key={label} style={{ textAlign: 'center', minWidth: '72px' }}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)', fontFamily: D }}>{val}</div>
          <div style={{ fontSize: '10px', color: 'var(--muted)' }}>{label}</div>
        </div>
      ))}

      {/* Price */}
      <div style={{ textAlign: 'right', minWidth: '80px' }}>
        <div style={{ fontFamily: D, fontSize: '18px', fontWeight: 800, color: 'var(--text)' }}>€{ch.pricePerPost}</div>
        <div style={{ fontSize: '10px', color: 'var(--muted)' }}>/ post</div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '7px', flexShrink: 0 }}>
        <button onClick={() => onDetail(ch)} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '9px', padding: '7px 12px', fontSize: '12px', fontWeight: 600, color: 'var(--text)', cursor: 'pointer', fontFamily: F }}>Ver</button>
        <button onClick={() => onHire(ch)} style={{ background: A, border: 'none', borderRadius: '9px', padding: '7px 14px', fontSize: '12px', fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: F }}>Contratar</button>
      </div>
    </div>
  )
}

// ─── Channel detail modal ─────────────────────────────────────────────────────
const ChannelModal = ({ ch, onClose, onHire }) => {
  const platColor = PLATFORM_COLORS[ch.platform] || A

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: 'var(--surface)', borderRadius: '22px', width: '100%', maxWidth: '580px', maxHeight: '85vh', overflow: 'auto', boxShadow: '0 32px 80px rgba(0,0,0,0.45)', animation: 'modal-in .2s ease' }}>
        <style>{`@keyframes modal-in { from { opacity:0; transform:translateY(12px) scale(0.97); } to { opacity:1; transform:none; } }`}</style>

        {/* Color bar */}
        <div style={{ height: '4px', background: platColor }} />

        {/* Header */}
        <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
              <h2 style={{ fontFamily: D, fontSize: '22px', fontWeight: 800, color: 'var(--text)' }}>{ch.name}</h2>
              {ch.verified && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: OK }}>
                  <CheckCircle size={16} strokeWidth={2.5} />
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>Verificado</span>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap', alignItems: 'center' }}>
              <PlatformBadge platform={ch.platform} />
              <span style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '2px 8px', fontSize: '12px', color: 'var(--muted)' }}>{ch.category}</span>
              <StarRating rating={ch.rating || 4.6} />
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '9px', padding: '9px', cursor: 'pointer', color: 'var(--muted)', flexShrink: 0, display: 'flex' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '22px' }}>

          {/* Description */}
          <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.7, margin: 0 }}>{ch.description}</p>

          {/* Metrics grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {[
              { label: 'Audiencia', val: ch.audience.toLocaleString('es'), icon: Users },
              { label: 'Engagement', val: `${ch.engagement}%`, icon: TrendingUp },
              { label: 'Frecuencia', val: ch.freq },
              { label: 'Precio / post', val: `€${ch.pricePerPost}` },
              { label: 'Demografía', val: ch.demo || 'General' },
              { label: 'Categoría', val: ch.category },
            ].map(({ label, val, icon: Icon }) => (
              <div key={label} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
                {Icon && <Icon size={14} color={A} style={{ marginBottom: '6px' }} />}
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', fontFamily: D }}>{val}</div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Price highlight */}
          <div style={{ background: AG(0.06), border: `1px solid ${AG(0.2)}`, borderRadius: '14px', padding: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '4px' }}>Precio por publicación</div>
              <div style={{ fontFamily: D, fontSize: '32px', fontWeight: 800, color: A, letterSpacing: '-0.03em' }}>€{ch.pricePerPost}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '2px' }}>ROI estimado</div>
              <div style={{ fontFamily: D, fontSize: '18px', fontWeight: 700, color: OK }}>~4.2x</div>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={() => { onHire(ch); onClose() }}
            style={{
              background: A, color: '#fff', border: 'none', borderRadius: '13px',
              padding: '15px', fontSize: '15px', fontWeight: 700,
              cursor: 'pointer', fontFamily: F, width: '100%',
              boxShadow: `0 6px 20px ${AG(0.35)}`,
              transition: 'transform .15s, box-shadow .15s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 10px 30px ${AG(0.45)}` }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = `0 6px 20px ${AG(0.35)}` }}
          >
            <Zap size={16} fill="#fff" /> Contratar este canal
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Filter chip ───────────────────────────────────────────────────────────────
const FilterChip = ({ label, active, onClick, count }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', gap: '5px',
      background: active ? A : 'var(--surface)',
      border: `1px solid ${active ? A : 'var(--border)'}`,
      borderRadius: '20px', padding: '5px 13px',
      fontSize: '12px', fontWeight: 600,
      color: active ? '#fff' : 'var(--muted)',
      cursor: 'pointer', fontFamily: F,
      transition: 'all .15s',
      boxShadow: active ? `0 2px 8px ${AG(0.25)}` : 'none',
    }}
  >
    {label}
    {count !== undefined && (
      <span style={{
        background: active ? 'rgba(255,255,255,0.25)' : 'var(--bg2)',
        borderRadius: '10px', padding: '0 5px', fontSize: '10px',
        color: active ? '#fff' : 'var(--muted)',
      }}>{count}</span>
    )}
  </button>
)

// ─── Range slider ──────────────────────────────────────────────────────────────
const PriceFilter = ({ min, max, value, onChange }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--muted)' }}>Precio máximo</span>
      <span style={{ fontFamily: D, fontSize: '14px', fontWeight: 700, color: A }}>€{value}</span>
    </div>
    <input
      type="range" min={min} max={max} value={value}
      onChange={e => onChange(Number(e.target.value))}
      style={{ width: '100%', accentColor: A }}
    />
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ fontSize: '11px', color: 'var(--muted2)' }}>€{min}</span>
      <span style={{ fontSize: '11px', color: 'var(--muted2)' }}>€{max}</span>
    </div>
  </div>
)

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ExplorePage() {
  const navigate = useNavigate()
  const [search, setSearch]         = useState('')
  const [platform, setPlatform]     = useState('all')
  const [category, setCategory]     = useState('all')
  const [sortBy, setSortBy]         = useState('relevance')
  const [onlyVerified, setOnlyVerified] = useState(false)
  const [maxPrice, setMaxPrice]     = useState(2000)
  const [viewMode, setViewMode]     = useState('grid')   // 'grid' | 'list'
  const [showFilters, setShowFilters] = useState(false)
  const [modalCh, setModalCh]       = useState(null)

  const platforms  = ['all', ...new Set(MOCK_CHANNELS.map(c => c.platform))]
  const categories = ['all', ...new Set(MOCK_CHANNELS.map(c => c.category))]

  const filtered = useMemo(() => {
    let arr = MOCK_CHANNELS.filter(c => {
      if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.category.toLowerCase().includes(search.toLowerCase())) return false
      if (platform !== 'all' && c.platform !== platform) return false
      if (category !== 'all' && c.category !== category) return false
      if (onlyVerified && !c.verified) return false
      if (c.pricePerPost > maxPrice) return false
      return true
    })
    if (sortBy === 'price-asc')  arr = [...arr].sort((a, b) => a.pricePerPost - b.pricePerPost)
    if (sortBy === 'price-desc') arr = [...arr].sort((a, b) => b.pricePerPost - a.pricePerPost)
    if (sortBy === 'audience')   arr = [...arr].sort((a, b) => b.audience - a.audience)
    if (sortBy === 'engagement') arr = [...arr].sort((a, b) => b.engagement - a.engagement)
    return arr
  }, [search, platform, category, sortBy, onlyVerified, maxPrice])

  const activeFilters = [
    platform !== 'all',
    category !== 'all',
    onlyVerified,
    maxPrice < 2000,
  ].filter(Boolean).length

  const SEL_STYLE = {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '10px', padding: '9px 12px', fontSize: '13px',
    color: 'var(--text)', fontFamily: F, outline: 'none', cursor: 'pointer',
  }

  return (
    <div style={{ fontFamily: F, display: 'flex', flexDirection: 'column', gap: '22px', maxWidth: '1200px' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontFamily: D, fontSize: '28px', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.04em', marginBottom: '4px' }}>
            Explorar canales
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--muted)' }}>
            {MOCK_CHANNELS.length} canales disponibles · Encuentra el perfecto para tu campaña
          </p>
        </div>
      </div>

      {/* ── Search bar ── */}
      <div style={{ position: 'relative' }}>
        <Search size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre, categoría o plataforma..."
          style={{
            width: '100%', boxSizing: 'border-box',
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '13px', padding: '13px 48px 13px 46px',
            fontSize: '14px', color: 'var(--text)', fontFamily: F, outline: 'none',
            transition: 'border-color .15s, box-shadow .15s',
          }}
          onFocus={e => { e.target.style.borderColor = AG(0.5); e.target.style.boxShadow = `0 0 0 3px ${AG(0.08)}` }}
          onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '4px', cursor: 'pointer', color: 'var(--muted)', display: 'flex' }}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* ── Toolbar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>

        {/* Platform chips */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', flex: 1 }}>
          {platforms.map(p => (
            <FilterChip
              key={p} label={p === 'all' ? 'Todas' : p}
              active={platform === p}
              onClick={() => setPlatform(p)}
              count={p === 'all' ? MOCK_CHANNELS.length : MOCK_CHANNELS.filter(c => c.platform === p).length}
            />
          ))}
        </div>

        {/* Sort */}
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={SEL_STYLE}>
          <option value="relevance">Relevancia</option>
          <option value="price-asc">Precio: menor a mayor</option>
          <option value="price-desc">Precio: mayor a menor</option>
          <option value="audience">Mayor audiencia</option>
          <option value="engagement">Mayor engagement</option>
        </select>

        {/* Filters toggle */}
        <button
          onClick={() => setShowFilters(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            background: showFilters ? AG(0.1) : 'var(--surface)',
            border: `1px solid ${showFilters ? AG(0.4) : 'var(--border)'}`,
            borderRadius: '10px', padding: '9px 14px',
            fontSize: '13px', fontWeight: 600,
            color: showFilters ? A : 'var(--muted)',
            cursor: 'pointer', fontFamily: F, position: 'relative',
          }}
        >
          <SlidersHorizontal size={14} />
          Filtros
          {activeFilters > 0 && (
            <span style={{ background: A, color: '#fff', borderRadius: '50%', width: '16px', height: '16px', fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {activeFilters}
            </span>
          )}
        </button>

        {/* View toggle */}
        <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
          {[{ mode: 'grid', Icon: Grid }, { mode: 'list', Icon: List }].map(({ mode, Icon }) => (
            <button key={mode} onClick={() => setViewMode(mode)} style={{
              background: viewMode === mode ? AG(0.12) : 'transparent',
              border: 'none', padding: '9px 12px', cursor: 'pointer',
              color: viewMode === mode ? A : 'var(--muted)',
              display: 'flex', alignItems: 'center',
              transition: 'background .15s, color .15s',
            }}>
              <Icon size={15} />
            </button>
          ))}
        </div>
      </div>

      {/* ── Expandable filters panel ── */}
      {showFilters && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', animation: 'fadeDown .2s ease' }}>
          <style>{`@keyframes fadeDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:none; } }`}</style>

          {/* Category */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Categoría</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {categories.map(c => (
                <FilterChip key={c} label={c === 'all' ? 'Todas' : c} active={category === c} onClick={() => setCategory(c)} />
              ))}
            </div>
          </div>

          {/* Price range */}
          <div>
            <PriceFilter min={50} max={2000} value={maxPrice} onChange={setMaxPrice} />
          </div>

          {/* Other options */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Opciones</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <div
                onClick={() => setOnlyVerified(v => !v)}
                style={{ width: '40px', height: '22px', borderRadius: '11px', background: onlyVerified ? A : 'var(--border)', position: 'relative', transition: 'background .2s', cursor: 'pointer', flexShrink: 0 }}
              >
                <div style={{ position: 'absolute', top: '3px', left: onlyVerified ? '21px' : '3px', width: '16px', height: '16px', borderRadius: '50%', background: '#fff', transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
              </div>
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)' }}>Solo verificados</span>
            </label>
          </div>

          {/* Reset */}
          {activeFilters > 0 && (
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button onClick={() => { setPlatform('all'); setCategory('all'); setOnlyVerified(false); setMaxPrice(2000) }} style={{ background: 'none', border: 'none', fontSize: '13px', color: '#ef4444', cursor: 'pointer', fontFamily: F, fontWeight: 600, padding: 0 }}>
                ✕ Limpiar filtros
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Results count ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '13px', color: 'var(--muted)' }}>
          Mostrando <strong style={{ color: 'var(--text)' }}>{filtered.length}</strong> canales
          {activeFilters > 0 && <span style={{ color: A }}> · {activeFilters} filtro{activeFilters > 1 ? 's' : ''} activo{activeFilters > 1 ? 's' : ''}</span>}
        </span>
      </div>

      {/* ── Grid / List ── */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: AG(0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '28px' }}>
            🔍
          </div>
          <div style={{ fontFamily: D, fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>Sin resultados</div>
          <div style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '20px' }}>Prueba con otros filtros de búsqueda</div>
          <button onClick={() => { setSearch(''); setPlatform('all'); setCategory('all'); setOnlyVerified(false); setMaxPrice(2000) }} style={{ background: A, color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 22px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: F }}>
            Limpiar filtros
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {filtered.map(ch => (
            <ChannelCardGrid key={ch.id} ch={ch} onDetail={setModalCh} onHire={() => navigate('/advertiser/autobuy')} />
          ))}
        </div>
      ) : (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
          {filtered.map((ch, i) => (
            <ChannelRowList key={ch.id} ch={ch} onDetail={setModalCh} onHire={() => navigate('/advertiser/autobuy')} isLast={i === filtered.length - 1} />
          ))}
        </div>
      )}

      {modalCh && <ChannelModal ch={modalCh} onClose={() => setModalCh(null)} onHire={() => navigate('/advertiser/autobuy')} />}
    </div>
  )
}
