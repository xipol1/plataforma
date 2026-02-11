export default function AboutPage() {
  return (
    <main className="container">
      <section className="card reveal">
        <h1 className="title">Sobre nosotros</h1>
        <p className="subtitle">Creamos conexiones reales entre marcas y audiencias en canales privados. Transparencia, confianza y resultados medibles.</p>
        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div className="feature-card">
            <h3 className="feature-title">Misión</h3>
            <p className="feature-desc">Facilitar campañas honestas y eficaces en comunidades cerradas, con pagos seguros y métricas auditables.</p>
          </div>
          <div className="feature-card">
            <h3 className="feature-title">Visión</h3>
            <p className="feature-desc">Ser el puente de confianza entre creadores y anunciantes, cuidando a la audiencia y escalando con calidad.</p>
          </div>
        </div>
      </section>

      <section className="card reveal">
        <h2 className="title">Valores</h2>
        <ul className="list">
          <li className="list-item">Confianza primero: propiedad verificada y entrega real.</li>
          <li className="list-item">Transparencia: precios claros, métricas comprensibles.</li>
          <li className="list-item">Cuidado de la comunidad: contenidos relevantes y respetuosos.</li>
          <li className="list-item">Resultados: campañas que aportan valor medible.</li>
        </ul>
      </section>

      <section className="card reveal">
        <h2 className="title">Equipo</h2>
        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
          <div className="feature-card">
            <h3 className="feature-title">María</h3>
            <p className="feature-desc">Producto y diseño. Enfocada en UX humana y resultados.</p>
          </div>
          <div className="feature-card">
            <h3 className="feature-title">Carlos</h3>
            <p className="feature-desc">Tecnología y datos. Métricas auditables y rendimiento.</p>
          </div>
          <div className="feature-card">
            <h3 className="feature-title">Lucía</h3>
            <p className="feature-desc">Relación con creadores. Calidad de campañas y reputación.</p>
          </div>
        </div>
      </section>

      <section className="card reveal">
        <h2 className="title">Contacto</h2>
        <p className="feature-desc">¿Eres anunciante o creador? Hablemos y empezamos hoy.</p>
        <div className="row">
          <a className="btn btn-primary" href="/login">Empezar</a>
          <a className="btn" href="/channels">Explorar canales</a>
        </div>
      </section>
    </main>
  );
}
