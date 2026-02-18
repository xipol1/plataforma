 "use client";
 
 import { useEffect, useMemo, useState } from "react";
 import { apiFetch } from "../../../lib/api";
 
 export default function CreatorEarningsPage() {
   const [status, setStatus] = useState("");
   const [summary, setSummary] = useState<{ earnings: number; published: number; completed: number; upcoming: number }>({
     earnings: 0,
     published: 0,
     completed: 0,
     upcoming: 0,
   });
  const [method, setMethod] = useState("bank");
  const [identifier, setIdentifier] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
  const [billing, setBilling] = useState<{ window_days: number; earnings: number; pending_payouts: number; invoices: Array<{ code: string; amount: number; currency: string; status: string; createdAt: string }> } | null>(null);
 
  useEffect(() => {
    setStatus("Cargando…");
    apiFetch(`/creator/summary`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((s) => {
        setSummary({
          earnings: Number(s.earnings ?? 0),
          published: Number(s.published ?? 0),
          completed: Number(s.completed ?? 0),
          upcoming: Number(s.upcoming ?? 0),
        });
        setStatus("");
      })
      .catch(() => setStatus("API no disponible"));
   apiFetch(`/creator/payout-config`)
     .then((r) => (r.ok ? r.json() : Promise.reject()))
     .then((cfg) => {
       if (cfg?.method) setMethod(cfg.method === "stripe" || cfg.method === "STRIPE" ? "stripe" : "bank");
       if (cfg?.identifier) setIdentifier(cfg.identifier);
     })
     .catch(() => {});
   apiFetch(`/creator/billing/summary?window_days=30&limit=5`)
     .then((r) => (r.ok ? r.json() : Promise.reject()))
     .then((b) => setBilling(b))
     .catch(() => {});
  }, []);
 
  const fmtUSD0 = useMemo(() => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }), []);

   return (
     <main className="container">
      <section className="card reveal">
        <div className="spaced">
          <div>
            <h1 className="title">Cobros y facturación</h1>
            <p className="subtitle">Configura tu método de cobro y revisa liquidaciones.</p>
          </div>
          <a className="btn btn-outline btn-sm" href="/app/creator">Volver</a>
        </div>

        {status && <div className="badge mt-xs">{status}</div>}

        <div className="grid-2 mt-sm">
          <div className="feature-card exec-action-card">
            <h3 className="feature-title">Resumen</h3>
            <div className="grid-2 mt-xs">
              <div className="kpi exec-kpi-mini">
                <div className="label">Ingresos del mes</div>
                <div className="value">{fmtUSD0.format(billing?.earnings ?? summary.earnings)}</div>
              </div>
              <div className="kpi exec-kpi-mini">
                <div className="label">Pagos pendientes</div>
                <div className="value">{fmtUSD0.format(billing?.pending_payouts ?? 0)}</div>
              </div>
            </div>
            <div className="mt-sm" style={{ fontWeight: 950 }}>Últimas liquidaciones</div>
            {(billing?.invoices?.length ?? 0) ? (
              <ul className="list exec-clean-list mt-xs">
                {billing!.invoices.map((inv) => (
                  <li key={inv.code} className="list-item">
                    <div className="spaced">
                      <div>{inv.code} · {fmtUSD0.format(inv.amount)} · {inv.status === "SUCCEEDED" ? "Pagado" : inv.status}</div>
                      <span className={`badge ${inv.status === "SUCCEEDED" ? "badge-success" : ""}`}>{inv.status === "SUCCEEDED" ? "OK" : inv.status}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="feature-desc mt-xs">Aún no hay liquidaciones.</p>
            )}
          </div>

          <div className="feature-card">
            <h3 className="feature-title">Configuración de cobro</h3>
            <p className="feature-desc">Elige cómo recibir pagos y guarda tu identificador.</p>
            <div className="toolbar mt-xs">
              <label className="label field-md">
                Método
                <select className="select" value={method} onChange={(e) => setMethod(e.target.value)}>
                  <option value="bank">Transferencia bancaria</option>
                  <option value="stripe">Stripe Connect</option>
                </select>
              </label>
              <label className="label field-lg">
                Identificador
                <input className="input" placeholder="Cuenta/ID" value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
              </label>
            <button
                className="btn btn-primary"
                onClick={async () => {
                  setSaveMsg("Guardando…");
                  try {
                    const res = await apiFetch(`/creator/payout-config`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ method, identifier }),
                    });
                    const data = await res.json();
                    setSaveMsg(res.ok ? "Guardado" : data.message ?? "Error guardando");
                  } catch {
                    setSaveMsg("API no disponible");
                  }
                  setTimeout(() => setSaveMsg(""), 2000);
                }}
              >
                Guardar
              </button>
            </div>
            {saveMsg && <div className="badge mt-xs" role="status" aria-live="polite">{saveMsg}</div>}
          </div>
        </div>
      </section>
     </main>
   );
 }
