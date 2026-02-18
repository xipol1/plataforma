 "use client";
 
 import { useEffect, useMemo, useState } from "react";
 import { apiFetch } from "../../../lib/api";
 
 export default function CreatorKPIsPage() {
   const [status, setStatus] = useState("");
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");
  const [summary, setSummary] = useState<{
    window_days: number;
    earnings: number;
    earnings_prev: number;
    publications: number;
    fill_rate: number;
    ctr_avg: number;
    avg_price: number;
    total_audience: number;
    clicks: number;
    impressions: number;
    clicksByMonth: number[];
  } | null>(null);
 
  useEffect(() => {
    setStatus("Cargando…");
    const windowDays = period === "7d" ? 7 : period === "90d" ? 90 : 30;
    apiFetch(`/creator/summary?window_days=${windowDays}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((s) => {
        setSummary(s);
        setStatus("");
      })
      .catch(() => setStatus("API no disponible"));
  }, [period]);

  const fmtUSD0 = useMemo(() => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }), []);
  const fmtInt = useMemo(() => new Intl.NumberFormat("es-ES"), []);

  function pctDelta(current: number, prev: number) {
    if (!Number.isFinite(current) || !Number.isFinite(prev)) return null;
    if (prev === 0) return current === 0 ? 0 : null;
    return Number((((current - prev) / prev) * 100).toFixed(1));
  }
  function formatVsPrev(current: number, prev: number) {
    const d = pctDelta(current, prev);
    if (d == null) return "vs periodo anterior";
    const sign = d > 0 ? "+" : "";
    return `${sign}${d}% · vs periodo anterior`;
  }

  const series = useMemo(() => {
    const base = summary?.clicksByMonth ?? [];
    const take = period === "7d" ? 3 : period === "90d" ? 12 : 6;
    return base.slice(-take);
  }, [period, summary?.clicksByMonth]);
  const max = Math.max(1, ...(series.length ? series : [0]));
  const hasData = series.some((v) => v > 0);
 
   return (
     <main className="container">
      <section className="card reveal">
        <div className="spaced">
          <div>
            <h1 className="title">KPIs</h1>
            <p className="subtitle">Métricas agregadas del periodo seleccionado.</p>
          </div>
          <label className="label field-sm">
            Periodo
            <select className="select" value={period} onChange={(e) => setPeriod(e.target.value as typeof period)}>
              <option value="30d">Últimos 30 días</option>
              <option value="7d">Últimos 7 días</option>
              <option value="90d">Últimos 90 días</option>
            </select>
          </label>
        </div>
        {status && <div className="badge mt-xs" role="status" aria-live="polite">{status}</div>}

        <div className="grid-4 exec-kpis-primary mt-md">
          <div className="feature-card exec-kpi-card exec-kpi-primary">
            <div className="exec-kpi-label">Ingresos</div>
            <div className="exec-kpi-value">{fmtUSD0.format(summary?.earnings ?? 0)}</div>
            <div className="exec-kpi-sub">{formatVsPrev(summary?.earnings ?? 0, summary?.earnings_prev ?? 0)}</div>
          </div>
          <div className="feature-card exec-kpi-card exec-kpi-primary">
            <div className="exec-kpi-label">Publicaciones</div>
            <div className="exec-kpi-value">{fmtInt.format(summary?.publications ?? 0)}</div>
            <div className="exec-kpi-sub">En el periodo seleccionado</div>
          </div>
          <div className="feature-card exec-kpi-card exec-kpi-primary">
            <div className="exec-kpi-label">Fill rate</div>
            <div className="exec-kpi-value">{(summary?.fill_rate ?? 0)}%</div>
            <div className="exec-kpi-sub">Publicadas vs campañas recibidas</div>
          </div>
          <div className="feature-card exec-kpi-card exec-kpi-primary">
            <div className="exec-kpi-label">CTR medio</div>
            <div className="exec-kpi-value">{(summary?.ctr_avg ?? 0)}%</div>
            <div className="exec-kpi-sub">Clicks válidos / clicks</div>
          </div>
        </div>

        <div className="grid-4 exec-kpis-secondary mt-sm">
          <div className="kpi exec-kpi-mini">
            <div className="label">Precio medio</div>
            <div className="value">{fmtUSD0.format(summary?.avg_price ?? 0)}</div>
          </div>
          <div className="kpi exec-kpi-mini">
            <div className="label">Audiencia total</div>
            <div className="value">{fmtInt.format(summary?.total_audience ?? 0)}</div>
          </div>
          <div className="kpi exec-kpi-mini">
            <div className="label">Clicks</div>
            <div className="value">{fmtInt.format(summary?.clicks ?? 0)}</div>
          </div>
          <div className="kpi exec-kpi-mini">
            <div className="label">Impresiones</div>
            <div className="value">{fmtInt.format(summary?.impressions ?? 0)}</div>
          </div>
        </div>

        <div className="feature-card mt-md">
          <h3 className="feature-title">Clicks (serie)</h3>
          {hasData ? (
            <div className="chart">
              {series.map((v, i) => (
                <div key={i} className="bar" style={{ height: `${(v / max) * 120}px` }} />
              ))}
            </div>
          ) : (
            <p className="feature-desc mt-xs">No hay suficiente actividad en este periodo.</p>
          )}
          <div className="row mt-sm" style={{ gap: "0.5rem" }}>
            <a className="btn btn-primary" href="/app/creator">Volver al centro</a>
            <a className="btn btn-secondary" href="/app/creator/precios">Gestionar precios</a>
          </div>
        </div>
      </section>
     </main>
   );
 }
