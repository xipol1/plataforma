 "use client";
 
 import { useEffect, useMemo, useState } from "react";
 import { loadStripe } from "@stripe/stripe-js";
 import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { apiFetch } from "../../lib/api";
 
 function StripePay({ onResult }: { onResult: (ok: boolean) => void }) {
   const stripe = useStripe();
   const elements = useElements();
   const [msg, setMsg] = useState("");
   return (
     <div>
       <PaymentElement />
       <div className="row" style={{ marginTop: "0.5rem" }}>
         <button
           className="btn btn-primary"
           onClick={async () => {
             if (!stripe || !elements) return;
             setMsg("Procesando…");
             const { error } = await stripe.confirmPayment({
               elements,
               confirmParams: { return_url: window.location.href },
               redirect: "if_required",
             });
             if (error) {
               setMsg("Error de pago");
               onResult(false);
             } else {
               setMsg("Pago confirmado");
               onResult(true);
             }
           }}
         >
           Pagar
         </button>
         {msg && <span className="badge">{msg}</span>}
       </div>
     </div>
   );
 }
 
 export default function GadgetResumenPage() {
   const [status, setStatus] = useState("");
   const [summary, setSummary] = useState({ total: 0, paid: 0, published: 0, impressions: 0, clicks: 0, ctr: 0, conversions: 0, cvr: 0, spend: 0, roas: 0 });
   const [events, setEvents] = useState<Array<{ label: string; desc: string; ts: string }>>([]);
   const [campaignId, setCampaignId] = useState("");
   const [flowMsg, setFlowMsg] = useState("");
   const [flow, setFlow] = useState<{ quote?: number | null; currency?: string; intentRef?: string | null; clientSecret?: string | null; paymentSucceeded?: boolean; published?: boolean }>({});
   const [startAt, setStartAt] = useState("");
   const [endAt, setEndAt] = useState("");
   const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
   const stripePromise = useMemo(() => (publishableKey ? loadStripe(publishableKey) : null), [publishableKey]);
 
   useEffect(() => {
     setStatus("");
    apiFetch(`/campaigns/summary`)
       .then((r) => (r.ok ? r.json() : Promise.reject()))
       .then((sum: { total: number; paid: number; published: number; clicks: number; valid: number; spend: number }) => {
         const clicks = sum.clicks ?? 0;
         const valid = sum.valid ?? 0;
         const ctr = clicks ? Number(((valid / clicks) * 100).toFixed(1)) : 0;
         setSummary((s) => ({ ...s, total: sum.total ?? 0, paid: sum.paid ?? 0, published: sum.published ?? 0, clicks, ctr, spend: sum.spend ?? 0 }));
       })
       .catch(() => {});
    apiFetch(`/campaigns/events`)
       .then((r) => (r.ok ? r.json() : Promise.reject()))
       .then((rows: Array<{ type: string; entity: string; entityId: string; ts: string }>) => {
         setEvents(rows.map((e) => ({ label: e.type, desc: `${e.entity} ${e.entityId}`, ts: e.ts })));
       })
       .catch(() => {});
   }, []);
 
   async function doQuote() {
     setFlowMsg("Calculando presupuesto…");
     try {
      const cRes = await apiFetch(`/campaigns/${campaignId}`);
       if (!cRes.ok) {
         setFlowMsg("Campaña no encontrada");
         return;
       }
       const camp = await cRes.json();
      const chRes = await apiFetch(`/channels/${camp.channelId}`, { auth: false });
       if (!chRes.ok) {
         setFlowMsg("Canal no encontrado o no activo");
         return;
       }
       const ch = await chRes.json();
       setFlow({ ...flow, quote: ch.pricePerPost, currency: "USD" });
       setFlowMsg(`Quote: USD ${ch.pricePerPost}`);
     } catch {
       setFlowMsg("API no disponible");
     }
   }
 
   async function doPay() {
     setFlowMsg("Creando intent de pago…");
     try {
       const idem = crypto.randomUUID();
      const res = await apiFetch(`/payments/intent`, {
         method: "POST",
        headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ campaignId, idempotencyKey: idem }),
       });
       if (!res.ok) {
         setFlowMsg("Error creando intent");
         return;
       }
       const data = await res.json();
       setFlow({ ...flow, quote: data.amount, currency: data.currency, intentRef: data.provider_ref ?? null, clientSecret: data.client_secret ?? null });
       setFlowMsg(data.client_secret ? `Intent listo · ${data.amount} ${data.currency}` : `Intent mock · ${data.amount} ${data.currency}`);
     } catch {
       setFlowMsg("API no disponible");
     }
   }
 
   async function ensurePaid() {
     try {
      const res = await apiFetch(`/payments/${campaignId}`);
       if (!res.ok) return false;
       const p = await res.json();
       return p.status === "SUCCEEDED";
     } catch {
       return false;
     }
   }
 
   async function doPublish() {
     setFlowMsg("Comprobando pago…");
     const now = Date.now();
     const s = startAt ? new Date(startAt).getTime() : NaN;
     const e = endAt ? new Date(endAt).getTime() : NaN;
     if (Number.isNaN(s) || Number.isNaN(e)) {
       setFlowMsg("Selecciona inicio y fin válidos");
       return;
     }
     if (s < now + 30 * 60 * 1000) {
       setFlowMsg("Inicio debe ser al menos dentro de 30 minutos");
       return;
     }
     if (e <= s) {
       setFlowMsg("Fin debe ser posterior al inicio");
       return;
     }
     if (e - s > 14 * 24 * 60 * 60 * 1000) {
       setFlowMsg("Ventana máxima 14 días");
       return;
     }
     try {
       const ok = await ensurePaid();
       if (!ok) {
         setFlowMsg("Pago pendiente. Completa el pago antes de publicar.");
         return;
       }
       setFlowMsg("Publicando…");
      const res = await apiFetch(`/campaigns/${campaignId}/publish`, {
         method: "PATCH",
        headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ startAt: new Date(s).toISOString(), endAt: new Date(e).toISOString() }),
       });
       if (!res.ok) {
         setFlowMsg("Error publicando");
         return;
       }
       const data = await res.json();
       setFlow({ ...flow, published: data.status === "PUBLISHED" });
       setFlowMsg("Publicado");
     } catch {
       setFlowMsg("API no disponible");
     }
   }
 
   const clicksByMonth = [95, 110, 120, 140, 160, 180, 175, 190, 210, 235, 260, 280];
   const max = Math.max(...clicksByMonth);
 
   return (
     <main className="container">
       <section className="card reveal">
         <h1 className="title">Gadget de resumen</h1>
         <p className="subtitle">Vista ampliada con KPIs, actividad y flujo Quote → Pay → Publish.</p>
        {status && <div className="badge" role="status" aria-live="polite">{status}</div>}
         <div className="kpi-grid" style={{ marginBottom: "0.75rem" }}>
           <div className="kpi"><div className="label">Campañas</div><div className="value">{summary.total}</div></div>
           <div className="kpi"><div className="label">Pagadas</div><div className="value">{summary.paid}</div></div>
           <div className="kpi"><div className="label">Publicadas</div><div className="value">{summary.published}</div></div>
           <div className="kpi"><div className="label">Clicks</div><div className="value">{summary.clicks.toLocaleString("en-US")}</div></div>
           <div className="kpi"><div className="label">CTR</div><div className="value">{summary.ctr}%</div></div>
           <div className="kpi"><div className="label">Spend</div><div className="value">USD {summary.spend}</div></div>
         </div>
         <div className="grid" style={{ gridTemplateColumns: "2fr 1fr", gap: "var(--space)" }}>
           <div className="feature-card">
             <h3 className="feature-title">Clicks por mes</h3>
             <div className="chart">
               {clicksByMonth.map((v, i) => (
                 <div key={i} className="bar" style={{ height: `${(v / max) * 120}px` }} />
               ))}
             </div>
           </div>
           <div className="feature-card">
             <h3 className="feature-title">Últimos eventos</h3>
             <ul className="list">
               {(events.length ? events : [{ label: "Sin eventos", desc: "", ts: "" }]).map((e, i) => (
                 <li key={i} className="list-item">
                   <div className="spaced">
                     <div>{e.label}{e.desc ? ` · ${e.desc}` : ""}</div>
                     <span className="badge">{e.ts ? new Date(e.ts).toLocaleString() : ""}</span>
                   </div>
                 </li>
               ))}
             </ul>
           </div>
         </div>
       </section>
       <section className="card reveal">
         <h2 className="title">Flujo integrado</h2>
         <p className="feature-desc">Quote → Pay → Publish en una sola vista.</p>
         <div className="grid" style={{ gridTemplateColumns: "2fr 1fr" }}>
           <div className="feature-card">
             <div className="row" style={{ marginBottom: "0.5rem" }}>
               <label className="label" style={{ maxWidth: 380 }}>
                 ID de campaña
                 <input className="input" value={campaignId} onChange={(e) => setCampaignId(e.target.value)} placeholder="uuid de campaña" />
               </label>
               <a className="btn" href="/campaigns/inbox">Mis campañas</a>
               <button className="btn btn-secondary" onClick={doQuote}>Quote</button>
               <button className="btn btn-primary" onClick={doPay}>Pay</button>
               <button className="btn btn-success" onClick={doPublish}>Publish</button>
             </div>
            <div className="row" style={{ marginTop: "0.25rem" }}>
              <span className="badge">Publicar requiere rol OPS</span>
            </div>
            <div className="row" style={{ gap: "0.5rem", marginBottom: "0.5rem" }}>
              <button
                className="btn"
                onClick={async () => {
                  setFlowMsg("Solicitando publicación…");
                  try {
                    const res = await apiFetch(`/campaigns/${campaignId}/request-publish`, { method: "POST" });
                    const data = await res.json();
                    setFlowMsg(res.ok ? "Solicitud enviada" : data.message ?? "Error solicitando");
                  } catch {
                    setFlowMsg("API no disponible");
                  }
                  setTimeout(() => setFlowMsg(""), 2000);
                }}
              >
                Solicitar publicación (Advertiser)
              </button>
            </div>
             <div className="row" style={{ gap: "0.5rem", marginBottom: "0.5rem" }}>
               <label className="label" style={{ maxWidth: 260 }}>
                 Inicio
                 <input type="datetime-local" className="input" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
               </label>
               <label className="label" style={{ maxWidth: 260 }}>
                 Fin
                 <input type="datetime-local" className="input" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
               </label>
             </div>
             {flowMsg && <div className="badge">{flowMsg}</div>}
             <div className="kpi-grid" style={{ marginTop: "0.5rem" }}>
               <div className="kpi"><div className="label">Quote</div><div className="value">{flow.quote ?? "-"}</div></div>
               <div className="kpi"><div className="label">Moneda</div><div className="value">{flow.currency ?? "-"}</div></div>
               <div className="kpi"><div className="label">Intent</div><div className="value">{flow.intentRef ?? "-"}</div></div>
               <div className="kpi"><div className="label">Pago</div><div className="value">{flow.paymentSucceeded ? "OK" : "Pendiente"}</div></div>
               <div className="kpi"><div className="label">Publicado</div><div className="value">{flow.published ? "Sí" : "No"}</div></div>
             </div>
             {stripePromise && flow.clientSecret ? (
               <Elements stripe={stripePromise} options={{ clientSecret: flow.clientSecret }}>
                 <StripePay onResult={(ok) => { setFlow({ ...flow, paymentSucceeded: ok }); setFlowMsg(ok ? "Pago confirmado" : "Pago cancelado"); }} />
               </Elements>
             ) : null}
           </div>
           <div className="feature-card">
             <h3 className="feature-title">Estado</h3>
             <ul className="list">
               <li className="list-item"><div className="spaced"><div>Quote</div><span className="badge">{flow.quote ? "OK" : "Pendiente"}</span></div></li>
               <li className="list-item"><div className="spaced"><div>Pay</div><span className="badge">{flow.intentRef ? "Intent creado" : "Pendiente"}</span></div></li>
               <li className="list-item"><div className="spaced"><div>Pago</div><span className="badge">{flow.paymentSucceeded ? "OK" : "Pendiente"}</span></div></li>
               <li className="list-item"><div className="spaced"><div>Publish</div><span className="badge">{flow.published ? "Publicado" : "Pendiente"}</span></div></li>
             </ul>
           </div>
         </div>
       </section>
     </main>
   );
 }
