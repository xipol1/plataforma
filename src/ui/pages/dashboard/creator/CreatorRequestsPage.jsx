import React, { useState } from 'react'
import { MOCK_REQUESTS } from './mockDataCreator'

const A   = '#8b5cf6'
const AG  = (o) => `rgba(139,92,246,${o})`
const WA  = '#25d366'
const F   = "'Inter', system-ui, sans-serif"
const D   = "'Sora', system-ui, sans-serif"
const SUCCESS = '#10b981'

const TABS = ['Todas', 'Pendientes', 'Aceptadas', 'Completadas', 'Rechazadas']

const StatusBadge = ({ status }) => {
  const cfg = {
    pendiente:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',   label: 'Pendiente' },
    aceptado:   { color: SUCCESS,   bg: 'rgba(16,185,129,0.1)',   label: 'Aceptada' },
    completado: { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', label: 'Completada' },
    rechazado:  { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   label: 'Rechazada' },
  }[status] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', label: status }
  return <span style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}40`, borderRadius: '20px', padding: '3px 10px', fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap' }}>{cfg.label}</span>
}

const RequestModal = ({ req, onClose, onAccept, onReject }) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
    <div style={{ background: 'var(--surface)', borderRadius: '20px', width: '100%', maxWidth: '520px', boxShadow: '0 24px 60px rgba(0,0,0,0.4)', overflow: 'hidden' }}>
      <div style={{ padding: '22px 26px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontFamily: D, fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>{req.title}</h2>
          <StatusBadge status={req.status} />
        </div>
        <button onClick={onClose} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', color: 'var(--muted)', fontFamily: F }}>✕</button>
      </div>
      <div style={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {[
            { label: 'Anunciante', val: req.advertiser },
            { label: 'Canal', val: req.channel },
            { label: 'Plataforma', val: req.platform },
            { label: 'Presupuesto', val: `€${req.budget}` },
            { label: 'Categoría', val: req.category },
            { label: 'Recibida', val: req.receivedAt },
          ].map(({ label, val }) => (
            <div key={label} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '3px' }}>{label}</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{val}</div>
            </div>
          ))}
        </div>
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mensaje del anunciante</div>
          <p style={{ fontSize: '14px', color: 'var(--text)', lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>"{req.message}"</p>
        </div>
        {req.status === 'pendiente' && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => { onReject(req.id); onClose() }} style={{ flex: 1, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: 600, color: '#ef4444', cursor: 'pointer', fontFamily: F }}>Rechazar</button>
            <button onClick={() => { onAccept(req.id); onClose() }} style={{ flex: 2, background: WA, border: 'none', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: F, boxShadow: '0 4px 12px rgba(37,211,102,0.3)' }}>✓ Aceptar solicitud</button>
          </div>
        )}
      </div>
    </div>
  </div>
)

export default function CreatorRequestsPage() {
  const [tab, setTab] = useState('Todas')
  const [requests, setRequests] = useState(MOCK_REQUESTS)
  const [selected, setSelected] = useState(null)

  const filtered = requests.filter(r => {
    if (tab === 'Todas') return true
    const map = { 'Pendientes': 'pendiente', 'Aceptadas': 'aceptado', 'Completadas': 'completado', 'Rechazadas': 'rechazado' }
    return r.status === map[tab]
  })

  const accept = (id) => setRequests(r => r.map(req => req.id === id ? { ...req, status: 'aceptado' } : req))
  const reject = (id) => setRequests(r => r.map(req => req.id === id ? { ...req, status: 'rechazado' } : req))

  const tabCount = (t) => {
    if (t === 'Todas') return requests.length
    const map = { 'Pendientes': 'pendiente', 'Aceptadas': 'aceptado', 'Completadas': 'completado', 'Rechazadas': 'rechazado' }
    return requests.filter(r => r.status === map[t]).length
  }

  return (
    <div style={{ fontFamily: F, display: 'flex', flexDirection: 'column', gap: '22px', maxWidth: '1000px' }}>
      <div>
        <h1 style={{ fontFamily: D, fontSize: '26px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.03em', marginBottom: '4px' }}>Solicitudes de anunciantes</h1>
        <p style={{ fontSize: '14px', color: 'var(--muted)' }}>Revisa y gestiona las propuestas que recibes</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '4px', width: 'fit-content' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: tab === t ? A : 'transparent', color: tab === t ? '#fff' : 'var(--muted)',
            border: 'none', borderRadius: '9px', padding: '7px 12px', fontSize: '13px', fontWeight: tab === t ? 600 : 400,
            cursor: 'pointer', fontFamily: F, transition: 'all .15s', display: 'flex', alignItems: 'center', gap: '5px',
          }}>
            {t}
            <span style={{ background: tab === t ? 'rgba(255,255,255,0.2)' : 'var(--bg2)', borderRadius: '10px', padding: '1px 6px', fontSize: '11px' }}>{tabCount(t)}</span>
          </button>
        ))}
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filtered.map(req => (
          <div key={req.id} style={{ background: 'var(--surface)', border: `1px solid ${req.status === 'pendiente' ? 'rgba(245,158,11,0.3)' : 'var(--border)'}`, borderRadius: '16px', padding: '20px 22px', cursor: 'pointer', transition: 'border-color .15s, transform .15s' }}
            onClick={() => setSelected(req)}
            onMouseEnter={e => { e.currentTarget.style.borderColor = AG(0.4); e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = req.status === 'pendiente' ? 'rgba(245,158,11,0.3)' : 'var(--border)'; e.currentTarget.style.transform = 'none' }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>{req.title}</span>
                  <StatusBadge status={req.status} />
                </div>
                <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '8px' }}>
                  <strong style={{ color: 'var(--text)' }}>{req.advertiser}</strong> · {req.channel} · {req.platform} · {req.receivedAt}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--muted)', fontStyle: 'italic', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>
                  "{req.message}"
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px', flexShrink: 0 }}>
                <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', fontFamily: D }}>€{req.budget}</span>
                {req.status === 'pendiente' && (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={e => { e.stopPropagation(); reject(req.id) }} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', padding: '7px 14px', fontSize: '12px', fontWeight: 600, color: '#ef4444', cursor: 'pointer', fontFamily: F }}>Rechazar</button>
                    <button onClick={e => { e.stopPropagation(); accept(req.id) }} style={{ background: WA, border: 'none', borderRadius: '8px', padding: '7px 14px', fontSize: '12px', fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: F }}>Aceptar</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
            <div style={{ fontFamily: D, fontSize: '16px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>Sin solicitudes</div>
            <div style={{ fontSize: '14px' }}>No hay solicitudes en esta categoría</div>
          </div>
        )}
      </div>

      {selected && <RequestModal req={selected} onClose={() => setSelected(null)} onAccept={accept} onReject={reject} />}
    </div>
  )
}
