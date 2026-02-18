 "use client";
 
 import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../../lib/api";

type Channel = {
  id: string;
  name: string;
  category: string;
  audienceSize: number;
  pricePerPost: number;
  status: "PENDING" | "ACTIVE" | "SUSPENDED";
  createdAt: string;
};

type ChannelMetrics = { window_days: number; items: Array<{ channelId: string; clicks: number; impressions: number; ctr: number }> };
 
 export default function CreatorChannels() {
   const [status, setStatus] = useState("");
  const [items, setItems] = useState<Channel[]>([]);
  const [metrics, setMetrics] = useState<ChannelMetrics | null>(null);
 
  useEffect(() => {
    setStatus("");
    void (async () => {
      try {
        const [cRes, mRes] = await Promise.all([
          apiFetch(`/channels/mine`),
          apiFetch(`/creator/channel-metrics?window_days=30`),
        ]);
        if (cRes.ok) setItems(((await cRes.json()) as Channel[]) ?? []);
        if (mRes.ok) setMetrics((await mRes.json()) as ChannelMetrics);
      } catch {
        setStatus("API no disponible");
      }
    })();
  }, []);
 
  const fmtInt = useMemo(() => new Intl.NumberFormat("es-ES"), []);
  const fmtUSD0 = useMemo(() => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }), []);
  const totalAudience = useMemo(() => items.reduce((sum, c) => sum + (c.audienceSize ?? 0), 0), [items]);
  const avgPrice = useMemo(() => (items.length ? Math.round(items.reduce((s, c) => s + (c.pricePerPost ?? 0), 0) / items.length) : 0), [items]);
  const activeCount = useMemo(() => items.filter((c) => c.status === "ACTIVE").length, [items]);
  const ctrAvg = useMemo(() => {
    const map = new Map((metrics?.items ?? []).map((m) => [m.channelId, m.ctr]));
    const values = items.map((c) => map.get(c.id) ?? 0);
    if (!values.length) return 0;
    return Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1));
  }, [items, metrics?.items]);

  const ctrMap = useMemo(() => new Map((metrics?.items ?? []).map((m) => [m.channelId, m.ctr])), [metrics?.items]);
 
   return (
     <main className="container">
       <section className="card reveal">
        <div className="spaced">
          <div>
            <h1 className="title">Mis canales</h1>
            <p className="subtitle">Nombre · Categoría · Precio · Verificación · CTR medio.</p>
          </div>
          <div className="row" style={{ gap: "0.5rem" }}>
            <a className="btn btn-primary btn-sm" href="/app/creator/precios">Gestionar precios</a>
            <a className="btn btn-outline btn-sm" href="/app/creator">Volver</a>
          </div>
        </div>
        {status && <div className="badge mt-xs" role="status" aria-live="polite">{status}</div>}

        <div className="grid-4 exec-kpis-secondary mt-sm">
          <div className="kpi exec-kpi-mini">
            <div className="label">Canales activos</div>
            <div className="value">{activeCount}</div>
          </div>
          <div className="kpi exec-kpi-mini">
            <div className="label">Audiencia total</div>
            <div className="value">{fmtInt.format(totalAudience)}</div>
          </div>
          <div className="kpi exec-kpi-mini">
            <div className="label">Precio medio</div>
            <div className="value">{fmtUSD0.format(avgPrice)}</div>
          </div>
          <div className="kpi exec-kpi-mini">
            <div className="label">CTR medio</div>
            <div className="value">{ctrAvg}%</div>
          </div>
        </div>

        {items.length ? (
          <ul className="list exec-clean-list mt-sm">
            {items.map((c) => {
              const ctr = ctrMap.get(c.id) ?? 0;
              const verified = c.status === "ACTIVE";
              return (
                <li key={c.id} className="list-item">
                  <div className="spaced" style={{ alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontWeight: 950 }}>
                        {c.name} · {c.category} · {fmtUSD0.format(c.pricePerPost)}
                      </div>
                      <div className="muted mt-xs">Audiencia: {fmtInt.format(c.audienceSize ?? 0)}</div>
                    </div>
                    <div className="row" style={{ gap: "0.5rem", alignItems: "center" }}>
                      <span className={`badge ${verified ? "badge-success" : ""}`}>{verified ? "Verificado" : c.status === "SUSPENDED" ? "Suspendido" : "Pendiente"}</span>
                      <span className="badge">CTR {ctr}%</span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="feature-card exec-action-card mt-sm">
            <h2 className="exec-section-title">Registra tu primer canal</h2>
            <p className="exec-section-sub">Configura categoría, precio y verificación para empezar a recibir propuestas.</p>
            <div className="row mt-sm" style={{ gap: "0.75rem" }}>
              <a className="btn btn-primary btn-lg" href="/app/creator/precios">Registrar canal</a>
              <a className="btn btn-secondary btn-lg" href="/about">Ver guía rápida</a>
            </div>
          </div>
        )}
       </section>
     </main>
   );
 }
