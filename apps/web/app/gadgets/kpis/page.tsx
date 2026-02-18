 "use client";
import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";
export default function GadgetKPIsPage() {
  const [summary, setSummary] = useState({ total: 0, paid: 0, published: 0, valid_clicks: 0, invalid_clicks: 0, spend: 0 });
  useEffect(() => {
    apiFetch(`/campaigns/summary`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) =>
        setSummary({
          total: Number(d.total ?? 0),
          paid: Number(d.paid ?? 0),
          published: Number(d.published ?? 0),
          valid_clicks: Number(d.valid ?? 0),
          invalid_clicks: Math.max(Number(d.clicks ?? 0) - Number(d.valid ?? 0), 0),
          spend: Number(d.spend ?? 0),
        }),
      )
      .catch(() => {});
  }, []);
  const ctr = (summary.valid_clicks && summary.total) ? ((summary.valid_clicks / Math.max(summary.total, 1)) * 100) : 0;
  return (
    <main className="container">
      <section className="card reveal">
        <h1 className="title">KPIs</h1>
        <p className="subtitle">Indicadores clave del último periodo.</p>
        <div className="kpi-grid">
          <div className="kpi"><div className="label">Campañas</div><div className="value">{summary.total}</div></div>
          <div className="kpi"><div className="label">Pagadas</div><div className="value">{summary.paid}</div></div>
          <div className="kpi"><div className="label">Publicadas</div><div className="value">{summary.published}</div></div>
          <div className="kpi"><div className="label">Clics válidos</div><div className="value">{summary.valid_clicks}</div></div>
          <div className="kpi"><div className="label">Clics inválidos</div><div className="value">{summary.invalid_clicks}</div></div>
          <div className="kpi"><div className="label">CTR aprox</div><div className="value">{ctr.toFixed(1)}%</div></div>
          <div className="kpi"><div className="label">Gasto</div><div className="value">USD {summary.spend}</div></div>
        </div>
      </section>
    </main>
  );
}
