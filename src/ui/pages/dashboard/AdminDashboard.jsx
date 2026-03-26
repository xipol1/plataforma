import React from 'react'

const A  = '#8b5cf6'
const AG = (o) => `rgba(139,92,246,${o})`
const F  = "'Inter', system-ui, sans-serif"
const D  = "'Sora', system-ui, sans-serif"

export default function AdminDashboard({ user }) {
  const nombre = user?.nombre || user?.email?.split('@')[0] || 'Admin'

  return (
    <div style={{ fontFamily: F, display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div>
        <h1 style={{ fontFamily: D, fontSize: '26px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.03em', marginBottom: '6px' }}>
          Panel de administración 🛡️
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--muted)' }}>Bienvenido, {nombre}. Aquí puedes gestionar la plataforma.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '14px' }}>
        {[
          { icon: '👥', label: 'Usuarios', value: '—' },
          { icon: '📡', label: 'Canales', value: '—' },
          { icon: '📣', label: 'Campañas', value: '—' },
          { icon: '💰', label: 'Volumen', value: '$—' },
        ].map(({ icon, label, value }) => (
          <div key={label} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '16px', padding: '20px 24px',
          }}>
            <div style={{ fontSize: '22px', marginBottom: '8px' }}>{icon}</div>
            <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: D, color: 'var(--text)' }}>{value}</div>
            <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '2px' }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '16px', padding: '24px',
      }}>
        <h3 style={{ fontFamily: D, fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '12px' }}>
          Acciones de moderación
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {['Revisar canales pendientes de verificación', 'Moderar solicitudes de campaña', 'Gestionar retiros pendientes', 'Ver logs de actividad'].map(action => (
            <button key={action} style={{
              background: 'var(--bg)', border: '1px solid var(--border)',
              borderRadius: '10px', padding: '12px 16px', textAlign: 'left',
              cursor: 'pointer', color: 'var(--text)', fontSize: '14px', fontFamily: F,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              transition: 'border-color .15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = AG(0.4) }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
            >
              {action}
              <span style={{ color: 'var(--muted)', fontSize: '12px' }}>Próximamente →</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
