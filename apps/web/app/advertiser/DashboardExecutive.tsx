"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch, getApiUrl } from "../lib/api";

type Period = "7d" | "30d" | "90d";

type Campaign = {
  id: string;
  channelId: string;
  channelName: string;
  channelCategory: string;
  channelPrice: number;
  status: string;
  createdAt: string;
  scheduledAt: string | null;
  startAt: string | null;
  endAt: string | null;
  publishedAt: string | null;
  destinationUrl: string;
  copyText: string;
};

type Summary = {
  window_days: number;
  total: number;
  paid: number;
  published: number;

  spend: number;
  spend_prev: number;
  impressions: number;
  impressions_prev: number;
  clicks: number;
  clicks_prev: number;
  roas: number;
  roas_prev: number;

  ctr: number;
  ctr_prev: number;
  cpc: number;
  cpc_prev: number;
  cpa: number;
  cpa_prev: number;
  conversions: number;
  conversions_prev: number;
  cvr: number;
  cvr_prev: number;

  clicksByMonth: number[];
};

type BillingSummary = {
  window_days: number;
  credits_available: number;
  spend: number;
  invoices: Array<{ code: string; amount: number; currency: string; status: string; createdAt: string }>;
};

type ActivityEvent = { type: string; entity: string; entityId: string; ts: string; meta?: unknown };

function pctDelta(current: number, prev: number) {
  if (!Number.isFinite(current) || !Number.isFinite(prev)) return null;
  if (prev === 0) return current === 0 ? 0 : null;
  return Number((((current - prev) / prev) * 100).toFixed(1));
}

function formatDeltaLine(current: number, prev: number, mode: "vs" | "var") {
  const d = pctDelta(current, prev);
  const base = mode === "vs" ? "vs periodo anterior" : "variación %";
  if (d == null) return base;
  const sign = d > 0 ? "+" : "";
  return `${sign}${d}% · ${base}`;
}

function formatEvent(ev: ActivityEvent) {
  const idShort = ev.entityId ? ev.entityId.slice(0, 8).toUpperCase() : "";
  if (ev.type === "PUBLISH_SENT") return { title: "Publicación realizada", meta: idShort ? `— ${idShort}` : "" };
  if (ev.type === "PUBLISH") return { title: "Publicación aprobada", meta: idShort ? `— ${idShort}` : "" };
  if (ev.type === "SCHEDULE_PROPOSAL") return { title: "Horario propuesto", meta: idShort ? `— ${idShort}` : "" };
  if (ev.type === "SCHEDULE_REQUEST") return { title: "Solicitud de publicación", meta: idShort ? `— ${idShort}` : "" };
  if (ev.type === "INTENT_CREATED") return { title: "Pago iniciado", meta: idShort ? `— ${idShort}` : "" };
  if (ev.type === "WEBHOOK_EVENT") return { title: "Pago actualizado", meta: idShort ? `— ${idShort}` : "" };
  if (ev.type === "STATUS_CHANGE") return { title: "Estado actualizado", meta: idShort ? `— ${idShort}` : "" };
  return { title: ev.type.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase()), meta: idShort ? `— ${idShort}` : "" };
}

export default function DashboardExecutive() {
  const [status, setStatus] = useState("");
  const [period, setPeriod] = useState<Period>("30d");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [billing, setBilling] = useState<BillingSummary | null>(null);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);

  const apiUrl = getApiUrl();
  const fmtInt = useMemo(() => new Intl.NumberFormat("es-ES"), []);
  const fmtUSD = useMemo(() => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }), []);

  const windowDays = period === "7d" ? 7 : period === "90d" ? 90 : 30;

  useEffect(() => {
    setStatus("");
    void (async () => {
      try {
        const [cRes, sRes, bRes, eRes] = await Promise.all([
          apiFetch(`/campaigns/inbox?limit=200&offset=0`),
          apiFetch(`/campaigns/summary?window_days=${windowDays}`),
          apiFetch(`/billing/summary?window_days=${windowDays}&limit=5`),
          apiFetch(`/campaigns/events`),
        ]);

        if (cRes.ok) {
          const rows = (await cRes.json()) as Campaign[];
          setCampaigns(Array.isArray(rows) ? rows : []);
        } else {
          setCampaigns([]);
        }

        if (sRes.ok) {
          const data = (await sRes.json()) as Summary;
          setSummary(data);
        } else {
          setSummary(null);
        }

        if (bRes.ok) {
          const data = (await bRes.json()) as BillingSummary;
          setBilling(data);
        } else {
          setBilling(null);
        }

        if (eRes.ok) {
          const rows = (await eRes.json()) as ActivityEvent[];
          setActivity(Array.isArray(rows) ? rows : []);
        } else {
          setActivity([]);
        }
      } catch {
        setStatus("API no disponible");
      }
    })();
  }, [apiUrl, windowDays]);

  const activeCampaigns = useMemo(() => {
    const blocked = new Set(["COMPLETED", "REFUNDED"]);
    return campaigns.filter((c) => !blocked.has(c.status));
  }, [campaigns]);

  const upcomingPublications = useMemo(() => {
    const now = Date.now();
    return campaigns
      .map((c) => {
        const when = c.startAt ?? c.scheduledAt;
        const ts = when ? new Date(when).getTime() : NaN;
        return { c, when, ts };
      })
      .filter((x) => Number.isFinite(x.ts) && x.ts > now)
      .sort((a, b) => a.ts - b.ts)
      .slice(0, 5)
      .map((x) => ({
        id: x.c.id,
        when: x.when!,
        channelName: x.c.channelName,
        status: x.c.startAt ? "Programada" : "Pendiente",
      }));
  }, [campaigns]);

  const performanceSeries = useMemo(() => {
    const base = summary?.clicksByMonth ?? [];
    const take = period === "7d" ? 3 : period === "90d" ? 12 : 6;
    return base.slice(-take);
  }, [period, summary?.clicksByMonth]);

  const performanceMax = Math.max(1, ...(performanceSeries.length ? performanceSeries : [0]));
  const performanceHasData = performanceSeries.some((v) => v > 0);

  const filteredActivity = useMemo(() => {
    const now = Date.now();
    const minTs = now - windowDays * 24 * 60 * 60 * 1000;
    return activity
      .filter((e) => {
        const ts = e.ts ? new Date(e.ts).getTime() : 0;
        return ts >= minTs;
      })
      .slice(0, 20);
  }, [activity, windowDays]);

  const lastActivityText = useMemo(() => {
    const rows = [...activity].sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
    const last = rows[0];
    if (!last) return { when: "", title: "" };
    const diffMs = Date.now() - new Date(last.ts).getTime();
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    const when = diffDays <= 0 ? "Hoy" : `Hace ${diffDays}d`;
    const t = formatEvent({ type: last.type, entity: last.entity, entityId: last.entityId, ts: last.ts });
    return { when, title: t.title };
  }, [activity]);

  const exampleCampaigns = useMemo(() => {
    return campaigns.slice(0, 3).map((c) => ({
      id: c.id,
      name: c.channelName,
      when: c.startAt ?? c.scheduledAt,
      status: c.status,
    }));
  }, [campaigns]);

  const k = summary ?? {
    window_days: windowDays,
    total: campaigns.length,
    paid: 0,
    published: 0,

    spend: 0,
    spend_prev: 0,
    impressions: 0,
    impressions_prev: 0,
    clicks: 0,
    clicks_prev: 0,
    roas: 0,
    roas_prev: 0,

    ctr: 0,
    ctr_prev: 0,
    cpc: 0,
    cpc_prev: 0,
    cpa: 0,
    cpa_prev: 0,
    conversions: 0,
    conversions_prev: 0,
    cvr: 0,
    cvr_prev: 0,

    clicksByMonth: [],
  };

  return (
    <main className="container">
      <section className="card reveal">
        <div className="exec-top">
          <div>
            <h1 className="exec-title">Panel de control</h1>
            <p className="exec-subtitle">Resumen de tus campañas y rendimiento reciente.</p>
          </div>
          <label className="label field-sm">
            Periodo
            <select className="select" value={period} onChange={(e) => setPeriod(e.target.value as Period)}>
              <option value="7d">Últimos 7 días</option>
              <option value="30d">Últimos 30 días</option>
              <option value="90d">Últimos 90 días</option>
            </select>
          </label>
        </div>

        {status && <div className="badge" role="status" aria-live="polite">{status}</div>}

        <div className="grid-4 exec-kpis-primary mt-md">
          <div className="feature-card exec-kpi-card exec-kpi-primary">
            <div className="exec-kpi-label">Inversión</div>
            <div className="exec-kpi-value">{fmtUSD.format(k.spend)}</div>
            <div className="exec-kpi-sub">{formatDeltaLine(k.spend, k.spend_prev, "vs")}</div>
          </div>
          <div className="feature-card exec-kpi-card exec-kpi-primary">
            <div className="exec-kpi-label">Impresiones</div>
            <div className="exec-kpi-value">{fmtInt.format(k.impressions)}</div>
            <div className="exec-kpi-sub">{formatDeltaLine(k.impressions, k.impressions_prev, "var")}</div>
          </div>
          <div className="feature-card exec-kpi-card exec-kpi-primary">
            <div className="exec-kpi-label">Clicks</div>
            <div className="exec-kpi-value">{fmtInt.format(k.clicks)}</div>
            <div className="exec-kpi-sub">{formatDeltaLine(k.clicks, k.clicks_prev, "var")}</div>
          </div>
          <div className="feature-card exec-kpi-card exec-kpi-primary">
            <div className="exec-kpi-label">ROAS</div>
            <div className="exec-kpi-value">{k.roas.toFixed(2)}x</div>
            <div className="exec-kpi-sub">{formatDeltaLine(k.roas, k.roas_prev, "var")}</div>
          </div>
        </div>

        <div className="grid-4 exec-kpis-secondary mt-sm">
          <div className="kpi exec-kpi-mini">
            <div className="label">CTR</div>
            <div className="value">{k.ctr}%</div>
          </div>
          <div className="kpi exec-kpi-mini">
            <div className="label">CPC</div>
            <div className="value">USD {k.cpc}</div>
          </div>
          <div className="kpi exec-kpi-mini">
            <div className="label">CPA</div>
            <div className="value">USD {k.cpa}</div>
          </div>
          <div className="kpi exec-kpi-mini">
            <div className="label">Conversiones</div>
            <div className="value">{k.conversions}</div>
          </div>
        </div>
      </section>

      <section className="card reveal mt-md">
        <div className="feature-card exec-action-card">
          {campaigns.length === 0 ? (
            <>
              <h2 className="exec-section-title">Empieza tu primera campaña</h2>
              <p className="exec-section-sub">Crea tu primera campaña y empieza a medir impacto real en comunidades activas.</p>
              <div className="row mt-sm" style={{ gap: "0.75rem" }}>
                <a className="btn btn-primary btn-lg" data-help="Inicia la creación de una nueva campaña" href="/app/advertiser/new">Crear campaña</a>
                <a className="btn btn-secondary btn-lg" data-help="Explora canales disponibles y sus precios" href="/channels">Explorar canales</a>
              </div>
            </>
          ) : (
            <>
              <h2 className="exec-section-title">Tienes {activeCampaigns.length} campañas activas</h2>
              <p className="exec-section-sub">Gestiona tus campañas y crea nuevas oportunidades.</p>
              <div className="row mt-sm" style={{ gap: "0.75rem" }}>
                <a className="btn btn-primary btn-lg" data-help="Abre tu bandeja de campañas en curso" href="/app/advertiser/inbox">Ver campañas</a>
                <a className="btn btn-secondary btn-lg" data-help="Crea una nueva campaña" href="/app/advertiser/new">Nueva campaña</a>
              </div>
            </>
          )}
        </div>
      </section>

      <section className="card reveal mt-md">
        <div>
          <h2 className="exec-section-title">Rendimiento mensual</h2>
          <p className="exec-section-sub">Actividad y resultados durante el periodo seleccionado.</p>
        </div>

        <div className="feature-card mt-sm">
          {performanceHasData ? (
            <div className="chart">
              {performanceSeries.map((v, i) => (
                <div key={i} className="bar" style={{ height: `${(v / performanceMax) * 120}px` }} />
              ))}
            </div>
          ) : (
            <p className="feature-desc">No hay suficiente actividad en este periodo.</p>
          )}

          <div className="grid-4 exec-mini-summary mt-sm">
            <div className="exec-mini-item">
              <div className="label">Spend</div>
              <div className="value">USD {k.spend}</div>
            </div>
            <div className="exec-mini-item">
              <div className="label">CPA</div>
              <div className="value">USD {k.cpa}</div>
            </div>
            <div className="exec-mini-item">
              <div className="label">CPC</div>
              <div className="value">USD {k.cpc}</div>
            </div>
            <div className="exec-mini-item">
              <div className="label">CVR</div>
              <div className="value">{k.cvr}%</div>
            </div>
          </div>
        </div>
      </section>

      <section className="card reveal mt-md">
        <div className="metrics-panel" data-visible="true">
          <div className="metrics-badge">{activeCampaigns.length > 0 ? "Activo" : "En preparación"}</div>
          <div className="metrics-switch">
            <div className="metrics-switch-label">Campañas</div>
            <div className="metrics-pills" role="tablist" aria-label="Campañas recientes">
              {exampleCampaigns.map((c, i) => (
                <button key={c.id} type="button" className={`metrics-pill ${i === 0 ? "active" : ""}`} role="tab" aria-selected={i === 0}>
                  {c.name}
                </button>
              ))}
            </div>
          </div>
          <div className="metrics-swap">
            <div className="metrics-kpis">
              <div className="metrics-kpi">
                <div className="metrics-kpi-label">CLICKS</div>
                <div className="metrics-kpi-value">{fmtInt.format(k.clicks)}</div>
                <div className="metrics-kpi-sub">Últimos {k.window_days} días</div>
              </div>
              <div className="metrics-kpi">
                <div className="metrics-kpi-label">PUBLICACIONES</div>
                <div className="metrics-kpi-value">{fmtInt.format(k.published)}</div>
                <div className="metrics-kpi-sub">Totales</div>
              </div>
              <div className="metrics-kpi">
                <div className="metrics-kpi-label">ÚLTIMA ACTIVIDAD</div>
                <div className="metrics-kpi-value">{lastActivityText.when || "—"}</div>
                <div className="metrics-kpi-sub">{lastActivityText.title || "Sin actividad reciente"}</div>
              </div>
            </div>
            <div className="metrics-table">
              <div className="metrics-head">
                <div className="metrics-date">Fecha</div>
                <div>Canal</div>
                <div className="metrics-clicks">Estado</div>
              </div>
              <div>
                {exampleCampaigns.length ? (
                  exampleCampaigns.map((c, idx) => {
                    const dateLabel = c.when ? new Date(c.when).toLocaleDateString("es-ES").slice(0, 5) : "—";
                    return (
                      <div key={c.id} className={`metrics-row ${idx === exampleCampaigns.length - 1 ? "last" : ""}`}>
                        <div className="metrics-date">{dateLabel}</div>
                        <div className="metrics-channel" title={c.name}>{c.name}</div>
                        <div className="metrics-clicks">{c.status}</div>
                      </div>
                    );
                  })
                ) : (
                  <div className="metrics-row last">
                    <div className="metrics-date">—</div>
                    <div className="metrics-channel">Sin campañas</div>
                    <div className="metrics-clicks">—</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="card reveal mt-md">
        <h2 className="exec-section-title">Operación activa</h2>

        <div className="grid-3 mt-sm">
          <div className="feature-card">
            <h3 className="feature-title">Próximas publicaciones</h3>
            {upcomingPublications.length ? (
              <ul className="list exec-clean-list mt-xs">
                {upcomingPublications.map((p) => (
                  <li key={p.id} className="list-item">
                    <div className="spaced" style={{ alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontWeight: 900 }}>
                          {new Date(p.when).toLocaleDateString("es-ES")} ·{" "}
                          {new Date(p.when).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                        <div className="muted mt-xs">{p.channelName}</div>
                      </div>
                      <div className="stack" style={{ justifyItems: "end" }}>
                        <span className="badge">{p.status}</span>
                        <a className="btn btn-outline btn-sm" data-help="Abre el detalle de la campaña programada" href={`/campaigns/${p.id}`}>Ver detalle</a>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="feature-desc mt-xs">No tienes publicaciones programadas.</p>
            )}
          </div>

          <div className="feature-card">
            <h3 className="feature-title">Campañas activas</h3>
            {activeCampaigns.length ? (
              <ul className="list exec-clean-list mt-xs">
                {activeCampaigns.slice(0, 6).map((c) => (
                  <li key={c.id} className="list-item">
                    <div className="spaced" style={{ alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontWeight: 900 }}>
                          {c.channelName} · {c.channelCategory} · {fmtUSD.format(c.channelPrice)}
                        </div>
                        <div className="muted mt-xs">Campaña {c.id.slice(0, 8).toUpperCase()}</div>
                      </div>
                      <div className="stack" style={{ justifyItems: "end" }}>
                        <span className="badge">{c.status === "PUBLISHED" || c.status === "PAID" || c.status === "READY" ? "Activa" : "Pendiente"}</span>
                        <a className="btn btn-outline btn-sm" data-help="Abre la campaña para ver y gestionar" href={`/campaigns/${c.id}`}>Ver</a>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="feature-desc mt-xs">No tienes campañas activas.</p>
            )}
          </div>

          <div className="feature-card">
            <h3 className="feature-title">Facturación</h3>
            <div className="grid-2 mt-xs">
              <div className="kpi exec-kpi-mini">
                <div className="label">Créditos disponibles</div>
                <div className="value">USD {billing?.credits_available ?? 0}</div>
              </div>
              <div className="kpi exec-kpi-mini">
                <div className="label">Gasto del mes</div>
                <div className="value">USD {billing?.spend ?? k.spend}</div>
              </div>
            </div>
            <div className="mt-sm" style={{ fontWeight: 900 }}>Últimas facturas</div>
            {(billing?.invoices?.length ?? 0) ? (
              <ul className="list exec-clean-list mt-xs">
                {billing!.invoices.map((inv) => (
                  <li key={inv.code} className="list-item">
                    <div className="spaced">
                      <div>{inv.code} · {fmtUSD.format(inv.amount)} · {inv.status === "SUCCEEDED" ? "Pagada" : inv.status}</div>
                      <span className={`badge ${inv.status === "SUCCEEDED" ? "badge-success" : ""}`}>{inv.status === "SUCCEEDED" ? "OK" : inv.status}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="feature-desc mt-xs">No hay facturas todavía.</p>
            )}
          </div>
        </div>
      </section>

      <section className="card reveal mt-md">
        <h2 className="exec-section-title">Actividad reciente</h2>
        {filteredActivity.length ? (
          <ul className="exec-timeline mt-sm">
            {filteredActivity.map((e) => {
              const t = formatEvent(e);
              return (
                <li key={`${e.type}-${e.entityId}-${e.ts}`} className="exec-timeline-item">
                  <div className="exec-timeline-dot" />
                  <div className="exec-timeline-body">
                    <div className="exec-timeline-line">
                      <span className="exec-timeline-title">{t.title}</span>{" "}
                      <span className="exec-timeline-meta">{t.meta}</span>
                    </div>
                    <div className="exec-timeline-ts">{new Date(e.ts).toLocaleString("es-ES")}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="feature-desc mt-sm">Aún no hay actividad reciente.</p>
        )}
      </section>
    </main>
  );
}
