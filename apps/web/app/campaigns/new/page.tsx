"use client";

import { useEffect, useState } from "react";
import { apiFetch, getApiUrl } from "../../lib/api";

export default function Page() {
  const [channelId, setChannelId] = useState("");
  const [copyText, setCopyText] = useState("");
  const [destinationUrl, setDestinationUrl] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [status, setStatus] = useState("");
  const [createdId, setCreatedId] = useState("");

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const cid = params.get("channelId") ?? "";
      if (cid) setChannelId(cid);
    } catch {}
  }, []);

  async function createCampaign() {
    setStatus("Creando campaña…");
    setCreatedId("");
    if (!channelId || !copyText || !destinationUrl) {
      setStatus("Completa canal, texto y URL destino");
      return;
    }
    try {
      const res = await apiFetch(`/campaigns`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channelId,
          copyText,
          destinationUrl,
          scheduledAt: scheduledAt || undefined,
        }),
      });
      if (!res.ok) {
        setStatus("Error creando campaña");
        return;
      }
      const data = await res.json();
      setCreatedId(data.id ?? "");
      setStatus("Campaña creada");
    } catch {
      setStatus("API no disponible");
    }
  }

  return (
    <main className="container">
      <section className="card reveal">
        <h1 className="title">Nueva campaña</h1>
        <p className="subtitle">Define canal, contenido y destino. Puedes programar la publicación opcionalmente.</p>
        <div className="form" style={{ maxWidth: 680 }}>
          <label className="label">
            Canal (UUID)
            <input className="input" value={channelId} onChange={(e) => setChannelId(e.target.value)} placeholder="00000000-0000-0000-0000-000000000000" />
          </label>
          <label className="label">
            Texto del anuncio
            <textarea className="input" value={copyText} onChange={(e) => setCopyText(e.target.value)} placeholder="Mensaje a publicar en el canal" rows={4} />
          </label>
          <label className="label">
            URL de destino
            <input className="input" value={destinationUrl} onChange={(e) => setDestinationUrl(e.target.value)} placeholder="https://tu-sitio.com/landing" />
          </label>
          <label className="label">
            Programar (ISO opcional)
            <input className="input" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} placeholder="2026-02-10T12:00:00Z" />
          </label>
          <div className="row" style={{ marginTop: 12 }}>
            <button onClick={createCampaign} className="btn btn-primary">Crear campaña</button>
            <a href="/channels" className="btn">Explorar canales</a>
            {status && <span className="badge" role="status" aria-live="polite">{status}</span>}
            {createdId && (
              <a className="btn btn-outline" href="/campaigns/inbox" style={{ marginLeft: "0.5rem" }}>
                Ver en mis campañas ({createdId})
              </a>
            )}
          </div>
          {createdId && (
            <div className="feature-card" style={{ marginTop: "0.75rem" }}>
              <h3 className="feature-title">Tracking</h3>
              <p className="feature-desc">Usa este enlace para publicar y medir clicks. El redirect añadirá af_click para atribuir conversiones.</p>
              <div className="stack">
                <div className="kpi">
                  <div className="label">Enlace de tracking</div>
                  <div className="value">{`${getApiUrl()}/r/${createdId}`}</div>
                </div>
                <div className="kpi">
                  <div className="label">Pixel de vista (landing)</div>
                  <div className="value">{`${getApiUrl()}/t/view/${createdId}.gif`}</div>
                </div>
                <div className="kpi">
                  <div className="label">Pixel de conversión</div>
                  <div className="value">{`${getApiUrl()}/t/conv/{af_click}.gif?type=CONVERSION&value=123&currency=USD`}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
