import HeroFX from "./components/HeroFX";
import DashboardCTA from "./components/DashboardCTA";
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
  const [health] = await Promise.all([getApiHealth()]);

  return (
    <>
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-top">
            <div className="hero-marquee" aria-label="Acerca del proyecto">
              <div className="hero-track marquee-anim">
                {[
                  "Acerca del proyecto",
                  "Compra de espacios",
                  "Pagos seguros",
                  "Tracking verificado",
                  "Telegram first",
                  "Dashboard por rol",
                ].map((t, i) => (
                  <span key={i} className="brand-chip">{t}</span>
                ))}
                {[
                  "Acerca del proyecto",
                  "Compra de espacios",
                  "Pagos seguros",
                  "Tracking verificado",
                  "Telegram first",
                  "Dashboard por rol",
                ].map((t, i) => (
                  <span key={`dup-${i}`} className="brand-chip">{t}</span>
                ))}
              </div>
            </div>
            <h1 className="hero-title">
              <span className="text-gradient">AdFlow</span>: activa campañas en canales con confianza y escala
            </h1>
            <p className="hero-subtitle">
              Plataforma de compra de espacios en canales privados: selección de audiencia, pagos seguros y publicación programada con tracking verificado.
            </p>
            <div className="hero-ctas">
              <a href="/channels" className="btn btn-primary">Explorar canales</a>
              <a href="/login" className="btn">Login/Register</a>
              <DashboardCTA />
            </div>
          </div>
          <div className="hero-grid">
            <div className="feature-card">
              <h3 className="feature-title">Audiencias reales</h3>
              <p className="feature-desc">Canales verificados con segmentación por categoría e interés.</p>
              <ul className="tick-list">
                <li>Selección curada</li>
                <li>Precios transparentes</li>
                <li>Disponibilidad real</li>
              </ul>
            </div>
            <div className="feature-card">
              <h3 className="feature-title">Pagos y publicación</h3>
              <p className="feature-desc">Flujo seguro con intents, scheduling y comprobaciones.</p>
              <ul className="tick-list">
                <li>Pagos seguros</li>
                <li>Publicación programada</li>
                <li>Revisión y estado</li>
              </ul>
            </div>
            <div className="feature-card">
              <h3 className="feature-title">Tracking verificado</h3>
              <p className="feature-desc">Medición de impresiones y clics con validación antifraude.</p>
              <ul className="tick-list">
                <li>Métricas clave</li>
                <li>CTR y ROAS</li>
                <li>Logs de publicación</li>
              </ul>
            </div>
          </div>
          <section className="reveal">
            <h2 className="title">Ejemplos de campañas</h2>
            <p className="subtitle">Explora rendimiento y buenas prácticas en campañas reales.</p>
            <CampaignExamples />
          </section>
          <div className="stat-bar">
            <div className="stat">
              <div className="label">Canales verificados</div>
              <div className="value">120+</div>
            </div>
            <div className="stat">
              <div className="label">Campañas activas</div>
              <div className="value">45</div>
            </div>
            <div className="stat">
              <div className="label">Conversión media</div>
              <div className="value">2.4%</div>
            </div>
          </div>
        </div>
      </section>

      <main className="container grid">
        <section className="card reveal">
          <h2 className="title">Estado de la plataforma</h2>
          <p className="subtitle">{health.status === "ok" ? health.details : "API no disponible"}</p>
          <div className="row" style={{ gap: "0.5rem" }}>
            <a className="btn btn-primary" href="/login">Login/Register</a>
            <a className="btn" href="/about">About</a>
          </div>
        </section>
        <div className="footer">© AdFlow · Privacidad · Términos</div>
      </main>
    </>
  );
}
