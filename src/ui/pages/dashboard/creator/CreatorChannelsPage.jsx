import React, { useState } from 'react'
import { Plus, Edit, Trash2, CheckCircle, Users, TrendingUp } from 'lucide-react'
import { MOCK_CHANNELS, PLATFORM_COLORS } from './mockDataCreator'

const A  = '#8b5cf6'
const AG = (o) => `rgba(139,92,246,${o})`
const WA = '#25d366'
const F  = "'Inter', system-ui, sans-serif"
const D  = "'Sora', system-ui, sans-serif"
const SUCCESS = '#10b981'

const fmtK = (n) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n

const PLATFORMS = ['Telegram', 'WhatsApp', 'Discord', 'Instagram', 'Newsletter', 'Facebook']
const CATEGORIES = ['Tecnología', 'Marketing', 'Negocios', 'Gaming', 'Fitness', 'Finanzas', 'Ecommerce']

const AddModal = ({ onClose }) => {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ name: '', platform: 'Telegram', url: '', audience: '', price: '', category: 'Tecnología', desc: '' })
  const update = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const inp = { width: '100%', boxSizing: 'border-box', background: 'var(--bg)', border: '1px solid var(--border-med)', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', color: 'var(--text)', fontFamily: F, outline: 'none' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: 'var(--surface)', borderRadius: '20px', width: '100%', maxWidth: '500px', overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.4)' }}>
        <div style={{ padding: '22px 28px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: D, fontSize: '17px', fontWeight: 700, color: 'var(--text)' }}>Registrar canal</div>
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>Paso {step} de 2 — será revisado por el equipo</div>
          </div>
          <button onClick={onClose} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', color: 'var(--muted)', fontFamily: F }}>✕</button>
        </div>
        <div style={{ display: 'flex', padding: '14px 28px', gap: '8px' }}>
          {['Información', 'Monetización'].map((s, i) => (
            <div key={i} style={{ flex: 1 }}><div style={{ height: '3px', borderRadius: '2px', background: step > i ? A : 'var(--border)', marginBottom: '4px' }} /><span style={{ fontSize: '10px', color: step > i ? A : 'var(--muted2)' }}>{s}</span></div>
          ))}
        </div>
        <div style={{ padding: '8px 28px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {step === 1 && <>
            <div><label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>Nombre del canal *</label><input value={form.name} onChange={e => update('name', e.target.value)} placeholder="Ej: Tech Insights ES" style={inp} /></div>
            <div><label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>Plataforma *</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>{PLATFORMS.map(p => <button key={p} onClick={() => update('platform', p)} style={{ background: form.platform === p ? A : 'var(--bg)', border: `1px solid ${form.platform === p ? A : 'var(--border)'}`, borderRadius: '20px', padding: '6px 12px', fontSize: '12px', color: form.platform === p ? '#fff' : 'var(--muted)', cursor: 'pointer', fontFamily: F }}>{p}</button>)}</div>
            </div>
            <div><label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>URL / enlace</label><input value={form.url} onChange={e => update('url', e.target.value)} placeholder="https://t.me/tucanal" style={inp} /></div>
            <div><label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>Audiencia actual</label><input type="number" value={form.audience} onChange={e => update('audience', e.target.value)} placeholder="15000" style={inp} /></div>
          </>}
          {step === 2 && <>
            <div><label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>Precio por publicación (€) *</label><input type="number" value={form.price} onChange={e => update('price', e.target.value)} placeholder="250" style={inp} /></div>
            <div><label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>Categoría</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>{CATEGORIES.map(c => <button key={c} onClick={() => update('category', c)} style={{ background: form.category === c ? A : 'var(--bg)', border: `1px solid ${form.category === c ? A : 'var(--border)'}`, borderRadius: '20px', padding: '6px 12px', fontSize: '12px', color: form.category === c ? '#fff' : 'var(--muted)', cursor: 'pointer', fontFamily: F }}>{c}</button>)}</div>
            </div>
            <div><label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>Descripción</label><textarea value={form.desc} onChange={e => update('desc', e.target.value)} placeholder="Describe tu canal, audiencia y tipo de contenido..." rows={3} style={{ ...inp, resize: 'none' }} /></div>
          </>}
        </div>
        <div style={{ padding: '16px 28px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
          <button onClick={() => step > 1 ? setStep(1) : onClose()} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 20px', fontSize: '13px', cursor: 'pointer', color: 'var(--text)', fontFamily: F }}>{step > 1 ? '← Volver' : 'Cancelar'}</button>
          <button onClick={() => step < 2 ? setStep(2) : onClose()} style={{ background: A, color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 24px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: F }}>{step === 2 ? 'Enviar para revisión ✓' : 'Siguiente →'}</button>
        </div>
      </div>
    </div>
  )
}

export default function CreatorChannelsPage() {
  const [channels, setChannels] = useState(MOCK_CHANNELS)
  const [showAdd, setShowAdd] = useState(false)
  const [editPrice, setEditPrice] = useState(null)
  const [newPrice, setNewPrice] = useState('')

  const savePrice = (id) => {
    setChannels(cs => cs.map(c => c.id === id ? { ...c, pricePerPost: Number(newPrice) } : c))
    setEditPrice(null)
  }

  return (
    <div style={{ fontFamily: F, display: 'flex', flexDirection: 'column', gap: '22px', maxWidth: '1000px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontFamily: D, fontSize: '26px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.03em', marginBottom: '4px' }}>Mis Canales</h1>
          <p style={{ fontSize: '14px', color: 'var(--muted)' }}>{channels.length} canales registrados</p>
        </div>
        <button onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: A, color: '#fff', border: 'none', borderRadius: '12px', padding: '11px 20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: F, boxShadow: `0 4px 14px ${AG(0.3)}` }}>
          <Plus size={16} /> Añadir canal
        </button>
      </div>

      {/* Stats summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        {[
          { label: 'Audiencia total', val: channels.reduce((s, c) => s + c.audience, 0).toLocaleString('es'), icon: Users },
          { label: 'Ingresos este mes', val: `€${channels.reduce((s, c) => s + c.earningsThisMonth, 0).toLocaleString('es')}`, icon: TrendingUp },
          { label: 'Ingresos totales', val: `€${channels.reduce((s, c) => s + c.totalEarnings, 0).toLocaleString('es')}`, icon: TrendingUp },
        ].map(({ label, val, icon: Icon }) => (
          <div key={label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: AG(0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon size={16} color={A} /></div>
            <div><div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', fontFamily: D }}>{val}</div><div style={{ fontSize: '12px', color: 'var(--muted)' }}>{label}</div></div>
          </div>
        ))}
      </div>

      {/* Channel cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {channels.map(ch => {
          const platColor = PLATFORM_COLORS[ch.platform] || A
          return (
            <div key={ch.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden', transition: 'border-color .15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = AG(0.35) }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
            >
              {/* Top bar with platform color */}
              <div style={{ height: '4px', background: platColor }} />
              <div style={{ padding: '20px 22px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                      <h3 style={{ fontFamily: D, fontSize: '17px', fontWeight: 700, color: 'var(--text)' }}>{ch.name}</h3>
                      <span style={{ background: `${platColor}18`, color: platColor, border: `1px solid ${platColor}35`, borderRadius: '6px', padding: '2px 8px', fontSize: '11px', fontWeight: 600 }}>{ch.platform}</span>
                      {ch.verified && <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: SUCCESS, fontSize: '12px', fontWeight: 600 }}><CheckCircle size={12} /> Verificado</span>}
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '14px', lineHeight: 1.5 }}>{ch.description}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px' }}>
                      {[
                        { label: 'Audiencia', val: fmtK(ch.audience) },
                        { label: 'Engagement', val: `${ch.engagement}%` },
                        { label: 'Posts este mes', val: ch.postsThisMonth },
                        { label: 'Ingresos mes', val: `€${ch.earningsThisMonth}` },
                      ].map(({ label, val }) => (
                        <div key={label} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 12px' }}>
                          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)', fontFamily: D }}>{val}</div>
                          <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '1px' }}>{label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right side: price + status + actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px', flexShrink: 0 }}>
                    <span style={{
                      background: ch.status === 'activo' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                      color: ch.status === 'activo' ? SUCCESS : '#f59e0b',
                      border: `1px solid ${ch.status === 'activo' ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.25)'}`,
                      borderRadius: '20px', padding: '4px 12px', fontSize: '12px', fontWeight: 600,
                    }}>{ch.status === 'activo' ? '● Activo' : '● Pendiente verificación'}</span>

                    {editPrice === ch.id ? (
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', color: 'var(--muted)' }}>€</span>
                        <input type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)}
                          style={{ width: '80px', background: 'var(--bg)', border: `1px solid ${A}`, borderRadius: '8px', padding: '6px 10px', fontSize: '14px', fontWeight: 700, color: 'var(--text)', fontFamily: D, outline: 'none' }}
                          autoFocus />
                        <button onClick={() => savePrice(ch.id)} style={{ background: A, border: 'none', borderRadius: '8px', padding: '7px 12px', fontSize: '12px', fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: F }}>✓</button>
                        <button onClick={() => setEditPrice(null)} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '7px 10px', fontSize: '12px', color: 'var(--muted)', cursor: 'pointer', fontFamily: F }}>✕</button>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text)', fontFamily: D }}>€{ch.pricePerPost}</div>
                        <div style={{ fontSize: '11px', color: 'var(--muted)' }}>por publicación</div>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => { setEditPrice(ch.id); setNewPrice(ch.pricePerPost) }} title="Editar precio" style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: 'var(--muted)', display: 'flex' }}><Edit size={14} /></button>
                      <button title="Eliminar" onClick={() => setChannels(cs => cs.filter(c => c.id !== ch.id))} style={{ background: 'var(--bg)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: '#ef4444', display: 'flex' }}><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {/* Empty add card */}
        <button onClick={() => setShowAdd(true)} style={{ background: 'transparent', border: `2px dashed ${AG(0.3)}`, borderRadius: '16px', padding: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: A, fontFamily: F, fontSize: '14px', fontWeight: 600, transition: 'border-color .15s, background .15s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = A; e.currentTarget.style.background = AG(0.04) }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = AG(0.3); e.currentTarget.style.background = 'transparent' }}
        >
          <Plus size={18} /> Añadir nuevo canal
        </button>
      </div>

      {showAdd && <AddModal onClose={() => setShowAdd(false)} />}
    </div>
  )
}
