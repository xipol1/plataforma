import HeroFX from "./components/HeroFX";
import CampaignExamples from "./components/CampaignExamples";

async function getApiHealth() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

  try {
    const response = await fetch(`${apiUrl}/health`, { cache: "no-store" });
    if (!response.ok) {
      return { status: "error", details: `API error ${response.status}` };
    }

    const data = await response.json();
    return { status: "ok", details: `DB: ${data.db ? "up" : "down"}, latency: ${data.latency_ms}ms` };
  } catch {
    return { status: "error", details: "API unreachable" };
  }
}

async function getProviders() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

  try {
    const response = await fetch(`${apiUrl}/meta/providers`, { cache: "no-store" });
    if (!response.ok) return [] as Array<{ name: string; capabilities: Record<string, boolean> }>;
    const data = await response.json();
    return data.providers as Array<{ name: string; capabilities: Record<string, boolean> }>;
  } catch {
    return [] as Array<{ name: string; capabilities: Record<string, boolean> }>;
  }
}

export default async function HomePage() {
  const [health, providers] = await Promise.all([getApiHealth(), getProviders()]);

  return (
    <>
      <section className="hero">
        <div className="hero-inner">
          <span className="pill">Nuevo · Telegram first</span>
          <h1 className="hero-title">
            <span className="text-gradient">AdFlow</span>: anuncios en canales con confianza y escala
          </h1>
          <p className="hero-subtitle">
            Conectamos marcas con audiencias reales en canales privados. Pagos seguros, publicación programada y tracking verificado.
          </p>
          <div className="cta">
            <a href="/channels" className="btn btn-primary">Explorar canales</a>
            <a href="/login" className="btn">Entrar</a>
          </div>
        </div>
      </section>

      <main className="container grid">
        <section className="card reveal">
          <div className="feature-grid">
            <a className="feature-card" href="/channels">
              <h3 className="feature-title">Conecta con audiencias reales</h3>
              <p className="feature-desc">Verificamos propiedad del canal y lectura de audiencia para evitar fraude.</p>
            </a>
            <a className="feature-card" href="/campaigns/new">
              <h3 className="feature-title">Pagos seguros</h3>
              <p className="feature-desc">Intentos de pago, retenciones y liberaciones con proveedores externos.</p>
            </a>
            <a className="feature-card" href="/creator">
              <h3 className="feature-title">OPS y automatización</h3>
              <p className="feature-desc">Publicación programada, tracking de clics e informes operativos.</p>
            </a>
          </div>
        </section>

        <section className="card reveal">
          <h2 className="title">Confiado por integraciones</h2>
          {providers.length === 0 ? (
            <p className="subtitle">No se pudieron cargar proveedores (API no disponible).</p>
          ) : (
            <div className="logos">
              {providers.map((p) => (
                <span key={p.name} className="logo">{p.name}</span>
              ))}
            </div>
          )}
        </section>

        <section className="card reveal">
          <h2 className="title">Cómo funciona</h2>
          <ul className="list">
            <li className="list-item">1 · Registra y publica tu canal privado.</li>
            <li className="list-item">2 · Crea campañas con copy y destino.</li>
            <li className="list-item">3 · Obtén presupuesto y paga con intento seguro.</li>
            <li className="list-item">4 · Programa publicación y recibe tracking.</li>
          </ul>
        </section>

        <section className="card reveal">
          <h2 className="title">Para anunciantes</h2>
          <div className="grid" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
            <div className="feature-card">
              <h3 className="feature-title">Catálogo de canales</h3>
              <p className="feature-desc">Explora categorías y audiencias con precios claros por publicación.</p>
            </div>
            <div className="feature-card">
              <h3 className="feature-title">Presupuestos instantáneos</h3>
              <p className="feature-desc">Calcula comisiones y costes antes de pagar para evitar sorpresas.</p>
            </div>
            <div className="feature-card">
              <h3 className="feature-title">Tracking verificado</h3>
              <p className="feature-desc">Clicks y conversiones con filtros antifraude y informes operativos.</p>
            </div>
          </div>
          <div className="accordion" style={{ marginTop: "0.75rem" }}>
            <details className="accordion-item">
              <summary>Catálogo de canales</summary>
              <p>Filtra por país, temática y tamaño. Verifica propiedad y entrega real antes de comprar.</p>
            </details>
            <details className="accordion-item">
              <summary>Presupuestos y pagos</summary>
              <p>Simula CTR y conversiones según audiencias. Paga seguro con retención y liberación tras entrega.</p>
            </details>
            <details className="accordion-item">
              <summary>Tracking verificado</summary>
              <p>Clicks únicos con antifraude. Reportes de impresiones y conversiones con atribución simple.</p>
            </details>
          </div>
        </section>

        <section className="card reveal">
          <h2 className="title">Para creadores</h2>
          <div className="grid" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
            <div className="feature-card">
              <h3 className="feature-title">Verificación de propiedad</h3>
              <p className="feature-desc">Acredita tu canal y gana visibilidad con sellos de confianza.</p>
            </div>
            <div className="feature-card">
              <h3 className="feature-title">Pricing inteligente</h3>
              <p className="feature-desc">Guías de precios según audiencia y engagement para maximizar ingresos.</p>
            </div>
            <div className="feature-card">
              <h3 className="feature-title">Gestión de campañas</h3>
              <p className="feature-desc">Publicación programada, ventanas de tiempo y reporte automático.</p>
            </div>
          </div>
          <div className="accordion" style={{ marginTop: "0.75rem" }}>
            <details className="accordion-item">
              <summary>Alta y verificación</summary>
              <p>Conecta el canal, valida dominio o propiedad y establece categorías y precios.</p>
            </details>
            <details className="accordion-item">
              <summary>Calendario y entregas</summary>
              <p>Programa contenido, recibe materiales del anunciante y publica según tu mejor horario.</p>
            </details>
            <details className="accordion-item">
              <summary>Analítica y reputación</summary>
              <p>Consulta rendimiento por campaña, satisfacción de anunciantes y mejora tu perfil.</p>
            </details>
          </div>
        </section>

        <section className="card reveal">
          <h2 className="title">Ejemplos de campañas</h2>
          <CampaignExamples />
        </section>

        <section className="card reveal">
          <h2 className="title">Confianza y seguridad</h2>
          <div className="accordion">
            <details className="accordion-item">
              <summary>Verificación de propiedad</summary>
              <p>Validación con DNS/archivo y chequeos de identidad para asegurar que el canal es legítimo.</p>
            </details>
            <details className="accordion-item">
              <summary>Protección de pagos</summary>
              <p>Depósitos en custodia, liberación tras la entrega y mecanismos de disputa claros.</p>
            </details>
            <details className="accordion-item">
              <summary>Antifraude y métricas</summary>
              <p>Detección de bots, deduplicación de clics y métricas auditables para toma de decisiones.</p>
            </details>
          </div>
        </section>

        <div className="footer">© AdFlow · Privacidad · Términos</div>
      </main>
    </>
  );
}
