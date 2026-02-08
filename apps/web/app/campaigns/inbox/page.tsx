 "use client";
 
 import { useEffect, useState } from "react";
 
 type Campaign = {
   id: string;
   channelId: string;
   status: string;
   destinationUrl: string;
 };
 
 export default function InboxPage() {
   const [items, setItems] = useState<Campaign[]>([]);
   const [status, setStatus] = useState("");
   const [actionMsg, setActionMsg] = useState("");
  const [dashView, setDashView] = useState<"ADVERTISER" | "CREATOR">("ADVERTISER");
 
   async function load() {
     const token = localStorage.getItem("token") ?? "";
     const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
     if (!token) {
       setStatus("Necesitas login");
       return;
     }
     try {
       const r = await fetch(`${apiUrl}/campaigns/inbox`, { headers: { Authorization: `Bearer ${token}` } });
       if (!r.ok) {
         setStatus("Error cargando campañas");
         return;
       }
       const data = await r.json();
       setItems(data);
       setStatus("");
     } catch {
       setStatus("API no disponible");
     }
   }
 
   useEffect(() => {
     void load();
   }, []);
 
   async function intent(campaignId: string) {
     setActionMsg("Creando intent...");
     const token = localStorage.getItem("token") ?? "";
     const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
     try {
       const res = await fetch(`${apiUrl}/payments/intent`, {
         method: "POST",
         headers: {
           "Content-Type": "application/json",
           Authorization: `Bearer ${token}`,
         },
         body: JSON.stringify({ campaignId }),
       });
       if (!res.ok) {
         setActionMsg("Error creando intent");
         return;
       }
       const data = await res.json();
       setActionMsg(`Intent OK: ${data.provider_ref} · ${data.amount} ${data.currency}`);
       void load();
     } catch {
       setActionMsg("API no disponible");
     }
   }
 
  const advertiserStats = {
    total: 8,
    paid: 6,
    published: 5,
    impressions: 112000,
    clicks: 2910,
    ctr: 2.6,
    conversions: 240,
    cvr: 8.2,
    spend: 2350,
    cpc: 0.81,
    cpa: 9.79,
    roas: 2.6,
    refundRate: 0.8,
    clicksByMonth: [95, 110, 120, 140, 160, 180, 175, 190, 210, 235, 260, 280],
  };
  const creatorStats = {
    published: 12,
    earnings: 1780,
    avgPrice: 110,
    audience: 55000,
    impressions: 94000,
    clicks: 1680,
    ctr: 1.8,
    fillRate: 74,
    topCats: ["crypto", "ecommerce", "tecnología"],
    clicksByMonth: [60, 70, 85, 95, 110, 120, 130, 145, 160, 170, 180, 195],
  };

  function Dashboard() {
    if (dashView === "ADVERTISER") {
      return (
        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
          <div className="feature-card">
            <h3 className="feature-title">Campañas</h3>
            <p className="feature-desc">Totales: {advertiserStats.total} · Pagadas: {advertiserStats.paid} · Publicadas: {advertiserStats.published}</p>
          </div>
          <div className="feature-card">
            <h3 className="feature-title">Rendimiento</h3>
            <p className="feature-desc">Impr: {advertiserStats.impressions.toLocaleString("en-US")} · Clicks: {advertiserStats.clicks} · CTR: {advertiserStats.ctr}%</p>
          </div>
          <div className="feature-card">
            <h3 className="feature-title">Gasto</h3>
            <p className="feature-desc">Spend: USD {advertiserStats.spend} · CPC: USD {advertiserStats.cpc} · CPA: USD {advertiserStats.cpa} · ROAS: {advertiserStats.roas}x</p>
          </div>
          <div className="feature-card" style={{ gridColumn: "1 / -1" }}>
            <h3 className="feature-title">Clicks por mes</h3>
            {(() => {
              const max = Math.max(...advertiserStats.clicksByMonth);
              return (
                <div className="chart">
                  {advertiserStats.clicksByMonth.map((v, i) => (
                    <div key={i} className="bar" style={{ height: `${(v / max) * 120}px` }} />
                  ))}
                </div>
              );
            })()}
            <div className="kpi-grid" style={{ marginTop: "0.5rem" }}>
              <div className="kpi"><div className="label">Conversiones</div><div className="value">{advertiserStats.conversions}</div></div>
              <div className="kpi"><div className="label">CVR</div><div className="value">{advertiserStats.cvr}%</div></div>
              <div className="kpi"><div className="label">Refund</div><div className="value">{advertiserStats.refundRate}%</div></div>
              <div className="kpi"><div className="label">ROAS</div><div className="value">{advertiserStats.roas}x</div></div>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
        <div className="feature-card">
          <h3 className="feature-title">Publicadas</h3>
          <p className="feature-desc">{creatorStats.published}</p>
        </div>
        <div className="feature-card">
          <h3 className="feature-title">Ingresos</h3>
          <p className="feature-desc">USD {creatorStats.earnings}</p>
        </div>
        <div className="feature-card">
          <h3 className="feature-title">Precio medio</h3>
          <p className="feature-desc">USD {creatorStats.avgPrice}</p>
        </div>
        <div className="feature-card">
          <h3 className="feature-title">Audiencia</h3>
            <p className="feature-desc">{creatorStats.audience.toLocaleString("en-US")} suscr.</p>
        </div>
        <div className="feature-card">
          <h3 className="feature-title">Rendimiento</h3>
            <p className="feature-desc">Impr: {creatorStats.impressions.toLocaleString("en-US")} · Clicks: {creatorStats.clicks} · CTR: {creatorStats.ctr}%</p>
        </div>
        <div className="feature-card">
          <h3 className="feature-title">Categorías top</h3>
          <p className="feature-desc">{creatorStats.topCats.join(", ")}</p>
        </div>
        <div className="feature-card" style={{ gridColumn: "1 / -1" }}>
          <h3 className="feature-title">Clicks por mes</h3>
          {(() => {
            const max = Math.max(...creatorStats.clicksByMonth);
            return (
              <div className="chart">
                {creatorStats.clicksByMonth.map((v, i) => (
                  <div key={i} className="bar alt" style={{ height: `${(v / max) * 120}px` }} />
                ))}
              </div>
            );
          })()}
          <div className="kpi-grid" style={{ marginTop: "0.5rem" }}>
            <div className="kpi"><div className="label">Fill rate</div><div className="value">{creatorStats.fillRate}%</div></div>
            <div className="kpi"><div className="label">Impresiones</div><div className="value">{creatorStats.impressions.toLocaleString()}</div></div>
            <div className="kpi"><div className="label">Clicks</div><div className="value">{creatorStats.clicks}</div></div>
            <div className="kpi"><div className="label">CTR</div><div className="value">{creatorStats.ctr}%</div></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="container">
      <section className="card reveal">
        <h1 className="title">Mis campañas</h1>
        <p className="subtitle">Gestiona pagos y estados de tus campañas. Datos más visibles y accesos rápidos. Incluye campañas pasadas con resumen para aprender y comparar.</p>
        <div className="row" style={{ marginBottom: "0.5rem" }}>
          <button onClick={() => void load()} className="btn">
            Refrescar
          </button>
          <button
            onClick={() => setDashView(dashView === "ADVERTISER" ? "CREATOR" : "ADVERTISER")}
            className="btn btn-primary"
          >
            {dashView === "ADVERTISER" ? "Ver dashboard Creador" : "Ver dashboard Anunciante"}
          </button>
          {status && <span className="badge">{status}</span>}
          {actionMsg && <span className="badge">{actionMsg}</span>}
        </div>
        <Dashboard />
        <h2 className="title" style={{ marginTop: "0.75rem" }}>Campañas activas</h2>
        <ul className="list">
          {items.map((c) => (
            <li key={c.id} className="list-item">
              <div className="spaced">
                <div>
                  <strong>{c.id}</strong> · Canal {c.channelId}
                </div>
                <div className="badge">{c.status}</div>
              </div>
              <div className="row" style={{ marginTop: "0.5rem" }}>
                <a href={c.destinationUrl} target="_blank" className="btn">
                  Destino
                </a>
                <button onClick={() => intent(c.id)} className="btn btn-primary">
                  Crear pago
                </button>
              </div>
            </li>
          ))}
        </ul>
        <h2 className="title" style={{ marginTop: "0.75rem" }}>Campañas pasadas</h2>
        <ul className="list">
          {[
            { id: "past-ACM-001", with: "Crypto Daily LATAM", summary: "Anuncio de wallet con CTA directo a registro", result: "CTR 2.9%, ROAS 2.4x" },
            { id: "past-ACM-002", with: "Ecommerce Growth Hub", summary: "Promo de envío gratis y 10% descuento", result: "CTR 2.1%, ROAS 1.8x" },
            { id: "past-ACM-003", with: "IA Builders ESP", summary: "Lanzamiento curso IA aplicado al e-commerce", result: "CTR 3.2%, ROAS 3.1x" },
          ].map((p) => (
            <li key={p.id} className="list-item">
              <div className="spaced">
                <div>
                  <strong>{p.id}</strong> · Con {p.with}
                </div>
                <div className="badge">{p.result}</div>
              </div>
              <p className="feature-desc" style={{ marginTop: "0.25rem" }}>{p.summary}</p>
              <div className="kpi-grid" style={{ marginTop: "0.5rem" }}>
                <div className="kpi"><div className="label">Impresiones</div><div className="value">{(42000).toLocaleString("en-US")}</div></div>
                <div className="kpi"><div className="label">Clicks</div><div className="value">{1260}</div></div>
                <div className="kpi"><div className="label">Conversiones</div><div className="value">{98}</div></div>
                <div className="kpi"><div className="label">Spend</div><div className="value">USD {1280}</div></div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
 }
