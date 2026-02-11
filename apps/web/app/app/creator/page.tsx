 "use client";
 
 import { useEffect, useState } from "react";
 
 export default function CreatorSummary() {
   const [status, setStatus] = useState("");
   const [stats, setStats] = useState({
     published: 0,
     earnings: 0,
     avgPrice: 0,
     audience: 0,
     impressions: 0,
     clicks: 0,
     ctr: 0,
     fillRate: 0,
   });
 
   useEffect(() => {
     const token = localStorage.getItem("token") ?? "";
     if (!token) {
       setStatus("Necesitas login como creador");
       return;
     }
     setStatus("");
   }, []);
 
   const clicksByMonth = [60, 70, 85, 95, 110, 120, 130, 145, 160, 170, 180, 195];
   const max = Math.max(...clicksByMonth);
 
   return (
     <main className="container">
       <section className="card reveal">
         <h1 className="title">Resumen</h1>
         <p className="subtitle">Visión general de tus canales, ingresos y rendimiento.</p>
         {status && <div className="badge">{status}</div>}
         <div className="kpi-grid" style={{ marginBottom: "0.75rem" }}>
           <div className="kpi"><div className="label">Publicadas</div><div className="value">{stats.published}</div></div>
           <div className="kpi"><div className="label">Ingresos</div><div className="value">USD {stats.earnings}</div></div>
           <div className="kpi"><div className="label">Precio medio</div><div className="value">USD {stats.avgPrice}</div></div>
           <div className="kpi"><div className="label">Audiencia</div><div className="value">{stats.audience.toLocaleString("en-US")}</div></div>
           <div className="kpi"><div className="label">Impresiones</div><div className="value">{stats.impressions.toLocaleString("en-US")}</div></div>
           <div className="kpi"><div className="label">Clicks</div><div className="value">{stats.clicks}</div></div>
           <div className="kpi"><div className="label">CTR</div><div className="value">{stats.ctr}%</div></div>
           <div className="kpi"><div className="label">Fill rate</div><div className="value">{stats.fillRate}%</div></div>
         </div>
         <div className="grid" style={{ gridTemplateColumns: "2fr 1fr", gap: "var(--space)" }}>
           <div className="feature-card">
             <h3 className="feature-title">Clicks por mes</h3>
             <div className="chart">
               {clicksByMonth.map((v, i) => (
                 <div key={i} className="bar alt" style={{ height: `${(v / max) * 120}px` }} />
               ))}
             </div>
             <div className="kpi-grid" style={{ marginTop: "0.5rem" }}>
               <div className="kpi"><div className="label">Canales</div><div className="value">3</div></div>
               <div className="kpi"><div className="label">Precio recomendado</div><div className="value">USD {stats.avgPrice}</div></div>
               <div className="kpi"><div className="label">Top CTR</div><div className="value">{Math.max(stats.ctr, 0)}%</div></div>
               <div className="kpi"><div className="label">Top categoría</div><div className="value">tecnología</div></div>
             </div>
           </div>
           <div className="feature-card">
             <h3 className="feature-title">Acciones rápidas</h3>
             <div className="grid" style={{ gridTemplateColumns: "1fr", gap: "0.5rem" }}>
               <a className="btn btn-primary btn-lg" href="/app/creator/channels">Mis canales</a>
               <a className="btn btn-outline btn-lg" href="/app/creator/inbox">Solicitudes</a>
             </div>
             <h3 className="feature-title" style={{ marginTop: "0.75rem" }}>Últimos eventos</h3>
             <ul className="list">
               {["Canal verificado", "Solicitud recibida", "Publicación completada"].map((e, i) => (
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
