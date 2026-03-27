import React, { useState, useMemo } from 'react'
import {
  Search, Plus, Eye, MousePointer, Pause, Trash2, BarChart2, Edit,
  Play, TrendingUp, DollarSign, Activity, ChevronDown, X, Zap,
} from 'lucide-react'
import { MOCK_ADS, PLATFORM_COLORS } from './mockData'

const A  = '#8b5cf6'
const AG = (o) => `rgba(139,92,246,${o})`
const F  = "'Inter', system-ui, sans-serif"
const D  = "'Sora', system-ui, sans-serif"
const OK   = '#10b981'
const WARN = '#f59e0b'
const ERR  = '#ef4444'
const NEUTRAL = '#94a3b8'
const ORANGE  = '#f97316'

const TABS = ['Todos', 'Activos', 'Pendientes', 'Completados', 'Pausados']

// ─── Status config ─────────────────────────────────────────────────────────────
function statusCfg(status) {
  return {
    activo:     { color: OK,     bg: `${OK}12`,       label: 'Activo',     dot: OK },
    pendiente:  { color: WARN,   bg: `${WARN}12`,     label: 'Pendiente',  dot: WARN },
    completado: { color: NEUTRAL, bg: 'rgba(148,163,184,0.1)', label: 'Completado', dot: NEUTRAL },
    pausado:    { color: ORANGE, bg: 'rgba(249,115,22,0.1)', label: 'Pausado', dot: ORANGE },
  }[status] || { color: NEUTRAL, bg: 'rgba(148,163,184,0.1)', label: status, dot: NEUTRAL }
}

const StatusBadge = ({ status }) => {
  const c = statusCfg(status)
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      background: c.bg, color: c.color, border: `1px solid ${c.color}35`,
      borderRadius: '20px', padding: '3px 10px', fontSize: '11px', fontWeight: 600,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: c.color, flexShrink: 0 }} />
      {c.label}
    </span>
  )
}

// ─── Mini sparkline ───────────────────────────────────────────────────────────
function MiniSpark({ data = [4, 7, 5, 9, 8, 12, 11, 14], color = A }) {
  const max = Math.max(...data), min = Math.min(...data), rng = max - min || 1
  const w = 60, h = 24, pad = 2
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * (w - pad * 2) + pad,
    y: h - pad - ((v - min) / rng) * (h - pad * 2),
  }))
  let d = `M ${pts[0].x},${pts[0].y}`
  for (let i = 1; i < pts.length; i++) {
    const cx1 = pts[i-1].x + (pts[i].x - pts[i-1].x) * 0.4
    const cx2 = pts[i].x - (pts[i].x - pts[i-1].x) * 0.4
    d += ` C ${cx1},${pts[i-1].y} ${cx2},${pts[i].y} ${pts[i].x},${pts[i].y}`
  }
  return (
    <svg width={w} height={h} style={{ flexShrink: 0 }}>
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx={pts[pts.length-1].x} cy={pts[pts.length-1].y} r="2.5" fill={color} />
    </svg>
  )
}

// ─── Progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ value, total, color = A }) {
  const pct = total > 0 ? Math.min(100, (value / total) * 100) : 0
  return (
    <div style={{ height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '2px', transition: 'width .5s ease' }} />
    </div>
  )
}

// ─── Detail modal ─────────────────────────────────────────────────────────────
const DetailModal = ({ ad, onClose }) => {
  const c = statusCfg(ad.status)
  const platColor = PLATFORM_COLORS[ad.platform] || A

  const TIMELINE = [
    { icon: '📋', label: 'Campaña creada', time: '1 Mar 2026', done: true },
    { icon: '👀', label: 'Revisión del canal', time: '1 Mar 2026', done: true },
    { icon: '✅', label: 'Aprobada por canal', time: '2 Mar 2026', done: true },
    { icon: '📢', label: 'Publicada', time: '3 Mar 2026', done: ad.status !== 'pendiente' },
    ...(ad.status === 'completado' ? [{ icon: '🏁', label: 'Campaña finalizada', time: ad.period.split('–')[1]?.trim() || '', done: true }] : []),
  ]

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: 'var(--surface)', borderRadius: '22px', width: '100%', maxWidth: '640px', maxHeight: '88vh', overflow: 'auto', boxShadow: '0 32px 80px rgba(0,0,0,0.45)' }}>

        {/* Color accent */}
        <div style={{ height: '4px', background: platColor }} />

        {/* Header */}
        <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px' }}>
          <div>
            <h2 style={{ fontFamily: D, fontSize: '20px', fontWeight: 800, color: 'var(--text)', marginBottom: '8px' }}>{ad.title}</h2>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <StatusBadge status={ad.status} />
              <span style={{ background: `${platColor}18`, color: platColor, border: `1px solid ${platColor}35`, borderRadius: '6px', padding: '2px 8px', fontSize: '11px', fontWeight: 600 }}>{ad.platform}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '9px', padding: '9px', cursor: 'pointer', color: 'var(--muted)', flexShrink: 0, display: 'flex' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* KPI cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            {[
              { label: 'Impresiones', val: ad.views.toLocaleString('es'), icon: Eye, color: '#3b82f6' },
              { label: 'Clicks', val: ad.clicks.toLocaleString('es'), icon: MousePointer, color: OK },
              { label: 'CTR', val: `${ad.ctr}%`, icon: Activity, color: ad.ctr > 4 ? OK : A },
              { label: 'Gasto', val: `€${ad.spent}`, icon: DollarSign, color: A },
            ].map(({ label, val, icon: Icon, color }) => (
              <div key={label} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '13px', padding: '14px', textAlign: 'center' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                  <Icon size={13} color={color} />
                </div>
                <div style={{ fontFamily: D, fontSize: '17px', fontWeight: 800, color, marginBottom: '3px' }}>{val}</div>
                <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Budget progress */}
          <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '13px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>Presupuesto utilizado</span>
              <span style={{ fontFamily: D, fontSize: '13px', fontWeight: 700, color: A }}>
                €{ad.spent} / €{ad.budget} <span style={{ color: 'var(--muted)', fontWeight: 400 }}>({Math.round(ad.spent / ad.budget * 100)}%)</span>
              </span>
            </div>
            <ProgressBar value={ad.spent} total={ad.budget} color={A} />
          </div>

          {/* Info grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {[
              { label: 'Canal', val: ad.channel },
              { label: 'Plataforma', val: ad.platform },
              { label: 'Categoría', val: ad.category },
              { label: 'Período', val: ad.period },
              { label: 'Presupuesto total', val: `€${ad.budget}` },
              { label: 'Gasto actual', val: `€${ad.spent}` },
            ].map(({ label, val }) => (
              <div key={label} style={{ background: 'var(--bg2)', borderRadius: '10px', padding: '12px 14px' }}>
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px', fontWeight: 500 }}>{label}</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{val}</div>
              </div>
            ))}
          </div>

          {/* Timeline */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Timeline
            </div>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '15px', top: '0', bottom: '0', width: '2px', background: 'var(--border)' }} />
              {TIMELINE.map((ev, i) => (
                <div key={i} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', paddingBottom: '16px', position: 'relative', paddingLeft: '40px' }}>
                  <div style={{ position: 'absolute', left: '7px', top: '2px', width: '18px', height: '18px', borderRadius: '50%', background: ev.done ? A : 'var(--bg2)', border: `2px solid ${ev.done ? A : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', zIndex: 1 }}>
                    {ev.done && <span style={{ color: '#fff', fontSize: '10px' }}>✓</span>}
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: ev.done ? 'var(--text)' : 'var(--muted)' }}>{ev.label}</div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>{ev.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button style={{ flex: 1, background: AG(0.1), border: `1px solid ${AG(0.3)}`, borderRadius: '11px', padding: '12px', fontSize: '13px', fontWeight: 600, color: A, cursor: 'pointer', fontFamily: F }}>
              Renovar campaña
            </button>
            <button style={{ flex: 1, background: A, border: 'none', borderRadius: '11px', padding: '12px', fontSize: '13px', fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: F, boxShadow: `0 4px 14px ${AG(0.3)}` }}>
              Crear campaña similar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Confirm delete modal ─────────────────────────────────────────────────────
const ConfirmModal = ({ onConfirm, onCancel }) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ background: 'var(--surface)', borderRadius: '18px', padding: '32px', maxWidth: '360px', width: '100%', textAlign: 'center', boxShadow: '0 24px 60px rgba(0,0,0,0.4)' }}>
      <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '22px' }}>🗑️</div>
      <h3 style={{ fontFamily: D, fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>¿Eliminar campaña?</h3>
      <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '24px', lineHeight: 1.5 }}>Esta acción no se puede deshacer. Los datos de rendimiento se perderán.</p>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={onCancel} style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px', fontSize: '13px', cursor: 'pointer', color: 'var(--text)', fontFamily: F }}>Cancelar</button>
        <button onClick={onConfirm} style={{ flex: 1, background: ERR, border: 'none', borderRadius: '10px', padding: '12px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', color: '#fff', fontFamily: F }}>Eliminar</button>
      </div>
    </div>
  </div>
)

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdsPage() {
  const [tab, setTab]             = useState('Todos')
  const [search, setSearch]       = useState('')
  const [selectedAd, setSelectedAd] = useState(null)
  const [showConfirm, setShowConfirm] = useState(null)
  const [ads, setAds]             = useState(MOCK_ADS)

  const tabFilter = (ad) => {
    if (tab === 'Todos') return true
    const map = { 'Activos': 'activo', 'Pendientes': 'pendiente', 'Completados': 'completado', 'Pausados': 'pausado' }
    return ad.status === (map[tab] || tab.toLowerCase())
  }

  const filtered = useMemo(() => ads.filter(ad => {
    if (!tabFilter(ad)) return false
    if (search && !ad.title.toLowerCase().includes(search.toLowerCase()) && !ad.channel.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [tab, search, ads])

  const tabCount = t => {
    if (t === 'Todos') return ads.length
    const map = { 'Activos': 'activo', 'Pendientes': 'pendiente', 'Completados': 'completado', 'Pausados': 'pausado' }
    return ads.filter(a => a.status === (map[t] || t.toLowerCase())).length
  }

  const deleteAd = (id) => {
    setAds(prev => prev.filter(a => a.id !== id))
    setShowConfirm(null)
  }

  // Summary stats
  const activeCount  = ads.filter(a => a.status === 'activo').length
  const totalSpend   = ads.reduce((s, a) => s + (a.spent || 0), 0)
  const totalViews   = ads.reduce((s, a) => s + a.views, 0)
  const avgCtr       = (ads.reduce((s, a) => s + a.ctr, 0) / ads.length).toFixed(1)

  return (
    <div style={{ fontFamily: F, display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1200px' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontFamily: D, fontSize: '28px', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.04em', marginBottom: '4px' }}>Mis Anuncios</h1>
          <p style={{ fontSize: '14px', color: 'var(--muted)' }}>{ads.length} campañas · {activeCount} activas ahora mismo</p>
        </div>
        <button style={{
          display: 'flex', alignItems: 'center', gap: '8px', background: A, color: '#fff',
          border: 'none', borderRadius: '12px', padding: '11px 20px', fontSize: '14px', fontWeight: 600,
          cursor: 'pointer', fontFamily: F, boxShadow: `0 4px 16px ${AG(0.35)}`,
          transition: 'transform .15s, box-shadow .15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${AG(0.4)}` }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = `0 4px 16px ${AG(0.35)}` }}
        >
          <Plus size={16} strokeWidth={2.5} /> Nueva campaña
        </button>
      </div>

      {/* ── Summary KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
        {[
          { label: 'Campañas activas', val: activeCount, icon: Zap, color: OK },
          { label: 'Gasto total', val: `€${totalSpend.toLocaleString('es')}`, icon: DollarSign, color: A },
          { label: 'Impresiones', val: totalViews >= 1000 ? `${(totalViews/1000).toFixed(0)}K` : totalViews, icon: Eye, color: '#3b82f6' },
          { label: 'CTR promedio', val: `${avgCtr}%`, icon: Activity, color: WARN },
        ].map(({ label, val, icon: Icon, color }) => (
          <div key={label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={16} color={color} />
            </div>
            <div>
              <div style={{ fontFamily: D, fontSize: '20px', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1 }}>{val}</div>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '3px' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: '4px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '4px', width: 'fit-content', flexWrap: 'wrap' }}>
        {TABS.map(t => {
          const count = tabCount(t)
          return (
            <button key={t} onClick={() => setTab(t)} style={{
              background: tab === t ? A : 'transparent',
              color: tab === t ? '#fff' : 'var(--muted)',
              border: 'none', borderRadius: '9px', padding: '7px 14px',
              fontSize: '13px', fontWeight: tab === t ? 600 : 400,
              cursor: 'pointer', fontFamily: F, transition: 'all .15s',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              {t}
              <span style={{ background: tab === t ? 'rgba(255,255,255,0.2)' : 'var(--bg2)', borderRadius: '10px', padding: '1px 7px', fontSize: '11px', fontWeight: 600 }}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Search ── */}
      <div style={{ position: 'relative', maxWidth: '420px' }}>
        <Search size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por título o canal..."
          style={{ width: '100%', boxSizing: 'border-box', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '11px', padding: '10px 12px 10px 37px', fontSize: '13px', color: 'var(--text)', fontFamily: F, outline: 'none', transition: 'border-color .15s' }}
          onFocus={e => { e.target.style.borderColor = AG(0.4) }}
          onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
        />
        {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex' }}><X size={14} /></button>}
      </div>

      {/* ── Table ── */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '860px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg2)' }}>
                {['Campaña', 'Categoría', 'Período', 'Rendimiento', 'CTR', 'Gasto / Ppto', 'Estado', ''].map((h, i) => (
                  <th key={h + i} style={{ padding: '11px 18px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((ad, i) => {
                const platColor = PLATFORM_COLORS[ad.platform] || A
                const spendPct = ad.spent && ad.budget ? Math.round((ad.spent / ad.budget) * 100) : 0
                return (
                  <tr
                    key={ad.id}
                    style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg2)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <td style={{ padding: '15px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '2px' }}>
                        <div style={{ width: '3px', height: '36px', borderRadius: '2px', background: platColor, flexShrink: 0, marginRight: '10px' }} />
                        <div>
                          <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '3px' }}>
                            {ad.title}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{ad.channel}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '15px 18px', fontSize: '12px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>{ad.category}</td>
                    <td style={{ padding: '15px 18px', fontSize: '12px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>{ad.period}</td>
                    <td style={{ padding: '15px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{ad.views.toLocaleString('es')}</div>
                          <div style={{ fontSize: '10px', color: 'var(--muted)' }}>{ad.clicks.toLocaleString('es')} clicks</div>
                        </div>
                        <MiniSpark color={A} />
                      </div>
                    </td>
                    <td style={{ padding: '15px 18px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: ad.ctr > 4 ? OK : ad.ctr < 2.5 ? ERR : 'var(--text)', fontFamily: D }}>
                        {ad.ctr}%
                      </span>
                    </td>
                    <td style={{ padding: '15px 18px', minWidth: '130px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginBottom: '5px' }}>
                        €{ad.spent} <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 400 }}>/ €{ad.budget}</span>
                      </div>
                      <ProgressBar value={ad.spent} total={ad.budget} color={spendPct > 80 ? WARN : A} />
                    </td>
                    <td style={{ padding: '15px 18px' }}>
                      <StatusBadge status={ad.status} />
                    </td>
                    <td style={{ padding: '15px 18px' }}>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button
                          onClick={() => setSelectedAd(ad)} title="Ver detalles"
                          style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '7px', padding: '6px', cursor: 'pointer', color: 'var(--muted)', display: 'flex', transition: 'color .15s, border-color .15s' }}
                          onMouseEnter={e => { e.currentTarget.style.color = A; e.currentTarget.style.borderColor = AG(0.4) }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}
                        >
                          <BarChart2 size={13} />
                        </button>
                        <button title="Editar" style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '7px', padding: '6px', cursor: 'pointer', color: 'var(--muted)', display: 'flex' }}>
                          <Edit size={13} />
                        </button>
                        <button title={ad.status === 'activo' ? 'Pausar' : 'Reactivar'} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '7px', padding: '6px', cursor: 'pointer', color: 'var(--muted)', display: 'flex' }}>
                          {ad.status === 'activo' ? <Pause size={13} /> : <Play size={13} />}
                        </button>
                        <button
                          onClick={() => setShowConfirm(ad.id)} title="Eliminar"
                          style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '7px', padding: '6px', cursor: 'pointer', color: ERR, display: 'flex', transition: 'background .15s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.06)' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: '60px', textAlign: 'center' }}>
                    <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: AG(0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '22px' }}>📣</div>
                    <div style={{ fontFamily: D, fontSize: '16px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>Sin campañas</div>
                    <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '20px' }}>
                      {search ? `No hay campañas que coincidan con "${search}"` : 'No hay campañas en esta categoría'}
                    </div>
                    <button style={{ background: A, color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 22px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: F }}>
                      Crear nueva campaña
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedAd && <DetailModal ad={selectedAd} onClose={() => setSelectedAd(null)} />}
      {showConfirm && <ConfirmModal onConfirm={() => deleteAd(showConfirm)} onCancel={() => setShowConfirm(null)} />}
    </div>
  )
}
