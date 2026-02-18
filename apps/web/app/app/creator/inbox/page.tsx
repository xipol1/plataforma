"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api";
 
 type Request = {
   id: string;
   status: string;
   createdAt: string;
   scheduledAt: string | null;
   destinationUrl: string;
   copyText: string;
   channelId: string;
   channelName: string;
   platform: string;
   category: string;
   audienceSize: number;
   pricePerPost: number;
   advertiserEmail: string;
 };
 
function brandFromEmail(email: string) {
  const local = (email ?? "").split("@")[0] ?? "";
  const cleaned = local.replace(/[._-]+/g, " ").trim();
  if (!cleaned) return "Marca";
  return cleaned.replace(/\b\w/g, (m) => m.toUpperCase());
}

 export default function CreatorInbox() {
   const [status, setStatus] = useState("");
   const [items, setItems] = useState<Request[]>([]);
   const [actionMsg, setActionMsg] = useState("");
  const [platform, setPlatform] = useState<"ALL" | "TELEGRAM" | "DISCORD" | "WHATSAPP">("ALL");
 
   useEffect(() => {
     void load();
   }, []);
 
   async function load() {
     setStatus("Cargando…");
     try {
      const r = await apiFetch(`/creator/inbox`);
       if (!r.ok) {
         setStatus("Error cargando solicitudes");
         setItems([]);
         return;
       }
       const data = (await r.json()) as Request[];
       setItems(Array.isArray(data) ? data : []);
       setStatus("");
     } catch {
       setStatus("API no disponible");
       setItems([]);
     }
   }
 
 async function accept(id: string) {
    setActionMsg("Aceptando…");
     try {
     const res = await apiFetch(`/creator/inbox/${id}/accept`, {
       method: "POST",
     });
       const data = await res.json();
       if (!res.ok) {
        setActionMsg(data.message ?? "No se pudo aceptar");
         return;
       }
      setActionMsg("Aceptada");
       void load();
     } catch {
       setActionMsg("API no disponible");
     }
   }
 
 async function reject(id: string) {
    setActionMsg("Rechazando…");
    try {
     const res = await apiFetch(`/creator/inbox/${id}/reject`, {
        method: "POST",
       headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionMsg(data.message ?? "No se pudo rechazar");
        return;
      }
      setActionMsg("Rechazada");
      void load();
    } catch {
      setActionMsg("API no disponible");
    }
  }
 
 async function confirmPublished(id: string) {
    setActionMsg("Confirmando publicación…");
    try {
     const res = await apiFetch(`/creator/inbox/${id}/confirm-published`, {
        method: "POST",
       headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setActionMsg((data as { message?: string }).message ?? "No se pudo publicar");
        return;
      }
      setActionMsg("Publicada");
      void load();
    } catch {
      setActionMsg("API no disponible");
    }
  }

   return (
     <main className="container">
       <section className="card reveal">
        <div className="spaced">
          <div>
            <h1 className="title">Solicitudes pendientes</h1>
            <p className="subtitle">Acepta, rechaza o revisa el detalle para ajustar el calendario.</p>
          </div>
          <div className="row" style={{ gap: "0.5rem" }}>
            <button className="btn btn-outline btn-sm" onClick={() => void load()}>Refrescar</button>
            {status && <span className="badge" role="status" aria-live="polite">{status}</span>}
            {actionMsg && <span className="badge" role="status" aria-live="polite">{actionMsg}</span>}
          </div>
        </div>

        <div className="market-filters mt-sm">
          <div className="filter-group">
            <span className="filter-label">Plataforma</span>
            {(["TELEGRAM", "DISCORD", "WHATSAPP"] as const).map((p) => (
              <button
                key={p}
                className={`filter-chip ${platform === p ? "active" : ""}`}
                onClick={() => setPlatform((cur) => (cur === p ? "ALL" : p))}
                type="button"
              >
                {p === "TELEGRAM" ? "Telegram" : p === "DISCORD" ? "Discord" : "WhatsApp"}
              </button>
            ))}
          </div>
        </div>

        {items.length === 0 && !status ? (
          <div className="feature-card exec-action-card mt-sm">
            <h2 className="exec-section-title">Aún no tienes solicitudes</h2>
            <p className="exec-section-sub">Registra y optimiza tus canales para empezar a recibir propuestas.</p>
            <div className="row mt-sm" style={{ gap: "0.75rem" }}>
              <a className="btn btn-primary btn-lg" href="/app/creator/precios">Registrar canal</a>
              <a className="btn btn-secondary btn-lg" href="/about">Ver guía rápida</a>
            </div>
          </div>
        ) : null}

        <ul className="list exec-clean-list mt-sm">
           {items.filter((r) => platform === "ALL" || r.platform === platform).map((r) => (
             <li key={r.id} className="list-item">
               <div className="spaced">
                 <div>
                  <div style={{ fontWeight: 950 }}>
                    {brandFromEmail(r.advertiserEmail)} · {r.channelName} · {r.platform} · USD {r.pricePerPost}
                  </div>
                  <div className="muted mt-xs">{r.category} · {r.platform} · {r.audienceSize.toLocaleString("es-ES")} audiencia</div>
                  <div className="muted mt-xs">{r.scheduledAt ? `Programada: ${new Date(r.scheduledAt).toLocaleString("es-ES")}` : "Estado: pendiente de calendario"}</div>
                 </div>
                 <div className="row" style={{ gap: "0.5rem" }}>
                  <span className="badge">{r.status}</span>
                  <button className="btn btn-primary btn-sm" onClick={() => void accept(r.id)}>Aceptar</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => void reject(r.id)}>Rechazar</button>
                  {(r.status === "SUBMITTED" || r.status === "PAID" || r.status === "READY") && (
                    <button className="btn btn-outline btn-sm" onClick={() => void confirmPublished(r.id)}>Confirmar publicado</button>
                  )}
                  <a className="btn btn-outline btn-sm" href={`/app/creator/campaigns/${r.id}`}>Ver detalle</a>
                 </div>
               </div>
               <div className="mt-xs muted" style={{ whiteSpace: "pre-wrap" }}>
                 {r.copyText}
               </div>
             </li>
           ))}
         </ul>
       </section>
     </main>
   );
 }
