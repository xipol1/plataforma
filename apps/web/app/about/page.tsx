export default function AboutPage() {
  return (
    <main
      style={{
        background:
          "radial-gradient(700px 420px at 55% 40%, rgba(91, 33, 182, 0.12), transparent 70%), #F7F6FB",
      }}
    >
      <section className="container" style={{ paddingTop: "64px", paddingBottom: "72px" }}>
        <div className="hero-split">
          <div className="stack-md">
            <div>
              <h1 className="hero-title" style={{ color: "#12121A", fontWeight: 800, marginBottom: "0.75rem" }}>
                Sobre nosotros
              </h1>
              <p className="hero-subtitle" style={{ color: "#3F3F55", marginTop: "1rem", marginBottom: "1.1rem" }}>
                Conectamos marcas y comunidades con un sistema de garantía, propiedad verificable y métricas claras.
              </p>
            </div>
            <div className="row" style={{ gap: "0.75rem" }}>
              <a className="btn btn-primary cta-gradient" href="/channels">
                Explorar canales
              </a>
              <a className="btn" href="/login">
                Registrarse
              </a>
            </div>
            <ul className="tick-list">
              <li>Pago retenido hasta confirmación</li>
              <li>Clicks verificados y trazables</li>
              <li>Relación cuidada con la audiencia</li>
            </ul>
          </div>

          <div className="hero-preview">
            <div className="grid" style={{ gap: "1rem" }}>
              <div className="feature-card">
                <h3 className="feature-title">Misión</h3>
                <p className="feature-desc">Simplificar campañas en comunidades cerradas con seguridad y transparencia.</p>
              </div>
              <div className="feature-card">
                <h3 className="feature-title">Visión</h3>
                <p className="feature-desc">Ser el puente de confianza entre anunciantes, creadores y audiencias.</p>
              </div>
              <div className="feature-card">
                <h3 className="feature-title">Cómo lo hacemos</h3>
                <p className="feature-desc">Estados verificables, pagos protegidos y panel con métricas entendibles.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container landing-section">
        <div className="grid-12">
          <div className="ad-left">
            <h2 className="ad-title">El proyecto</h2>
            <p className="ad-subtitle">Una plataforma para ejecutar campañas con garantía y medir el impacto real.</p>
            <ul className="tick-list">
              <li>Propiedad del canal verificable</li>
              <li>Entrega confirmada</li>
              <li>Transparencia en cada paso</li>
            </ul>
          </div>
          <div className="ad-right">
            <div className="ad-cards">
              <div className="ad-card large">
                <h3 className="feature-title">Compra segura</h3>
                <p className="feature-desc">El pago se retiene hasta que la publicación se confirma.</p>
              </div>
              <div className="ad-card">
                <h3 className="feature-title">Métricas claras</h3>
                <p className="feature-desc">Clicks verificados y trazabilidad por campaña.</p>
              </div>
              <div className="ad-card">
                <h3 className="feature-title">Relación sostenible</h3>
                <p className="feature-desc">Contenido relevante, respeto por la comunidad y reputación cuidada.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container landing-section">
        <div className="stack-md">
          <div className="section-head">
            <div>
              <h2 className="title">Equipo</h2>
              <p className="subtitle">Construimos con foco en experiencia, confianza y resultados medibles.</p>
            </div>
          </div>
          <div className="feature-grid">
            <div className="feature-card">
              <h3 className="feature-title">María</h3>
              <p className="feature-desc">Producto y diseño. UX humana, claridad y consistencia visual.</p>
            </div>
            <div className="feature-card">
              <h3 className="feature-title">Carlos</h3>
              <p className="feature-desc">Tecnología y datos. Rendimiento, trazabilidad y calidad de métricas.</p>
            </div>
            <div className="feature-card">
              <h3 className="feature-title">Lucía</h3>
              <p className="feature-desc">Relación con creadores. Criterios de calidad y buenas prácticas.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container landing-section">
        <div className="stack-md">
          <h2 className="title">FAQ</h2>
          <div className="accordion">
            <details className="accordion-item">
              <summary>¿Qué significa “compra con garantía”?</summary>
              <p>El pago queda retenido y solo se libera cuando la publicación se confirma y su estado es verificable.</p>
            </details>
            <details className="accordion-item">
              <summary>¿Cómo se verifica la propiedad de un canal?</summary>
              <p>Mediante señales y acciones comprobables dentro de la plataforma del canal, y revisión cuando aplica.</p>
            </details>
            <details className="accordion-item">
              <summary>¿Qué métricas se muestran en el panel?</summary>
              <p>Clicks verificados e historial por campaña, para entender el rendimiento sin ruido ni métricas confusas.</p>
            </details>
            <details className="accordion-item">
              <summary>¿Cómo se evita el fraude o los clicks falsos?</summary>
              <p>Filtramos señales no válidas y evitamos atribuciones incorrectas para que los resultados sean coherentes.</p>
            </details>
            <details className="accordion-item">
              <summary>¿Qué tipos de campañas funcionan mejor?</summary>
              <p>Las que aportan valor real a la audiencia: ofertas claras, contenido útil y propuestas relevantes.</p>
            </details>
            <details className="accordion-item">
              <summary>¿Puedo pausar o rechazar una campaña?</summary>
              <p>Sí. Los canales pueden aceptar o rechazar propuestas, y las campañas siguen un flujo con estados visibles.</p>
            </details>
            <details className="accordion-item">
              <summary>¿Cómo se fijan los precios?</summary>
              <p>Los canales publican precios y condiciones, y el anunciante compra con visibilidad del coste final.</p>
            </details>
            <details className="accordion-item">
              <summary>¿Cómo contacto con el equipo?</summary>
              <p>Puedes registrarte y escribirnos desde tu dashboard, o empezar explorando canales y creando una campaña.</p>
            </details>
          </div>
        </div>
      </section>

      <section className="container landing-section">
        <div className="callout-card">
          <div className="callout-inner">
            <div>
              <h2 className="callout-title">Anunciarse con confianza.</h2>
              <p className="callout-sub">Compra con garantía y mide con claridad.</p>
            </div>
            <div className="callout-actions">
              <a className="btn btn-primary cta-gradient" href="/channels">
                Explorar canales
              </a>
              <a className="btn btn-secondary" href="/login">
                Registrarse
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
