 "use client";
 
 import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";
 
 type Campaign = {
   id: string;
   channelId: string;
  channelPlatform?: string;
  channelName?: string;
  channelCategory?: string;
  channelPrice?: number;
   status: string;
   destinationUrl: string;
 };
 
 export default function InboxPage() {
   const [items, setItems] = useState<Campaign[]>([]);
   const [status, setStatus] = useState("");
   const [actionMsg, setActionMsg] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<Record<string, string>>({});
  const [summary, setSummary] = useState<{ clicks: number; valid: number; invalid: number; spend: number; ctr: number }>({
    clicks: 0,
    valid: 0,
    invalid: 0,
    spend: 0,
    ctr: 0,
  });
  const [statsByCampaign, setStatsByCampaign] = useState<Record<string, { total: number; valid: number; views: number; conversions: number }>>({});
  const [platform, setPlatform] = useState<"ALL" | "TELEGRAM" | "DISCORD" | "WHATSAPP">("ALL");
 
   async function load() {
    setStatus("");
     try {
      const r = await apiFetch(`/campaigns/inbox`);
       if (!r.ok) {
         setStatus("Error cargando campañas");
         return;
       }
       const data = await r.json();
       setItems(data);
       setStatus("");
     } catch {
       setStatus("API no disponible");
     }
   }
 
  useEffect(() => {
    void load();
    void loadSummary();
  }, []);

  async function loadSummary() {
    try {
      const r = await apiFetch(`/campaigns/summary`);
      if (!r.ok) return;
      const sum = (await r.json()) as { clicks: number; valid: number; invalid: number; spend: number };
      const clicks = sum.clicks ?? 0;
      const valid = sum.valid ?? 0;
      const ctr = clicks ? Number(((valid / clicks) * 100).toFixed(1)) : 0;
      setSummary({ clicks, valid, invalid: sum.invalid ?? 0, spend: sum.spend ?? 0, ctr });
    } catch {}
  }
 
   async function intent(campaignId: string) {
     setActionMsg("Creando intent...");
     try {
      const res = await apiFetch(`/payments/intent`, {
         method: "POST",
        headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ campaignId }),
       });
       if (!res.ok) {
         setActionMsg("Error creando intent");
         return;
       }
       const data = await res.json();
       setActionMsg(`Intent OK: ${data.provider_ref} · ${data.amount} ${data.currency}`);
       void load();
     } catch {
       setActionMsg("API no disponible");
     }
   }
 
  async function checkPayment(campaignId: string) {
    try {
      const res = await apiFetch(`/payments/${campaignId}`);
      if (!res.ok) {
        setPaymentStatus((s) => ({ ...s, [campaignId]: "ERROR" }));
        return;
      }
      const p = await res.json();
      setPaymentStatus((s) => ({ ...s, [campaignId]: p.status }));
    } catch {
      setPaymentStatus((s) => ({ ...s, [campaignId]: "ERROR" }));
    }
  }

  async function loadCampaignStats(campaignId: string) {
    setActionMsg("Cargando métricas…");
    try {
      const res = await apiFetch(`/campaigns/${campaignId}/tracking-stats`);
      const data = await res.json();
      if (!res.ok) {
        setActionMsg(data.message ?? "Error cargando métricas");
        return;
      }
      setStatsByCampaign((m) => ({ ...m, [campaignId]: { total: data.total ?? 0, valid: data.valid ?? 0, views: data.views ?? 0, conversions: data.conversions ?? 0 } }));
      setActionMsg("");
    } catch {
      setActionMsg("API no disponible");
    }
  }

  const visible = items.filter((c) => platform === "ALL" || (c.channelPlatform ?? "TELEGRAM") === platform);

  function badgeTone(value: string, kind: "campaign" | "payment") {
    const v = (value ?? "").toUpperCase();
    if (kind === "payment") {
      if (v.includes("PAID") || v.includes("CAPTURED") || v.includes("SUCCEEDED") || v.includes("COMPLETED")) return "badge-success";
      if (v.includes("PENDING") || v.includes("REQUIRES") || v.includes("CREATED") || v.includes("OPEN")) return "badge-warn";
      if (v.includes("FAILED") || v.includes("ERROR") || v.includes("CANCEL")) return "badge-danger";
      return "";
    }
    if (v.includes("ACTIVE") || v.includes("VERIFIED") || v.includes("DONE") || v.includes("COMPLETED")) return "badge-success";
    if (v.includes("PENDING") || v.includes("CREATED") || v.includes("DRAFT") || v.includes("WAIT")) return "badge-warn";
    if (v.includes("REJECT") || v.includes("CANCEL") || v.includes("ERROR") || v.includes("FAILED")) return "badge-danger";
    return "";
  }

  return (
    <main className="container campaigns-page">
      <section className="page-card reveal">
        <div className="page-head">
          <div className="page-head-left">
            <h1 className="page-title">Mis campañas</h1>
            <p className="page-subtitle">Pagos protegidos, estado verificable y métricas claras.</p>
          </div>
          <div className="page-head-right">
            <button onClick={() => void load()} className="btn btn-secondary">
              Refrescar
            </button>
          </div>
        </div>
        {(status || actionMsg) && (
          <div className="page-alerts" aria-live="polite">
            {status && <span className="badge" role="status" aria-live="polite">{status}</span>}
            {actionMsg && <span className="badge" role="status" aria-live="polite">{actionMsg}</span>}
          </div>
        )}

        <div className="page-toolbar">
          <div className="filter-group">
            <span className="filter-label">Plataforma</span>
            <button
              className={`filter-chip ${platform === "ALL" ? "active" : ""}`}
              onClick={() => setPlatform("ALL")}
              type="button"
            >
              Todas
            </button>
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
          <div className="page-meta">
            <span className="pill violet">Campañas: {visible.length}</span>
            <span className="pill violet">Clicks: {summary.clicks.toLocaleString("es-ES")}</span>
            <span className="pill violet">CTR: {summary.ctr}%</span>
          </div>
        </div>

        <div className="stat-grid mb-sm">
          <div className="stat-card">
            <div className="label">Campañas</div>
            <div className="value">{visible.length}</div>
          </div>
          <div className="stat-card">
            <div className="label">Rendimiento</div>
            <div className="value">{summary.ctr}%</div>
          </div>
          <div className="stat-card">
            <div className="label">Gasto</div>
            <div className="value">USD {summary.spend}</div>
          </div>
        </div>

        <div className="page-section">
          <div className="section-head">
            <h2 className="section-title">Campañas</h2>
          </div>

          {visible.length === 0 ? (
            <div className="empty-state">
              <div className="empty-title">No hay campañas para mostrar</div>
              <div className="empty-sub">Explora canales y activa una campaña con pago protegido.</div>
              <div className="btn-group">
                <a className="btn btn-primary cta-gradient" href="/channels">Explorar canales</a>
                <button className="btn btn-secondary" onClick={() => void load()}>Refrescar</button>
              </div>
            </div>
          ) : (
            <ul className="campaign-list">
              {visible.map((c) => {
                const payment = paymentStatus[c.id] ? String(paymentStatus[c.id]) : "-";
                return (
                  <li key={c.id} className="campaign-item">
                    <div className="campaign-top">
                      <div className="campaign-left">
                        <div className="campaign-title-row">
                          <div className="campaign-name">{c.channelName ?? `Canal ${c.channelId}`}</div>
                          <div className="campaign-pills">
                            <span className="pill violet">{(c.channelPlatform ?? "TELEGRAM") === "TELEGRAM" ? "Telegram" : (c.channelPlatform ?? "TELEGRAM") === "DISCORD" ? "Discord" : "WhatsApp"}</span>
                            {c.channelCategory && <span className="pill violet">{c.channelCategory}</span>}
                          </div>
                        </div>
                        <div className="campaign-meta">
                          <span className="muted">ID</span> {c.id}
                        </div>
                      </div>
                      <div className="campaign-right">
                        <span className={`badge ${badgeTone(c.status, "campaign")}`}>{c.status}</span>
                        <span className={`badge ${badgeTone(payment, "payment")}`}>Pago: {payment}</span>
                      </div>
                    </div>

                    <div className="campaign-actions">
                      <a href={`/campaigns/${c.id}`} className="btn btn-outline btn-sm">Ver detalle</a>
                      <button onClick={() => void loadCampaignStats(c.id)} className="btn btn-outline btn-sm">Métricas</button>
                      <a href={c.destinationUrl} target="_blank" rel="noreferrer" className="btn btn-sm">Destino</a>
                      <button onClick={() => intent(c.id)} className="btn btn-primary btn-sm">Crear pago</button>
                      <button onClick={() => checkPayment(c.id)} className="btn btn-secondary btn-sm">Estado de pago</button>
                    </div>

                    {statsByCampaign[c.id] && (
                      <div className="campaign-kpis">
                        <div className="kpi-grid">
                          <div className="kpi"><div className="label">Clicks</div><div className="value">{statsByCampaign[c.id].total.toLocaleString("es-ES")}</div></div>
                          <div className="kpi"><div className="label">Válidos</div><div className="value">{statsByCampaign[c.id].valid.toLocaleString("es-ES")}</div></div>
                          <div className="kpi"><div className="label">CTR</div><div className="value">{statsByCampaign[c.id].total ? ((statsByCampaign[c.id].valid / statsByCampaign[c.id].total) * 100).toFixed(1) : "0.0"}%</div></div>
                          <div className="kpi"><div className="label">Vistas</div><div className="value">{statsByCampaign[c.id].views.toLocaleString("es-ES")}</div></div>
                          <div className="kpi"><div className="label">Conversiones</div><div className="value">{statsByCampaign[c.id].conversions.toLocaleString("es-ES")}</div></div>
                          <div className="kpi"><div className="label">Pago</div><div className="value">{payment}</div></div>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
 }
