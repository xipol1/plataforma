 "use client";
 
 import { useEffect, useState } from "react";
 
 type Channel = {
   id: string;
   name: string;
   category: string;
   audienceSize: number;
   pricePerPost: number;
   platform: string;
  publishedCount?: number;
 };
 
 export default function ChannelsPage() {
   const [channels, setChannels] = useState<Channel[]>([]);
   const [status, setStatus] = useState("");
  const featured = [
    { name: "Crypto Daily LATAM", category: "crypto", audienceSize: 18000, pricePerPost: 120, platform: "TELEGRAM", publishedCount: 22 },
    { name: "Ecommerce Growth Hub", category: "ecommerce", audienceSize: 9600, pricePerPost: 90, platform: "TELEGRAM", publishedCount: 15 },
    { name: "Finanzas Personales Pro", category: "finanzas", audienceSize: 22000, pricePerPost: 150, platform: "TELEGRAM", publishedCount: 31 },
    { name: "IA Builders ESP", category: "tecnología", audienceSize: 12500, pricePerPost: 110, platform: "TELEGRAM", publishedCount: 12 },
    { name: "Gaming Indies LATAM", category: "gaming", audienceSize: 14200, pricePerPost: 95, platform: "TELEGRAM", publishedCount: 18 },
  ];
 
   useEffect(() => {
     const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
     fetch(`${apiUrl}/channels?limit=20`)
       .then((r) => r.json())
       .then((data) => {
         if (Array.isArray(data)) {
           setChannels(data);
           setStatus("");
         } else {
           setStatus("Error cargando canales");
           setChannels([]);
         }
       })
       .catch(() => {
         setStatus("API no disponible");
         setChannels([]);
       });
   }, []);
 
  return (
    <main className="container">
      <section className="card">
        <h1 className="title">Canales</h1>
        <p className="subtitle">Explora y crea campañas en canales activos.</p>
        <div style={{ marginBottom: "0.75rem" }}>
          <h2 className="title">Ejemplos destacados</h2>
          <div className="carousel-marquee">
            <div className="carousel-track marquee-anim">
              {[...featured, ...featured].map((f, i) => (
                <div key={i} className="carousel-card">
                  <h3 className="carousel-title">{f.name}</h3>
                  <div className="carousel-meta">
                    {f.category} · {f.platform} · {f.audienceSize} suscr.
                  </div>
                  <div className="carousel-footer">
                    <span className="badge badge-success">{f.pricePerPost} USD</span>
                    <span className="badge">Anuncios: {f.publishedCount}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {status && <p className="badge">{status}</p>}
        <div className="channels-grid">
          {channels.length === 0 ? (
            <div className="channel-card">No hay canales disponibles</div>
          ) : (
            [...channels,
              { id: "f1", name: "Hacking Ético España", category: "seguridad", audienceSize: 8700, pricePerPost: 105, platform: "TELEGRAM", publishedCount: 9 },
              { id: "f2", name: "Cocina Creativa MX", category: "food", audienceSize: 15300, pricePerPost: 85, platform: "TELEGRAM", publishedCount: 17 },
              { id: "f3", name: "Startups Madrid", category: "negocios", audienceSize: 11800, pricePerPost: 130, platform: "TELEGRAM", publishedCount: 21 },
              { id: "f4", name: "Viajes Low Cost LATAM", category: "viajes", audienceSize: 20450, pricePerPost: 90, platform: "TELEGRAM", publishedCount: 26 },
            ].map((c) => (
              <div key={c.id} className="channel-card">
                <div>
                  <h3 className="channel-title">{c.name}</h3>
                  <div className="channel-meta">
                    {c.category} · {c.platform} · {c.audienceSize} suscr.
                  </div>
                </div>
                <div className="channel-footer">
                  <span className="badge badge-success">{c.pricePerPost} USD</span>
                  <span className="badge">Anuncios: {c.publishedCount ?? 0}</span>
                </div>
                <div className="row" style={{ marginTop: "0.5rem" }}>
                  <a href={`/campaigns/new?channelId=${c.id}`} className="btn btn-primary">Crear campaña</a>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
 }
