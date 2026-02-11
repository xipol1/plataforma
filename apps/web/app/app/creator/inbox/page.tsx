 "use client";
 
 import { useEffect, useState } from "react";
 
 type Request = {
   id: string;
   campaignId: string;
   brand: string;
   title: string;
   priceOffered: number;
   scheduledAt?: string;
   status: "PENDING" | "ACCEPTED" | "REJECTED";
   destinationUrl: string;
 };
 
 const sampleRequests: Request[] = [
   { id: "req-001", campaignId: "ACM-2026-001", brand: "Semjuice", title: "Post SEO tips · 1 publicación", priceOffered: 120, scheduledAt: "2026-02-12 11:00", status: "PENDING", destinationUrl: "https://semjuice.com/" },
   { id: "req-002", campaignId: "ACM-2026-002", brand: "Shopify", title: "Promo app descuentos · 2 publicaciones", priceOffered: 210, status: "PENDING", destinationUrl: "https://shopify.com/apps" },
   { id: "req-003", campaignId: "ACM-2026-003", brand: "IA Builders", title: "Curso IA aplicado · 1 publicación", priceOffered: 90, scheduledAt: "2026-02-14 18:00", status: "ACCEPTED", destinationUrl: "https://iabuilders.example/" },
 ];
 
 export default function CreatorInbox() {
   const [status, setStatus] = useState("");
   const [items, setItems] = useState<Request[]>(sampleRequests);
   const [actionMsg, setActionMsg] = useState("");
 
   useEffect(() => {
     const token = localStorage.getItem("token") ?? "";
     if (!token) {
       setStatus("Necesitas login como creador");
       return;
     }
     setStatus("");
   }, []);
 
   function accept(id: string) {
     setItems((prev) => prev.map((r) => (r.id === id ? { ...r, status: "ACCEPTED" } : r)));
     setActionMsg(`Solicitud ${id} aceptada`);
   }
   function reject(id: string) {
     setItems((prev) => prev.map((r) => (r.id === id ? { ...r, status: "REJECTED" } : r)));
     setActionMsg(`Solicitud ${id} rechazada`);
   }
   function proposeSchedule(id: string) {
     const when = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().slice(0, 16).replace("T", " ");
     setItems((prev) => prev.map((r) => (r.id === id ? { ...r, scheduledAt: when, status: "PENDING" } : r)));
     setActionMsg(`Propuesto ${when} para ${id}`);
   }
 
   return (
     <main className="container">
       <section className="card reveal">
         <h1 className="title">Solicitudes de publicaciones</h1>
         <p className="subtitle">Aprueba, rechaza o propone horario para las solicitudes entrantes.</p>
         <div className="row" style={{ gap: "0.5rem" }}>
           {status && <span className="badge">{status}</span>}
           {actionMsg && <span className="badge">{actionMsg}</span>}
         </div>
         <ul className="list" style={{ marginTop: "0.5rem" }}>
           {items.map((r) => (
             <li key={r.id} className="list-item">
               <div className="spaced">
                 <div>
                   <strong>{r.title}</strong> · {r.brand} · {r.campaignId}
                   <div className="muted" style={{ marginTop: "0.25rem" }}>
                     Oferta: USD {r.priceOffered} · {r.scheduledAt ? `Propuesto: ${r.scheduledAt}` : "Sin horario propuesto"}
                   </div>
                 </div>
                 <div className="row" style={{ gap: "0.5rem" }}>
                   <span className="badge">{r.status}</span>
                   <a href={r.destinationUrl} className="btn btn-outline btn-sm" target="_blank">Destino</a>
                   <button className="btn btn-success btn-sm" onClick={() => accept(r.id)}>Aceptar</button>
                   <button className="btn btn-danger btn-sm" onClick={() => reject(r.id)}>Rechazar</button>
                   <button className="btn btn-secondary btn-sm" onClick={() => proposeSchedule(r.id)}>Proponer horario</button>
                 </div>
               </div>
             </li>
           ))}
         </ul>
       </section>
     </main>
   );
 }
