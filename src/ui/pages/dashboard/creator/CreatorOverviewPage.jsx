import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Radio, Inbox, DollarSign, TrendingUp, Plus } from 'lucide-react'
import { useAuth } from '../../../../auth/AuthContext'
import { MOCK_CHANNELS, MOCK_REQUESTS, MOCK_EARNINGS, MOCK_MONTHLY_EARNINGS } from './mockDataCreator'

const A  = '#8b5cf6'
const AG = (o) => `rgba(139,92,246,${o})`
const WA = '#25d366'
const WAG = (o) => `rgba(37,211,102,${o})`
const F  = "'Inter', system-ui, sans-serif"
const D  = "'Sora', system-ui, sans-serif"
const SUCCESS = '#10b981'

const BarChart = ({ data, color }) => {
  const max = Math.max(...data.map(d => d.value))
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '80px' }}>
      {data.map((d, i) => {
        const isLast = i === data.length - 1
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', width: '100%' }}>
              {isLast && <div style={{ fontSize: '10px', color, fontWeight: 700, textAlign: 'center', marginBottom: '2px' }}>€{d.value}</div>}
              <div style={{ width: '100%', borderRadius: '4px 4px 0 0', minHeight: '4px', height: `${(d.value / max) * 100}%`, background: isLast ? color : `${color}55` }} />
            </div>
            <span style={{ fontSize: '10px', color: 'var(--muted)' }}>{d.label}</span>
          </div>
        )
      })}
    </div>
  )
}

const Kpi = ({ icon: Icon, label, value, sub, color, accent }) => (
  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px 22px' }}>
    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${accent || A}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
      <Icon size={18} color={accent || A} strokeWidth={2} />
    </div>
    <div style={{ fontSize: '26px', fontWeight: 700, fontFamily: D, color: color || 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>{label}</div>
    {sub && <div style={{ fontSize: '12px', color: SUCCESS, marginTop: '4px', fontWeight: 500 }}>{sub}</div>}
  </div>
)

const PlatBadge = ({ p }) => {
  const colors = { Telegram: '#2aabee', WhatsApp: '#25d366', Discord: '#5865f2', Instagram: '#e1306c' }
  const c = colors[p] || A
  return <span style={{ background: `${c}18`, color: c, border: `1px solid ${c}35`, borderRadius: '6px', padding: '2px 8px', fontSize: '11px', fontWeight: 600 }}>{p}</span>
}

const AddChannelModal = ({ onClose }) => {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ name: '', platform: 'Telegram', url: '', audience: '', price: '', category: '', desc: '' })
  const update = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const PLATFORMS = ['Telegram', 'WhatsApp', 'Discord', 'Instagram', 'Newsletter', 'Facebook']
  const CATEGORIES = ['Tecnología', 'Marketing', 'Negocios', 'Gaming', 'Fitness', 'Finanzas', 'Ecommerce']

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: 'var(--surface)', borderRadius: '20px', width: '100%', maxWidth: '500px', overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.4)' }}>
        <div style={{ padding: '22px 28px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: D, fontSize: '17px', fontWeight: 700, color: 'var(--text)' }}>Registrar canal</div>
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>Paso {step} de 2</div>
          </div>
          <button onClick={onClose} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', color: 'var(--muted)', fontFamily: F }}>✕</button>
        </div>
        <div style={{ display: 'flex', padding: '14px 28px', gap: '8px' }}>
          {['Información básica', 'Monetización'].map((s, i) => (
            <div key={i} style={{ flex: 1 }}>
              <div style={{ height: '3px', borderRadius: '2px', background: step > i ? A : 'var(--border)', marginBottom: '4px' }} />
              <span style={{ fontSize: '10px', color: step > i ? A : 'var(--muted2)' }}>{s}</span>
            </div>
          ))}
        </div>
        <div style={{ padding: '8px 28px 28px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {step === 1 && <>
            <div><label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>Nombre del canal *</label>
              <input value={form.name} onChange={e => update('name', e.target.value)} placeholder="Ej: Tech Insights ES" style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg)', border: '1px solid var(--border-med)', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', color: 'var(--text)', fontFamily: F, outline: 'none' }} /></div>
            <div><label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>Plataforma *</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {PLATFORMS.map(p => <button key={p} onClick={() => update('platform', p)} style={{ background: form.platform === p ? A : 'var(--bg)', border: `1px solid ${form.platform === p ? A : 'var(--border)'}`, borderRadius: '20px', padding: '6px 12px', fontSize: '12px', color: form.platform === p ? '#fff' : 'var(--muted)', cursor: 'pointer', fontFamily: F }}>{p}</button>)}
              </div></div>
            <div><label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>Enlace al canal</label>
              <input value={form.url} onChange={e => update('url', e.target.value)} placeholder="https://t.me/tucanal" style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg)', border: '1px solid var(--border-med)', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', color: 'var(--text)', fontFamily: F, outline: 'none' }} /></div>
            <div><label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>Audiencia aproximada</label>
              <input type="number" value={form.audience} onChange={e => update('audience', e.target.value)} placeholder="Ej: 15000" style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg)', border: '1px solid var(--border-med)', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', color: 'var(--text)', fontFamily: F, outline: 'none' }} /></div>
          </>}
          {step === 2 && <>
            <div><label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>Precio por publicación (€) *</label>
              <input type="number" value={form.price} onChange={e => update('price', e.target.value)} placeholder="Ej: 250" style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg)', border: '1px solid var(--border-med)', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', color: 'var(--text)', fontFamily: F, outline: 'none' }} /></div>
            <div><label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>Categoría</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {CATEGORIES.map(c => <button key={c} onClick={() => update('category', c)} style={{ background: form.category === c ? A : 'var(--bg)', border: `1px solid ${form.category === c ? A : 'var(--border)'}`, borderRadius: '20px', padding: '6px 12px', fontSize: '12px', color: form.category === c ? '#fff' : 'var(--muted)', cursor: 'pointer', fontFamily: F }}>{c}</button>)}
              </div></div>
            <div><label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>Descripción breve</label>
              <textarea value={form.desc} onChange={e => update('desc', e.target.value)} placeholder="Describe tu canal y audiencia..." rows={3} style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg)', border: '1px solid var(--border-med)', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', color: 'var(--text)', fontFamily: F, outline: 'none', resize: 'none' }} /></div>
          </>}
        </div>
        <div style={{ padding: '16px 28px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
          <button onClick={() => step > 1 ? setStep(1) : onClose()} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 20px', fontSize: '13px', cursor: 'pointer', color: 'var(--text)', fontFamily: F }}>{step > 1 ? '← Anterior' : 'Cancelar'}</button>
          <button onClick={() => step < 2 ? setStep(2) : onClose()} style={{ background: A, color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 24px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: F }}>{step === 2 ? 'Registrar canal ✓' : 'Siguiente →'}</button>
        </div>
      </div>
    </div>
  )
}

export default function CreatorOverviewPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)
  const nombre = user?.nombre || 'Creador'

  const totalEarnings = MOCK_CHANNELS.reduce((s, c) => s + c.totalEarnings, 0)
  const monthEarnings = MOCK_CHANNELS.reduce((s, c) => s + c.earningsThisMonth, 0)
  const activeChannels = MOCK_CHANNELS.filter(c => c.status === 'activo').length
  const pendingReqs    = MOCK_REQUESTS.filter(r => r.status === 'pendiente').length

  return (
    <div style={{ fontFamily: F, display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1100px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontFamily: D, fontSize: '28px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.03em', marginBottom: '4px' }}>
            Hola, {nombre} 👋
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--muted)' }}>Gestiona tus canales y controla tus ganancias</p>
        </div>
        <button onClick={() => setShowModal(true)} style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: WA, color: '#fff', border: 'none', borderRadius: '12px',
          padding: '11px 20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: F,
          boxShadow: `0 4px 14px ${WAG(0.35)}`, transition: 'transform .15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none' }}
        >
          <Plus size={16} strokeWidth={2.5} /> Registrar canal
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        <Kpi icon={DollarSign}   label="Ganancias este mes" value={`€${monthEarnings.toLocaleString('es')}`} sub="+18% vs mes anterior" accent={WA} color={WA} />
        <Kpi icon={Radio}        label="Canales activos" value={activeChannels} accent={A} />
        <Kpi icon={Inbox}        label="Solicitudes pendientes" value={pendingReqs} sub={pendingReqs > 0 ? 'Requieren respuesta' : undefined} accent="#f59e0b" />
        <Kpi icon={TrendingUp}   label="Ganancias totales" value={`€${totalEarnings.toLocaleString('es')}`} accent={SUCCESS} />
      </div>

      {/* Main 2-col */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: '20px' }}>

        {/* Left: channels + pending requests */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Channels */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontFamily: D, fontSize: '16px', fontWeight: 600, color: 'var(--text)' }}>Mis Canales</h2>
              <button onClick={() => navigate('/creator/channels')} style={{ background: 'none', border: 'none', fontSize: '13px', color: A, cursor: 'pointer', fontWeight: 600, fontFamily: F }}>Ver todos →</button>
            </div>
            <div>
              {MOCK_CHANNELS.map((ch, i) => (
                <div key={ch.id} style={{ padding: '16px 22px', borderBottom: i < MOCK_CHANNELS.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', gap: '14px' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg2)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: AG(0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                    📡
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>{ch.name}</span>
                      <PlatBadge p={ch.platform} />
                      {ch.verified && <span style={{ fontSize: '10px', color: SUCCESS, fontWeight: 600 }}>✓ Verificado</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--muted)' }}>
                      <span>{ch.audience.toLocaleString('es')} suscriptores</span>
                      <span>€{ch.pricePerPost}/post</span>
                      <span style={{ color: SUCCESS, fontWeight: 600 }}>€{ch.earningsThisMonth} este mes</span>
                    </div>
                  </div>
                  <span style={{
                    background: ch.status === 'activo' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                    color: ch.status === 'activo' ? SUCCESS : '#f59e0b',
                    border: `1px solid ${ch.status === 'activo' ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.25)'}`,
                    borderRadius: '20px', padding: '3px 10px', fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap',
                  }}>{ch.status === 'activo' ? 'Activo' : 'Pendiente'}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pending requests */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontFamily: D, fontSize: '16px', fontWeight: 600, color: 'var(--text)' }}>Solicitudes pendientes</h2>
                {pendingReqs > 0 && <span style={{ background: WAG(0.15), color: WA, border: `1px solid ${WAG(0.3)}`, borderRadius: '20px', padding: '2px 8px', fontSize: '11px', fontWeight: 700 }}>{pendingReqs}</span>}
              </div>
              <button onClick={() => navigate('/creator/requests')} style={{ background: 'none', border: 'none', fontSize: '13px', color: A, cursor: 'pointer', fontWeight: 600, fontFamily: F }}>Ver todas →</button>
            </div>
            {MOCK_REQUESTS.filter(r => r.status === 'pendiente').map((req, i, arr) => (
              <div key={req.id} style={{ padding: '16px 22px', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '3px' }}>{req.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '6px' }}>{req.advertiser} · {req.channel} · {req.receivedAt}</div>
                    <div style={{ fontSize: '13px', color: 'var(--muted)', fontStyle: 'italic', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>"{req.message}"</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', flexShrink: 0 }}>
                    <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', fontFamily: D }}>€{req.budget}</span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: 600, color: '#ef4444', cursor: 'pointer', fontFamily: F }}>Rechazar</button>
                      <button onClick={() => navigate('/creator/requests')} style={{ background: WA, border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: F }}>Aceptar</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: earnings chart + recent */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px' }}>
            <h3 style={{ fontFamily: D, fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '14px' }}>Ganancias mensuales</h3>
            <BarChart data={MOCK_MONTHLY_EARNINGS} color={WA} />
          </div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontFamily: D, fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>Últimos ingresos</h3>
              <button onClick={() => navigate('/creator/earnings')} style={{ background: 'none', border: 'none', fontSize: '12px', color: A, cursor: 'pointer', fontFamily: F }}>Ver todos</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {MOCK_EARNINGS.filter(e => e.amount > 0).slice(0, 4).map(e => (
                <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', marginBottom: '1px' }}>{e.desc.split('—')[0].trim()}</div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{e.date}</div>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: SUCCESS, fontFamily: D }}>+€{e.amount}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: `linear-gradient(135deg, ${WA} 0%, #1aa34a 100%)`, borderRadius: '16px', padding: '18px', color: '#fff' }}>
            <div style={{ fontSize: '12px', opacity: 0.85, marginBottom: '6px' }}>Saldo disponible para retirar</div>
            <div style={{ fontSize: '28px', fontWeight: 800, fontFamily: D, letterSpacing: '-0.02em', marginBottom: '12px' }}>€930</div>
            <button onClick={() => navigate('/creator/earnings')} style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.35)', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: F }}>Solicitar retiro →</button>
          </div>
        </div>
      </div>

      {showModal && <AddChannelModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
