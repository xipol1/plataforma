 "use client";
 
 import { useEffect, useMemo, useState } from "react";
 
 export default function NewCampaignPage() {
   const [channelId, setChannelId] = useState<string>("");
   const [copyText, setCopyText] = useState<string>("");
   const [destinationUrl, setDestinationUrl] = useState<string>("https://example.com");
   const [status, setStatus] = useState<string>("");
 
   const qsChannelId = useMemo(() => {
     try {
       const u = new URL(window.location.href);
       return u.searchParams.get("channelId") ?? "";
     } catch {
       return "";
     }
   }, []);
 
   useEffect(() => {
     if (qsChannelId) setChannelId(qsChannelId);
   }, [qsChannelId]);
 
  async function onSubmit(e: React.FormEvent) {
     e.preventDefault();
     const token = localStorage.getItem("token") ?? "";
     if (!token) {
       setStatus("Necesitas login");
       return;
     }
    if (!channelId || !copyText || !destinationUrl) {
      setStatus("Completa todos los campos");
      return;
    }
     const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
    setStatus("Creando...");
     try {
       const res = await fetch(`${apiUrl}/campaigns`, {
         method: "POST",
         headers: {
           "Content-Type": "application/json",
           Authorization: `Bearer ${token}`,
         },
         body: JSON.stringify({ channelId, copyText, destinationUrl }),
       });
       if (!res.ok) {
         setStatus("Error creando campaña");
         return;
       }
       const data = await res.json();
       setStatus(`Campaña creada: ${data.id}`);
     } catch {
       setStatus("API no disponible");
     }
   }
 
  return (
    <main className="container">
      <section className="card">
        <h1 className="title">Nueva campaña</h1>
        <p className="subtitle">Define el canal, el copy y el destino de tu anuncio. Contenido de ejemplo: recomendaciones de copy, destino y estimaciones de CTR.</p>
        <form onSubmit={onSubmit} className="form">
          <label className="label">
            Channel ID
            <input className="input" value={channelId} onChange={(e) => setChannelId(e.target.value)} />
          </label>
          <label className="label">
            Copy
            <textarea className="textarea" value={copyText} onChange={(e) => setCopyText(e.target.value)} rows={4} />
          </label>
          <label className="label">
            Destination URL
            <input className="input" value={destinationUrl} onChange={(e) => setDestinationUrl(e.target.value)} type="url" />
          </label>
          <div className="row">
            <button type="submit" className="btn btn-primary" disabled={status === "Creando..."}>
              Crear
            </button>
            {status && <span className="badge">{status}</span>}
          </div>
        </form>
        <div className="row" style={{ marginTop: "0.75rem" }}>
          <a className="btn" href="/channels">
            Canales
          </a>
          <a className="btn" href="/campaigns/inbox">
            Mis campañas
          </a>
        </div>
      </section>
    </main>
  );
 }
