 "use client";
 
  import { useEffect, useState } from "react";
  import { useParams, useRouter } from "next/navigation";
  import { apiFetch, getApiUrl } from "../../../lib/api";
 
 type Offer = {
   id: string;
   type: string;
   basePrice: number;
   currency: string;
   turnaroundDays: number;
   dofollow: boolean;
   sponsoredLabel: boolean;
   constraints: string | null;
   createdAt: string;
 };
 
 export default function BlogOffersPage() {
   const params = useParams<{ id: string }>();
   const id = (params?.id as string) ?? "";
   const router = useRouter();
  const apiUrl = getApiUrl();
   const [status, setStatus] = useState("");
   const [items, setItems] = useState<Offer[]>([]);
   const [form, setForm] = useState({
     type: "SPONSORED_POST",
     basePrice: "",
     currency: "USD",
     turnaroundDays: "7",
     dofollow: true,
     sponsoredLabel: false,
     constraints: "",
   });
 
  async function load() {
    setStatus("Cargando…");
    apiFetch(`/blogs/${id}/offers`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((rows) => {
        setItems(rows as Offer[]);
        setStatus("");
      })
      .catch(() => setStatus("API no disponible"));
  }
   useEffect(() => {
     if (id) void load();
   }, [id]);
 
   async function onCreate(e: React.FormEvent) {
     e.preventDefault();
     setStatus("Guardando…");
     const payload = {
       type: form.type,
       basePrice: Number(form.basePrice),
       currency: form.currency,
       turnaroundDays: Number(form.turnaroundDays),
       dofollow: form.dofollow,
       sponsoredLabel: form.sponsoredLabel,
       constraints: form.constraints || undefined,
     };
    try {
      const r = await apiFetch(`/blogs/${id}/offers`, {
         method: "POST",
        headers: { "Content-Type": "application/json" },
         body: JSON.stringify(payload),
       });
       const data = await r.json().catch(() => ({}));
       if (!r.ok) {
         setStatus((data as { message?: string }).message ?? "Error guardando");
         return;
       }
       setStatus("");
       setForm({ ...form, basePrice: "", turnaroundDays: "7", constraints: "" });
       void load();
     } catch {
       setStatus("API no disponible");
     }
   }
 
   return (
     <main className="container">
       <section className="card reveal">
         <div className="spaced">
           <div>
             <h1 className="title">Ofertas del blog</h1>
             <p className="subtitle">Crea y ajusta las ofertas disponibles.</p>
           </div>
           <a className="btn btn-outline" href="/blogs">Volver</a>
         </div>
        {status && <div className="badge mt-xs" role="status" aria-live="polite">{status}</div>}
 
         <form className="form mt-sm" onSubmit={onCreate}>
           <div className="grid-split">
             <label className="label">
               Tipo
               <select className="select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                 <option value="SPONSORED_POST">Sponsored post</option>
                 <option value="LINK_INSERTION">Link insertion</option>
                 <option value="HOMEPAGE_MENTION">Homepage mention</option>
               </select>
             </label>
             <label className="label">
               Precio base (USD)
               <input className="input" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: e.target.value })} />
             </label>
             <label className="label">
               SLA (días)
               <input className="input" value={form.turnaroundDays} onChange={(e) => setForm({ ...form, turnaroundDays: e.target.value })} />
             </label>
           </div>
           <div className="grid-split">
             <label className="label">
               Dofollow
               <select className="select" value={form.dofollow ? "yes" : "no"} onChange={(e) => setForm({ ...form, dofollow: e.target.value === "yes" })}>
                 <option value="yes">Sí</option>
                 <option value="no">No</option>
               </select>
             </label>
             <label className="label">
               Etiqueta sponsored
               <select className="select" value={form.sponsoredLabel ? "yes" : "no"} onChange={(e) => setForm({ ...form, sponsoredLabel: e.target.value === "yes" })}>
                 <option value="yes">Sí</option>
                 <option value="no">No</option>
               </select>
             </label>
           </div>
           <label className="label">Restricciones<input className="input" value={form.constraints} onChange={(e) => setForm({ ...form, constraints: e.target.value })} placeholder="temas prohibidos, casinos…" /></label>
           <div className="row mt-sm" style={{ gap: "0.5rem" }}>
             <button className="btn btn-primary" type="submit">Crear oferta</button>
           </div>
         </form>
 
         <div className="mt-md">
           <h2 className="exec-section-title">Ofertas existentes</h2>
           {items.length ? (
             <ul className="list exec-clean-list mt-sm">
               {items.map((o) => (
                 <li key={o.id} className="list-item">
                   <div className="spaced">
                     <div>
                       <div style={{ fontWeight: 950 }}>{o.type} · USD {o.basePrice}</div>
                       <div className="muted mt-xs">SLA: {o.turnaroundDays} días · dofollow: {o.dofollow ? "sí" : "no"} · sponsored: {o.sponsoredLabel ? "sí" : "no"}</div>
                     </div>
                   </div>
                 </li>
               ))}
             </ul>
           ) : (
             <div className="exec-section-sub">Aún no hay ofertas.</div>
           )}
         </div>
       </section>
     </main>
   );
 }
