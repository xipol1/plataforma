"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";
export default function GadgetActividadPage() {
  const [events, setEvents] = useState<Array<{ ts: string; label: string; desc: string }>>([]);
  const [status, setStatus] = useState("");
  useEffect(() => {
    apiFetch(`/campaigns/events`)
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(rows => {
        setEvents(rows.map((e: any) => ({
          ts: e.createdAt,
          label: e.action,
          desc: `${e.entityType} ${e.entityId}`,
        })));
        setStatus("");
      })
      .catch(() => setStatus("API no disponible"));
  }, []);
  return (
    <main className="container">
      <section className="card reveal">
        <h1 className="title">Actividad</h1>
        <p className="subtitle">Feed de eventos relevantes recientes.</p>
        {status && <span className="badge" role="status" aria-live="polite">{status}</span>}
        <ul className="list">
          {events.map((e, i) => (
            <li key={`${e.ts}-${i}`} className="list-item">
              <div className="spaced">
                <div>
                  <strong>{e.label}</strong>
                  <div className="muted">{e.desc}</div>
                </div>
                <span className="badge">{e.ts}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
