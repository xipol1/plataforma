 "use client";
 
  import { useEffect, useState } from "react";
  import { apiFetch } from "../lib/api";
 
 export default function BlogsPage() {
   const [status, setStatus] = useState("");
   const [items, setItems] = useState<Array<{ id: string; name: string; domain: string; status: string; monthlyTraffic: number | null; categories: string; offers: string }>>([]);
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
 
   return (
     <main className="container">
       <section className="card reveal">
         <div className="spaced">
           <div>
             <h1 className="title">Mis blogs</h1>
             <p className="subtitle">Registra y gestiona tus sitios.</p>
           </div>
           <a className="btn btn-primary" href="/blogs/new">Registrar blog</a>
         </div>
        {status && <div className="badge mt-xs" role="status" aria-live="polite">{status}</div>}
         {items.length ? (
           <ul className="list exec-clean-list mt-sm">
             {items.map((b) => (
               <li key={b.id} className="list-item">
                 <div className="spaced">
                   <div>
                     <div style={{ fontWeight: 950 }}>{b.name} · {b.domain}</div>
                     <div className="muted mt-xs"><span className="badge">{b.status}</span> · Tráfico: {b.monthlyTraffic ?? "—"} · Categorías: {b.categories}</div>
                   </div>
                   <div className="row" style={{ gap: "0.5rem" }}>
                     <a className="btn btn-secondary btn-sm" href={`/blogs/${b.id}/offers`}>Gestionar ofertas ({b.offers})</a>
                   </div>
                 </div>
               </li>
             ))}
           </ul>
         ) : (
           <div className="feature-card exec-action-card mt-sm">
             <h2 className="exec-section-title">No hay blogs</h2>
             <p className="exec-section-sub">Registra tu blog y solicita verificación.</p>
           </div>
         )}
       </section>
     </main>
   );
 }
