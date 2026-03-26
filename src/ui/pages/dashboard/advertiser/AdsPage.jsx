import React, { useState, useMemo } from 'react'
import { Search, Plus, Eye, MousePointer, Pause, Trash2, BarChart2, Edit } from 'lucide-react'
import { MOCK_ADS, PLATFORM_COLORS } from './mockData'

const A  = '#8b5cf6'
const AG = (o) => `rgba(139,92,246,${o})`
const F  = "'Inter', system-ui, sans-serif"
const D  = "'Sora', system-ui, sans-serif"
const SUCCESS = '#10b981', WARN = '#f59e0b', NEUTRAL = '#94a3b8'

const TABS = ['Todos', 'Activos', 'Pendientes', 'Completados']

const StatusBadge = ({ status }) => {
  const c = { activo: { color: SUCCESS, bg: 'rgba(16,185,129,0.12)', label: 'Activo' }, pendiente: { color: WARN, bg: 'rgba(245,158,11,0.12)', label: 'Pendiente' }, completado: { color: NEUTRAL, bg: 'rgba(148,163,184,0.12)', label: 'Completado' }, pausado: { color: '#f97316', bg: 'rgba(249,115,22,0.12)', label: 'Pausado' } }[status] || { color: NEUTRAL, bg: 'rgba(148,163,184,0.12)', label: status }
  return <span style={{ background: c.bg, color: c.color, border: `1px solid ${c.color}40`, borderRadius: '20px', padding: '3px 10px', fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap' }}>{c.label}</span>
}

const DetailModal = ({ ad, onClose }) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
    <div style={{ background: 'var(--surface)', borderRadius: '20px', width: '100%', maxWidth: '600px', overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.4)' }}>
      <div style={{ padding: '22px 26px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontFamily: D, fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>{ad.title}</h2>
          <StatusBadge status={ad.status} />
        </div>
        <button onClick={onClose} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', color: 'var(--muted)', fontFamily: F }}>✕</button>
      </div>
      <div style={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {[
            { label: 'Impresiones', val: ad.views.toLocaleString('es'), icon: Eye },
            { label: 'Clicks', val: ad.clicks.toLocaleString('es'), icon: MousePointer },
            { label: 'CTR', val: `${ad.ctr}%`, icon: BarChart2 },
            { label: 'Gasto', val: `€${ad.spent}`, icon: null },
          ].map(({ label, val, icon: Icon }) => (
            <div key={label} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: A, fontFamily: D }}>{val}</div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {[
            { label: 'Canal', val: ad.channel },
            { label: 'Plataforma', val: ad.platform },
            { label: 'Categoría', val: ad.category },
            { label: 'Período', val: ad.period },
            { label: 'Presupuesto', val: `€${ad.budget}` },
          ].map(({ label, val }) => (
            <div key={label} style={{ background: 'var(--bg2)', borderRadius: '10px', padding: '12px 14px' }}>
              <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>{label}</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{val}</div>
            </div>
          ))}
        </div>

        {/* Timeline */}
        <div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Timeline</div>
          {[
            { icon: '📋', label: 'Creado', time: '1 Mar 2026' },
            { icon: '✅', label: 'Aprobado por el canal', time: '2 Mar 2026' },
            { icon: '📢', label: 'Publicado', time: '3 Mar 2026' },
            ad.status === 'completado' && { icon: '🏁', label: 'Finalizado', time: ad.period.split('–')[1] || '' },
          ].filter(Boolean).map((ev, i) => (
            <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', paddingBottom: '10px', borderLeft: i < 3 ? `2px solid ${AG(0.25)}` : 'none', marginLeft: '10px', paddingLeft: '16px', position: 'relative' }}>
              <span style={{ position: 'absolute', left: '-10px', fontSize: '14px' }}>{ev.icon}</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{ev.label}</div>
                <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{ev.time}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={{ flex: 1, background: AG(0.1), border: `1px solid ${AG(0.3)}`, borderRadius: '10px', padding: '11px', fontSize: '13px', fontWeight: 600, color: A, cursor: 'pointer', fontFamily: F }}>Renovar anuncio</button>
          <button style={{ flex: 1, background: A, border: 'none', borderRadius: '10px', padding: '11px', fontSize: '13px', fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: F }}>Crear anuncio similar</button>
        </div>
      </div>
    </div>
  </div>
)

export default function AdsPage() {
  const [tab, setTab] = useState('Todos')
  const [search, setSearch] = useState('')
  const [selectedAd, setSelectedAd] = useState(null)
  const [showConfirm, setShowConfirm] = useState(null)

  const filtered = useMemo(() => {
    return MOCK_ADS.filter(ad => {
      const matchTab = tab === 'Todos' || ad.status === tab.toLowerCase().slice(0, -1) || (tab === 'Activos' && ad.status === 'activo') || (tab === 'Pendientes' && ad.status === 'pendiente') || (tab === 'Completados' && ad.status === 'completado')
      const matchSearch = !search || ad.title.toLowerCase().includes(search.toLowerCase()) || ad.channel.toLowerCase().includes(search.toLowerCase())
      return matchTab && matchSearch
    })
  }, [tab, search])

  const tabCount = (t) => t === 'Todos' ? MOCK_ADS.length : MOCK_ADS.filter(a => a.status === t.toLowerCase().replace('s', '')).length

  return (
    <div style={{ fontFamily: F, display: 'flex', flexDirection: 'column', gap: '22px', maxWidth: '1200px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontFamily: D, fontSize: '26px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.03em', marginBottom: '4px' }}>Mis Anuncios</h1>
          <p style={{ fontSize: '14px', color: 'var(--muted)' }}>{MOCK_ADS.length} anuncios en total</p>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: '8px', background: A, color: '#fff', border: 'none', borderRadius: '12px', padding: '11px 20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: F, boxShadow: `0 4px 14px ${AG(0.3)}` }}>
          <Plus size={16} /> Nuevo Anuncio
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '4px', width: 'fit-content' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: tab === t ? A : 'transparent',
            color: tab === t ? '#fff' : 'var(--muted)',
            border: 'none', borderRadius: '9px', padding: '7px 14px',
            fontSize: '13px', fontWeight: tab === t ? 600 : 400,
            cursor: 'pointer', fontFamily: F, transition: 'all .15s',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            {t}
            <span style={{ background: tab === t ? 'rgba(255,255,255,0.2)' : 'var(--bg2)', borderRadius: '10px', padding: '1px 6px', fontSize: '11px' }}>
              {tabCount(t)}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: '400px' }}>
        <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por título o canal..." style={{ width: '100%', boxSizing: 'border-box', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 12px 10px 36px', fontSize: '13px', color: 'var(--text)', fontFamily: F, outline: 'none' }} />
      </div>

      {/* Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg2)' }}>
                {['Anuncio', 'Categoría', 'Período', 'Vistas', 'Clicks', 'CTR', 'Presupuesto', 'Estado', 'Acciones'].map(h => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((ad, i) => (
                <tr key={ad.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg2)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ad.title}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '3px' }}>
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: PLATFORM_COLORS[ad.platform] || A, flexShrink: 0 }} />
                      <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{ad.channel}</span>
                    </div>
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: '12px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>{ad.category}</td>
                  <td style={{ padding: '13px 16px', fontSize: '12px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>{ad.period}</td>
                  <td style={{ padding: '13px 16px', fontSize: '13px', color: 'var(--text)', fontWeight: 500, whiteSpace: 'nowrap' }}>{ad.views.toLocaleString('es')}</td>
                  <td style={{ padding: '13px 16px', fontSize: '13px', color: 'var(--text)', fontWeight: 500, whiteSpace: 'nowrap' }}>{ad.clicks.toLocaleString('es')}</td>
                  <td style={{ padding: '13px 16px', fontSize: '13px', color: ad.ctr > 4 ? '#10b981' : 'var(--text)', fontWeight: 600, whiteSpace: 'nowrap' }}>{ad.ctr}%</td>
                  <td style={{ padding: '13px 16px', fontSize: '13px', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap' }}>€{ad.budget}</td>
                  <td style={{ padding: '13px 16px' }}><StatusBadge status={ad.status} /></td>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => setSelectedAd(ad)} title="Ver detalles" style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '7px', padding: '6px', cursor: 'pointer', color: 'var(--muted)', display: 'flex' }}><BarChart2 size={13} /></button>
                      <button title="Editar" style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '7px', padding: '6px', cursor: 'pointer', color: 'var(--muted)', display: 'flex' }}><Edit size={13} /></button>
                      <button title={ad.status === 'activo' ? 'Pausar' : 'Reactivar'} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '7px', padding: '6px', cursor: 'pointer', color: 'var(--muted)', display: 'flex' }}><Pause size={13} /></button>
                      <button onClick={() => setShowConfirm(ad.id)} title="Eliminar" style={{ background: 'var(--bg)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '7px', padding: '6px', cursor: 'pointer', color: '#ef4444', display: 'flex' }}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} style={{ padding: '48px', textAlign: 'center', color: 'var(--muted)' }}>
                  <div style={{ fontSize: '36px', marginBottom: '10px' }}>📣</div>
                  <div style={{ fontFamily: D, fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>Sin anuncios</div>
                  <div style={{ fontSize: '13px' }}>No hay anuncios que coincidan con los filtros seleccionados</div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedAd && <DetailModal ad={selectedAd} onClose={() => setSelectedAd(null)} />}

      {showConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--surface)', borderRadius: '16px', padding: '28px', maxWidth: '360px', width: '100%', textAlign: 'center', boxShadow: '0 24px 60px rgba(0,0,0,0.4)' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>🗑️</div>
            <h3 style={{ fontFamily: D, fontSize: '17px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>¿Eliminar anuncio?</h3>
            <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '20px' }}>Esta acción no se puede deshacer.</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowConfirm(null)} style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '11px', fontSize: '13px', cursor: 'pointer', color: 'var(--text)', fontFamily: F }}>Cancelar</button>
              <button onClick={() => setShowConfirm(null)} style={{ flex: 1, background: '#ef4444', border: 'none', borderRadius: '10px', padding: '11px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: '#fff', fontFamily: F }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
