import AppPreview from "./components/AppPreview";
import TrustRow from "./components/TrustRow";
import EscrowFlowSection from "./components/EscrowFlowSection";
import MetricsSection from "./components/MetricsSection";

export default async function HomePage() {
  return (
    <main>
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-split">
            <div className="hero-top">
              <h1 className="hero-title">La forma simple de anunciarte en comunidades.</h1>
              <p className="hero-subtitle">Descubre canales reales. Publica con garantía. Mide el impacto.</p>
              <div className="hero-ctas">
                <a href="/channels" className="btn btn-primary cta-gradient">Explorar canales</a>
                <a href="#como-funciona" className="btn">Cómo funciona</a>
              </div>
            </div>
            <div className="hero-preview">
              <AppPreview />
            </div>
          </div>
        </div>
      </section>

      <TrustRow />

      <EscrowFlowSection />

      <MetricsSection />

      <section className="container landing-section">
        <div className="grid-12">
          <div className="ad-left">
            <h2 className="ad-title">Para anunciantes</h2>
            <p className="ad-subtitle">Accede a comunidades reales y activa campañas con seguridad.</p>
            <ul className="tick-list">
              <li>Compra con garantía</li>
              <li>Métricas verificadas</li>
            </ul>
          </div>
          <div className="ad-right">
            <div className="ad-cards">
              <div className="ad-card large">
                <h3 className="feature-title">Encuentra comunidades relevantes</h3>
                <p className="feature-desc">Descubre canales por categoría, tamaño y precio.</p>
              </div>
              <div className="ad-card">
                <h3 className="feature-title">Compra segura</h3>
                <p className="feature-desc">El pago se libera solo tras confirmación.</p>
              </div>
              <div className="ad-card">
                <h3 className="feature-title">Mide el impacto</h3>
                <p className="feature-desc">Clicks verificados y métricas claras.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container landing-section">
        <div className="stack-md">
          <div>
            <h2 className="title">Para canales</h2>
            <p className="subtitle">Monetiza tu comunidad con transparencia.</p>
          </div>
          <div className="creator-grid">
            <div className="creator-left">
              <div className="feature-card">
                <h3 className="feature-title">Registra tu canal</h3>
                <p className="feature-desc">Verificación simple y categorías claras.</p>
              </div>
              <div className="feature-card">
                <h3 className="feature-title">Acepta propuestas</h3>
                <p className="feature-desc">Precio y timing definidos para cada campaña.</p>
              </div>
              <div className="feature-card">
                <h3 className="feature-title">Publica y cobra</h3>
                <p className="feature-desc">Pagos protegidos y estado verificable.</p>
              </div>
            </div>
            <div className="creator-right">
              <div className="creator-panel">
                <h4 className="feature-title">Pagos protegidos</h4>
                <p className="feature-desc">La plataforma retiene el pago y lo libera tras confirmar la publicación.</p>
                <div className="row mt-sm" style={{ gap: "0.5rem" }}>
                  <a className="btn btn-primary cta-gradient" href="/login?next=/app/creator/channels">Registrar mi canal</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="container timeline-section">
        <div className="stack-md" style={{ maxWidth: "1152px", margin: "0 auto" }}>
          <h2 className="timeline-title">Cómo funciona</h2>
          <div className="timeline">
            <div className="timeline-line" />
            <div className="timeline-vline" />
            <div className="timeline-step">
              <div className="step-dot">1</div>
              <div className="step-title">Elige</div>
              <div className="step-desc">Explora canales por categoría y precio.</div>
            </div>
            <div className="timeline-step">
              <div className="step-dot">2</div>
              <div className="step-title">Activa</div>
              <div className="step-desc">Define tu mensaje y confirma el pago seguro.</div>
            </div>
            <div className="timeline-step">
              <div className="step-dot">3</div>
              <div className="step-title">Mide</div>
              <div className="step-desc">Publicación verificada y métricas visibles.</div>
            </div>
          </div>
        </div>
      </section>

      <section className="container landing-section">
        <div className="callout-card">
          <div className="callout-inner">
            <div>
              <h2 className="callout-title">La atención ya existe.</h2>
              <p className="callout-sub">Accede a ella de forma simple.</p>
            </div>
            <div className="callout-actions">
              <a className="btn btn-primary cta-gradient" href="/channels">Explorar canales</a>
              <a className="btn btn-secondary" href="/login">Registrarse</a>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="container landing-section">
        <div className="stack-md">
          <h2 className="title">FAQ</h2>
          <div className="accordion">
            <details className="accordion-item">
              <summary>¿Cómo se verifica la propiedad de un canal?</summary>
              <p>Mediante pruebas simples en la plataforma del canal y revisión manual cuando aplica.</p>
            </details>
            <details className="accordion-item">
              <summary>¿Qué métodos de pago aceptáis?</summary>
              <p>El pago seguro se gestiona mediante intents con tarjeta y otros métodos compatibles.</p>
            </details>
            <details className="accordion-item">
              <summary>¿Qué métricas se reportan?</summary>
              <p>Impresiones y clics verificados con claridad desde tu panel.</p>
            </details>
          </div>
        </div>
      </section>
    </main>
  );
}
