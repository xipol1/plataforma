import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, SlidersHorizontal, X, CheckCircle, Users, TrendingUp } from 'lucide-react'
import { MOCK_CHANNELS, PLATFORM_COLORS } from './mockData'

const A  = '#8b5cf6'
const AG = (o) => `rgba(139,92,246,${o})`
const F  = "'Inter', system-ui, sans-serif"
const D  = "'Sora', system-ui, sans-serif"

const fmtAudience = (n) => n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : n

const PlatformBadge = ({ platform }) => (
  <span style={{
    background: `${PLATFORM_COLORS[platform] || A}20`,
    color: PLATFORM_COLORS[platform] || A,
    border: `1px solid ${PLATFORM_COLORS[platform] || A}40`,
    borderRadius: '6px', padding: '2px 8px', fontSize: '11px', fontWeight: 600,
    whiteSpace: 'nowrap',
  }}>{platform}</span>
)

const ChannelCard = ({ ch, onDetail, onHire }) => (
  <div style={{
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '16px', overflow: 'hidden',
    display: 'flex', flexDirection: 'column',
    transition: 'border-color .15s, transform .15s',
  }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = AG(0.4); e.currentTarget.style.transform = 'translateY(-2px)' }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none' }}
  >
    {/* Header */}
    <div style={{ padding: '18px 18px 12px', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
        <div style={{ fontFamily: D, fontSize: '15px', fontWeight: 700, color: 'var(--text)', lineHeight: 1.3 }}>{ch.name}</div>
        {ch.verified && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '6px', padding: '2px 7px', fontSize: '10px', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>
            <CheckCircle size={10} /> Verificado
          </span>
        )}
      </div>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        <PlatformBadge platform={ch.platform} />
        <span style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '2px 8px', fontSize: '11px', color: 'var(--muted)' }}>{ch.category}</span>
      </div>
    </div>

    {/* Metrics */}
    <div style={{ padding: '14px 18px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', borderBottom: '1px solid var(--border)' }}>
      {[
        { icon: Users, label: 'Audiencia', val: fmtAudience(ch.audience) },
        { icon: TrendingUp, label: 'Engagement', val: `${ch.engagement}%` },
        { icon: null, label: 'Freq.', val: ch.freq.split('/')[0] + '/sem' },
      ].map(({ icon: Icon, label, val }) => (
        <div key={label} style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', fontFamily: D }}>{val}</div>
          <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '1px' }}>{label}</div>
        </div>
      ))}
    </div>

    {/* Price + CTA */}
    <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
      <div>
        <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', fontFamily: D }}>€{ch.pricePerPost}</div>
        <div style={{ fontSize: '11px', color: 'var(--muted)' }}>por publicación</div>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={() => onDetail(ch)} style={{
          background: 'var(--bg)', border: '1px solid var(--border-med)',
          borderRadius: '10px', padding: '8px 14px', fontSize: '12px', fontWeight: 600,
          color: 'var(--text)', cursor: 'pointer', fontFamily: F, transition: 'border-color .15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = A }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-med)' }}
        >Ver</button>
        <button onClick={() => onHire(ch)} style={{
          background: A, border: 'none', borderRadius: '10px',
          padding: '8px 14px', fontSize: '12px', fontWeight: 600,
          color: '#fff', cursor: 'pointer', fontFamily: F,
          boxShadow: `0 2px 8px ${AG(0.3)}`, transition: 'background .15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = '#7c3aed' }}
          onMouseLeave={e => { e.currentTarget.style.background = A }}
        >Contratar</button>
      </div>
    </div>
  </div>
)

// ── Channel Detail Modal ───────────────────────────────────────────────────────
const ChannelModal = ({ ch, onClose, onHire }) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
    <div style={{ background: 'var(--surface)', borderRadius: '20px', width: '100%', maxWidth: '560px', maxHeight: '80vh', overflow: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.4)' }}>
      <div style={{ padding: '22px 26px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', position: 'sticky', top: 0, background: 'var(--surface)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
            <h2 style={{ fontFamily: D, fontSize: '20px', fontWeight: 700, color: 'var(--text)' }}>{ch.name}</h2>
            {ch.verified && <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#10b981', fontSize: '12px', fontWeight: 600 }}><CheckCircle size={13} /> Verificado</span>}
          </div>
          <div style={{ display: 'flex', gap: '6px' }}><PlatformBadge platform={ch.platform} /></div>
        </div>
        <button onClick={onClose} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: 'var(--muted)', flexShrink: 0 }}><X size={16} /></button>
      </div>

      <div style={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.6 }}>{ch.description}</p>

        {/* Metrics grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {[
            { label: 'Audiencia', val: ch.audience.toLocaleString('es') },
            { label: 'Engagement', val: `${ch.engagement}%` },
            { label: 'Frecuencia', val: ch.freq },
            { label: 'Precio / post', val: `€${ch.pricePerPost}` },
            { label: 'Demografía', val: ch.demo },
            { label: 'Categoría', val: ch.category },
          ].map(({ label, val }) => (
            <div key={label} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px' }}>
              <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>{label}</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>{val}</div>
            </div>
          ))}
        </div>

        <button onClick={() => { onHire(ch); onClose() }} style={{
          background: A, color: '#fff', border: 'none', borderRadius: '12px',
          padding: '14px', fontSize: '14px', fontWeight: 600,
          cursor: 'pointer', fontFamily: F, width: '100%',
          boxShadow: `0 4px 14px ${AG(0.35)}`,
        }}>
          Contratar este canal →
        </button>
      </div>
    </div>
  </div>
)

export default function ExplorePage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [platform, setPlatform] = useState('all')
  const [category, setCategory] = useState('all')
  const [sortBy, setSortBy] = useState('relevance')
  const [onlyVerified, setOnlyVerified] = useState(false)
  const [modalCh, setModalCh] = useState(null)

  const platforms = ['all', ...new Set(MOCK_CHANNELS.map(c => c.platform))]
  const categories = ['all', ...new Set(MOCK_CHANNELS.map(c => c.category))]

  const filtered = useMemo(() => {
    let arr = MOCK_CHANNELS.filter(c => {
      if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.category.toLowerCase().includes(search.toLowerCase())) return false
      if (platform !== 'all' && c.platform !== platform) return false
      if (category !== 'all' && c.category !== category) return false
      if (onlyVerified && !c.verified) return false
      return true
    })
    if (sortBy === 'price-asc')  arr = [...arr].sort((a, b) => a.pricePerPost - b.pricePerPost)
    if (sortBy === 'price-desc') arr = [...arr].sort((a, b) => b.pricePerPost - a.pricePerPost)
    if (sortBy === 'audience')   arr = [...arr].sort((a, b) => b.audience - a.audience)
    if (sortBy === 'engagement') arr = [...arr].sort((a, b) => b.engagement - a.engagement)
    return arr
  }, [search, platform, category, sortBy, onlyVerified])

  const sel = { background: 'var(--bg)', border: '1px solid var(--border-med)', borderRadius: '10px', padding: '9px 12px', fontSize: '13px', color: 'var(--text)', fontFamily: F, outline: 'none', cursor: 'pointer' }

  return (
    <div style={{ fontFamily: F, display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1200px' }}>

      {/* Header */}
      <div>
        <h1 style={{ fontFamily: D, fontSize: '26px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.03em', marginBottom: '4px' }}>Explorar canales</h1>
        <p style={{ fontSize: '14px', color: 'var(--muted)' }}>Encuentra el canal perfecto para tu campaña</p>
      </div>

      {/* Search bar */}
      <div style={{ position: 'relative' }}>
        <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre, categoría o plataforma..."
          style={{ width: '100%', boxSizing: 'border-box', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px 16px 12px 40px', fontSize: '14px', color: 'var(--text)', fontFamily: F, outline: 'none' }}
        />
        {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}><X size={16} /></button>}
      </div>

      {/* Filters row */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={platform} onChange={e => setPlatform(e.target.value)} style={sel}>
          {platforms.map(p => <option key={p} value={p}>{p === 'all' ? 'Todas las plataformas' : p}</option>)}
        </select>
        <select value={category} onChange={e => setCategory(e.target.value)} style={sel}>
          {categories.map(c => <option key={c} value={c}>{c === 'all' ? 'Todas las categorías' : c}</option>)}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={sel}>
          <option value="relevance">Ordenar: Relevancia</option>
          <option value="price-asc">Precio: menor a mayor</option>
          <option value="price-desc">Precio: mayor a menor</option>
          <option value="audience">Mayor audiencia</option>
          <option value="engagement">Mayor engagement</option>
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--muted)', cursor: 'pointer', marginLeft: 'auto' }}>
          <input type="checkbox" checked={onlyVerified} onChange={e => setOnlyVerified(e.target.checked)} style={{ accentColor: A, width: '15px', height: '15px' }} />
          Solo verificados
        </label>
        <span style={{ fontSize: '13px', color: 'var(--muted2)' }}>Mostrando {filtered.length} canales</span>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
        {filtered.map(ch => (
          <ChannelCard key={ch.id} ch={ch} onDetail={setModalCh} onHire={() => navigate('/advertiser/autobuy')} />
        ))}
        {filtered.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔍</div>
            <div style={{ fontFamily: D, fontSize: '16px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>Sin resultados</div>
            <div style={{ fontSize: '14px' }}>Prueba con otros filtros de búsqueda</div>
          </div>
        )}
      </div>

      {modalCh && <ChannelModal ch={modalCh} onClose={() => setModalCh(null)} onHire={() => navigate('/advertiser/autobuy')} />}
    </div>
  )
}
