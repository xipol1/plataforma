 "use client";
 
  import { useEffect, useMemo, useState } from "react";
  import { useParams } from "next/navigation";
  import { apiFetch, getApiUrl } from "../../lib/api";
 
 export default function OrderDetailPage() {
   const params = useParams<{ id: string }>();
   const id = (params?.id as string) ?? "";
   const apiUrl = getApiUrl();
   const [status, setStatus] = useState("");
   const [item, setItem] = useState<{
     id: string;
     status: string;
     createdAt: string;
     blogName: string;
     targetUrl: string;
     anchorText: string;
     contentBrief: string;
     proposedPrice: number;
     finalPrice: number | null;
   } | null>(null);
   const [pub, setPub] = useState({ url: "", at: "" });
   const fmt = useMemo(() => new Intl.DateTimeFormat("es-ES", { dateStyle: "short", timeStyle: "short" }), []);
 
  async function load() {
     setStatus("Cargando…");
     try {
      const r = await apiFetch(`/blog-requests/${id}`);
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setStatus((data as { message?: string }).message ?? "No encontrado");
        return;
      }
      setItem(data as typeof item);
      setStatus("");
     } catch {
       setStatus("API no disponible");
     }
   }
   useEffect(() => {
     if (id) void load();
   }, [id]);
 
   async function changeStatus(next: "ACCEPTED" | "REJECTED" | "NEEDS_CHANGES") {
     setStatus("Actualizando…");
     try {
      const r = await apiFetch(`/blog-requests/${id}`, {
         method: "PATCH",
        headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ status: next }),
       });
       if (r.ok) {
         await load();
       }
     } catch {
       setStatus("API no disponible");
     }
   }
 
   async function publish() {
     setStatus("Guardando publicación…");
     try {
      const r = await apiFetch(`/blog-requests/${id}/publish`, {
         method: "POST",
        headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ publishedUrl: pub.url, publishedAt: pub.at }),
       });
       if (r.ok) await load();
     } catch {
       setStatus("API no disponible");
     }
   }
 
   async function verify() {
     setStatus("Verificando…");
     try {
      const r = await apiFetch(`/blog-requests/${id}/verify`, { method: "POST" });
       if (r.ok) await load();
     } catch {
       setStatus("API no disponible");
     }
   }
 
   async function settle() {
     setStatus("Liquidando…");
     try {
      const r = await apiFetch(`/blog-requests/${id}/settle`, { method: "POST" });
       if (r.ok) await load();
     } catch {
       setStatus("API no disponible");
     }
   }
 
   return (
     <main className="container">
       <section className="card reveal">
         <div className="spaced">
           <div>
             <h1 className="title">Detalle de solicitud</h1>
             <p className="subtitle">Brief, URL destino, anchor y estado.</p>
           </div>
           <a className="btn btn-outline" href="/dashboard/blog">Volver</a>
         </div>
        {status && <div className="badge mt-xs" role="status" aria-live="polite">{status}</div>}
         {item ? (
           <div className="feature-card mt-sm">
             <div className="spaced">
               <div>
                 <div style={{ fontWeight: 950 }}>{item.blogName} · USD {item.proposedPrice}</div>
                 <div className="muted mt-xs">{fmt.format(new Date(item.createdAt))}</div>
               </div>
               <span className="badge">{item.status}</span>
             </div>
             <div className="mt-sm" style={{ whiteSpace: "pre-wrap" }}>{item.contentBrief}</div>
             <div className="kpi-grid mt-sm">
               <div className="kpi"><div className="label">Target URL</div><div className="value">{item.targetUrl}</div></div>
               <div className="kpi"><div className="label">Anchor</div><div className="value">{item.anchorText}</div></div>
             </div>
             <div className="row mt-sm" style={{ gap: "0.5rem" }}>
               {item.status !== "ACCEPTED" && <button className="btn btn-primary btn-sm" onClick={() => void changeStatus("ACCEPTED")}>Aceptar</button>}
               <button className="btn btn-secondary btn-sm" onClick={() => void changeStatus("NEEDS_CHANGES")}>Solicitar cambios</button>
               <button className="btn btn-outline btn-sm" onClick={() => void changeStatus("REJECTED")}>Rechazar</button>
               {item.status === "ACCEPTED" && (
                 <span className="badge">En escrow: pendiente integración</span>
               )}
             </div>
             <div className="mt-sm">
               <h3 className="feature-title">Publicación</h3>
               <div className="grid-split">
                 <label className="label">URL publicada<input className="input" value={pub.url} onChange={(e) => setPub({ ...pub, url: e.target.value })} /></label>
                 <label className="label">Fecha/hora<input className="input" value={pub.at} onChange={(e) => setPub({ ...pub, at: e.target.value })} placeholder="2026-02-15T10:00:00Z" /></label>
               </div>
               <div className="row mt-xs" style={{ gap: "0.5rem" }}>
                 <button className="btn btn-secondary btn-sm" onClick={() => void publish()}>Marcar como publicada</button>
                 <button className="btn btn-outline btn-sm" onClick={() => void verify()}>Verificar publicación</button>
                 <button className="btn btn-outline btn-sm" onClick={() => void settle()}>Marcar como completada</button>
               </div>
             </div>
           </div>
         ) : null}
       </section>
     </main>
   );
 }
