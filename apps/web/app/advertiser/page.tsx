 "use client";
 
 import { useEffect, useState } from "react";
 
 export default function AdvertiserDashboard() {
   const [status, setStatus] = useState("");
  const [summary, setSummary] = useState({
     total: 0,
     paid: 0,
     published: 0,
     impressions: 0,
     clicks: 0,
     ctr: 0,
     conversions: 0,
     cvr: 0,
     spend: 0,
     roas: 0,
   });
 
   useEffect(() => {
     const token = localStorage.getItem("token") ?? "";
     if (!token) {
       setStatus("Necesitas login como anunciante");
       return;
     }
     setStatus("");
   }, []);
 
  const clicksByMonth = [95, 110, 120, 140, 160, 180, 175, 190, 210, 235, 260, 280];
  const max = Math.max(...clicksByMonth);

  return (
    <main className="container">
      <section className="card reveal">
        <h1 className="title">Resumen</h1>
        <p className="subtitle">Tu rendimiento a vista de pájaro y accesos a acciones clave.</p>
        {status && <div className="badge">{status}</div>}
        <div className="kpi-grid" style={{ marginBottom: "0.75rem" }}>
          <div className="kpi"><div className="label">Campañas</div><div className="value">{summary.total}</div></div>
          <div className="kpi"><div className="label">Pagadas</div><div className="value">{summary.paid}</div></div>
          <div className="kpi"><div className="label">Publicadas</div><div className="value">{summary.published}</div></div>
          <div className="kpi"><div className="label">Impresiones</div><div className="value">{summary.impressions.toLocaleString("en-US")}</div></div>
          <div className="kpi"><div className="label">Clicks</div><div className="value">{summary.clicks.toLocaleString("en-US")}</div></div>
          <div className="kpi"><div className="label">CTR</div><div className="value">{summary.ctr}%</div></div>
          <div className="kpi"><div className="label">Conversiones</div><div className="value">{summary.conversions}</div></div>
          <div className="kpi"><div className="label">ROAS</div><div className="value">{summary.roas}x</div></div>
        </div>
        <div className="grid" style={{ gridTemplateColumns: "2fr 1fr", gap: "var(--space)" }}>
          <div className="feature-card">
            <h3 className="feature-title">Clicks por mes</h3>
            <div className="chart">
              {clicksByMonth.map((v, i) => (
                <div key={i} className="bar" style={{ height: `${(v / max) * 120}px` }} />
              ))}
            </div>
            <div className="kpi-grid" style={{ marginTop: "0.5rem" }}>
              <div className="kpi"><div className="label">Spend</div><div className="value">USD {summary.spend}</div></div>
              <div className="kpi"><div className="label">CPA</div><div className="value">USD {summary.conversions ? (summary.spend / summary.conversions).toFixed(2) : 0}</div></div>
              <div className="kpi"><div className="label">CPC</div><div className="value">USD {summary.clicks ? (summary.spend / summary.clicks).toFixed(2) : 0}</div></div>
              <div className="kpi"><div className="label">CVR</div><div className="value">{summary.cvr}%</div></div>
            </div>
          </div>
          <div className="feature-card">
            <h3 className="feature-title">Acciones rápidas</h3>
            <div className="grid" style={{ gridTemplateColumns: "1fr", gap: "0.5rem" }}>
              <a className="btn btn-primary" href="/app/advertiser/new">Crear campaña</a>
              <a className="btn" href="/app/advertiser/inbox">Ver mis campañas</a>
              <a className="btn" href="/channels">Explorar canales</a>
            </div>
            <h3 className="feature-title" style={{ marginTop: "0.75rem" }}>Últimos eventos</h3>
            <ul className="list">
              {["Pago intent creado", "Campaña publicada", "Click válido recibido"].map((e, i) => (
                <li key={i} className="list-item">
                  <div className="spaced">
                    <div>{e}</div>
                    <span className="badge">OK</span>
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
