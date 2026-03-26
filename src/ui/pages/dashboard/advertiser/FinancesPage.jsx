import React, { useState } from 'react'
import { Wallet, TrendingUp, ArrowDownLeft, ArrowUpRight, Download } from 'lucide-react'
import { MOCK_TRANSACTIONS, MOCK_MONTHLY_SPEND } from './mockData'

const A  = '#8b5cf6'
const AG = (o) => `rgba(139,92,246,${o})`
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
              {isLast && <div style={{ fontSize: '11px', color: A, fontWeight: 700, textAlign: 'center', marginBottom: '3px' }}>€{d.value}</div>}
              <div style={{
                width: '100%', borderRadius: '6px 6px 0 0', minHeight: '4px',
                height: `${(d.value / max) * 100}%`,
                background: isLast ? A : AG(0.35),
                transition: 'height .3s',
              }} />
            </div>
            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{d.label}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function FinancesPage() {
  const [dateRange, setDateRange] = useState('todo')
  const [showRecharge, setShowRecharge] = useState(false)
  const [rechargeAmount, setRechargeAmount] = useState(500)

  const balance = 1470
  const thisMonth = 1930
  const totalHistoric = MOCK_TRANSACTIONS.filter(t => t.type === 'cargo').reduce((s, t) => s + Math.abs(t.amount), 0)
  const saved = Math.round(totalHistoric * 0.12)

  const txFiltered = MOCK_TRANSACTIONS

  return (
    <div style={{ fontFamily: F, display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1100px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontFamily: D, fontSize: '26px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.03em', marginBottom: '4px' }}>Finanzas</h1>
          <p style={{ fontSize: '14px', color: 'var(--muted)' }}>Controla tu saldo y el historial de transacciones</p>
        </div>
        <button onClick={() => setShowRecharge(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: A, color: '#fff', border: 'none', borderRadius: '12px', padding: '11px 22px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: F, boxShadow: `0 4px 14px ${AG(0.3)}` }}>
          <Wallet size={16} /> Recargar saldo
        </button>
      </div>

      {/* Balance + stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        <div style={{ background: `linear-gradient(135deg, ${A} 0%, #7c3aed 100%)`, borderRadius: '16px', padding: '22px', color: '#fff' }}>
          <div style={{ fontSize: '12px', fontWeight: 500, opacity: 0.8, marginBottom: '8px' }}>Saldo disponible</div>
          <div style={{ fontSize: '34px', fontWeight: 800, fontFamily: D, letterSpacing: '-0.03em' }}>€{balance.toLocaleString('es')}</div>
          <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px' }}>Listo para usar en campañas</div>
        </div>
        {[
          { icon: TrendingUp, label: 'Gasto este mes', val: `€${thisMonth.toLocaleString('es')}`, sub: '+12% vs mes anterior', color: SUCCESS },
          { icon: ArrowDownLeft, label: 'Gasto total histórico', val: `€${totalHistoric.toLocaleString('es')}`, sub: `${MOCK_TRANSACTIONS.filter(t => t.type === 'cargo').length} transacciones` },
          { icon: ArrowUpRight, label: 'Ahorro estimado', val: `€${saved.toLocaleString('es')}`, sub: 'vs precio de lista', color: SUCCESS },
        ].map(({ icon: Icon, label, val, sub, color }) => (
          <div key={label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: AG(0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
              <Icon size={16} color={A} />
            </div>
            <div style={{ fontSize: '22px', fontWeight: 700, fontFamily: D, color: color || 'var(--text)', marginBottom: '2px' }}>{val}</div>
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '1px' }}>{label}</div>
            <div style={{ fontSize: '11px', color: 'var(--muted2)' }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Monthly spend chart */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '22px' }}>
        <h2 style={{ fontFamily: D, fontSize: '16px', fontWeight: 600, color: 'var(--text)', marginBottom: '20px' }}>Gasto mensual</h2>
        <BarChart data={MOCK_MONTHLY_SPEND} />
      </div>

      {/* Transactions */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontFamily: D, fontSize: '16px', fontWeight: 600, color: 'var(--text)' }}>Historial de transacciones</h2>
          <button style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '9px', padding: '7px 14px', fontSize: '12px', fontWeight: 600, color: 'var(--muted)', cursor: 'pointer', fontFamily: F }}>
            <Download size={13} /> Exportar CSV
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg2)' }}>
                {['Fecha', 'Descripción', 'Tipo', 'Monto', 'Estado'].map(h => (
                  <th key={h} style={{ padding: '10px 18px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {txFiltered.map((tx, i) => (
                <tr key={tx.id} style={{ borderBottom: i < txFiltered.length - 1 ? '1px solid var(--border)' : 'none' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg2)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  <td style={{ padding: '13px 18px', fontSize: '13px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>{tx.date}</td>
                  <td style={{ padding: '13px 18px', fontSize: '13px', color: 'var(--text)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.desc}</td>
                  <td style={{ padding: '13px 18px' }}>
                    <span style={{
                      background: tx.type === 'recarga' ? 'rgba(16,185,129,0.1)' : AG(0.1),
                      color: tx.type === 'recarga' ? SUCCESS : A,
                      border: `1px solid ${tx.type === 'recarga' ? 'rgba(16,185,129,0.25)' : AG(0.25)}`,
                      borderRadius: '6px', padding: '3px 8px', fontSize: '11px', fontWeight: 600,
                    }}>{tx.type === 'recarga' ? 'Recarga' : 'Cargo'}</span>
                  </td>
                  <td style={{ padding: '13px 18px', fontSize: '14px', fontWeight: 700, color: tx.amount > 0 ? SUCCESS : 'var(--text)', fontFamily: D, whiteSpace: 'nowrap' }}>
                    {tx.amount > 0 ? '+' : ''}€{Math.abs(tx.amount).toLocaleString('es')}
                  </td>
                  <td style={{ padding: '13px 18px' }}>
                    <span style={{ background: 'rgba(16,185,129,0.1)', color: SUCCESS, borderRadius: '6px', padding: '3px 8px', fontSize: '11px', fontWeight: 600 }}>Completado</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment methods */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '22px' }}>
        <h2 style={{ fontFamily: D, fontSize: '16px', fontWeight: 600, color: 'var(--text)', marginBottom: '16px' }}>Métodos de pago</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: AG(0.1), border: `1px solid ${AG(0.2)}`, borderRadius: '8px', padding: '8px 12px', fontSize: '13px', fontWeight: 700, color: A }}>VISA</div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>•••• •••• •••• 4242</div>
                <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Expira 12/2027 · Principal</div>
              </div>
            </div>
            <span style={{ background: 'rgba(16,185,129,0.1)', color: SUCCESS, borderRadius: '6px', padding: '3px 8px', fontSize: '11px', fontWeight: 600 }}>Activa</span>
          </div>
          <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'transparent', border: `2px dashed ${AG(0.3)}`, borderRadius: '12px', padding: '14px', fontSize: '13px', fontWeight: 600, color: A, cursor: 'pointer', fontFamily: F }}>
            + Agregar método de pago
          </button>
        </div>
      </div>

      {/* Recharge modal */}
      {showRecharge && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--surface)', borderRadius: '20px', width: '100%', maxWidth: '420px', padding: '28px', boxShadow: '0 24px 60px rgba(0,0,0,0.4)' }}>
            <h2 style={{ fontFamily: D, fontSize: '20px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>Recargar saldo</h2>
            <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '22px' }}>El saldo se añade de inmediato a tu cuenta</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
              {[100, 250, 500, 1000].map(amt => (
                <button key={amt} onClick={() => setRechargeAmount(amt)} style={{ flex: '1', minWidth: '80px', background: rechargeAmount === amt ? A : 'var(--bg)', border: `1px solid ${rechargeAmount === amt ? A : 'var(--border)'}`, borderRadius: '10px', padding: '10px', fontSize: '14px', fontWeight: 700, color: rechargeAmount === amt ? '#fff' : 'var(--text)', cursor: 'pointer', fontFamily: D }}>€{amt}</button>
              ))}
            </div>
            <div style={{ position: 'relative', marginBottom: '20px' }}>
              <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', fontSize: '16px' }}>€</span>
              <input type="number" value={rechargeAmount} onChange={e => setRechargeAmount(Number(e.target.value))} style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg)', border: '1px solid var(--border-med)', borderRadius: '10px', padding: '12px 14px 12px 30px', fontSize: '18px', fontWeight: 700, color: 'var(--text)', fontFamily: D, outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowRecharge(false)} style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px', fontSize: '13px', cursor: 'pointer', color: 'var(--text)', fontFamily: F }}>Cancelar</button>
              <button onClick={() => setShowRecharge(false)} style={{ flex: 2, background: A, border: 'none', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', color: '#fff', fontFamily: F }}>Recargar €{rechargeAmount}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
