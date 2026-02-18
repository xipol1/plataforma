 "use client";
 
 import { useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api";
 
 export default function CreatorActivityPage() {
   const [status, setStatus] = useState("");
  const [events, setEvents] = useState<Array<{ createdAt: string; action: string; entityType: string; entityId?: string; meta?: string | null }>>([]);

  function formatEvent(action: string, entityId?: string) {
    const short = entityId ? entityId.slice(0, 8).toUpperCase() : "";
    if (action === "CREATOR_ACCEPT") return { title: "Solicitud aceptada", meta: short ? `— ${short}` : "" };
    if (action === "CREATOR_REJECT") return { title: "Solicitud rechazada", meta: short ? `— ${short}` : "" };
    if (action === "SCHEDULE_PROPOSAL") return { title: "Calendario propuesto", meta: short ? `— ${short}` : "" };
    if (action === "SCHEDULE_REQUEST") return { title: "Nueva solicitud", meta: short ? `— ${short}` : "" };
    if (action === "PUBLISH_SENT") return { title: "Publicación realizada", meta: short ? `— ${short}` : "" };
    if (action === "PAYOUT_CONFIG_SET") return { title: "Datos de cobro actualizados", meta: "" };
    return { title: action.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase()), meta: short ? `— ${short}` : "" };
  }
 
  useEffect(() => {
    setStatus("Cargando…");
    apiFetch(`/creator/events`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((rows) => {
        setEvents(rows);
        setStatus("");
      })
      .catch(() => setStatus("API no disponible"));
  }, []);
 
   return (
     <main className="container">
      <section className="card reveal">
        <div className="spaced">
          <div>
            <h1 className="title">Actividad reciente</h1>
            <p className="subtitle">Timeline de eventos relacionados con solicitudes, calendario y cobros.</p>
          </div>
          <a className="btn btn-outline btn-sm" href="/app/creator">Volver</a>
        </div>

        {status && <div className="badge mt-xs" role="status" aria-live="polite">{status}</div>}

        {events.length ? (
          <ul className="exec-timeline mt-sm">
            {events.slice(0, 30).map((e) => {
              const t = formatEvent(e.action, e.entityId);
              return (
                <li key={`${e.action}-${e.entityType}-${e.createdAt}`} className="exec-timeline-item">
                  <div className="exec-timeline-dot" />
                  <div className="exec-timeline-body">
                    <div className="exec-timeline-line">
                      <span className="exec-timeline-title">{t.title}</span>{" "}
                      <span className="exec-timeline-meta">{t.meta}</span>
                    </div>
                    <div className="exec-timeline-ts">{new Date(e.createdAt).toLocaleString("es-ES")}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="feature-desc mt-sm">Aún no hay actividad reciente.</p>
        )}
      </section>
     </main>
   );
 }
