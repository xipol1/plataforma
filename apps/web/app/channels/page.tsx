"use client";

import { useEffect, useRef, useState } from "react";
 
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
  const [selectedFeatured, setSelectedFeatured] = useState<typeof featured[number] | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  function fmtNumber(n: number) { return n.toLocaleString("en-US"); }
  function fmtUSD(n: number) { return `USD ${n}`; }
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
 
  const filler = [
    { id: "f1", name: "Hacking Ético España", category: "seguridad", audienceSize: 8700, pricePerPost: 105, platform: "TELEGRAM", publishedCount: 9 },
    { id: "f2", name: "Cocina Creativa MX", category: "food", audienceSize: 15300, pricePerPost: 85, platform: "TELEGRAM", publishedCount: 17 },
    { id: "f3", name: "Startups Madrid", category: "negocios", audienceSize: 11800, pricePerPost: 130, platform: "TELEGRAM", publishedCount: 21 },
    { id: "f4", name: "Viajes Low Cost LATAM", category: "viajes", audienceSize: 20450, pricePerPost: 90, platform: "TELEGRAM", publishedCount: 26 },
  ];

  const items = channels.length > 0 ? channels : filler;

  useEffect(() => {
    if (selectedFeatured || selectedChannel) {
      document.body.style.overflow = "hidden";
      closeBtnRef.current?.focus();
    } else {
      document.body.style.overflow = "";
    }
  }, [selectedFeatured, selectedChannel]);

  return (
    <main className="container">
      <section className="card reveal">
        <h1 className="title">Canales</h1>
        <p className="subtitle">Explora y crea campañas en canales activos.</p>
        <div style={{ marginBottom: "0.75rem" }}>
          <h2 className="title">Ejemplos destacados</h2>
          <div className="carousel-marquee">
            <div className="carousel-track marquee-anim">
              {[...featured, ...featured].map((f, i) => (
                <div key={i} className="carousel-card" onClick={() => setSelectedFeatured(f)}>
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
          {items.map((c, i) => (
              <div key={c.id} className="channel-card" onClick={() => setSelectedChannel(c)}>
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
            ))}
        </div>
        {(selectedFeatured || selectedChannel) && (
          <div className="modal-backdrop" onClick={() => { setSelectedFeatured(null); setSelectedChannel(null); document.body.style.overflow=""; }}>
            <div
              className="modal-card"
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title-channels"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => { if (e.key === "Escape") { setSelectedFeatured(null); setSelectedChannel(null); document.body.style.overflow=""; } }}
              tabIndex={-1}
            >
              <div className="modal-header">
                <h3 id="modal-title-channels" className="modal-title">{(selectedFeatured?.name ?? selectedChannel?.name) ?? ""}</h3>
                <button ref={closeBtnRef} className="modal-close" onClick={() => { setSelectedFeatured(null); setSelectedChannel(null); document.body.style.overflow=""; }}>Cerrar</button>
              </div>
              <div className="modal-content">
                <div>
                  <div className="modal-kpis">
                    <div className="kpi"><div className="label">Audiencia</div><div className="value">{fmtNumber((selectedFeatured?.audienceSize ?? selectedChannel?.audienceSize) ?? 0)}</div></div>
                    <div className="kpi"><div className="label">Precio</div><div className="value">{fmtUSD((selectedFeatured?.pricePerPost ?? selectedChannel?.pricePerPost) ?? 0)}</div></div>
                    <div className="kpi"><div className="label">Anuncios</div><div className="value">{fmtNumber((selectedFeatured?.publishedCount ?? selectedChannel?.publishedCount ?? 0))}</div></div>
                    <div className="kpi"><div className="label">Plataforma</div><div className="value">{(selectedFeatured?.platform ?? selectedChannel?.platform) ?? ""}</div></div>
                  </div>
                  <div className="grid" style={{ gridTemplateColumns: "2fr 1fr", marginTop: "0.75rem", alignItems: "center" }}>
                    <svg className="line-chart" viewBox="0 0 600 180" preserveAspectRatio="none">
                      <polyline
                        fill="none"
                        stroke="var(--success)"
                        strokeWidth="2"
                        points={[30, 50, 40, 60, 45, 70]
                          .map((v, idx) => {
                            const x = (idx / (6 - 1)) * 600;
                            const max = 70;
                            const y = 180 - (v / max) * 150 - 10;
                            return `${x},${y}`;
                          })
                          .join(" ")}
                      />
                    </svg>
                    <div className="donut" />
                  </div>
                </div>
                <div>
                  <div className="kpi-grid">
                    <div className="kpi"><div className="label">Categoría</div><div className="value">{(selectedFeatured?.category ?? selectedChannel?.category) ?? ""}</div></div>
                    <div className="kpi"><div className="label">Precio medio</div><div className="value">USD {(selectedFeatured?.pricePerPost ?? selectedChannel?.pricePerPost) ?? ""}</div></div>
                    <div className="kpi"><div className="label">Anuncios previos</div><div className="value">{(selectedFeatured?.publishedCount ?? selectedChannel?.publishedCount ?? 0).toLocaleString("en-US")}</div></div>
                    <div className="kpi"><div className="label">Estado</div><div className="value">Activo</div></div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <a className="btn" href="/channels">Ver otros canales</a>
                <a className="btn btn-primary" href={`/campaigns/new?channelId=${selectedChannel?.id ?? ""}`}>Crear campaña</a>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
 }
