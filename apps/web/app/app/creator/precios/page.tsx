 "use client";
 
  import { useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api";
 
 type MyChannel = { id: string; name: string; category: string; pricePerPost: number };
 
 export default function CreatorPricingPage() {
   const [status, setStatus] = useState("");
   const [channels, setChannels] = useState<MyChannel[]>([]);
   const [edits, setEdits] = useState<Record<string, { category: string; pricePerPost: number }>>({});
   const [saveMsg, setSaveMsg] = useState("");
 
  useEffect(() => {
    setStatus("Cargando…");
    apiFetch(`/channels/mine`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((rows: Array<MyChannel>) => {
        setChannels(rows);
        const next: Record<string, { category: string; pricePerPost: number }> = {};
        rows.forEach((c) => (next[c.id] = { category: c.category, pricePerPost: c.pricePerPost }));
        setEdits(next);
        setStatus("");
      })
      .catch(() => setStatus("API no disponible"));
  }, []);
 
  async function save(id: string) {
     setSaveMsg("");
    const resp = await apiFetch(`/channels/${id}/self`, {
       method: "PATCH",
      headers: { "Content-Type": "application/json" },
       body: JSON.stringify(edits[id]),
     });
     if (!resp.ok) {
       setSaveMsg("Error al guardar");
       return;
     }
     const updated = await resp.json();
     setChannels((prev) => prev.map((c) => (c.id === id ? { ...c, category: updated.category, pricePerPost: updated.pricePerPost } : c)));
     setSaveMsg("Guardado");
     setTimeout(() => setSaveMsg(""), 2000);
   }
 
   return (
     <main className="container">
       <section className="card">
         <h1 className="title">Precios y categorías</h1>
         {status && <div className="badge" role="status" aria-live="polite">{status}</div>}
         <div className="feature-card">
           <h3 className="feature-title">Mis canales</h3>
           <ul className="list">
             {channels.map((c) => (
               <li key={c.id} className="list-item">
                 <div className="spaced">
                   <div>
                     <strong>{c.name}</strong>
                     <div className="muted">Actual: {c.category} · USD {c.pricePerPost}</div>
                   </div>
                   <div className="row" style={{ gap: "0.5rem" }}>
                     <select
                       className="select"
                       value={edits[c.id]?.category ?? c.category}
                       onChange={(e) =>
                         setEdits((prev) => ({ ...prev, [c.id]: { ...(prev[c.id] ?? { category: c.category, pricePerPost: c.pricePerPost }), category: e.target.value } }))
                       }
                     >
                       <option value="tecnología">tecnología</option>
                       <option value="finanzas">finanzas</option>
                       <option value="marketing">marketing</option>
                       <option value="ecommerce">ecommerce</option>
                     </select>
                     <input
                       className="input"
                       value={String(edits[c.id]?.pricePerPost ?? c.pricePerPost)}
                       onChange={(e) =>
                         setEdits((prev) => ({
                           ...prev,
                           [c.id]: {
                             ...(prev[c.id] ?? { category: c.category, pricePerPost: c.pricePerPost }),
                             pricePerPost: Math.max(1, Math.floor(Number(e.target.value) || 0)),
                           },
                         }))
                       }
                       style={{ width: 120 }}
                     />
                     <button className="btn btn-primary btn-sm" onClick={() => save(c.id)}>Guardar</button>
                   </div>
                  <div className="row" style={{ gap: "0.5rem", marginTop: "0.5rem" }}>
                    <label className="label" style={{ maxWidth: 220 }}>
                      Ref canal
                      <input id={`ref-${c.id}`} className="input" placeholder="@usuario o ID" />
                    </label>
                    <label className="label" style={{ maxWidth: 220 }}>
                      Ref usuario
                      <input id={`user-${c.id}`} className="input" placeholder="@tu_usuario" />
                    </label>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={async () => {
                        const channelRef = (document.getElementById(`ref-${c.id}`) as HTMLInputElement)?.value ?? "";
                        const userRef = (document.getElementById(`user-${c.id}`) as HTMLInputElement)?.value ?? "";
                        setSaveMsg("Verificando…");
                        try {
                          const res = await apiFetch(`/channels/${c.id}/activate`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ platform: "TELEGRAM", channelRef, userRef }),
                          });
                          const data = await res.json();
                          setSaveMsg(res.ok ? "Canal verificado" : data.message ?? "Error verificando");
                        } catch {
                          setSaveMsg("API no disponible");
                        }
                      }}
                    >
                      Verificar propiedad
                    </button>
                  </div>
                 </div>
               </li>
             ))}
           </ul>
           <div className="row" style={{ marginTop: "0.5rem" }}>
             <a className="btn btn-outline" href="/app/creator/channels">Gestionar en detalle</a>
           </div>
           {saveMsg && <div className="badge" role="status" aria-live="polite" style={{ marginTop: "0.5rem" }}>{saveMsg}</div>}
         </div>
       </section>
     </main>
   );
 }
