 "use client";
 
 import { useEffect, useMemo, useState } from "react";
 
 type Channel = {
   id: string;
   name: string;
   category: string;
   audience: number;
   price: number;
   status: "ACTIVE" | "PAUSED" | "PENDING";
   metrics: { impressions: number; clicks: number; ctr: number; earnings: number };
 };
 
 const sampleChannels: Channel[] = [
   { id: "chn-001", name: "Tech Insider ES", category: "tecnología", audience: 12500, price: 85, status: "ACTIVE", metrics: { impressions: 120000, clicks: 3800, ctr: 3.2, earnings: 1240 } },
   { id: "chn-002", name: "Crypto Radar", category: "finanzas", audience: 8200, price: 70, status: "PAUSED", metrics: { impressions: 85000, clicks: 2100, ctr: 2.5, earnings: 680 } },
   { id: "chn-003", name: "Growth Hacks", category: "marketing", audience: 15600, price: 95, status: "ACTIVE", metrics: { impressions: 145000, clicks: 4500, ctr: 3.1, earnings: 1520 } },
 ];
 
 export default function CreatorChannels() {
   const [status, setStatus] = useState("");
   const [items, setItems] = useState<Channel[]>(sampleChannels);
   const [msg, setMsg] = useState("");
 
   useEffect(() => {
     const token = localStorage.getItem("token") ?? "";
     if (!token) {
       setStatus("Necesitas login como creador");
       return;
     }
     setStatus("");
   }, []);
 
   const totalAudience = useMemo(() => items.reduce((sum, c) => sum + c.audience, 0), [items]);
   const monthlyClicks = useMemo(() => [320, 380, 410, 450, 480, 510, 500, 540, 580, 600, 640, 700], []);
   const max = Math.max(...monthlyClicks);
 
   function toggleStatus(id: string) {
     setItems((prev) =>
       prev.map((c) =>
         c.id === id ? { ...c, status: c.status === "ACTIVE" ? "PAUSED" : "ACTIVE" } : c
       )
     );
     setMsg(`Estado de ${id} actualizado`);
   }
 
   return (
     <main className="container">
       <section className="card reveal">
         <h1 className="title">Mis canales</h1>
         <p className="subtitle">Gestiona tus canales, precios y disponibilidad.</p>
         <div className="row" style={{ gap: "0.5rem" }}>
           {status && <span className="badge">{status}</span>}
           {msg && <span className="badge">{msg}</span>}
         </div>
         <div className="kpi-grid" style={{ marginTop: "0.5rem" }}>
           <div className="kpi"><div className="label">Canales activos</div><div className="value">{items.filter(i => i.status === "ACTIVE").length}</div></div>
           <div className="kpi"><div className="label">Audiencia total</div><div className="value">{totalAudience.toLocaleString("en-US")}</div></div>
           <div className="kpi"><div className="label">Ingresos estimados</div><div className="value">USD {items.reduce((s, c) => s + c.metrics.earnings, 0)}</div></div>
           <div className="kpi"><div className="label">CTR medio</div><div className="value">{(items.reduce((s, c) => s + c.metrics.ctr, 0) / items.length).toFixed(2)}%</div></div>
         </div>
 
         <div className="grid" style={{ gridTemplateColumns: "2fr 1fr", gap: "var(--space)", marginTop: "var(--space)" }}>
           <div>
             <div className="channels-grid">
               {items.map((c) => (
                 <div key={c.id} className="channel-card">
                   <div>
                     <h3 className="channel-title">{c.name}</h3>
                     <div className="channel-meta">{c.category} · {c.audience.toLocaleString("en-US")} seguidores</div>
                   </div>
                   <div className="overlay-kpis">
                     <div className="kpi"><div className="label">Impresiones</div><div className="value">{c.metrics.impressions.toLocaleString("en-US")}</div></div>
                     <div className="kpi"><div className="label">Clicks</div><div className="value">{c.metrics.clicks.toLocaleString("en-US")}</div></div>
                     <div className="kpi"><div className="label">CTR</div><div className="value">{c.metrics.ctr}%</div></div>
                     <div className="kpi"><div className="label">Ingresos</div><div className="value">USD {c.metrics.earnings}</div></div>
                   </div>
                   <div className="channel-footer">
                     <span className="badge">{c.status}</span>
                     <div className="row" style={{ gap: "0.4rem" }}>
                       <button className="btn btn-primary btn-sm" onClick={() => toggleStatus(c.id)}>
                         {c.status === "ACTIVE" ? "Pausar" : "Activar"}
                       </button>
                       <a className="btn btn-outline btn-sm" href={`/app/creator/channels/${c.id}`}>Editar</a>
                     </div>
                   </div>
                 </div>
               ))}
             </div>
           </div>
           <div className="feature-card">
             <h3 className="feature-title">Clicks por mes</h3>
             <div className="chart">
               {monthlyClicks.map((v, i) => (
                 <div key={i} className="bar alt" style={{ height: `${(v / max) * 120}px` }} />
               ))}
             </div>
             <div className="kpi-grid" style={{ marginTop: "0.5rem" }}>
               <div className="kpi"><div className="label">Precio medio</div><div className="value">USD {(items.reduce((s, c) => s + c.price, 0) / items.length).toFixed(0)}</div></div>
               <div className="kpi"><div className="label">Top canal</div><div className="value">{items[0]?.name}</div></div>
               <div className="kpi"><div className="label">Disponibilidad</div><div className="value">{items.filter(i => i.status === "ACTIVE").length} activos</div></div>
               <div className="kpi"><div className="label">Pendientes</div><div className="value">{items.filter(i => i.status === "PENDING").length}</div></div>
             </div>
           </div>
         </div>
       </section>
     </main>
   );
 }
