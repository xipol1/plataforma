import React, { useState } from 'react'
import { User, Bell, Lock, CreditCard } from 'lucide-react'
import { useAuth } from '../../../../auth/AuthContext'

const A  = '#8b5cf6'
const AG = (o) => `rgba(139,92,246,${o})`
const WA = '#25d366'
const F  = "'Inter', system-ui, sans-serif"
const D  = "'Sora', system-ui, sans-serif"

const TABS = [
  { id: 'perfil',         icon: User,       label: 'Perfil' },
  { id: 'notificaciones', icon: Bell,       label: 'Notificaciones' },
  { id: 'seguridad',      icon: Lock,       label: 'Seguridad' },
  { id: 'cobros',         icon: CreditCard, label: 'Método de cobro' },
]

const Inp = ({ label, type = 'text', value, placeholder, hint }) => {
  const [val, setVal] = useState(value || '')
  return (
    <div>
      <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>{label}</label>
      <input type={type} value={val} onChange={e => setVal(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg)', border: '1px solid var(--border-med)', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', color: 'var(--text)', fontFamily: F, outline: 'none' }} />
      {hint && <div style={{ fontSize: '11px', color: 'var(--muted2)', marginTop: '4px' }}>{hint}</div>}
    </div>
  )
}

const Toggle = ({ label, desc, defaultOn = true }) => {
  const [on, setOn] = useState(defaultOn)
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
      <div><div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', marginBottom: '2px' }}>{label}</div><div style={{ fontSize: '12px', color: 'var(--muted)' }}>{desc}</div></div>
      <button onClick={() => setOn(!on)} style={{ width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer', position: 'relative', background: on ? WA : 'var(--muted2)', transition: 'background .2s', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: '3px', left: on ? '22px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
      </button>
    </div>
  )
}

const Card = ({ title, children }) => (
  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
    {title && <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)' }}><h2 style={{ fontFamily: D, fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>{title}</h2></div>}
    <div style={{ padding: '22px' }}>{children}</div>
  </div>
)

export default function CreatorSettingsPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState('perfil')
  const [saved, setSaved] = useState(false)

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  return (
    <div style={{ fontFamily: F, display: 'flex', flexDirection: 'column', gap: '22px', maxWidth: '860px' }}>
      <div>
        <h1 style={{ fontFamily: D, fontSize: '26px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.03em', marginBottom: '4px' }}>Configuración</h1>
        <p style={{ fontSize: '14px', color: 'var(--muted)' }}>Gestiona tu cuenta y preferencias de creador</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--border)' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'none', border: 'none', cursor: 'pointer', padding: '10px 16px', fontSize: '13px', fontWeight: tab === t.id ? 600 : 400, color: tab === t.id ? WA : 'var(--muted)', borderBottom: `2px solid ${tab === t.id ? WA : 'transparent'}`, marginBottom: '-1px', fontFamily: F, transition: 'color .15s' }}>
            <t.icon size={15} strokeWidth={tab === t.id ? 2.2 : 1.8} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'perfil' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Card title="Información personal">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <Inp label="Nombre completo" value={user?.nombre || 'María García'} />
                <Inp label="Email" type="email" value={user?.email || 'maria@creadores.com'} />
              </div>
              <Inp label="Descripción / Bio" value="Creadora de contenido tech en Telegram y WhatsApp con más de 5 años de experiencia." hint="Aparecerá en tu perfil público como creador" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <Inp label="Sitio web" placeholder="https://tuwebsite.com" />
                <Inp label="País" value="España" />
              </div>
            </div>
          </Card>
          <Card title="Avatar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(37,211,102,0.15)', border: '2px solid rgba(37,211,102,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: D, fontWeight: 700, fontSize: '24px', color: WA, flexShrink: 0 }}>
                {(user?.nombre || 'MG').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <button style={{ background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.25)', borderRadius: '9px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, color: WA, cursor: 'pointer', fontFamily: F, marginRight: '8px' }}>Subir imagen</button>
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '6px' }}>PNG o JPG, máx. 2MB</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {tab === 'notificaciones' && (
        <Card title="Preferencias de notificación">
          <Toggle label="Nueva solicitud de anunciante" desc="Notificación cuando un anunciante envía una propuesta" />
          <Toggle label="Solicitud aprobada" desc="Confirmación cuando aceptas una solicitud" />
          <Toggle label="Pago recibido" desc="Aviso cuando recibes un ingreso en tu cuenta" />
          <Toggle label="Retiro procesado" desc="Confirmación cuando tu retiro se ha procesado" />
          <Toggle label="Recordatorio de respuesta" desc="Aviso si llevas más de 24h sin responder a una solicitud" />
          <Toggle label="Novedades de Adflow" desc="Actualizaciones y nuevas funcionalidades de la plataforma" defaultOn={false} />
        </Card>
      )}

      {tab === 'seguridad' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Card title="Cambiar contraseña">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <Inp label="Contraseña actual" type="password" placeholder="••••••••" />
              <Inp label="Nueva contraseña" type="password" placeholder="Mínimo 8 caracteres" />
              <Inp label="Confirmar nueva contraseña" type="password" placeholder="Repite la contraseña" />
            </div>
          </Card>
          <Card title="Autenticación de dos factores">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>2FA por aplicación autenticadora</div>
                <div style={{ fontSize: '13px', color: 'var(--muted)' }}>Protege tu cuenta con una capa extra de seguridad</div>
              </div>
              <button style={{ background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.25)', borderRadius: '10px', padding: '10px 20px', fontSize: '13px', fontWeight: 600, color: WA, cursor: 'pointer', fontFamily: F, whiteSpace: 'nowrap' }}>Activar 2FA</button>
            </div>
          </Card>
        </div>
      )}

      {tab === 'cobros' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Card title="Cuenta bancaria para cobros">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <Inp label="Titular de la cuenta" value={user?.nombre || 'María García'} />
                <Inp label="NIF / DNI" placeholder="12345678A" />
              </div>
              <Inp label="IBAN" placeholder="ES91 2100 0418 4502 0005 1332" hint="Deben coincidir titular y NIF" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <Inp label="Banco" placeholder="CaixaBank" />
                <Inp label="BIC / SWIFT" placeholder="CAIXESBBXXX" />
              </div>
            </div>
          </Card>
          <Card title="PayPal (alternativa)">
            <Inp label="Email de PayPal" type="email" placeholder="tu@paypal.com" hint="Para retiros instantáneos con una pequeña comisión" />
          </Card>
          <div style={{ background: 'rgba(37,211,102,0.06)', border: '1px solid rgba(37,211,102,0.2)', borderRadius: '12px', padding: '14px 16px', fontSize: '13px', color: 'var(--muted)' }}>
            💡 Los retiros se procesan en 2-3 días hábiles a cuenta bancaria, o de forma instantánea por PayPal (2% comisión).
          </div>
        </div>
      )}

      {['perfil', 'notificaciones', 'seguridad', 'cobros'].includes(tab) && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={save} style={{ background: saved ? SUCCESS : WA, color: '#fff', border: 'none', borderRadius: '12px', padding: '12px 28px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: F, transition: 'background .2s', boxShadow: `0 4px 14px ${saved ? 'rgba(16,185,129,0.3)' : 'rgba(37,211,102,0.3)'}` }}>
            {saved ? '✓ Guardado' : 'Guardar cambios'}
          </button>
        </div>
      )}
    </div>
  )
}
