 "use client";
 
  import { useEffect, useMemo, useState } from "react";
  import { apiFetch, getApiUrl } from "../../lib/api";
 
 type DashboardData = {
   window_days: number;
   kpis: {
     revenue_usd: number;
     publications: number;
     requests_new: number;
     avg_turnaround_days: number;
   };
   secondary: {
     avg_price_usd: number;
     fill_rate_pct: number;
     dofollow_rate_pct: number;
     ctr_pct: number | null;
   };
   requests_pending: Array<{ id: string; advertiserEmail: string; blogName: string; type: string | null; proposedPrice: number; status: string; createdAt: string }>;
   upcoming_publications: Array<{ id: string; blogName: string; status: string; requestedStart: string | null }>;
   recent_publications: Array<{ id: string; blogName: string; publishedUrl: string; proofStatus: string }>;
   billing: { earnings_month_usd: number; pending_payouts_usd: number; invoices: Array<{ code: string; amount: number; status: string; createdAt: string }> };
   activity: Array<{ type: string; createdAt: string; meta?: unknown }>;
 };
 
 export default function BlogDashboard() {
   const [period, setPeriod] = useState<"7" | "30" | "90">("30");
   const [status, setStatus] = useState("");
   const [data, setData] = useState<DashboardData | null>(null);
   const fmtDate = useMemo(() => new Intl.DateTimeFormat("es-ES", { year: "numeric", month: "short", day: "2-digit" }), []);
   const fmtTime = useMemo(() => new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit" }), []);
 
  useEffect(() => {
    setStatus("Cargando…");
    apiFetch(`/dashboard/blog?period=${period}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((rows) => {
        setData(rows as DashboardData);
        setStatus("");
      })
      .catch(() => setStatus("API no disponible"));
  }, [period]);
 
   return (
     <main className="container">
       <section className="card reveal">
         <div className="spaced">
           <div>
             <h1 className="title">Centro de monetización SEO</h1>
             <p className="subtitle">Solicitudes, publicaciones e ingresos en un solo lugar.</p>
           </div>
           <div className="row" style={{ gap: "0.5rem", alignItems: "center" }}>
             <span className="muted">Periodo</span>
             {(["7", "30", "90"] as const).map((p) => (
               <button
                 key={p}
                 className={`filter-chip ${period === p ? "active" : ""}`}
                 onClick={() => setPeriod(p)}
                 type="button"
               >
                 {p === "7" ? "Últimos 7 días" : p === "30" ? "Últimos 30 días" : "Últimos 90 días"}
               </button>
             ))}
           </div>
         </div>
        {status && <div className="badge mt-xs" role="status" aria-live="polite">{status}</div>}
 
         <div className="grid-split mt-sm">
           <div className="feature-card">
             <div className="kpi-grid">
               <div className="kpi"><div className="label">Ingresos</div><div className="value">USD {data?.kpis.revenue_usd ?? 0}</div></div>
               <div className="kpi"><div className="label">Publicaciones</div><div className="value">{data?.kpis.publications ?? 0}</div></div>
               <div className="kpi"><div className="label">Solicitudes nuevas</div><div className="value">{data?.kpis.requests_new ?? 0}</div></div>
               <div className="kpi"><div className="label">Tiempo medio entrega</div><div className="value">{data?.kpis.avg_turnaround_days ?? 0} días</div></div>
             </div>
           </div>
           <div className="feature-card">
             <div className="kpi-grid">
               <div className="kpi"><div className="label">Precio medio</div><div className="value">USD {data?.secondary.avg_price_usd ?? 0}</div></div>
               <div className="kpi"><div className="label">Fill rate</div><div className="value">{data?.secondary.fill_rate_pct ?? 0}%</div></div>
               <div className="kpi"><div className="label">Dofollow rate</div><div className="value">{data?.secondary.dofollow_rate_pct ?? 0}%</div></div>
               <div className="kpi"><div className="label">CTR</div><div className="value">{typeof data?.secondary.ctr_pct === "number" ? `${data?.secondary.ctr_pct}%` : "—"}</div></div>
             </div>
           </div>
         </div>
 
         <div className="spaced mt-md">
           <div>
             <h2 className="exec-section-title">Solicitudes pendientes</h2>
             <p className="exec-section-sub">Responde rápido para maximizar fill rate.</p>
           </div>
         </div>
         {data?.requests_pending?.length ? (
           <ul className="list exec-clean-list mt-sm">
             {data.requests_pending.map((r) => (
               <li key={r.id} className="list-item">
                 <div className="spaced">
                   <div>
                     <div style={{ fontWeight: 950 }}>
                       {r.advertiserEmail} · {r.blogName} · {r.type ?? "—"} · USD {r.proposedPrice}
                     </div>
                     <div className="muted mt-xs">{new Date(r.createdAt).toLocaleString("es-ES")}</div>
                   </div>
                   <div className="row" style={{ gap: "0.5rem" }}>
                     <a className="btn btn-primary btn-sm" href={`/orders/${r.id}`}>Ver detalle</a>
                     <a className="btn btn-secondary btn-sm" href={`/orders/${r.id}`}>Aceptar</a>
                     <a className="btn btn-outline btn-sm" href={`/orders/${r.id}`}>Rechazar</a>
                   </div>
                 </div>
               </li>
             ))}
           </ul>
         ) : (
           <div className="feature-card exec-action-card mt-sm">
             <h2 className="exec-section-title">Aún no tienes solicitudes</h2>
             <p className="exec-section-sub">Registra tu blog y define ofertas para empezar a recibir propuestas.</p>
             <div className="row mt-sm" style={{ gap: "0.75rem" }}>
               <a className="btn btn-primary btn-lg" href="/blogs/new">Registrar blog</a>
               <a className="btn btn-secondary btn-lg" href="/blogs">Crear oferta</a>
             </div>
           </div>
         )}
 
         <div className="spaced mt-md">
           <div>
             <h2 className="exec-section-title">Próximas publicaciones</h2>
           </div>
         </div>
         {data?.upcoming_publications?.length ? (
           <ul className="list exec-clean-list mt-sm">
             {data.upcoming_publications.map((p) => {
               const when = p.requestedStart ? new Date(p.requestedStart) : null;
               const date = when ? fmtDate.format(when) : "Sin fecha";
               const time = when ? fmtTime.format(when) : "";
               return (
                 <li key={p.id} className="list-item">
                   <div className="spaced">
                     <div>
                       <div style={{ fontWeight: 950 }}>{date}{time ? ` · ${time}` : ""} · {p.blogName}</div>
                       <div className="muted mt-xs">{p.status}</div>
                     </div>
                     <div className="row" style={{ gap: "0.5rem" }}>
                       <a className="btn btn-outline btn-sm" href={`/orders/${p.id}`}>Ver detalle</a>
                       <a className="btn btn-secondary btn-sm" href={`/orders/${p.id}`}>Actualizar estado</a>
                     </div>
                   </div>
                 </li>
               );
             })}
           </ul>
         ) : (
           <div className="feature-card exec-action-card mt-sm">
             <h2 className="exec-section-title">No hay publicaciones próximas</h2>
             <p className="exec-section-sub">Acepta solicitudes y programa la publicación.</p>
           </div>
         )}
 
         <div className="spaced mt-md">
           <div>
             <h2 className="exec-section-title">Publicadas recientemente</h2>
           </div>
         </div>
         {data?.recent_publications?.length ? (
           <ul className="list exec-clean-list mt-sm">
             {data.recent_publications.map((p) => (
               <li key={p.id} className="list-item">
                 <div className="spaced">
                   <div>
                     <div style={{ fontWeight: 950 }}>{p.blogName}</div>
                     <div className="muted mt-xs">{p.publishedUrl}</div>
                   </div>
                   <div className="row" style={{ gap: "0.5rem" }}>
                     <span className="badge">{p.proofStatus}</span>
                     <a className="btn btn-outline btn-sm" href={`/orders/${p.id}`}>Verificar</a>
                   </div>
                 </div>
               </li>
             ))}
           </ul>
         ) : (
           <div className="feature-card exec-action-card mt-sm">
             <h2 className="exec-section-title">Aún no hay publicaciones recientes</h2>
             <p className="exec-section-sub">Publica y verifica para ver resultados aquí.</p>
           </div>
         )}
 
         <div className="spaced mt-md">
           <div>
             <h2 className="exec-section-title">Optimiza tus ingresos</h2>
             <p className="exec-section-sub">Recomendaciones basadas en demanda y rendimiento.</p>
           </div>
         </div>
         <div className="grid-split mt-sm">
           <div className="feature-card">
             <h3 className="feature-title">Añade oferta de Link insertion (alta demanda)</h3>
             <p className="feature-desc">Gestiona ofertas para captar la demanda retenida.</p>
             <a className="btn btn-secondary" href="/blogs">Gestionar ofertas</a>
           </div>
           <div className="feature-card">
             <h3 className="feature-title">Ajusta categorías para recibir mejores briefs</h3>
             <p className="feature-desc">Configura categorías precisas por blog.</p>
             <a className="btn btn-secondary" href="/blogs">Gestionar blogs</a>
           </div>
         </div>
 
         <div className="spaced mt-md">
           <div>
             <h2 className="exec-section-title">Mis blogs</h2>
           </div>
         </div>
         <BlogsList />
 
         <div className="spaced mt-md">
           <div>
             <h2 className="exec-section-title">Facturación</h2>
           </div>
         </div>
         <BillingBlock />
 
         <div className="spaced mt-md">
           <div>
             <h2 className="exec-section-title">Actividad reciente</h2>
           </div>
         </div>
         <ActivityBlock />
       </section>
     </main>
   );
 }
 
 function BlogsList() {
   const [items, setItems] = useState<Array<{ id: string; name: string; domain: string; status: string; monthlyTraffic: number | null; categories: string; offers: string }>>([]);
  const [status, setStatus] = useState("");
  const apiUrl = getApiUrl();
  useEffect(() => {
    setStatus("Cargando…");
    apiFetch(`/blogs`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((rows) => {
        setItems(rows as typeof items);
        setStatus("");
      })
      .catch(() => setStatus("API no disponible"));
  }, []);
 
  if (status) return <div className="badge mt-xs" role="status" aria-live="polite">{status}</div>;
   if (!items.length)
     return (
       <div className="feature-card exec-action-card mt-sm">
         <h2 className="exec-section-title">No hay blogs</h2>
         <p className="exec-section-sub">Regístralos y verifica propiedad para empezar.</p>
         <div className="row mt-sm" style={{ gap: "0.75rem" }}>
           <a className="btn btn-primary btn-lg" href="/blogs/new">Registrar blog</a>
           <a className="btn btn-secondary btn-lg" href="/about">Guía rápida</a>
         </div>
       </div>
     );
   return (
     <ul className="list exec-clean-list mt-sm">
       {items.map((b) => (
         <li key={b.id} className="list-item">
           <div className="spaced">
             <div>
               <div style={{ fontWeight: 950 }}>{b.name} · {b.domain}</div>
               <div className="muted mt-xs">
                 <span className="badge">{b.status}</span> · Tráfico: {b.monthlyTraffic ?? "—"} · Categorías: {b.categories}
               </div>
             </div>
             <div className="row" style={{ gap: "0.5rem" }}>
               <a className="btn btn-primary btn-sm" href={`/blogs/${b.id}`}>Gestionar</a>
               <a className="btn btn-secondary btn-sm" href={`/blogs/${b.id}/offers`}>Ver ofertas ({b.offers})</a>
               <a className="btn btn-outline btn-sm" href={`/blogs/${b.id}/analytics`}>Ver rendimiento</a>
             </div>
           </div>
         </li>
       ))}
     </ul>
   );
 }
 
 function BillingBlock() {
  const [status, setStatus] = useState("");
  const [invoices, setInvoices] = useState<Array<{ code: string; amount: number; status: string; createdAt: string }>>([]);
  const [summary, setSummary] = useState<{ earnings: number; pending: number } | null>(null);
  const apiUrl = getApiUrl();
  useEffect(() => {
    setStatus("Cargando…");
    apiFetch(`/dashboard/blog?period=30`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((rows) => {
        const d = rows as DashboardData;
        setInvoices(d.billing.invoices);
        setSummary({ earnings: d.billing.earnings_month_usd, pending: d.billing.pending_payouts_usd });
        setStatus("");
      })
      .catch(() => setStatus("API no disponible"));
  }, []);
  if (status) return <div className="badge mt-xs" role="status" aria-live="polite">{status}</div>;
   return (
     <div className="feature-card mt-sm">
       <div className="kpi-grid">
         <div className="kpi"><div className="label">Ingresos del mes</div><div className="value">USD {summary?.earnings ?? 0}</div></div>
         <div className="kpi"><div className="label">Pagos pendientes</div><div className="value">USD {summary?.pending ?? 0}</div></div>
       </div>
       <div className="mt-sm">
         {invoices.length ? (
           <ul className="list exec-clean-list">
             {invoices.map((inv) => (
               <li key={inv.code} className="list-item">
                 <div className="spaced">
                   <div>
                     <div style={{ fontWeight: 950 }}>{inv.code} · USD {inv.amount}</div>
                     <div className="muted mt-xs">{inv.status} · {new Date(inv.createdAt).toLocaleString("es-ES")}</div>
                   </div>
                 </div>
               </li>
             ))}
           </ul>
         ) : (
           <div className="exec-section-sub">Todavía no hay liquidaciones.</div>
         )}
       </div>
     </div>
   );
 }
 
 function ActivityBlock() {
   return (
     <div className="feature-card mt-sm">
       <div className="exec-section-sub">Aún no hay actividad reciente.</div>
     </div>
   );
 }
