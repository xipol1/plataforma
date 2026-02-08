import HeroFX from "./components/HeroFX";

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
        <HeroFX />
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
            <div className="feature-card">
              <h3 className="feature-title">Conecta con audiencias reales</h3>
              <p className="feature-desc">Verificamos propiedad del canal y lectura de audiencia para evitar fraude.</p>
            </div>
            <div className="feature-card">
              <h3 className="feature-title">Pagos seguros</h3>
              <p className="feature-desc">Intentos de pago, retenciones y liberaciones con proveedores externos.</p>
            </div>
            <div className="feature-card">
              <h3 className="feature-title">OPS y automatización</h3>
              <p className="feature-desc">Publicación programada, tracking de clics e informes operativos.</p>
            </div>
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
        <div className="footer">© AdFlow · Privacidad · Términos</div>
      </main>
    </>
  );
}
