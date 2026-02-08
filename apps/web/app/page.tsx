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
    <main style={{ maxWidth: 980, margin: "0 auto", display: "grid", gap: "1rem" }}>
      <section style={{ background: "white", borderRadius: 12, padding: "1.25rem" }}>
        <h1>Plataforma MVP</h1>
        <p>Marketplace de anuncios para canales cerrados (Telegram first).</p>
      </section>

      <section style={{ background: "white", borderRadius: 12, padding: "1.25rem" }}>
        <h2>Estado del backend</h2>
        <p>
          <strong>{health.status.toUpperCase()}</strong>: {health.details}
        </p>
      </section>

      <section style={{ background: "white", borderRadius: 12, padding: "1.25rem" }}>
        <h2>Proveedores de canal (unión inicial)</h2>
        {providers.length === 0 ? (
          <p>No se pudieron cargar proveedores (API no disponible).</p>
        ) : (
          <ul>
            {providers.map((provider) => (
              <li key={provider.name}>
                <strong>{provider.name}</strong> — ownership: {String(provider.capabilities.supportsChannelOwnershipCheck)},
                audience: {String(provider.capabilities.supportsAudienceRead)}, messaging: {String(provider.capabilities.supportsMessageSend)}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section style={{ background: "white", borderRadius: 12, padding: "1.25rem" }}>
        <h2>Siguientes pasos sugeridos</h2>
        <ol>
          <li>Registrar y publicar un canal.</li>
          <li>Crear campaña en estado DRAFT.</li>
          <li>Usar <code>POST /campaigns/quote</code> para estimar comisión/plataforma.</li>
        </ol>
      </section>
    </main>
  );
}
