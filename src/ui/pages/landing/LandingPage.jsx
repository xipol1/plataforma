import React, { useState } from 'react'
import { Link } from 'react-router-dom'

/* ─── DATA ──────────────────────────────────────────────── */
const HERO_CARDS = [
  { icon: '📱', bg: 'rgba(42,171,238,0.15)', color: 'var(--tg)', platform: 'Telegram', name: 'Tech Audience ES', members: '8.2K miembros', price: '€450/post', cls: 'animate-float' },
  { icon: '🎮', bg: 'rgba(88,101,242,0.15)', color: 'var(--dc)', platform: 'Discord', name: 'Gaming Community Pro', members: '4.5K miembros', price: '€280/post', cls: 'animate-float-2', marginLeft: '24px' },
  { icon: '🛒', bg: 'rgba(37,211,102,0.15)', color: 'var(--wa)', platform: 'WhatsApp', name: 'Ecommerce Growth Hub', members: '1.2K miembros', price: '€320/post', cls: 'animate-float-3' },
]

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

const SELLERS = [
  { initials: 'TP', grad: 'linear-gradient(135deg,#2aabee,#0e6fa8)', name: 'techpro', niche: 'Marketing · Telegram', stars: '★★★★★', rating: '4.9', reviews: 312, badge: '⭐ Top Canal' },
  { initials: 'EH', grad: 'linear-gradient(135deg,#25d366,#15803d)', name: 'ecomhub', niche: 'Ecommerce · WhatsApp', stars: '★★★★★', rating: '4.9', reviews: 421, badge: '⭐ Top Canal' },
  { initials: 'FT', grad: 'linear-gradient(135deg,#25d366,#15803d)', name: 'fitcoach_lu', niche: 'Fitness · WhatsApp', stars: '★★★★★', rating: '5.0', reviews: 97, badge: '✅ Verificado' },
  { initials: 'GM', grad: 'linear-gradient(135deg,#5865f2,#3730a3)', name: 'gamermk', niche: 'Gaming · Discord', stars: '★★★★☆', rating: '4.8', reviews: 189, badge: '🔥 Trending' },
  { initials: 'AI', grad: 'linear-gradient(135deg,#f97316,#b45309)', name: 'ai_labs_co', niche: 'IA · Discord', stars: '★★★★☆', rating: '4.8', reviews: 138, badge: '🆕 Emergente' },
]

const PLAT_COLORS = {
  tg: { bg: 'rgba(42,171,238,0.2)', color: 'var(--tg)', border: 'rgba(42,171,238,.3)' },
  dc: { bg: 'rgba(88,101,242,0.2)', color: 'var(--dc)', border: 'rgba(88,101,242,.3)' },
  wa: { bg: 'rgba(37,211,102,0.2)', color: 'var(--wa)', border: 'rgba(37,211,102,.3)' },
  yt: { bg: 'rgba(255,0,0,0.2)', color: 'var(--yt)', border: 'rgba(255,0,0,.3)' },
  cr: { bg: 'rgba(149,0,255,0.2)', color: '#a855f7', border: 'rgba(149,0,255,.3)' },
  in: { bg: 'rgba(255,100,0,0.2)', color: '#f97316', border: 'rgba(255,100,0,.3)' },
}

/* ─── COMPONENT ─────────────────────────────────────────── */
export default function LandingPage() {
  const [hoveredCat, setHoveredCat] = useState(null)
  const [hoveredCard, setHoveredCard] = useState(null)
  const [hoveredSeller, setHoveredSeller] = useState(null)

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text)', fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── ANNOUNCEMENT ── */}
      <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg2)', padding: '10px 48px', textAlign: 'center', fontSize: '14px', color: 'var(--muted)' }}>
        Nuevo: <strong style={{ color: 'var(--text)' }}>Adflow Premium</strong> para anunciantes con alto volumen
      </div>

      {/* ── HERO ── */}
      <section style={{ position: 'relative', minHeight: '560px', display: 'flex', alignItems: 'center', padding: '80px 48px', overflow: 'hidden' }}>
        {/* bg gradients */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          background: 'radial-gradient(ellipse 60% 50% at 70% 50%, rgba(29,191,115,0.12) 0%, transparent 60%), radial-gradient(ellipse 40% 60% at 10% 80%, rgba(88,101,242,0.08) 0%, transparent 50%), linear-gradient(135deg,#0d0d0d 0%,#111 100%)',
        }} />
        {/* grid */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px), linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)',
          backgroundSize: '48px 48px',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 70% 50%,black 0%,transparent 70%)',
          maskImage: 'radial-gradient(ellipse 80% 80% at 70% 50%,black 0%,transparent 70%)',
        }} />

        {/* left content */}
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '580px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(29,191,115,0.1)', border: '1px solid rgba(29,191,115,0.25)', borderRadius: '100px', padding: '5px 14px', fontSize: '13px', color: 'var(--green)', marginBottom: '24px', fontWeight: 500 }}>
            <span className="animate-pulse-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
            +12.400 canales verificados
          </div>

          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(38px,5vw,58px)', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-1.5px', marginBottom: '20px' }}>
            Compra espacios en las mejores <em style={{ fontStyle: 'normal', color: 'var(--green)' }}>comunidades</em> privadas
          </h1>

          <p style={{ fontSize: '17px', color: 'var(--muted)', lineHeight: 1.7, maxWidth: '460px', marginBottom: '36px', fontWeight: 300 }}>
            Accede a audiencias activas en canales verificados de Telegram, Discord y más. Pago protegido y métricas reales en cada campaña.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <a
              href="#categories"
              style={{ background: 'var(--green)', color: '#fff', padding: '14px 28px', borderRadius: '8px', fontWeight: 600, fontSize: '15px', transition: 'background .2s, transform .15s', display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--green-dark)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--green)'; e.currentTarget.style.transform = 'none' }}
            >
              🔍 Explorar canales
            </a>
            <Link
              to="/auth/register"
              style={{ color: 'var(--muted)', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none', transition: 'color .2s' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
            >
              Empezar campaña →
            </Link>
          </div>

          <div style={{ display: 'flex', gap: '40px', marginTop: '48px', paddingTop: '40px', borderTop: '1px solid var(--border)' }}>
            {[['12.4K', 'Canales verificados'], ['98.7%', 'Satisfacción'], ['340K+', 'Anunciantes']].map(([v, l]) => (
              <div key={l}>
                <strong style={{ fontFamily: "'Syne', sans-serif", fontSize: '26px', fontWeight: 800, display: 'block', color: 'var(--text)' }}>{v}</strong>
                <span style={{ fontSize: '13px', color: 'var(--muted)' }}>{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* right floating cards */}
        <div style={{ position: 'absolute', right: '48px', top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: '16px', zIndex: 1 }}>
          {HERO_CARDS.map((card, i) => (
            <div
              key={card.name}
              className={card.cls}
              style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: '12px', padding: '16px 20px', width: '240px',
                display: 'flex', alignItems: 'center', gap: '14px',
                backdropFilter: 'blur(8px)',
                ...(card.marginLeft ? { marginLeft: card.marginLeft } : {}),
              }}
            >
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0, background: card.bg, color: card.color }}>
                {card.icon}
              </div>
              <div style={{ flex: 1 }}>
                <strong style={{ display: 'block', fontSize: '13px', fontWeight: 500 }}>{card.name}</strong>
                <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{card.platform} · {card.members}</span>
              </div>
              <span style={{ color: 'var(--green)', fontWeight: 600, fontSize: '13px', flexShrink: 0 }}>{card.price}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <div style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '18px 48px', display: 'flex', alignItems: 'center', gap: '48px', overflowX: 'auto', background: 'var(--bg2)' }}>
        <span style={{ fontSize: '12px', color: 'var(--muted2)', whiteSpace: 'nowrap', fontWeight: 500, letterSpacing: '.5px', textTransform: 'uppercase' }}>Plataformas</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px', flex: 1 }}>
          {TRUST_PLATFORMS.map(p => (
            <span key={p} style={{ fontFamily: "'Syne', sans-serif", fontSize: '15px', fontWeight: 700, color: 'var(--muted2)', whiteSpace: 'nowrap' }}>{p}</span>
          ))}
        </div>
      </div>

      {/* ── CATEGORIES ── */}
      <section id="categories" style={{ padding: '72px 48px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '32px' }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '28px', fontWeight: 800, letterSpacing: '-.5px' }}>Explorar por categoría</h2>
          <a href="#listings" style={{ fontSize: '14px', color: 'var(--green)' }}>Ver todas →</a>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
          {CATEGORIES.map((cat, i) => (
            <div
              key={cat.name}
              onMouseEnter={() => setHoveredCat(i)}
              onMouseLeave={() => setHoveredCat(null)}
              style={{
                background: hoveredCat === i ? 'var(--surface2)' : 'var(--surface)',
                border: `1px solid ${hoveredCat === i ? 'var(--green)' : 'var(--border)'}`,
                borderRadius: '12px', padding: '20px 18px', cursor: 'pointer',
                transition: 'border-color .2s, transform .2s, background .2s',
                display: 'flex', flexDirection: 'column', gap: '10px',
                transform: hoveredCat === i ? 'translateY(-3px)' : 'none',
              }}
            >
              <div style={{ fontSize: '28px' }}>{cat.icon}</div>
              <strong style={{ fontSize: '14px', fontWeight: 600, fontFamily: "'Syne', sans-serif" }}>{cat.name}</strong>
              <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{cat.count}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURED LISTINGS ── */}
      <section id="listings" style={{ padding: '72px 48px', background: 'var(--bg2)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '32px' }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '28px', fontWeight: 800, letterSpacing: '-.5px' }}>Canales destacados</h2>
          <a href="#" style={{ fontSize: '14px', color: 'var(--green)' }}>Ver todos →</a>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {LISTINGS.map((l, i) => {
            const pc = PLAT_COLORS[l.platCls]
            return (
              <div
                key={l.seller + i}
                onMouseEnter={() => setHoveredCard(i)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  background: 'var(--surface)', border: `1px solid ${hoveredCard === i ? 'var(--green)' : 'var(--border)'}`,
                  borderRadius: '14px', overflow: 'hidden', cursor: 'pointer',
                  transition: 'border-color .2s, transform .2s, box-shadow .2s',
                  transform: hoveredCard === i ? 'translateY(-4px)' : 'none',
                  boxShadow: hoveredCard === i ? '0 16px 40px rgba(0,0,0,.4)' : 'none',
                }}
              >
                {/* thumbnail */}
                <div style={{ height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', position: 'relative', overflow: 'hidden', background: l.thumbBg }}>
                  <span style={{ position: 'relative', zIndex: 1 }}>{l.thumb}</span>
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.15)' }} />
                  <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 1, borderRadius: '6px', padding: '3px 8px', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', background: pc.bg, color: pc.color, border: `1px solid ${pc.border}` }}>
                    {l.platLabel}
                  </div>
                  {l.badge && (
                    <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 1, background: 'rgba(251,191,36,.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,.3)', borderRadius: '6px', padding: '2px 8px', fontSize: '10px', fontWeight: 700, letterSpacing: '.3px' }}>
                      {l.badge}
                    </div>
                  )}
                </div>

                {/* body */}
                <div style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: l.sellerBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                      {l.sellerInitials}
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 500 }}>
                      {l.seller}
                      {l.isPro && <span style={{ fontSize: '10px', background: 'rgba(29,191,115,.15)', color: 'var(--green)', borderRadius: '4px', padding: '1px 6px', fontWeight: 600, marginLeft: '4px' }}>PRO</span>}
                    </span>
                  </div>

                  <div style={{ fontSize: '14px', lineHeight: 1.5, marginBottom: '10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {l.title}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: 'var(--muted)', marginBottom: '12px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#fbbf24' }}>
                      ★ {l.rating} <span style={{ color: 'var(--muted)' }}>({l.reviews})</span>
                    </span>
                    <span>{l.members}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                    <div>
                      <span style={{ fontFamily: "'Syne', sans-serif", fontSize: '16px', fontWeight: 700 }}>{l.price}</span>
                      <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--muted)' }}>{l.unit}</span>
                    </div>
                    <Link
                      to="/auth/login"
                      style={{ background: 'var(--green)', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'background .2s', textDecoration: 'none' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--green-dark)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'var(--green)'}
                    >
                      Ver canal
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: '72px 48px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '32px' }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '28px', fontWeight: 800, letterSpacing: '-.5px' }}>¿Cómo funciona?</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '32px' }}>
          {STEPS.map(s => (
            <div key={s.n} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Syne', sans-serif", fontSize: '20px', fontWeight: 800, color: 'var(--green)' }}>
                {s.n}
              </div>
              <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '17px', fontWeight: 700 }}>{s.title}</h3>
              <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.65 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PROMO BANNER ── */}
      <div style={{ margin: '0 48px 72px', borderRadius: '20px', background: 'linear-gradient(135deg,#0a2e1a 0%,#0d1f2d 50%,#0e0e2e 100%)', border: '1px solid rgba(29,191,115,.2)', padding: '64px', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '32px', flexWrap: 'wrap' }}>
        <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(29,191,115,.15) 0%,transparent 70%)', pointerEvents: 'none' }} />
        <div>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '32px', fontWeight: 800, letterSpacing: '-.5px', marginBottom: '12px' }}>
            ¿Tienes un canal privado?<br />Empieza a monetizarlo hoy
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--muted)', maxWidth: '420px', lineHeight: 1.7 }}>
            Únete a más de 4.200 creadores que ya generan ingresos recurrentes vendiendo espacios publicitarios en sus comunidades en Adflow.
          </p>
        </div>
        <Link
          to="/auth/register"
          style={{ background: 'var(--green)', color: '#fff', padding: '14px 32px', borderRadius: '8px', fontWeight: 600, fontSize: '15px', whiteSpace: 'nowrap', flexShrink: 0, transition: 'background .2s, transform .15s', display: 'inline-block', textDecoration: 'none' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--green-dark)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--green)'; e.currentTarget.style.transform = 'none' }}
        >
          Vender espacios →
        </Link>
      </div>

      {/* ── TOP SELLERS ── */}
      <section style={{ padding: '72px 48px', background: 'var(--bg2)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '32px' }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '28px', fontWeight: 800, letterSpacing: '-.5px' }}>Canales mejor valorados</h2>
          <a href="#" style={{ fontSize: '14px', color: 'var(--green)' }}>Ver todos →</a>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
          {SELLERS.map((s, i) => (
            <div
              key={s.name}
              onMouseEnter={() => setHoveredSeller(i)}
              onMouseLeave={() => setHoveredSeller(null)}
              style={{
                background: 'var(--surface)', border: `1px solid ${hoveredSeller === i ? 'var(--green)' : 'var(--border)'}`,
                borderRadius: '14px', padding: '24px 20px', textAlign: 'center', cursor: 'pointer',
                transition: 'border-color .2s, transform .2s',
                transform: hoveredSeller === i ? 'translateY(-3px)' : 'none',
              }}
            >
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 800, color: '#fff', fontFamily: "'Syne', sans-serif", background: s.grad }}>
                {s.initials}
              </div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>{s.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '10px' }}>{s.niche}</div>
              <div style={{ color: '#fbbf24', fontSize: '13px', marginBottom: '6px' }}>{s.stars} {s.rating}</div>
              <div style={{ fontSize: '12px', color: 'var(--muted2)' }}>{s.reviews} reseñas</div>
              <span style={{ marginTop: '12px', display: 'inline-block', background: 'rgba(29,191,115,.1)', border: '1px solid rgba(29,191,115,.2)', color: 'var(--green)', borderRadius: '20px', padding: '3px 12px', fontSize: '11px', fontWeight: 600 }}>
                {s.badge}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: 'var(--bg2)', borderTop: '1px solid var(--border)', padding: '56px 48px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '48px', marginBottom: '48px' }}>
          <div>
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '24px', display: 'block', marginBottom: '12px' }}>
              Ad<span style={{ color: 'var(--green)' }}>flow</span>
            </span>
            <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 1.7, maxWidth: '260px' }}>
              El marketplace líder de publicidad en canales privados. Conecta anunciantes con las mejores comunidades.
            </p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              {['✈️', '🐦', '📸', '▶️'].map(s => (
                <a key={s} href="#" style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>{s}</a>
              ))}
            </div>
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
