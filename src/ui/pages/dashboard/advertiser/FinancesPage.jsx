import React, { useState } from 'react'
import { Wallet, TrendingUp, ArrowDownLeft, ArrowUpRight, Download, CreditCard, Plus, X, CheckCircle, Clock } from 'lucide-react'
import { MOCK_TRANSACTIONS, MOCK_MONTHLY_SPEND } from './mockData'

const A  = '#8b5cf6'
const AG = (o) => `rgba(139,92,246,${o})`
const F  = "'Inter', system-ui, sans-serif"
const D  = "'Sora', system-ui, sans-serif"
const OK = '#10b981'
const WARN = '#f59e0b'
const BLUE = '#3b82f6'

// ─── Enhanced bar chart ────────────────────────────────────────────────────────
const BarChart = ({ data }) => {
  const max = Math.max(...data.map(d => d.value))
  const [hoverIdx, setHoverIdx] = useState(null)

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '120px', paddingBottom: '20px' }}>
      {data.map((d, i) => {
        const isLast = i === data.length - 1
        const isHov  = hoverIdx === i
        const pct    = (d.value / max) * 100

        return (
          <div key={i}
            onMouseEnter={() => setHoverIdx(i)}
            onMouseLeave={() => setHoverIdx(null)}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%', cursor: 'default' }}
          >
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', width: '100%' }}>
              {(isHov || isLast) && (
                <div style={{ fontSize: '11px', color: isLast ? A : 'var(--muted)', fontWeight: 700, textAlign: 'center', marginBottom: '4px' }}>
                  €{d.value}
                </div>
              )}
              <div style={{
                width: '100%', borderRadius: '6px 6px 0 0', minHeight: '4px',
                height: `${pct}%`,
                background: isLast
                  ? `linear-gradient(180deg, ${AG(1)} 0%, #7c3aed 100%)`
                  : isHov ? AG(0.55) : AG(0.3),
                transition: 'background .15s, height .4s cubic-bezier(.4,0,.2,1)',
              }} />
            </div>
            <span style={{ fontSize: '10px', color: isLast ? A : 'var(--muted)', fontWeight: isLast ? 600 : 400, whiteSpace: 'nowrap' }}>
              {d.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Spending breakdown pie alternative ───────────────────────────────────────
const CATEGORY_SPEND = [
  { label: 'Telegram', pct: 38, color: '#2aabee', amount: 1240 },
  { label: 'Instagram', pct: 26, color: '#e1306c', amount: 860 },
  { label: 'Newsletter', pct: 19, color: WARN, amount: 620 },
  { label: 'Discord', pct: 15, color: '#5865f2', amount: 480 },
  { label: 'Otros', pct: 2, color: '#94a3b8', amount: 60 },
]

// ─── Transaction type icon ─────────────────────────────────────────────────────
function TxIcon({ type }) {
  const cfg = {
    recarga: { icon: '💳', color: OK, bg: `${OK}12` },
    cargo:   { icon: '📢', color: A,  bg: AG(0.1)   },
  }[type] || { icon: '💰', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' }

  return (
    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
      {cfg.icon}
    </div>
  )
}

// ─── Recharge modal ────────────────────────────────────────────────────────────
const RechargeModal = ({ onClose }) => {
  const [amount, setAmount] = useState(500)
  const [step, setStep]     = useState(1) // 1: select amount, 2: success

  const PRESETS = [100, 250, 500, 1000]

  if (step === 2) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: 'var(--surface)', borderRadius: '22px', padding: '44px', maxWidth: '380px', width: '100%', textAlign: 'center', boxShadow: '0 32px 80px rgba(0,0,0,0.45)' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: `${OK}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <CheckCircle size={28} color={OK} strokeWidth={2} />
          </div>
          <h3 style={{ fontFamily: D, fontSize: '22px', fontWeight: 800, color: 'var(--text)', marginBottom: '8px' }}>Recarga exitosa</h3>
          <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '8px', lineHeight: 1.6 }}>
            Se han añadido <strong style={{ color: A }}>€{amount}</strong> a tu saldo disponible.
          </p>
          <p style={{ fontSize: '13px', color: 'var(--muted2)', marginBottom: '28px' }}>El saldo está listo para usar en campañas.</p>
          <button onClick={onClose} style={{ background: A, color: '#fff', border: 'none', borderRadius: '12px', padding: '13px 32px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: F, boxShadow: `0 4px 16px ${AG(0.35)}` }}>
            Perfecto, gracias
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: 'var(--surface)', borderRadius: '22px', width: '100%', maxWidth: '440px', overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.45)' }}>
        <div style={{ height: '4px', background: `linear-gradient(90deg, ${A} 0%, #7c3aed 100%)` }} />
        <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontFamily: D, fontSize: '20px', fontWeight: 800, color: 'var(--text)' }}>Recargar saldo</h2>
            <p style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '3px' }}>El saldo se acredita de forma instantánea</p>
          </div>
          <button onClick={onClose} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '9px', padding: '8px', cursor: 'pointer', color: 'var(--muted)', display: 'flex' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Preset amounts */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Selecciona un importe</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {PRESETS.map(amt => (
                <button key={amt} onClick={() => setAmount(amt)} style={{
                  background: amount === amt ? A : 'var(--bg)',
                  border: `1px solid ${amount === amt ? A : 'var(--border)'}`,
                  borderRadius: '11px', padding: '12px 8px',
                  fontFamily: D, fontSize: '16px', fontWeight: 800,
                  color: amount === amt ? '#fff' : 'var(--text)',
                  cursor: 'pointer',
                  boxShadow: amount === amt ? `0 3px 10px ${AG(0.3)}` : 'none',
                  transition: 'all .15s',
                }}>
                  €{amt}
                </button>
              ))}
            </div>
          </div>

          {/* Custom input */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>O introduce un importe</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', fontSize: '18px', fontFamily: D, fontWeight: 700 }}>€</span>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(Math.max(10, Number(e.target.value)))}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'var(--bg)', border: '1px solid var(--border-med)',
                  borderRadius: '12px', padding: '13px 14px 13px 36px',
                  fontSize: '20px', fontWeight: 800, color: 'var(--text)', fontFamily: D, outline: 'none',
                  transition: 'border-color .15s',
                }}
                onFocus={e => { e.target.style.borderColor = AG(0.5) }}
                onBlur={e => { e.target.style.borderColor = 'var(--border-med)' }}
              />
            </div>
          </div>

          {/* Payment method */}
          <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: AG(0.1), border: `1px solid ${AG(0.2)}`, borderRadius: '8px', padding: '7px 11px', fontSize: '12px', fontWeight: 800, color: A, letterSpacing: '0.05em' }}>VISA</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>•••• •••• •••• 4242</div>
              <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Expira 12/2027</div>
            </div>
            <span style={{ background: `${OK}12`, color: OK, borderRadius: '6px', padding: '2px 8px', fontSize: '11px', fontWeight: 600 }}>Principal</span>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={onClose} style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '11px', padding: '13px', fontSize: '14px', cursor: 'pointer', color: 'var(--text)', fontFamily: F }}>
              Cancelar
            </button>
            <button onClick={() => setStep(2)} style={{ flex: 2, background: A, border: 'none', borderRadius: '11px', padding: '13px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', color: '#fff', fontFamily: F, boxShadow: `0 4px 14px ${AG(0.35)}`, transition: 'transform .15s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none' }}
            >
              Recargar €{amount}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function FinancesPage() {
  const [showRecharge, setShowRecharge] = useState(false)
  const [txFilter, setTxFilter] = useState('todos')

  const balance     = 1470
  const thisMonth   = 1930
  const totalHistoric = MOCK_TRANSACTIONS.filter(t => t.type === 'cargo').reduce((s, t) => s + Math.abs(t.amount), 0)
  const saved       = Math.round(totalHistoric * 0.12)

  const filteredTx = MOCK_TRANSACTIONS.filter(tx => {
    if (txFilter === 'todos') return true
    return tx.type === txFilter
  })

  return (
    <div style={{ fontFamily: F, display: 'flex', flexDirection: 'column', gap: '26px', maxWidth: '1100px' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontFamily: D, fontSize: '28px', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.04em', marginBottom: '4px' }}>Finanzas</h1>
          <p style={{ fontSize: '14px', color: 'var(--muted)' }}>Controla tu saldo, gasto y métodos de pago</p>
        </div>
        <button
          onClick={() => setShowRecharge(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: A, color: '#fff', border: 'none', borderRadius: '12px', padding: '11px 22px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: F, boxShadow: `0 4px 16px ${AG(0.35)}`, transition: 'transform .15s, box-shadow .15s' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${AG(0.4)}` }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = `0 4px 16px ${AG(0.35)}` }}
        >
          <Plus size={16} strokeWidth={2.5} /> Recargar saldo
        </button>
      </div>

      {/* ── Balance + KPI row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1.2fr) repeat(3, 1fr)', gap: '14px' }}>

        {/* Balance hero card */}
        <div style={{ background: `linear-gradient(135deg, ${A} 0%, #7c3aed 100%)`, borderRadius: '18px', padding: '24px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
          <div style={{ position: 'absolute', bottom: '-30px', right: '20px', width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
          <Wallet size={20} color="rgba(255,255,255,0.7)" style={{ marginBottom: '12px' }} />
          <div style={{ fontSize: '13px', opacity: 0.8, marginBottom: '6px' }}>Saldo disponible</div>
          <div style={{ fontFamily: D, fontSize: '38px', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '8px' }}>
            €{balance.toLocaleString('es')}
          </div>
          <div style={{ fontSize: '12px', opacity: 0.7 }}>Listo para usar en campañas</div>
          <button
            onClick={() => setShowRecharge(true)}
            style={{ marginTop: '16px', background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '9px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: F }}
          >
            Añadir fondos →
          </button>
        </div>

        {/* KPI cards */}
        {[
          { icon: TrendingUp, label: 'Gasto este mes', val: `€${thisMonth.toLocaleString('es')}`, sub: '+12% vs mes anterior', color: BLUE, subColor: BLUE },
          { icon: ArrowDownLeft, label: 'Gasto histórico total', val: `€${totalHistoric.toLocaleString('es')}`, sub: `${MOCK_TRANSACTIONS.filter(t => t.type === 'cargo').length} transacciones`, color: A },
          { icon: ArrowUpRight, label: 'Ahorro estimado', val: `€${saved.toLocaleString('es')}`, sub: 'vs precio de lista', color: OK, subColor: OK },
        ].map(({ icon: Icon, label, val, sub, color, subColor }) => (
          <div key={label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px', transition: 'border-color .15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = AG(0.3) }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
          >
            <div style={{ width: '38px', height: '38px', borderRadius: '11px', background: `${color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
              <Icon size={17} color={color} />
            </div>
            <div style={{ fontFamily: D, fontSize: '24px', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em', marginBottom: '3px' }}>{val}</div>
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>{label}</div>
            <div style={{ fontSize: '11px', color: subColor || 'var(--muted2)', fontWeight: subColor ? 600 : 400 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* ── 2-col: chart + breakdown ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) 1fr', gap: '20px' }}>

        {/* Monthly spend chart */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <h2 style={{ fontFamily: D, fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>Gasto mensual</h2>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['3M', '6M', '12M'].map((l, i) => (
                <button key={l} style={{ background: i === 2 ? AG(0.1) : 'transparent', border: `1px solid ${i === 2 ? AG(0.3) : 'var(--border)'}`, borderRadius: '7px', padding: '3px 9px', fontSize: '11px', color: i === 2 ? A : 'var(--muted)', cursor: 'pointer', fontFamily: F }}>{l}</button>
              ))}
            </div>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '18px' }}>Histórico de gasto en campañas</p>
          <BarChart data={MOCK_MONTHLY_SPEND} />
        </div>

        {/* Spending breakdown */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px' }}>
          <h2 style={{ fontFamily: D, fontSize: '15px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>Desglose por plataforma</h2>
          <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '18px' }}>Este mes</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {CATEGORY_SPEND.map(cat => (
              <div key={cat.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: cat.color }} />
                    <span style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 500 }}>{cat.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{cat.pct}%</span>
                    <span style={{ fontFamily: D, fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>€{cat.amount}</span>
                  </div>
                </div>
                <div style={{ height: '5px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${cat.pct}%`, background: `linear-gradient(90deg, ${cat.color} 0%, ${cat.color}80 100%)`, borderRadius: '3px', transition: 'width .5s ease' }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 500 }}>Total este mes</span>
            <span style={{ fontFamily: D, fontSize: '16px', fontWeight: 800, color: A }}>€{CATEGORY_SPEND.reduce((s, c) => s + c.amount, 0).toLocaleString('es')}</span>
          </div>
        </div>
      </div>

      {/* ── Transactions ── */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', overflow: 'hidden' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontFamily: D, fontSize: '15px', fontWeight: 700, color: 'var(--text)', marginBottom: '2px' }}>Historial de transacciones</h2>
            <p style={{ fontSize: '12px', color: 'var(--muted)' }}>{MOCK_TRANSACTIONS.length} movimientos registrados</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Filter chips */}
            <div style={{ display: 'flex', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '9px', overflow: 'hidden' }}>
              {['todos', 'recarga', 'cargo'].map(f => (
                <button key={f} onClick={() => setTxFilter(f)} style={{
                  background: txFilter === f ? AG(0.12) : 'transparent', border: 'none',
                  padding: '6px 14px', fontSize: '12px', fontWeight: txFilter === f ? 600 : 400,
                  color: txFilter === f ? A : 'var(--muted)', cursor: 'pointer', fontFamily: F,
                  borderRight: f !== 'cargo' ? '1px solid var(--border)' : 'none',
                }}>
                  {f === 'todos' ? 'Todos' : f === 'recarga' ? 'Recargas' : 'Cargos'}
                </button>
              ))}
            </div>
            <button style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '9px', padding: '7px 14px', fontSize: '12px', fontWeight: 600, color: 'var(--muted)', cursor: 'pointer', fontFamily: F }}>
              <Download size={13} /> Exportar CSV
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '620px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg2)' }}>
                {['Transacción', 'Fecha', 'Tipo', 'Importe', 'Estado'].map(h => (
                  <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredTx.map((tx, i) => (
                <tr key={tx.id}
                  style={{ borderBottom: i < filteredTx.length - 1 ? '1px solid var(--border)' : 'none' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg2)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  <td style={{ padding: '15px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <TxIcon type={tx.type} />
                      <div>
                        <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text)', maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.desc}</div>
                        <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                          #{String(tx.id).padStart(6, '0')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '15px 20px', fontSize: '13px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Clock size={11} />
                      {tx.date}
                    </div>
                  </td>
                  <td style={{ padding: '15px 20px' }}>
                    <span style={{
                      background: tx.type === 'recarga' ? `${OK}12` : AG(0.1),
                      color: tx.type === 'recarga' ? OK : A,
                      border: `1px solid ${tx.type === 'recarga' ? `${OK}30` : AG(0.3)}`,
                      borderRadius: '6px', padding: '3px 9px', fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap',
                    }}>
                      {tx.type === 'recarga' ? 'Recarga' : 'Cargo'}
                    </span>
                  </td>
                  <td style={{ padding: '15px 20px' }}>
                    <span style={{ fontFamily: D, fontSize: '15px', fontWeight: 800, color: tx.amount > 0 ? OK : 'var(--text)', whiteSpace: 'nowrap' }}>
                      {tx.amount > 0 ? '+' : ''}€{Math.abs(tx.amount).toLocaleString('es')}
                    </span>
                  </td>
                  <td style={{ padding: '15px 20px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', background: `${OK}12`, color: OK, borderRadius: '6px', padding: '3px 9px', fontSize: '11px', fontWeight: 600, width: 'fit-content' }}>
                      <CheckCircle size={10} strokeWidth={2.5} /> Completado
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Payment methods ── */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '18px', padding: '22px' }}>
        <h2 style={{ fontFamily: D, fontSize: '15px', fontWeight: 700, color: 'var(--text)', marginBottom: '16px' }}>Métodos de pago</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Active card */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: AG(0.04), border: `1px solid ${AG(0.2)}`, borderRadius: '13px', padding: '15px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ background: AG(0.12), border: `1px solid ${AG(0.25)}`, borderRadius: '9px', padding: '8px 13px', fontSize: '13px', fontWeight: 800, color: A, letterSpacing: '0.05em' }}>VISA</div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>•••• •••• •••• 4242</div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>Expira 12/2027 · Tarjeta principal</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ background: `${OK}12`, color: OK, border: `1px solid ${OK}25`, borderRadius: '6px', padding: '3px 9px', fontSize: '11px', fontWeight: 600 }}>
                ● Activa
              </span>
              <button style={{ background: 'none', border: 'none', fontSize: '12px', color: 'var(--muted)', cursor: 'pointer', fontFamily: F }}>Editar</button>
            </div>
          </div>

          {/* Add method */}
          <button style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            background: 'transparent', border: `2px dashed ${AG(0.3)}`, borderRadius: '13px', padding: '15px',
            fontSize: '13px', fontWeight: 600, color: A, cursor: 'pointer', fontFamily: F,
            transition: 'border-color .15s, background .15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = A; e.currentTarget.style.background = AG(0.04) }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = AG(0.3); e.currentTarget.style.background = 'transparent' }}
          >
            <Plus size={15} /> Añadir método de pago
          </button>
        </div>
      </div>

      {showRecharge && <RechargeModal onClose={() => setShowRecharge(false)} />}
    </div>
  )
}
