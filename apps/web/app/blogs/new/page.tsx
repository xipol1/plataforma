 "use client";
 
  import { useState } from "react";
  import { apiFetch } from "../../lib/api";
  import { useRouter } from "next/navigation";
 
 export default function NewBlogPage() {
   const router = useRouter();
   const [status, setStatus] = useState("");
   const [form, setForm] = useState({
     name: "",
     domain: "",
     language: "es",
     country: "",
     categories: "",
     monthlyTraffic: "",
     DR: "",
     DA: "",
     indexedPages: "",
   });
 
   async function onSubmit(e: React.FormEvent) {
     e.preventDefault();
     setStatus("Guardando…");
     const payload = {
       name: form.name,
       domain: form.domain,
       language: form.language,
       country: form.country || undefined,
       categories: form.categories.split(",").map((s) => s.trim()).filter(Boolean),
       monthlyTraffic: form.monthlyTraffic ? Number(form.monthlyTraffic) : undefined,
       DR: form.DR ? Number(form.DR) : undefined,
       DA: form.DA ? Number(form.DA) : undefined,
       indexedPages: form.indexedPages ? Number(form.indexedPages) : undefined,
     };
    try {
      const r = await apiFetch(`/blogs`, {
         method: "POST",
        headers: { "Content-Type": "application/json" },
         body: JSON.stringify(payload),
       });
       const data = await r.json().catch(() => ({}));
       if (!r.ok) {
         setStatus((data as { message?: string }).message ?? "Error guardando");
         return;
       }
       router.replace(`/blogs/${data.id}/offers`);
     } catch {
       setStatus("API no disponible");
     }
   }
 
   return (
     <main className="container">
       <section className="card reveal">
         <div className="spaced">
           <div>
             <h1 className="title">Registrar blog</h1>
             <p className="subtitle">Guardar y solicitar verificación.</p>
           </div>
           <a className="btn btn-outline" href="/blogs">Volver</a>
         </div>
         {status && <div className="badge mt-xs" role="status" aria-live="polite">{status}</div>}
         <form className="form mt-sm" onSubmit={onSubmit}>
           <label className="label">Nombre<input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
           <label className="label">Dominio<input className="input" value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} placeholder="https://tu.blog" /></label>
           <label className="label">Idioma<input className="input" value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} /></label>
           <label className="label">País (opcional)<input className="input" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></label>
           <label className="label">Categorías (coma)<input className="input" value={form.categories} onChange={(e) => setForm({ ...form, categories: e.target.value })} placeholder="marketing, tecnología" /></label>
           <div className="grid-split">
             <label className="label">Tráfico mensual<input className="input" value={form.monthlyTraffic} onChange={(e) => setForm({ ...form, monthlyTraffic: e.target.value })} /></label>
             <label className="label">DR<input className="input" value={form.DR} onChange={(e) => setForm({ ...form, DR: e.target.value })} /></label>
             <label className="label">DA<input className="input" value={form.DA} onChange={(e) => setForm({ ...form, DA: e.target.value })} /></label>
             <label className="label">Páginas indexadas<input className="input" value={form.indexedPages} onChange={(e) => setForm({ ...form, indexedPages: e.target.value })} /></label>
           </div>
           <div className="row mt-sm" style={{ gap: "0.5rem" }}>
             <button className="btn btn-primary" type="submit">Guardar y solicitar verificación</button>
           </div>
           <div className="muted mt-xs">Verificación manual en proceso.</div>
         </form>
       </section>
     </main>
   );
 }
