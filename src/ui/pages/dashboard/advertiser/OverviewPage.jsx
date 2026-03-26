import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, TrendingDown, Eye, MousePointer, DollarSign, Megaphone, Plus } from 'lucide-react'
import { useAuth } from '../../../../auth/AuthContext'
import { MOCK_ADS, MOCK_NOTIFICATIONS, MOCK_CHANNELS, MOCK_MONTHLY_SPEND, MOCK_USER, PLATFORM_COLORS } from './mockData'

const A  = '#8b5cf6'
const AG = (o) => `rgba(139,92,246,${o})`
const F  = "'Inter', system-ui, sans-serif"
const D  = "'Sora', system-ui, sans-serif"
const SUCCESS = '#10b981'
const WARN    = '#f59e0b'
const NEUTRAL = '#94a3b8'

// ── Sparkline ────────────────────────────────────────────────────────────────
const Sparkline = ({ data, color = A, w = 72, h = 28 }) => {
  const max = Math.max(...data), min = Math.min(...data)
  const rng = max - min || 1
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / rng) * (h - 2) - 1}`).join(' ')
  return (
    <svg width={w} height={h}><polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" /></svg>
  )
}

// ── Donut Chart ───────────────────────────────────────────────────────────────
const Donut = ({ segments, total, size = 160 }) => {
  const r = 54, cx = size / 2, cy = size / 2, circ = 2 * Math.PI * r
  let offset = 0
  return (
    <svg width={size} height={size}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth="20" />
      {segments.map((s, i) => {
        const dash = (s.value / total) * circ, gap = circ - dash
        const el = <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth="20"
          strokeDasharray={`${dash} ${gap}`} strokeDashoffset={-offset}
          style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', transition: 'stroke-dashoffset .3s' }} />
        offset += dash
        return el
      })}
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize="22" fontWeight="700" fill="var(--text)" fontFamily={D}>{total}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="11" fill="var(--muted)" fontFamily={F}>anuncios</text>
    </svg>
  )
}

// ── Bar Chart ─────────────────────────────────────────────────────────────────
const BarChart = ({ data }) => {
  const max = Math.max(...data.map(d => d.value))
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '80px', paddingBottom: '20px', position: 'relative' }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', width: '100%' }}>
            <div style={{
              width: '100%', borderRadius: '4px 4px 0 0', minHeight: '4px',
              height: `${(d.value / max) * 100}%`,
              background: i === data.length - 1 ? A : AG(0.4),
              transition: 'height .3s',
            }} />
          </div>
          <span style={{ fontSize: '10px', color: 'var(--muted)', position: 'absolute', bottom: 0 }}>{d.label}</span>
        </div>
      ))}
    </div>
  )
}

// ── Status badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const cfg = {
    activo:    { color: SUCCESS, bg: 'rgba(16,185,129,0.12)', label: 'Activo' },
    pendiente: { color: WARN,    bg: 'rgba(245,158,11,0.12)', label: 'Pendiente' },
    completado:{ color: NEUTRAL, bg: 'rgba(148,163,184,0.12)',label: 'Completado' },
    pausado:   { color: '#f97316', bg: 'rgba(249,115,22,0.12)', label: 'Pausado' },
  }[status] || { color: NEUTRAL, bg: 'rgba(148,163,184,0.12)', label: status }
  return (
    <span style={{
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}40`,
      borderRadius: '20px', padding: '3px 10px', fontSize: '11px', fontWeight: 600,
      whiteSpace: 'nowrap',
    }}>{cfg.label}</span>
  )
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
const KpiCard = ({ icon: Icon, label, value, change, changeDir, sparkData }) => (
  <div style={{
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '16px', padding: '20px 22px',
    display: 'flex', flexDirection: 'column', gap: '10px',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: AG(0.12), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={18} color={A} strokeWidth={2} />
      </div>
      {sparkData && <Sparkline data={sparkData} />}
    </div>
    <div>
      <div style={{ fontSize: '26px', fontWeight: 700, fontFamily: D, color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>{label}</div>
    </div>
    {change && (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: changeDir === 'up' ? SUCCESS : '#ef4444' }}>
        {changeDir === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {change} vs mes anterior
      </div>
    )}
  </div>
)

// ── Create Ad Modal ───────────────────────────────────────────────────────────
const CreateAdModal = ({ onClose }) => {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ title: '', desc: '', category: '', budget: '', duration: '' })
  const update = (k, v) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: 'var(--surface)', borderRadius: '20px', width: '100%', maxWidth: '520px', overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.4)' }}>
        {/* Header */}
        <div style={{ padding: '22px 28px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: D, fontSize: '17px', fontWeight: 700, color: 'var(--text)' }}>Crear anuncio</div>
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>Paso {step} de 3</div>
          </div>
          <button onClick={onClose} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', color: 'var(--muted)', fontFamily: F }}>✕</button>
        </div>

        {/* Stepper */}
        <div style={{ display: 'flex', padding: '16px 28px', gap: '8px' }}>
          {['Información', 'Canales', 'Creatividades'].map((s, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ height: '3px', borderRadius: '2px', background: step > i ? A : 'var(--border)' }} />
              <span style={{ fontSize: '10px', color: step > i ? A : 'var(--muted2)', fontWeight: step === i + 1 ? 600 : 400 }}>{s}</span>
            </div>
          ))}
        </div>

        {/* Body */}
        <div style={{ padding: '8px 28px 28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {step === 1 && <>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>Título del anuncio *</label>
              <input value={form.title} onChange={e => update('title', e.target.value)} placeholder="Ej: Lanzamiento de mi producto SaaS" style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg)', border: '1px solid var(--border-med)', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', color: 'var(--text)', fontFamily: F, outline: 'none' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>Descripción</label>
              <textarea value={form.desc} onChange={e => update('desc', e.target.value)} placeholder="Describe tu producto o servicio..." rows={3} style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg)', border: '1px solid var(--border-med)', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', color: 'var(--text)', fontFamily: F, outline: 'none', resize: 'none' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>Presupuesto (€)</label>
                <input type="number" value={form.budget} onChange={e => update('budget', e.target.value)} placeholder="450" style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg)', border: '1px solid var(--border-med)', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', color: 'var(--text)', fontFamily: F, outline: 'none' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>Duración (días)</label>
                <input type="number" value={form.duration} onChange={e => update('duration', e.target.value)} placeholder="14" style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg)', border: '1px solid var(--border-med)', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', color: 'var(--text)', fontFamily: F, outline: 'none' }} />
              </div>
            </div>
          </>}
          {step === 2 && (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--muted)', fontSize: '14px' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>📡</div>
              <div style={{ fontFamily: D, fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>Selecciona canales</div>
              <div>Ve a <span style={{ color: A, fontWeight: 600 }}>Explorar</span> para elegir canales y contactar creadores.</div>
            </div>
          )}
          {step === 3 && (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--muted)', fontSize: '14px' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>🎨</div>
              <div style={{ fontFamily: D, fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>Creatividades</div>
              <div>Sube tu imagen o vídeo para el anuncio.</div>
              <div style={{ marginTop: '16px', border: `2px dashed ${AG(0.3)}`, borderRadius: '12px', padding: '24px', color: A, cursor: 'pointer' }}>+ Subir imagen / vídeo</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 28px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
          <button onClick={() => step > 1 ? setStep(s => s - 1) : onClose()} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 20px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', color: 'var(--text)', fontFamily: F }}>{step > 1 ? '← Anterior' : 'Cancelar'}</button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', cursor: 'pointer', color: 'var(--muted)', fontFamily: F }}>Guardar borrador</button>
            <button onClick={() => step < 3 ? setStep(s => s + 1) : onClose()} style={{ background: A, color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: F }}>{step === 3 ? 'Lanzar ✓' : 'Siguiente →'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Overview Page ─────────────────────────────────────────────────────────────
export default function OverviewPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)
  const nombre = user?.nombre || MOCK_USER.name.split(' ')[0]

  const activeAds    = MOCK_ADS.filter(a => a.status === 'activo')
  const totalSpent   = MOCK_ADS.reduce((s, a) => s + a.spent, 0)
  const totalViews   = MOCK_ADS.reduce((s, a) => s + a.views, 0)
  const totalClicks  = MOCK_ADS.reduce((s, a) => s + a.clicks, 0)
  const avgCtr       = MOCK_ADS.filter(a => a.ctr > 0).reduce((s, a, _, arr) => s + a.ctr / arr.length, 0)

  const donutData = [
    { label: 'Activos',     value: MOCK_ADS.filter(a => a.status === 'activo').length,     color: SUCCESS, pct: 0 },
    { label: 'Pendientes',  value: MOCK_ADS.filter(a => a.status === 'pendiente').length,  color: WARN,    pct: 0 },
    { label: 'Completados', value: MOCK_ADS.filter(a => a.status === 'completado').length, color: NEUTRAL, pct: 0 },
  ].map(d => ({ ...d, pct: Math.round((d.value / MOCK_ADS.length) * 100) }))

  const featuredChannels = MOCK_CHANNELS.filter(c => c.verified).slice(0, 3)

  return (
    <div style={{ fontFamily: F, display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1200px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: D, fontSize: '28px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.03em', marginBottom: '4px' }}>
            Bienvenido, {nombre} 👋
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--muted)' }}>Gestiona tus campañas publicitarias</p>
        </div>
        <button onClick={() => setShowModal(true)} style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: A, color: '#fff', border: 'none', borderRadius: '12px',
          padding: '11px 20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: F,
          boxShadow: `0 4px 14px ${AG(0.35)}`, transition: 'transform .15s, box-shadow .15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 6px 20px ${AG(0.45)}` }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = `0 4px 14px ${AG(0.35)}` }}
        >
          <Plus size={16} strokeWidth={2.5} /> Crear Anuncio
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
        <KpiCard icon={DollarSign} label="Gasto Total" value={`€${totalSpent.toLocaleString('es')}`} change="+12%" changeDir="up" sparkData={MOCK_MONTHLY_SPEND.map(d => d.value)} />
        <KpiCard icon={Megaphone} label="Anuncios Activos" value={activeAds.length} change="+1" changeDir="up" />
        <KpiCard icon={MousePointer} label="CTR Promedio" value={`${avgCtr.toFixed(1)}%`} change="+0.3%" changeDir="up" />
        <KpiCard icon={Eye} label="Impresiones Totales" value={totalViews.toLocaleString('es')} change="+8.4%" changeDir="up" sparkData={[4200, 5800, 7100, 9400, 11200, 18420]} />
      </div>

      {/* Main content — 2 col */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: '20px' }}>

        {/* Left: Ads table */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontFamily: D, fontSize: '16px', fontWeight: 600, color: 'var(--text)' }}>Mis Anuncios Activos</h2>
            <button onClick={() => navigate('/advertiser/ads')} style={{ background: 'none', border: 'none', fontSize: '13px', color: A, cursor: 'pointer', fontWeight: 600, fontFamily: F }}>Ver todos →</button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Título', 'Canal', 'Categoría', 'Vistas', 'Presupuesto', 'Estado', ''].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MOCK_ADS.map((ad, i) => (
                  <tr key={ad.id} style={{ borderBottom: i < MOCK_ADS.length - 1 ? '1px solid var(--border)' : 'none' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg2)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ad.title}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: PLATFORM_COLORS[ad.platform] || A, flexShrink: 0 }} />
                        <span style={{ fontSize: '12px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>{ad.channel}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>{ad.category}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text)', whiteSpace: 'nowrap' }}>{ad.views.toLocaleString('es')}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap' }}>€{ad.budget}</td>
                    <td style={{ padding: '12px 16px' }}><StatusBadge status={ad.status} /></td>
                    <td style={{ padding: '12px 16px' }}>
                      <button onClick={() => navigate(`/advertiser/ads`)} style={{ background: AG(0.08), border: `1px solid ${AG(0.2)}`, borderRadius: '8px', padding: '5px 12px', fontSize: '12px', fontWeight: 600, color: A, cursor: 'pointer', fontFamily: F, whiteSpace: 'nowrap' }}>Detalles</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Donut + notifications + channels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Donut chart */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px' }}>
            <h3 style={{ fontFamily: D, fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '16px' }}>Distribución por Estado</h3>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <Donut segments={donutData} total={MOCK_ADS.length} size={150} />
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {donutData.map(d => (
                  <div key={d.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: d.color }} />
                      <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{d.label}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>{d.value}</span>
                      <span style={{ fontSize: '11px', color: 'var(--muted2)' }}>{d.pct}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h3 style={{ fontFamily: D, fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>Notificaciones</h3>
              <button style={{ background: 'none', border: 'none', fontSize: '12px', color: A, cursor: 'pointer', fontFamily: F }}>Ver todas</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {MOCK_NOTIFICATIONS.slice(0, 3).map(n => (
                <div key={n.id} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '14px', flexShrink: 0 }}>{n.type === 'success' ? '✅' : n.type === 'warning' ? '⚠️' : 'ℹ️'}</span>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', marginBottom: '1px' }}>{n.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', lineHeight: 1.4 }}>{n.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Spend chart */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '18px' }}>
            <h3 style={{ fontFamily: D, fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '14px' }}>Gasto mensual</h3>
            <BarChart data={MOCK_MONTHLY_SPEND} />
          </div>
        </div>
      </div>

      {showModal && <CreateAdModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
