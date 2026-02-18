 "use client";
 
 import { useEffect, useMemo, useState } from "react";
 import { apiFetch } from "../../../lib/api";
 
 export default function CreatorPublicationsPage() {
   const [status, setStatus] = useState("");
  const [items, setItems] = useState<Array<{ campaignId: string; channelId: string; when: string | null; channel: string; platform: string; status: string }>>([]);
  const fmtDate = useMemo(() => new Intl.DateTimeFormat("es-ES", { year: "numeric", month: "short", day: "2-digit" }), []);
  const fmtTime = useMemo(() => new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit" }), []);
  const [platform, setPlatform] = useState<"ALL" | "TELEGRAM" | "DISCORD" | "WHATSAPP">("ALL");
 
  useEffect(() => {
    setStatus("Cargando…");
    apiFetch(`/creator/publications`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((rows) => {
        setItems(rows);
        setStatus("");
      })
      .catch(() => setStatus("API no disponible"));
  }, []);
 
   return (
     <main className="container">
      <section className="card reveal">
        <div className="spaced">
          <div>
            <h1 className="title">Próximas publicaciones</h1>
            <p className="subtitle">Fecha · Canal · Estado. Ajusta el calendario desde el detalle.</p>
          </div>
          <div className="row" style={{ gap: "0.5rem" }}>
            <a className="btn btn-outline btn-sm" href="/app/creator/inbox">Ver solicitudes</a>
            <a className="btn btn-outline btn-sm" href="/app/creator">Volver</a>
          </div>
        </div>

        {status && <div className="badge mt-xs" role="status" aria-live="polite">{status}</div>}

        <div className="market-filters mt-sm">
          <div className="filter-group">
            <span className="filter-label">Plataforma</span>
            {(["TELEGRAM", "DISCORD", "WHATSAPP"] as const).map((p) => (
              <button
                key={p}
                className={`filter-chip ${platform === p ? "active" : ""}`}
                onClick={() => setPlatform((cur) => (cur === p ? "ALL" : p))}
                type="button"
              >
                {p === "TELEGRAM" ? "Telegram" : p === "DISCORD" ? "Discord" : "WhatsApp"}
              </button>
            ))}
          </div>
        </div>

        {items.filter((it) => platform === "ALL" || it.platform === platform).length ? (
          <ul className="list exec-clean-list mt-sm">
            {items.filter((it) => platform === "ALL" || it.platform === platform).slice(0, 12).map((p) => {
              const when = p.when ? new Date(p.when) : null;
              const date = when ? fmtDate.format(when) : "Sin fecha";
              const time = when ? fmtTime.format(when) : "";
              return (
                <li key={p.campaignId} className="list-item">
                  <div className="spaced" style={{ alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontWeight: 950 }}>{date}{time ? ` · ${time}` : ""} · {p.channel} · {p.platform}</div>
                      <div className="muted mt-xs">{p.status}</div>
                    </div>
                    <div className="row" style={{ gap: "0.5rem" }}>
                      <a className="btn btn-outline btn-sm" href={`/app/creator/campaigns/${p.campaignId}`}>Ver detalle</a>
                      <a className="btn btn-secondary btn-sm" href={`/app/creator/campaigns/${p.campaignId}`}>Ajustar calendario</a>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="feature-card exec-action-card mt-sm">
            <h2 className="exec-section-title">No tienes publicaciones programadas.</h2>
            <p className="exec-section-sub">Cuando recibas solicitudes y se programe el horario, aparecerán aquí.</p>
            <div className="row mt-sm" style={{ gap: "0.75rem" }}>
              <a className="btn btn-primary btn-lg" href="/app/creator/inbox">Ver solicitudes</a>
              <a className="btn btn-secondary btn-lg" href="/app/creator/precios">Gestionar precios</a>
            </div>
          </div>
        )}
      </section>
     </main>
   );
 }
