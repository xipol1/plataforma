import React, { useState } from 'react'
import { Link } from 'react-router-dom'

/* ─── DATA ──────────────────────────────────────────────── */

const TRUST_PLATFORMS = ['✈️ Telegram', '🎮 Discord', '💬 WhatsApp', '▶️ YouTube', '📸 Instagram', '🎵 TikTok', '📡 Twitch', '🔔 Patreon']

const CATEGORIES = [
  { icon: '📈', name: 'Marketing Digital', count: '2.340 canales' },
  { icon: '🛒', name: 'Ecommerce', count: '3.180 canales' },
  { icon: '💪', name: 'Fitness & Salud', count: '1.205 canales' },
  { icon: '🎮', name: 'Gaming', count: '1.890 canales' },
  { icon: '🤖', name: 'Inteligencia Artificial', count: '870 canales' },
  { icon: '🎨', name: 'Arte & Diseño', count: '640 canales' },
  { icon: '📚', name: 'Educación', count: '520 canales' },
  { icon: '🌍', name: 'Lifestyle', count: '430 canales' },
]

const LISTINGS = [
  { thumb: '📱', thumbBg: 'linear-gradient(135deg,#0e3f5c,#1a6fa8)', platCls: 'tg', platLabel: '✈️ Telegram', badge: '⭐ TOP', seller: 'techpro', sellerBg: '#2aabee', sellerInitials: 'TP', isPro: true, title: 'Audiencia tech hispanohablante con alta tasa de engagement y conversión', rating: '4.9', reviews: 312, members: '8.200 seguidores', price: '€450', unit: '/post' },
  { thumb: '🎮', thumbBg: 'linear-gradient(135deg,#1e2359,#3b42a3)', platCls: 'dc', platLabel: '🎮 Discord', badge: '🔥 Hot', seller: 'gamermk', sellerBg: '#5865f2', sellerInitials: 'GM', isPro: false, title: 'Servidor gaming con comunidad activa, torneos semanales y alto engagement', rating: '4.8', reviews: 189, members: '4.500 seguidores', price: '€280', unit: '/post' },
  { thumb: '🛒', thumbBg: 'linear-gradient(135deg,#063d25,#1a7a47)', platCls: 'wa', platLabel: '💬 WhatsApp', badge: null, seller: 'ecomhub', sellerBg: '#25d366', sellerInitials: 'EH', isPro: true, title: 'Comunidad de compradores activos en ecommerce con alto poder adquisitivo', rating: '5.0', reviews: 97, members: '1.200 seguidores', price: '€320', unit: '/post' },
  { thumb: '▶️', thumbBg: 'linear-gradient(135deg,#3d0000,#a31a1a)', platCls: 'yt', platLabel: '▶️ YouTube', badge: '🆕 Nuevo', seller: 'edtech_es', sellerBg: '#ff0000', sellerInitials: 'ET', isPro: false, title: 'Canal educativo con audiencia premium y alta receptividad a productos digitales', rating: '4.7', reviews: 54, members: '780 seguidores', price: '€190', unit: '/post' },
  { thumb: '🤖', thumbBg: 'linear-gradient(135deg,#2d1b4e,#6b2fa0)', platCls: 'cr', platLabel: '🎮 Discord', badge: '⭐ TOP', seller: 'ai_labs_co', sellerBg: '#a855f7', sellerInitials: 'AI', isPro: true, title: 'Comunidad IA: prompts, herramientas, automatizaciones y novedades del sector', rating: '4.9', reviews: 421, members: '11.000 seguidores', price: '€220', unit: '/post' },
  { thumb: '💡', thumbBg: 'linear-gradient(135deg,#3d1a0a,#a34a1a)', platCls: 'in', platLabel: '✈️ Telegram', badge: null, seller: 'lifestyle_co', sellerBg: '#f97316', sellerInitials: 'LS', isPro: false, title: 'Audiencia lifestyle con interés en moda, viajes y tendencias de consumo', rating: '4.8', reviews: 138, members: '3.400 seguidores', price: '€150', unit: '/post' },
]

const STEPS = [
  { n: '01', title: 'Encuentra tu audiencia', desc: 'Explora más de 12.000 canales verificados por categoría, plataforma o precio. Usa filtros para dar con tu comunidad perfecta.' },
  { n: '02', title: 'Pago protegido', desc: 'Paga con tarjeta o transferencia. Todos los pagos están custodiados. Si el canal no publica, te devolvemos el dinero.' },
  { n: '03', title: 'Campaña publicada', desc: 'El canal publica tu anuncio en el tiempo acordado. Recibes confirmación y métricas de rendimiento en tu panel.' },
  { n: '04', title: 'Métricas reales', desc: 'Controla clicks, alcance y conversiones desde tu dashboard. Repite con los canales que mejor rendimiento ofrecen.' },
]

const listings = [
  { name: 'Tech Audience ES', platform: 'Telegram', members: '120k audiencia', rating: '4.9', price: '€450 / post' },
  { name: 'Ecommerce Growth Hub', platform: 'Discord', members: '150k audiencia', rating: '4.8', price: '€650 / post' },
  { name: 'Gaming Community Pro', platform: 'WhatsApp', members: '80k audiencia', rating: '5.0', price: '€390 / post' }
]

const categories = ['Tech', 'Gaming', 'IA', 'Ecommerce', 'Educación', 'Creators']

/* ─── COMPONENT ─────────────────────────────────────────── */
export default function LandingPage() {
  const [hoveredCat, setHoveredCat] = useState(null)
  const [hoveredCard, setHoveredCard] = useState(null)
  const [hoveredSeller, setHoveredSeller] = useState(null)

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text)', fontFamily: "'Inter', sans-serif" }}>

      {/* ── ANNOUNCEMENT ── */}
      <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg2)', padding: '10px 48px', textAlign: 'center', fontSize: '14px', color: 'var(--muted)' }}>
        Nuevo: <strong style={{ color: 'var(--text)' }}>Adflow Premium</strong> para anunciantes con alto volumen
      </div>

      <section className="relative mx-auto grid w-full max-w-[1240px] gap-12 px-4 pb-16 pt-[120px] md:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pb-24">
        <div>
          <span className="inline-flex items-center rounded-full border border-emerald-300/40 bg-emerald-400/10 px-3 py-1 text-xs font-semibold tracking-wide text-emerald-200">
            Marketplace Adflow
          </span>
          <h1 className="mt-6 max-w-2xl font-['Sora'] text-[40px] font-bold leading-[1.1] tracking-tight md:text-[48px]">
            Compra espacios publicitarios en comunidades reales
          </h1>
          <p className={isDark ? 'mt-5 max-w-2xl text-base leading-7 text-indigo-100/80 md:text-lg' : 'mt-5 max-w-2xl text-base leading-7 text-slate-600 md:text-lg'}>
            Accede a audiencias activas en canales privados y ejecuta campañas con pago protegido y métricas verificables.
          </p>

          <div className="mt-6">
            <p className={isDark ? "font-['Sora'] text-sm font-semibold text-white" : "font-['Sora'] text-sm font-semibold text-slate-900"}>
              Encuentra tus audiencias
            </p>
            <p className={isDark ? 'mt-1 text-sm text-indigo-100/70' : 'mt-1 text-sm text-slate-600'}>
              Segmentadas por intereses, comportamiento y contexto
            </p>
          </div>

          <form className="mt-8 w-full max-w-[720px]" onSubmit={(event) => event.preventDefault()}>
            <div className={isDark ? 'flex h-[60px] items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-4 shadow-[0_10px_30px_rgba(0,0,0,0.15)]' : 'flex h-[60px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 shadow-[0_10px_30px_rgba(0,0,0,0.15)]'}>
              <input
                type="text"
                placeholder="Buscar audiencias, canales o temáticas..."
                className={isDark ? 'h-full flex-1 bg-transparent text-sm text-white placeholder:text-indigo-100/50 outline-none' : 'h-full flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none'}
              />
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-sm transition-transform hover:-translate-y-0.5"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" stroke="currentColor" strokeWidth="2" />
                  <path d="M16 16l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {['Telegram', 'Discord', 'Ecommerce', 'Educación', 'Gaming'].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  className={isDark ? 'rounded-full bg-white/10 px-3 py-1.5 text-xs text-indigo-100/90 transition hover:bg-white/15' : 'rounded-full bg-slate-200 px-3 py-1.5 text-xs text-slate-700 transition hover:bg-slate-300'}
                >
                  {chip}
                </button>
              ))}
            </div>
          </form>

          <div className="mt-6 flex flex-wrap gap-3">
            <a href="#featured" className="rounded-lg bg-emerald-500 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-600">
              Explorar canales
            </a>
            <Link to="/auth/register" className={isDark ? 'rounded-lg border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10' : 'rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100'}>
              Empezar campaña
            </Link>
          </div>

          {/* ── RIGHT PANEL ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flexShrink: 0, opacity: 0.9 }}>
            {[
              ['12.4K', 'Canales verificados'],
              ['98.7%', 'Satisfacción'],
              ['€84M', 'Volumen anual']
            ].map(([value, label]) => (
              <div key={label} className={isDark ? 'rounded-xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur' : 'rounded-xl border border-slate-200 bg-white p-4 shadow-sm'}>
                <p className="font-['Sora'] text-2xl font-bold">{value}</p>
                <p className={isDark ? 'mt-1 text-xs text-indigo-100/70' : 'mt-1 text-xs text-slate-500'}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

        <div className={isDark ? 'rounded-3xl border border-white/10 bg-white/[0.06] p-4 shadow-xl backdrop-blur-xl opacity-90 lg:origin-top-right lg:scale-[0.9]' : 'rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-xl backdrop-blur opacity-90 lg:origin-top-right lg:scale-[0.9]'}>
          <div className={isDark ? 'mb-4 flex items-center justify-between border-b border-white/10 pb-4' : 'mb-4 flex items-center justify-between border-b border-slate-200 pb-4'}>
            <p className="font-['Sora'] text-lg font-bold">Canales destacados hoy</p>
            <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs text-emerald-200">Actualizado en vivo</span>
          </div>
          <div className="space-y-3">
            {listings.map((channel) => (
              <article key={channel.name} className={isDark ? 'rounded-xl border border-white/10 bg-[#101626] p-4 transition hover:border-emerald-400/60' : 'rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-emerald-400'}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className={isDark ? 'font-semibold text-white' : 'font-semibold text-slate-900'}>{channel.name}</h3>
                    <p className={isDark ? 'text-xs text-indigo-100/70' : 'text-xs text-slate-500'}>{channel.platform} · {channel.members}</p>
                  </div>
                  {l.badge && (
                    <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 1, background: 'rgba(251,191,36,.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,.3)', borderRadius: '6px', padding: '2px 8px', fontSize: '10px', fontWeight: 700, letterSpacing: '.3px' }}>
                      {l.badge}
                    </div>
                  )}
                </div>
                <div className={isDark ? 'mt-3 flex items-center justify-between border-t border-white/10 pt-3' : 'mt-3 flex items-center justify-between border-t border-slate-200 pt-3'}>
                  <p className="font-['Sora'] text-xl font-bold">{channel.price}</p>
                  <Link to="/auth/login" className="rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600">Ver canal</Link>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1240px] px-4 pb-8 md:px-10">
        <div className="grid gap-4 md:grid-cols-3">
          {products.map((item) => (
            <article key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur">
              <div className="mb-3 inline-grid h-11 w-11 place-items-center rounded-lg bg-white/10 text-2xl">{item.icon}</div>
              <h3 className="font-['Sora'] text-xl font-bold">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-indigo-100/75">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="categories" className="mx-auto w-full max-w-[1240px] px-4 py-12 md:px-10 md:py-16">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-['Sora'] text-3xl font-bold">Categorías premium</h2>
          <a href="#featured" className="text-sm text-emerald-300 hover:text-emerald-200">Ver todas →</a>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {categories.map((category) => (
            <article key={category} className="rounded-xl border border-white/10 bg-[#111827]/70 p-4 text-center transition hover:-translate-y-1 hover:border-emerald-400/70">
              <h3 className="font-['Sora'] text-lg font-bold">{category}</h3>
              <p className="mt-1 text-xs text-indigo-100/70">Canales verificados</p>
            </article>
          ))}
        </div>
      </section>

      <section id="featured" className="mx-auto w-full max-w-[1240px] px-4 pb-16 md:px-10 md:pb-24">
        <div className="rounded-3xl border border-indigo-300/20 bg-gradient-to-r from-[#1a1f3f] via-[#14243d] to-[#143829] p-8 md:p-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200/80">Adflow Premium</p>
          <h2 className="mt-3 font-['Sora'] text-3xl font-bold md:text-4xl">Tu operación de campañas como una fintech de marketing</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-indigo-100/80 md:text-base">
            Workflows aprobatorios, gestión multi-equipo, presupuesto por unidad de negocio y soporte prioritario con
            SLA dedicado para agencias y marcas enterprise.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/auth/register" className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-[#111827] hover:bg-gray-100">
              Solicitar demo enterprise
            </Link>
            <Link to="/auth/login" className="rounded-lg border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10">
              Entrar al panel
            </Link>
          </div>
          {[
            { title: 'Plataformas', links: ['Telegram', 'Discord', 'WhatsApp', 'YouTube', 'TikTok'] },
            { title: 'Categorías', links: ['Ecommerce', 'Gaming', 'Fitness', 'Educación', 'IA & Tech'] },
            { title: 'Empresa', links: ['Sobre nosotros', 'Blog', 'Afiliados', 'Soporte', 'Privacidad'] },
          ].map(col => (
            <div key={col.title}>
              <h4 style={{ fontFamily: "'Syne', sans-serif", fontSize: '13px', fontWeight: 700, letterSpacing: '.5px', textTransform: 'uppercase', color: 'var(--muted2)', marginBottom: '16px' }}>{col.title}</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {col.links.map(l => (
                  <li key={l}><a href="#" style={{ fontSize: '14px', color: 'var(--muted)', textDecoration: 'none', transition: 'color .2s' }}>{l}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', color: 'var(--muted2)', flexWrap: 'wrap', gap: '12px' }}>
          <span>© 2025 Adflow. Todos los derechos reservados.</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[['✈️ Telegram', 'rgba(42,171,238,.12)', 'var(--tg)'], ['🎮 Discord', 'rgba(88,101,242,.12)', 'var(--dc)'], ['💬 WhatsApp', 'rgba(37,211,102,.12)', 'var(--wa)']].map(([label, bg, color]) => (
              <span key={label} style={{ borderRadius: '20px', padding: '3px 10px', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', background: bg, color }}>{label}</span>
            ))}
          </div>
        </div>
      </footer>

    </div>
  )
}
