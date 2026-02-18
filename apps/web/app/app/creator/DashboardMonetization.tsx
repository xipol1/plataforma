"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../lib/api";

type Period = "30d" | "7d" | "90d";

type CreatorSummary = {
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
};

type MyChannel = {
  id: string;
  name: string;
  category: string;
  pricePerPost: number;
  status: "PENDING" | "ACTIVE" | "SUSPENDED";
  audienceSize: number;
};

type InboxItem = {
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

type PublicationItem = { campaignId: string; channelId: string; when: string | null; channel: string; status: string };

type BillingSummary = {
  window_days: number;
  earnings: number;
  pending_payouts: number;
  invoices: Array<{ code: string; amount: number; currency: string; status: string; createdAt: string }>;
};

type CreatorEvent = { action: string; entityType: string; entityId: string; createdAt: string; meta?: string | null };

type ChannelMetrics = { window_days: number; items: Array<{ channelId: string; clicks: number; impressions: number; ctr: number }> };

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

function brandFromEmail(email: string) {
  const local = (email ?? "").split("@")[0] ?? "";
  const cleaned = local.replace(/[._-]+/g, " ").trim();
  if (!cleaned) return "Marca";
  return cleaned.replace(/\b\w/g, (m) => m.toUpperCase());
}

function formatEvent(action: string, entityId: string) {
  const short = entityId ? entityId.slice(0, 8).toUpperCase() : "";
  if (action === "CREATOR_ACCEPT") return { title: "Solicitud aceptada", meta: short ? `— ${short}` : "" };
  if (action === "CREATOR_REJECT") return { title: "Solicitud rechazada", meta: short ? `— ${short}` : "" };
  if (action === "SCHEDULE_PROPOSAL") return { title: "Calendario propuesto", meta: short ? `— ${short}` : "" };
  if (action === "SCHEDULE_REQUEST") return { title: "Nueva solicitud", meta: short ? `— ${short}` : "" };
  if (action === "PUBLISH_SENT") return { title: "Publicación realizada", meta: short ? `— ${short}` : "" };
  if (action === "PAYOUT_CONFIG_SET") return { title: "Datos de cobro actualizados", meta: "" };
  return { title: action.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase()), meta: short ? `— ${short}` : "" };
}

export default function DashboardMonetization() {
  const [status, setStatus] = useState("");
  const [period, setPeriod] = useState<Period>("30d");

  const [summary, setSummary] = useState<CreatorSummary | null>(null);
  const [channels, setChannels] = useState<MyChannel[]>([]);
  const [channelMetrics, setChannelMetrics] = useState<ChannelMetrics | null>(null);
  const [inbox, setInbox] = useState<InboxItem[]>([]);
  const [publications, setPublications] = useState<PublicationItem[]>([]);
  const [billing, setBilling] = useState<BillingSummary | null>(null);
  const [events, setEvents] = useState<CreatorEvent[]>([]);
  const [actionMsg, setActionMsg] = useState("");

  const fmtUSD0 = useMemo(() => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }), []);
  const fmtInt = useMemo(() => new Intl.NumberFormat("es-ES"), []);

  const windowDays = period === "7d" ? 7 : period === "90d" ? 90 : 30;

  useEffect(() => {
    setStatus("");
    void (async () => {
      try {
        const [sRes, cRes, mRes, iRes, pRes, bRes, eRes] = await Promise.all([
          apiFetch(`/creator/summary?window_days=${windowDays}`),
          apiFetch(`/channels/mine`),
          apiFetch(`/creator/channel-metrics?window_days=${windowDays}`),
          apiFetch(`/creator/inbox`),
          apiFetch(`/creator/publications`),
          apiFetch(`/creator/billing/summary?window_days=${windowDays}&limit=5`),
          apiFetch(`/creator/events`),
        ]);

        if (sRes.ok) setSummary((await sRes.json()) as CreatorSummary);
        if (cRes.ok) setChannels(((await cRes.json()) as MyChannel[]) ?? []);
        if (mRes.ok) setChannelMetrics((await mRes.json()) as ChannelMetrics);
        if (iRes.ok) setInbox(((await iRes.json()) as InboxItem[]) ?? []);
        if (pRes.ok) setPublications(((await pRes.json()) as PublicationItem[]) ?? []);
        if (bRes.ok) setBilling((await bRes.json()) as BillingSummary);
        if (eRes.ok) setEvents(((await eRes.json()) as CreatorEvent[]) ?? []);
      } catch {
        setStatus("API no disponible");
      }
    })();
  }, [windowDays]);

  async function acceptRequest(id: string) {
    setActionMsg("Aceptando…");
    try {
      const r = await apiFetch(`/creator/inbox/${id}/accept`, { method: "POST" });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setActionMsg((data as { message?: string }).message ?? "No se pudo aceptar");
        return;
      }
      setActionMsg("Aceptada");
      setInbox((prev) => prev.map((x) => (x.id === id ? { ...x, scheduledAt: (data as { scheduledAt?: string | null }).scheduledAt ?? x.scheduledAt } : x)));
      setTimeout(() => setActionMsg(""), 1500);
    } catch {
      setActionMsg("API no disponible");
    }
  }

  async function rejectRequest(id: string) {
    setActionMsg("Rechazando…");
    try {
      const r = await apiFetch(`/creator/inbox/${id}/reject`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setActionMsg((data as { message?: string }).message ?? "No se pudo rechazar");
        return;
      }
      setActionMsg("Rechazada");
      setInbox((prev) => prev.filter((x) => x.id !== id));
      setTimeout(() => setActionMsg(""), 1500);
    } catch {
      setActionMsg("API no disponible");
    }
  }

  const pendingRequests = useMemo(() => {
    const blocked = new Set(["COMPLETED", "REFUNDED", "DISPUTED"]);
    return inbox.filter((r) => !blocked.has(r.status)).slice(0, 8);
  }, [inbox]);

  const k = summary ?? {
    window_days: windowDays,
    earnings: 0,
    earnings_prev: 0,
    publications: 0,
    fill_rate: 0,
    ctr_avg: 0,
    avg_price: 0,
    total_audience: 0,
    clicks: 0,
    impressions: 0,
    clicksByMonth: [],
  };

  const channelCtrMap = useMemo(() => {
    const map = new Map<string, { ctr: number }>();
    for (const it of channelMetrics?.items ?? []) map.set(it.channelId, { ctr: it.ctr });
    return map;
  }, [channelMetrics?.items]);

  const suggestions = useMemo(() => {
    if (!channels.length) {
      return [
        "Define tu precio base y verifica tu canal para empezar a recibir propuestas.",
        "Refuerza horario 12:00–14:00 (Mejor CTR histórico)",
        "Ajusta categoría para mejorar encaje",
      ];
    }
    const avgPrice = k.avg_price || Math.round(channels.reduce((s, c) => s + (c.pricePerPost ?? 0), 0) / Math.max(1, channels.length));
    const best = channels
      .map((c) => ({ c, ctr: channelCtrMap.get(c.id)?.ctr ?? 0 }))
      .sort((a, b) => b.ctr - a.ctr)[0];
    const s1 =
      best && best.c && best.ctr >= 2 && best.c.pricePerPost <= avgPrice
        ? `Sube precio en ${best.c.name} +10% (Alta demanda reciente)`
        : "Optimiza tu precio según demanda (testea +5% / +10%)";
    const s2 = "Refuerza horario 12:00–14:00 (Mejor CTR histórico)";
    const s3 = channels.some((c) => !c.category) ? "Ajusta categoría para mejorar encaje" : "Ajusta categoría para mejorar encaje";
    return [s1, s2, s3];
  }, [channels, channelCtrMap, k.avg_price]);

  const lastActivityText = useMemo(() => {
    const rows = [...events].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const last = rows[0];
    if (!last) return { when: "", title: "" };
    const diffMs = Date.now() - new Date(last.createdAt).getTime();
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    const when = diffDays <= 0 ? "Hoy" : `Hace ${diffDays}d`;
    const t = formatEvent(last.action, last.entityId);
    return { when, title: t.title };
  }, [events]);

  const examplePublications = useMemo(() => {
    return publications.slice(0, 3);
  }, [publications]);

  return (
    <main className="container">
      <section className="card reveal">
        <div className="exec-top">
          <div>
            <h1 className="exec-title">Centro de monetización</h1>
            <p className="exec-subtitle">Resumen de tus canales, ingresos y rendimiento.</p>
          </div>
          <label className="label field-sm">
            Periodo
            <select className="select" value={period} onChange={(e) => setPeriod(e.target.value as Period)}>
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
            <div className="exec-kpi-value">{fmtUSD0.format(k.earnings)}</div>
            <div className="exec-kpi-sub">{formatVsPrev(k.earnings, k.earnings_prev)}</div>
          </div>
          <div className="feature-card exec-kpi-card exec-kpi-primary">
            <div className="exec-kpi-label">Publicaciones</div>
            <div className="exec-kpi-value">{fmtInt.format(k.publications)}</div>
            <div className="exec-kpi-sub">En el periodo seleccionado</div>
          </div>
          <div className="feature-card exec-kpi-card exec-kpi-primary">
            <div className="exec-kpi-label">Fill rate</div>
            <div className="exec-kpi-value">{k.fill_rate}%</div>
            <div className="exec-kpi-sub">Publicadas vs campañas recibidas</div>
          </div>
          <div className="feature-card exec-kpi-card exec-kpi-primary">
            <div className="exec-kpi-label">CTR medio</div>
            <div className="exec-kpi-value">{k.ctr_avg}%</div>
            <div className="exec-kpi-sub">Clicks válidos / clicks</div>
          </div>
        </div>

        <div className="grid-4 exec-kpis-secondary mt-sm">
          <div className="kpi exec-kpi-mini">
            <div className="label">Precio medio</div>
            <div className="value">USD {k.avg_price}</div>
          </div>
          <div className="kpi exec-kpi-mini">
            <div className="label">Audiencia total</div>
            <div className="value">{fmtInt.format(k.total_audience)}</div>
          </div>
          <div className="kpi exec-kpi-mini">
            <div className="label">Clicks</div>
            <div className="value">{fmtInt.format(k.clicks)}</div>
          </div>
          <div className="kpi exec-kpi-mini">
            <div className="label">Impresiones</div>
            <div className="value">{fmtInt.format(k.impressions)}</div>
          </div>
        </div>
      </section>

      <section className="card reveal mt-md">
        <div className="metrics-panel" data-visible="true">
          <div className="metrics-badge">{publications.length > 0 ? "Activo" : "En preparación"}</div>
          <div className="metrics-switch">
            <div className="metrics-switch-label">Campañas</div>
            <div className="metrics-pills" role="tablist" aria-label="Campañas recientes">
              {examplePublications.map((p, i) => (
                <button key={`${p.campaignId}-${p.channelId}`} type="button" className={`metrics-pill ${i === 0 ? "active" : ""}`} role="tab" aria-selected={i === 0}>
                  {p.channel}
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
                <div className="metrics-kpi-value">{fmtInt.format(k.publications)}</div>
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
                {examplePublications.length ? (
                  examplePublications.map((p, idx) => {
                    const dateLabel = p.when ? new Date(p.when).toLocaleDateString("es-ES").slice(0, 5) : "—";
                    return (
                      <div key={`${p.campaignId}-${p.channelId}-row`} className={`metrics-row ${idx === examplePublications.length - 1 ? "last" : ""}`}>
                        <div className="metrics-date">{dateLabel}</div>
                        <div className="metrics-channel" title={p.channel}>{p.channel}</div>
                        <div className="metrics-clicks">{p.status}</div>
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
        <div className="spaced">
          <div>
            <h2 className="exec-section-title">{pendingRequests.length ? "Solicitudes pendientes" : "Aún no tienes solicitudes"}</h2>
            <p className="exec-section-sub">
              {pendingRequests.length ? "Responde rápido para maximizar el fill rate." : "Registra y optimiza tus canales para empezar a recibir propuestas."}
            </p>
          </div>
          {actionMsg && <span className="badge" role="status" aria-live="polite">{actionMsg}</span>}
        </div>

        {pendingRequests.length ? (
          <ul className="list exec-clean-list mt-sm">
            {pendingRequests.map((r) => (
              <li key={r.id} className="list-item">
                <div className="spaced" style={{ alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 950 }}>
                      {brandFromEmail(r.advertiserEmail)} · {r.channelName} · USD {r.pricePerPost}
                    </div>
                    <div className="muted mt-xs">{r.status}</div>
                  </div>
                  <div className="row" style={{ gap: "0.5rem" }}>
                    <button className="btn btn-primary btn-sm" data-help="Acepta la solicitud y programa la publicación" onClick={() => void acceptRequest(r.id)}>Aceptar</button>
                    <button className="btn btn-secondary btn-sm" data-help="Rechaza la solicitud y la elimina del inbox" onClick={() => void rejectRequest(r.id)}>Rechazar</button>
                    <a className="btn btn-outline btn-sm" data-help="Abre el detalle de la campaña" href={`/app/creator/campaigns/${r.id}`}>Ver detalle</a>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="feature-card exec-action-card mt-sm">
            <div className="row" style={{ gap: "0.75rem" }}>
              <a className="btn btn-primary btn-lg" data-help="Registra un canal para empezar a recibir propuestas" href="/app/creator/precios">Registrar canal</a>
              <a className="btn btn-secondary btn-lg" data-help="Consulta una guía breve de uso de la plataforma" href="/about">Ver guía rápida</a>
            </div>
          </div>
        )}
      </section>

      <section className="card reveal mt-md">
        <div className="spaced">
          <div>
            <h2 className="exec-section-title">Próximas publicaciones</h2>
            <p className="exec-section-sub">Fecha · Canal · Estado</p>
          </div>
          <a className="btn btn-outline btn-sm" data-help="Proponer o ajustar fechas de publicación" href="/app/creator/inbox">Ajustar calendario</a>
        </div>

        {publications.length ? (
          <ul className="list exec-clean-list mt-sm">
            {publications.slice(0, 8).map((p) => (
              <li key={p.campaignId} className="list-item">
                <div className="spaced" style={{ alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 950 }}>
                      {p.when ? `${new Date(p.when).toLocaleDateString("es-ES")} · ${p.channel}` : p.channel} · {p.status}
                    </div>
                    <div className="muted mt-xs">{p.when ? new Date(p.when).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) : ""}</div>
                  </div>
                  <a className="btn btn-outline btn-sm" data-help="Abre el detalle de la campaña seleccionada" href={`/app/creator/campaigns/${p.campaignId}`}>Ver detalle</a>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="feature-desc mt-sm">No tienes publicaciones programadas.</p>
        )}
      </section>

      <section className="card reveal mt-md">
        <div className="spaced">
          <div>
            <h2 className="exec-section-title">Optimiza tus ingresos</h2>
            <p className="exec-section-sub">Recomendaciones basadas en rendimiento y demanda.</p>
          </div>
          <a className="btn btn-primary btn-sm" data-help="Configura y ajusta tus precios por canal" href="/app/creator/precios">Gestionar precios</a>
        </div>

        <div className="grid-3 mt-sm">
          {suggestions.map((s, idx) => (
            <div key={idx} className="feature-card exec-action-card">
              <div style={{ fontWeight: 950 }}>{s}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="card reveal mt-md">
        <div className="spaced">
          <div>
            <h2 className="exec-section-title">Mis canales</h2>
            <p className="exec-section-sub">Nombre · Categoría · Precio · Verificación · CTR medio</p>
          </div>
          <a className="btn btn-outline btn-sm" data-help="Gestiona tus canales (precio, verificación y datos)" href="/app/creator/precios">Gestionar</a>
        </div>

        {channels.length ? (
          <ul className="list exec-clean-list mt-sm">
            {channels.slice(0, 10).map((c) => (
              <li key={c.id} className="list-item">
                <div className="spaced" style={{ alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 950 }}>{c.name} · {c.category} · USD {c.pricePerPost}</div>
                    <div className="muted mt-xs">Audiencia: {fmtInt.format(c.audienceSize ?? 0)}</div>
                  </div>
                  <div className="row" style={{ gap: "0.5rem", alignItems: "center" }}>
                    <span className={`badge ${c.status === "ACTIVE" ? "badge-success" : ""}`}>{c.status === "ACTIVE" ? "Verificado" : "Pendiente"}</span>
                    <span className="badge">CTR {channelCtrMap.get(c.id)?.ctr ?? 0}%</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="feature-desc mt-sm">Registra tu primer canal para empezar a monetizar.</p>
        )}
      </section>

      <section className="card reveal mt-md">
        <h2 className="exec-section-title">Facturación</h2>
        <div className="grid-2 mt-sm">
          <div className="kpi exec-kpi-mini">
            <div className="label">Ingresos del mes</div>
            <div className="value">{fmtUSD0.format(billing?.earnings ?? k.earnings)}</div>
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
      </section>

      <section className="card reveal mt-md">
        <h2 className="exec-section-title">Actividad reciente</h2>
        {events.length ? (
          <ul className="exec-timeline mt-sm">
            {events.slice(0, 20).map((e) => {
              const t = formatEvent(e.action, e.entityId);
              return (
                <li key={`${e.action}-${e.entityId}-${e.createdAt}`} className="exec-timeline-item">
                  <div className="exec-timeline-dot" />
                  <div className="exec-timeline-body">
                    <div className="exec-timeline-line">
                      <span className="exec-timeline-title">{t.title}</span>{" "}
                      <span className="exec-timeline-meta">{t.meta}</span>
                    </div>
                    <div className="exec-timeline-ts">{new Date(e.createdAt).toLocaleString("es-ES")}</div>
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
