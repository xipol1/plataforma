import React, { useState } from 'react'
import { Download, Wallet } from 'lucide-react'
import { MOCK_EARNINGS, MOCK_MONTHLY_EARNINGS, MOCK_CHANNELS } from './mockDataCreator'

const A  = '#8b5cf6'
const AG = (o) => `rgba(139,92,246,${o})`
const WA = '#25d366'
const WAG = (o) => `rgba(37,211,102,${o})`
const F  = "'Inter', system-ui, sans-serif"
const D  = "'Sora', system-ui, sans-serif"
const SUCCESS = '#10b981'

const BarChart = ({ data }) => {
  const max = Math.max(...data.map(d => d.value))
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '100px' }}>
      {data.map((d, i) => {
        const isLast = i === data.length - 1
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', width: '100%' }}>
              {isLast && <div style={{ fontSize: '11px', color: WA, fontWeight: 700, textAlign: 'center', marginBottom: '3px' }}>€{d.value}</div>}
              <div style={{ width: '100%', borderRadius: '6px 6px 0 0', minHeight: '4px', height: `${(d.value / max) * 100}%`, background: isLast ? WA : `${WA}50`, transition: 'height .3s' }} />
            </div>
            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{d.label}</span>
          </div>
        )
      })}
    </div>
  )
}

const WithdrawModal = ({ balance, onClose }) => {
  const [amount, setAmount] = useState(balance)
  const [method, setMethod] = useState('bank')
  const [done, setDone] = useState(false)

  if (done) return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--surface)', borderRadius: '20px', padding: '40px', maxWidth: '380px', textAlign: 'center', boxShadow: '0 24px 60px rgba(0,0,0,0.4)' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
        <h3 style={{ fontFamily: D, fontSize: '20px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>¡Retiro solicitado!</h3>
        <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '24px' }}>Recibirás €{amount} en tu cuenta en 2-3 días hábiles.</p>
        <button onClick={onClose} style={{ background: WA, color: '#fff', border: 'none', borderRadius: '12px', padding: '12px 28px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: F }}>Cerrar</button>
      </div>
    </div>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: 'var(--surface)', borderRadius: '20px', width: '100%', maxWidth: '420px', overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.4)' }}>
        <div style={{ padding: '22px 28px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontFamily: D, fontSize: '18px', fontWeight: 700, color: 'var(--text)' }}>Solicitar retiro</h2>
          <button onClick={onClose} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', color: 'var(--muted)', fontFamily: F }}>✕</button>
        </div>
        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ background: WAG(0.08), border: `1px solid ${WAG(0.25)}`, borderRadius: '12px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Saldo disponible</span>
            <span style={{ fontFamily: D, fontSize: '20px', fontWeight: 800, color: WA }}>€{balance}</span>
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>Importe a retirar</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', fontSize: '16px' }}>€</span>
              <input type="number" value={amount} onChange={e => setAmount(Math.min(balance, Math.max(0, Number(e.target.value))))} style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg)', border: '1px solid var(--border-med)', borderRadius: '10px', padding: '11px 14px 11px 30px', fontSize: '18px', fontWeight: 700, color: 'var(--text)', fontFamily: D, outline: 'none' }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--muted)', display: 'block', marginBottom: '8px' }}>Método de cobro</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { id: 'bank', label: 'Cuenta bancaria', desc: '•••• 4242 · 2-3 días hábiles' },
                { id: 'paypal', label: 'PayPal', desc: 'instantáneo' },
              ].map(m => (
                <button key={m.id} onClick={() => setMethod(m.id)} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: method === m.id ? AG(0.08) : 'var(--bg)', border: `1px solid ${method === m.id ? A : 'var(--border)'}`, borderRadius: '10px', padding: '12px 14px', cursor: 'pointer', textAlign: 'left', boxShadow: method === m.id ? `0 0 0 1px ${A}` : 'none' }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: `2px solid ${method === m.id ? A : 'var(--muted2)'}`, background: method === m.id ? A : 'transparent', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{m.label}</div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{m.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => setDone(true)} disabled={amount <= 0} style={{ background: amount > 0 ? WA : 'var(--muted2)', color: '#fff', border: 'none', borderRadius: '12px', padding: '13px', fontSize: '14px', fontWeight: 600, cursor: amount > 0 ? 'pointer' : 'not-allowed', fontFamily: F, boxShadow: amount > 0 ? '0 4px 14px rgba(37,211,102,0.35)' : 'none' }}>
            Retirar €{amount}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CreatorEarningsPage() {
  const [showWithdraw, setShowWithdraw] = useState(false)

  const balance       = 930
  const totalEarnings = MOCK_CHANNELS.reduce((s, c) => s + c.totalEarnings, 0)
  const thisMonth     = MOCK_CHANNELS.reduce((s, c) => s + c.earningsThisMonth, 0)

  return (
    <div style={{ fontFamily: F, display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1000px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontFamily: D, fontSize: '26px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.03em', marginBottom: '4px' }}>Ganancias</h1>
          <p style={{ fontSize: '14px', color: 'var(--muted)' }}>Historial de ingresos y gestión de retiros</p>
        </div>
        <button onClick={() => setShowWithdraw(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: WA, color: '#fff', border: 'none', borderRadius: '12px', padding: '11px 22px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: F, boxShadow: '0 4px 14px rgba(37,211,102,0.3)' }}>
          <Wallet size={16} /> Solicitar retiro
        </button>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
        <div style={{ background: `linear-gradient(135deg, ${WA} 0%, #1aa34a 100%)`, borderRadius: '16px', padding: '22px', color: '#fff' }}>
          <div style={{ fontSize: '12px', opacity: 0.85, marginBottom: '6px' }}>Saldo disponible</div>
          <div style={{ fontSize: '32px', fontWeight: 800, fontFamily: D, letterSpacing: '-0.02em' }}>€{balance}</div>
          <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px' }}>Listo para retirar</div>
        </div>
        {[
          { label: 'Ganancias este mes', val: `€${thisMonth}`, sub: '+18% vs mes anterior' },
          { label: 'Ganancias totales', val: `€${totalEarnings.toLocaleString('es')}`, sub: 'Desde el inicio' },
          { label: 'Retiros realizados', val: '€800', sub: '1 retiro este mes' },
        ].map(({ label, val, sub }) => (
          <div key={label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px 22px' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: D, color: 'var(--text)', marginBottom: '4px' }}>{val}</div>
            <div style={{ fontSize: '13px', color: 'var(--muted)' }}>{label}</div>
            <div style={{ fontSize: '12px', color: SUCCESS, marginTop: '4px', fontWeight: 500 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Monthly chart */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '22px' }}>
        <h2 style={{ fontFamily: D, fontSize: '16px', fontWeight: 600, color: 'var(--text)', marginBottom: '20px' }}>Ganancias por mes</h2>
        <BarChart data={MOCK_MONTHLY_EARNINGS} />
      </div>

      {/* By channel */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontFamily: D, fontSize: '16px', fontWeight: 600, color: 'var(--text)' }}>Ganancias por canal</h2>
        </div>
        {MOCK_CHANNELS.map((ch, i) => {
          const pct = Math.round((ch.earningsThisMonth / thisMonth) * 100) || 0
          return (
            <div key={ch.id} style={{ padding: '16px 22px', borderBottom: i < MOCK_CHANNELS.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>{ch.name}</div>
                <div style={{ height: '6px', background: 'var(--bg2)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: WA, borderRadius: '3px', transition: 'width .4s' }} />
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', fontFamily: D }}>€{ch.earningsThisMonth}</div>
                <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{pct}% del total</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Transactions */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontFamily: D, fontSize: '16px', fontWeight: 600, color: 'var(--text)' }}>Historial de movimientos</h2>
          <button style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '9px', padding: '7px 14px', fontSize: '12px', fontWeight: 600, color: 'var(--muted)', cursor: 'pointer', fontFamily: F }}>
            <Download size={13} /> Exportar CSV
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg2)' }}>
                {['Fecha', 'Descripción', 'Tipo', 'Importe', 'Estado'].map(h => (
                  <th key={h} style={{ padding: '10px 18px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_EARNINGS.map((e, i) => (
                <tr key={e.id} style={{ borderBottom: i < MOCK_EARNINGS.length - 1 ? '1px solid var(--border)' : 'none' }}
                  onMouseEnter={ev => { ev.currentTarget.style.background = 'var(--bg2)' }}
                  onMouseLeave={ev => { ev.currentTarget.style.background = 'transparent' }}
                >
                  <td style={{ padding: '13px 18px', fontSize: '13px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>{e.date}</td>
                  <td style={{ padding: '13px 18px', fontSize: '13px', color: 'var(--text)', maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.desc}</td>
                  <td style={{ padding: '13px 18px' }}>
                    <span style={{ background: e.amount > 0 ? WAG(0.1) : AG(0.08), color: e.amount > 0 ? WA : A, border: `1px solid ${e.amount > 0 ? WAG(0.25) : AG(0.2)}`, borderRadius: '6px', padding: '3px 8px', fontSize: '11px', fontWeight: 600 }}>
                      {e.amount > 0 ? 'Ingreso' : 'Retiro'}
                    </span>
                  </td>
                  <td style={{ padding: '13px 18px', fontSize: '14px', fontWeight: 700, color: e.amount > 0 ? SUCCESS : 'var(--text)', fontFamily: D, whiteSpace: 'nowrap' }}>
                    {e.amount > 0 ? '+' : ''}€{Math.abs(e.amount).toLocaleString('es')}
                  </td>
                  <td style={{ padding: '13px 18px' }}>
                    <span style={{ background: e.status === 'completado' ? 'rgba(16,185,129,0.1)' : e.status === 'pendiente' ? 'rgba(245,158,11,0.1)' : AG(0.08), color: e.status === 'completado' ? SUCCESS : e.status === 'pendiente' ? '#f59e0b' : A, borderRadius: '6px', padding: '3px 8px', fontSize: '11px', fontWeight: 600 }}>
                      {e.status === 'completado' ? 'Completado' : e.status === 'pendiente' ? 'Pendiente' : 'Retirado'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showWithdraw && <WithdrawModal balance={balance} onClose={() => setShowWithdraw(false)} />}
    </div>
  )
}
