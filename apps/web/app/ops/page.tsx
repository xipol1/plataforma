 "use client";
 
 import { useState } from "react";
 
 export default function OpsPage() {
   const [campaignId, setCampaignId] = useState("44444444-4444-4444-4444-444444444444");
   const [startAt, setStartAt] = useState("");
   const [endAt, setEndAt] = useState("");
   const [msg, setMsg] = useState("");
   const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
 
   async function publish() {
     setMsg("Publicando...");
     const token = localStorage.getItem("token") ?? "";
     if (!token) {
       setMsg("Necesitas login OPS");
       return;
     }
     try {
       const res = await fetch(`${apiUrl}/campaigns/${campaignId}/publish`, {
         method: "PATCH",
         headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
         body: JSON.stringify({ startAt, endAt }),
       });
       const data = await res.json();
       setMsg(res.ok ? `Publicado: ${data.status}` : `Error: ${data.message ?? "fallo"}`);
     } catch {
       setMsg("API no disponible");
     }
   }
 
   async function stats() {
     setMsg("Cargando stats...");
     const token = localStorage.getItem("token") ?? "";
     if (!token) {
       setMsg("Necesitas login OPS");
       return;
     }
     try {
       const res = await fetch(`${apiUrl}/tracking/stats/${campaignId}`, {
         headers: { Authorization: `Bearer ${token}` },
       });
       const data = await res.json();
       setMsg(res.ok ? `Clicks: ${data.total}, válidos: ${data.valid}` : `Error: ${data.message ?? "fallo"}`);
     } catch {
       setMsg("API no disponible");
     }
   }
 
  return (
    <main className="container">
      <section className="card reveal">
        <h1 className="title">OPS</h1>
        <p className="subtitle">Publicar campaña y ver estadísticas. Contenido de ejemplo: recomendaciones de ventana de publicación y métricas operativas clave.</p>
        <div className="form" style={{ maxWidth: 640 }}>
          <label className="label">
            Campaign ID
            <input className="input" value={campaignId} onChange={(e) => setCampaignId(e.target.value)} />
          </label>
          <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <label className="label">
              Inicio (ISO)
              <input className="input" placeholder="2026-02-08T12:00:00Z" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
            </label>
            <label className="label">
              Fin (ISO)
              <input className="input" placeholder="2026-02-10T12:00:00Z" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
            </label>
          </div>
          <div className="row" style={{ marginTop: 12 }}>
            <button onClick={publish} className="btn btn-success">Publicar</button>
            <button onClick={stats} className="btn">Ver stats (30d)</button>
            {msg && <span className="badge">{msg}</span>}
          </div>
        </div>
        <div className="row" style={{ marginTop: "0.75rem" }}>
          <a href="/channels" className="btn">Canales</a>
          <a href="/campaigns/inbox" className="btn">Mis campañas</a>
        </div>
      </section>
    </main>
   );
 }
