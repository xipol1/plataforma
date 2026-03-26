import React, { useState } from 'react'
import { Zap, Bot, Heart, MousePointer, CheckCircle, ChevronDown } from 'lucide-react'
import { MOCK_CHANNELS } from './mockData'

const A  = '#8b5cf6'
const AG = (o) => `rgba(139,92,246,${o})`
const F  = "'Inter', system-ui, sans-serif"
const D  = "'Sora', system-ui, sans-serif"

const CATEGORIES = ['Tecnología', 'Negocios', 'Marketing', 'Ecommerce', 'Gaming', 'Fitness', 'Finanzas', 'Diseño', 'Gastronomía']
const AUTO_CHANNELS = MOCK_CHANNELS.filter(c => c.verified).slice(0, 4)

const calcEstimates = (budget) => {
  const cpc   = 0.16
  const clicks = Math.round(budget / cpc)
  const impr   = Math.round(clicks * 22)
  return { cpc, clicks, impr }
}

const ModeCard = ({ icon: Icon, label, desc, badge, selected, onClick }) => (
  <button onClick={onClick} style={{
    background: selected ? AG(0.1) : 'var(--bg)',
    border: `1.5px solid ${selected ? A : 'var(--border)'}`,
    borderRadius: '14px', padding: '16px',
    cursor: 'pointer', textAlign: 'left', flex: 1,
    boxShadow: selected ? `0 0 0 1px ${A}` : 'none',
    transition: 'all .15s',
  }}
    onMouseEnter={e => { if (!selected) e.currentTarget.style.borderColor = AG(0.4) }}
    onMouseLeave={e => { if (!selected) e.currentTarget.style.borderColor = 'var(--border)' }}
  >
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: selected ? AG(0.15) : 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={18} color={selected ? A : 'var(--muted)'} />
      </div>
      {badge && <span style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '6px', padding: '2px 8px', fontSize: '10px', fontWeight: 700 }}>{badge}</span>}
    </div>
    <div style={{ fontFamily: D, fontSize: '13px', fontWeight: 700, color: selected ? A : 'var(--text)', marginBottom: '4px' }}>{label}</div>
    <div style={{ fontSize: '11px', color: 'var(--muted)', lineHeight: 1.4 }}>{desc}</div>
  </button>
)

export default function AutoBuyPage() {
  const [step, setStep] = useState(1)
  const [budget, setBudget] = useState(300)
  const [category, setCategory] = useState('Tecnología')
  const [mode, setMode] = useState('auto')
  const [adText, setAdText] = useState('')
  const [url, setUrl] = useState('')
  const [launched, setLaunched] = useState(false)

  const est = calcEstimates(budget)
  const budgetPerChannel = Math.round(budget / AUTO_CHANNELS.length)

  if (launched) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', flexDirection: 'column', gap: '20px', textAlign: 'center' }}>
      <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(16,185,129,0.12)', border: '2px solid rgba(16,185,129,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px' }}>✅</div>
      <div>
        <h2 style={{ fontFamily: D, fontSize: '24px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>¡Campaña lanzada!</h2>
        <p style={{ fontSize: '14px', color: 'var(--muted)', maxWidth: '400px' }}>Tu campaña Auto-Buy está activa. Los canales seleccionados publicarán tu anuncio en las próximas 24h.</p>
      </div>
      <button onClick={() => { setLaunched(false); setStep(1) }} style={{ background: A, color: '#fff', border: 'none', borderRadius: '12px', padding: '12px 28px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: F }}>Ver mis anuncios</button>
    </div>
  )

  return (
    <div style={{ fontFamily: F, display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1100px' }}>

      {/* Header */}
      <div>
        <h1 style={{ fontFamily: D, fontSize: '26px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.03em', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Zap size={24} color={A} /> Auto-Buy
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--muted)' }}>La IA selecciona los mejores canales y optimiza tu presupuesto automáticamente</p>
      </div>

      {/* Stepper */}
      <div style={{ display: 'flex', gap: '0', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '16px 20px', alignItems: 'center', gap: '12px' }}>
        {['Configuración', 'Contenido del anuncio'].map((s, i) => (
          <React.Fragment key={i}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => setStep(i + 1)}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                background: step > i ? A : step === i + 1 ? AG(0.15) : 'var(--bg2)',
                border: `2px solid ${step >= i + 1 ? A : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', fontWeight: 700, color: step > i ? '#fff' : step === i + 1 ? A : 'var(--muted)',
              }}>{step > i ? <CheckCircle size={14} /> : i + 1}</div>
              <span style={{ fontSize: '13px', fontWeight: step === i + 1 ? 600 : 400, color: step === i + 1 ? 'var(--text)' : 'var(--muted)' }}>{s}</span>
            </div>
            {i < 1 && <div style={{ flex: 1, height: '2px', background: step > 1 ? A : 'var(--border)', borderRadius: '1px' }} />}
          </React.Fragment>
        ))}
      </div>

      {/* Main layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 300px', gap: '20px', alignItems: 'start' }}>

        {/* Form */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {step === 1 && <>
            {/* Budget */}
            <div>
              <label style={{ fontFamily: D, fontSize: '15px', fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: '12px' }}>Presupuesto total</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', fontSize: '16px' }}>€</span>
                  <input type="number" value={budget} onChange={e => setBudget(Math.max(50, Number(e.target.value)))}
                    style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg)', border: `1px solid ${AG(0.3)}`, borderRadius: '10px', padding: '11px 14px 11px 30px', fontSize: '18px', fontWeight: 700, color: 'var(--text)', fontFamily: D, outline: 'none' }} />
                </div>
                <div style={{ background: AG(0.08), border: `1px solid ${AG(0.2)}`, borderRadius: '12px', padding: '12px 16px', minWidth: '200px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>Estimación</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: A, fontFamily: D }}>~{est.clicks.toLocaleString('es')} clicks</div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>CPC estimado: €{est.cpc} · ~{est.impr.toLocaleString('es')} impresiones</div>
                </div>
              </div>
              <input type="range" min={50} max={2000} step={50} value={budget} onChange={e => setBudget(Number(e.target.value))}
                style={{ width: '100%', accentColor: A }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--muted2)', marginTop: '4px' }}>
                <span>€50</span><span>€2.000</span>
              </div>
            </div>

            {/* Category */}
            <div>
              <label style={{ fontFamily: D, fontSize: '15px', fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: '10px' }}>Categoría del producto</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {CATEGORIES.map(c => (
                  <button key={c} onClick={() => setCategory(c)} style={{
                    background: category === c ? A : 'var(--bg)',
                    border: `1px solid ${category === c ? A : 'var(--border)'}`,
                    borderRadius: '20px', padding: '7px 14px', fontSize: '13px', fontWeight: category === c ? 600 : 400,
                    color: category === c ? '#fff' : 'var(--muted)', cursor: 'pointer', fontFamily: F, transition: 'all .15s',
                  }}>{c}</button>
                ))}
              </div>
            </div>

            {/* Mode */}
            <div>
              <label style={{ fontFamily: D, fontSize: '15px', fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: '10px' }}>Modo de distribución</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <ModeCard icon={Bot} label="Automático" desc="La IA elige los mejores canales para maximizar tu ROI" badge="Recomendado" selected={mode === 'auto'} onClick={() => setMode('auto')} />
                <ModeCard icon={Heart} label="Mis favoritos" desc="Distribuye entre canales que has marcado como favoritos" selected={mode === 'fav'} onClick={() => setMode('fav')} />
                <ModeCard icon={MousePointer} label="Manual" desc="Elige tú mismo los canales desde el explorador" selected={mode === 'manual'} onClick={() => setMode('manual')} />
              </div>
            </div>
          </>}

          {step === 2 && <>
            <div>
              <label style={{ fontFamily: D, fontSize: '15px', fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: '8px' }}>
                Texto del anuncio <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 400 }}>({adText.length}/500 caracteres)</span>
              </label>
              <textarea value={adText} onChange={e => setAdText(e.target.value.slice(0, 500))} placeholder="Escribe el mensaje que se publicará en los canales. Incluye una llamada a la acción clara..." rows={6}
                style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg)', border: '1px solid var(--border-med)', borderRadius: '12px', padding: '14px', fontSize: '14px', color: 'var(--text)', fontFamily: F, outline: 'none', resize: 'none', lineHeight: 1.6 }} />
            </div>

            <div>
              <label style={{ fontFamily: D, fontSize: '15px', fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: '8px' }}>URL de destino</label>
              <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://tu-web.com/landing"
                style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg)', border: `1px solid ${url && !url.startsWith('http') ? '#ef4444' : 'var(--border-med)'}`, borderRadius: '10px', padding: '11px 14px', fontSize: '14px', color: 'var(--text)', fontFamily: F, outline: 'none' }} />
              {url && !url.startsWith('http') && <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>La URL debe comenzar con https://</div>}
            </div>

            {/* Preview */}
            {adText && (
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Preview del mensaje</div>
                <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', borderLeft: `4px solid ${AG(0.6)}` }}>
                  <div style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{adText}</div>
                  {url && <div style={{ marginTop: '8px', fontSize: '12px', color: A, textDecoration: 'underline' }}>{url}</div>}
                </div>
              </div>
            )}
          </>}

          {/* Nav buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
            <button onClick={() => step > 1 && setStep(1)} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '11px 22px', fontSize: '13px', cursor: step > 1 ? 'pointer' : 'default', color: step > 1 ? 'var(--text)' : 'var(--muted2)', fontFamily: F, opacity: step === 1 ? 0.4 : 1 }} disabled={step === 1}>← Anterior</button>
            {step === 1
              ? <button onClick={() => setStep(2)} style={{ background: A, color: '#fff', border: 'none', borderRadius: '10px', padding: '11px 24px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: F }}>Siguiente →</button>
              : <button onClick={() => setLaunched(true)} disabled={!adText || !url.startsWith('http')} style={{ background: adText && url.startsWith('http') ? A : 'var(--muted2)', color: '#fff', border: 'none', borderRadius: '10px', padding: '11px 24px', fontSize: '13px', fontWeight: 600, cursor: adText && url.startsWith('http') ? 'pointer' : 'not-allowed', fontFamily: F, boxShadow: adText && url.startsWith('http') ? `0 4px 14px ${AG(0.35)}` : 'none' }}>
                <Zap size={14} style={{ marginRight: '6px', display: 'inline-block', verticalAlign: 'middle' }} />Lanzar campaña
              </button>
            }
          </div>
        </div>

        {/* Summary panel */}
        <div style={{ position: 'sticky', top: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ fontFamily: D, fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>Resumen</h3>
            {[
              { label: 'Presupuesto', val: `€${budget.toLocaleString('es')}` },
              { label: 'Clicks esperados', val: `~${est.clicks.toLocaleString('es')}` },
              { label: 'Impresiones', val: `~${est.impr.toLocaleString('es')}` },
              { label: 'CPC estimado', val: `€${est.cpc}` },
            ].map(({ label, val }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--muted)' }}>{label}</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', fontFamily: D }}>{val}</span>
              </div>
            ))}
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '18px' }}>
            <h3 style={{ fontFamily: D, fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '12px' }}>Canales seleccionados</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {AUTO_CHANNELS.map(ch => (
                <div key={ch.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '10px', background: 'var(--bg)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{ch.name}</span>
                    <span style={{ fontSize: '10px', background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>Alto rend.</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--muted)' }}>
                    <span>€{budgetPerChannel} asignado</span>
                    <span>~{Math.round(budgetPerChannel / est.cpc)} clicks</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
