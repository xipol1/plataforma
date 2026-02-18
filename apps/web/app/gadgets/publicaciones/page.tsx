 "use client";
import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";
export default function GadgetPublicacionesPage() {
  const [items, setItems] = useState<Array<{ id: string; createdAt: string; scheduledAt: string | null; status: string; channelId: string }>>([]);
  const [status, setStatus] = useState("");
  useEffect(() => {
    const params = new URLSearchParams({ limit: "10", offset: "0" });
    apiFetch(`/campaigns/inbox?${params.toString()}`)
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(rows => {
        setItems(rows);
        setStatus("");
      })
      .catch(() => setStatus("API no disponible"));
  }, []);
  return (
    <main className="container">
      <section className="card reveal">
        <h1 className="title">Publicaciones</h1>
        <p className="subtitle">Agenda y logs de publicación verificados.</p>
        {status && <span className="badge" role="status" aria-live="polite">{status}</span>}
        <div className="grid" style={{ gridTemplateColumns: "2fr 1fr" }}>
          <div className="feature-card">
            <h3 className="feature-title">Agenda próxima</h3>
            <p className="feature-desc">Configura ventanas por canal y audiencia.</p>
            <div className="row" style={{ gap: "0.5rem", marginTop: "0.5rem" }}>
              <a className="btn btn-primary" href="/app/advertiser/inbox">Programar ventana</a>
              <a className="btn" href="/channels">Ver canales</a>
            </div>
          </div>
          <div className="feature-card">
            <h3 className="feature-title">Logs recientes</h3>
            <ul className="list">
              {items.map((e) => (
                <li key={e.id} className="list-item">
                  <div className="spaced">
                    <div>
                      <strong>{e.scheduledAt ?? e.createdAt}</strong> · Canal {e.channelId}
                    </div>
                    <span className="badge">{e.status}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
