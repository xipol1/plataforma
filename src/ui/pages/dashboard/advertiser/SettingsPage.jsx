import React, { useState } from 'react'
import { User, Bell, Lock, FileText, Key } from 'lucide-react'
import { useAuth } from '../../../../auth/AuthContext'
import { MOCK_USER } from './mockData'

const A  = '#8b5cf6'
const AG = (o) => `rgba(139,92,246,${o})`
const F  = "'Inter', system-ui, sans-serif"
const D  = "'Sora', system-ui, sans-serif"

const TABS = [
  { id: 'perfil',         icon: User,     label: 'Perfil' },
  { id: 'notificaciones', icon: Bell,     label: 'Notificaciones' },
  { id: 'seguridad',      icon: Lock,     label: 'Seguridad' },
  { id: 'facturacion',    icon: FileText, label: 'Facturación' },
  { id: 'api',            icon: Key,      label: 'API' },
]

const Field = ({ label, type = 'text', value, placeholder, hint }) => {
  const [val, setVal] = useState(value || '')
  return (
    <div>
      <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>{label}</label>
      {type === 'textarea'
        ? <textarea value={val} onChange={e => setVal(e.target.value)} placeholder={placeholder} rows={3} style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg)', border: '1px solid var(--border-med)', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', color: 'var(--text)', fontFamily: F, outline: 'none', resize: 'none' }} />
        : <input type={type} value={val} onChange={e => setVal(e.target.value)} placeholder={placeholder} style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg)', border: '1px solid var(--border-med)', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', color: 'var(--text)', fontFamily: F, outline: 'none' }} />
      }
      {hint && <div style={{ fontSize: '11px', color: 'var(--muted2)', marginTop: '4px' }}>{hint}</div>}
    </div>
  )
}

const Toggle = ({ label, desc, defaultOn }) => {
  const [on, setOn] = useState(defaultOn !== false)
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
      <div>
        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', marginBottom: '2px' }}>{label}</div>
        <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{desc}</div>
      </div>
      <button onClick={() => setOn(!on)} style={{
        width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer', position: 'relative',
        background: on ? A : 'var(--muted2)', transition: 'background .2s', flexShrink: 0,
      }}>
        <div style={{ position: 'absolute', top: '3px', left: on ? '22px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
      </button>
    </div>
  )
}

const Card = ({ children, title }) => (
  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden' }}>
    {title && <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
      <h2 style={{ fontFamily: D, fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>{title}</h2>
    </div>}
    <div style={{ padding: '22px' }}>{children}</div>
  </div>
)

export default function SettingsPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState('perfil')
  const [saved, setSaved] = useState(false)

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  return (
    <div style={{ fontFamily: F, display: 'flex', flexDirection: 'column', gap: '22px', maxWidth: '900px' }}>

      <div>
        <h1 style={{ fontFamily: D, fontSize: '26px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.03em', marginBottom: '4px' }}>Configuración</h1>
        <p style={{ fontSize: '14px', color: 'var(--muted)' }}>Gestiona tu cuenta y preferencias</p>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--border)', paddingBottom: '0' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '10px 16px', fontSize: '13px', fontWeight: tab === t.id ? 600 : 400,
            color: tab === t.id ? A : 'var(--muted)',
            borderBottom: `2px solid ${tab === t.id ? A : 'transparent'}`,
            marginBottom: '-1px', fontFamily: F, transition: 'color .15s',
          }}>
            <t.icon size={15} strokeWidth={tab === t.id ? 2.2 : 1.8} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Perfil */}
      {tab === 'perfil' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Card title="Información personal">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <Field label="Nombre completo" value={user?.nombre || MOCK_USER.name} />
                <Field label="Email" type="email" value={user?.email || MOCK_USER.email} />
              </div>
              <Field label="Empresa" value={MOCK_USER.company} placeholder="Nombre de tu empresa" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <Field label="Zona horaria" value="Europe/Madrid" />
                <Field label="Sitio web" placeholder="https://tuempresa.com" />
              </div>
            </div>
          </Card>
          <Card title="Avatar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: AG(0.2), border: `2px solid ${AG(0.4)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: D, fontWeight: 700, fontSize: '24px', color: A, flexShrink: 0 }}>
                {(user?.nombre || MOCK_USER.name).slice(0, 2).toUpperCase()}
              </div>
              <div>
                <button style={{ background: AG(0.1), border: `1px solid ${AG(0.25)}`, borderRadius: '9px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, color: A, cursor: 'pointer', fontFamily: F, marginRight: '8px' }}>Subir imagen</button>
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '6px' }}>PNG o JPG, máx. 2MB</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Notificaciones */}
      {tab === 'notificaciones' && (
        <Card title="Preferencias de notificación">
          <Toggle label="Anuncio aprobado" desc="Recibe una notificación cuando el canal aprueba tu anuncio" defaultOn />
          <Toggle label="Anuncio publicado" desc="Notificación cuando tu anuncio es publicado en el canal" defaultOn />
          <Toggle label="Milestone de impresiones" desc="Alerta cuando tu campaña supera 10K, 50K, 100K impresiones" defaultOn />
          <Toggle label="Campaña finalizada" desc="Notificación cuando termina el período de un anuncio" defaultOn />
          <Toggle label="Saldo bajo" desc="Alerta cuando tu saldo disponible baja de €50" defaultOn />
          <Toggle label="Newsletter de Adflow" desc="Recibe novedades, consejos y actualizaciones de la plataforma" defaultOn={false} />
        </Card>
      )}

      {/* Seguridad */}
      {tab === 'seguridad' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Card title="Cambiar contraseña">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <Field label="Contraseña actual" type="password" placeholder="••••••••" />
              <Field label="Nueva contraseña" type="password" placeholder="Mínimo 8 caracteres" />
              <Field label="Confirmar nueva contraseña" type="password" placeholder="Repite la contraseña" />
            </div>
          </Card>
          <Card title="Autenticación de dos factores (2FA)">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>2FA por aplicación autenticadora</div>
                <div style={{ fontSize: '13px', color: 'var(--muted)' }}>Aumenta la seguridad de tu cuenta con Google Authenticator o similar</div>
              </div>
              <button style={{ background: AG(0.1), border: `1px solid ${AG(0.25)}`, borderRadius: '10px', padding: '10px 20px', fontSize: '13px', fontWeight: 600, color: A, cursor: 'pointer', fontFamily: F, whiteSpace: 'nowrap' }}>Activar 2FA</button>
            </div>
          </Card>
        </div>
      )}

      {/* Facturación */}
      {tab === 'facturacion' && (
        <Card title="Datos de facturación">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <Field label="Nombre / Razón social" value={MOCK_USER.company} />
              <Field label="NIF / CIF" placeholder="B12345678" />
            </div>
            <Field label="Dirección" placeholder="Calle, número, piso" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
              <Field label="Código postal" placeholder="28001" />
              <Field label="Ciudad" placeholder="Madrid" />
              <Field label="País" value="España" />
            </div>
            <Field label="Email de facturación" type="email" value={user?.email || MOCK_USER.email} hint="Recibirás las facturas en este email" />
          </div>
        </Card>
      )}

      {/* API */}
      {tab === 'api' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Card title="Clave API">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>Tu clave API</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input readOnly value="adf_live_••••••••••••••••••••••••••••••" style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: 'var(--muted)', fontFamily: 'monospace', outline: 'none' }} />
                  <button style={{ background: AG(0.1), border: `1px solid ${AG(0.25)}`, borderRadius: '10px', padding: '10px 16px', fontSize: '13px', fontWeight: 600, color: A, cursor: 'pointer', fontFamily: F, whiteSpace: 'nowrap' }}>Mostrar</button>
                  <button style={{ background: A, border: 'none', borderRadius: '10px', padding: '10px 16px', fontSize: '13px', fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: F, whiteSpace: 'nowrap' }}>Regenerar</button>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--muted2)', marginTop: '6px' }}>⚠️ Nunca compartas tu clave API. Trátala como una contraseña.</div>
              </div>
            </div>
          </Card>
          <Card title="Documentación">
            <div style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.6 }}>
              Integra Adflow en tus aplicaciones usando nuestra API REST. Gestiona campañas, consulta métricas y automatiza flujos de trabajo.
              <br /><br />
              <button style={{ background: AG(0.1), border: `1px solid ${AG(0.25)}`, borderRadius: '9px', padding: '9px 18px', fontSize: '13px', fontWeight: 600, color: A, cursor: 'pointer', fontFamily: F }}>Ver documentación API →</button>
            </div>
          </Card>
        </div>
      )}

      {/* Save button */}
      {['perfil', 'notificaciones', 'seguridad', 'facturacion'].includes(tab) && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={save} style={{
            background: saved ? '#10b981' : A, color: '#fff', border: 'none', borderRadius: '12px',
            padding: '12px 28px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: F,
            transition: 'background .2s', boxShadow: `0 4px 14px ${saved ? 'rgba(16,185,129,0.3)' : AG(0.3)}`,
          }}>
            {saved ? '✓ Guardado' : 'Guardar cambios'}
          </button>
        </div>
      )}
    </div>
  )
}
