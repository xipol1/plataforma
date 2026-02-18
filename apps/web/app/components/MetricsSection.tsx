"use client";

import { useEffect, useMemo, useRef, useState } from "react";

function CheckIcon() {
  return (
    <svg className="metrics-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M20 7l-10 10-4-4" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function MetricsSection() {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [activeCampaignId, setActiveCampaignId] = useState("saas-b2b");
  const [swapKey, setSwapKey] = useState(0);

  const campaigns = useMemo(
    () => [
      {
        id: "saas-b2b",
        name: "Lanzamiento SaaS B2B",
        kpis: { clicks: "2.438", clicksSub: "Últimos 7 días", publications: "12", publicationsSub: "Totales", last: "Hace 2h", lastSub: "Campaña verificada" },
        rows: [
          { date: "12/02", channel: "Startup Builders Weekly", clicks: "438" },
          { date: "10/02", channel: "Performance Running Club", clicks: "291" },
          { date: "07/02", channel: "Healthy Living Collective", clicks: "189" },
        ],
      },
      {
        id: "ecom-fitness",
        name: "Promo Ecommerce Fitness",
        kpis: { clicks: "1.102", clicksSub: "Últimos 7 días", publications: "5", publicationsSub: "Totales", last: "Hace 1d", lastSub: "Publicación confirmada" },
        rows: [
          { date: "14/02", channel: "Fitness Deals España", clicks: "372" },
          { date: "11/02", channel: "Performance Running Club", clicks: "241" },
          { date: "08/02", channel: "Gym & Nutrition Weekly", clicks: "189" },
        ],
      },
      {
        id: "health-content",
        name: "Contenido Salud & Bienestar",
        kpis: { clicks: "786", clicksSub: "Últimos 7 días", publications: "3", publicationsSub: "Totales", last: "Hace 3d", lastSub: "Solicitud aceptada" },
        rows: [
          { date: "13/02", channel: "Healthy Living Collective", clicks: "301" },
          { date: "09/02", channel: "Mindful Habits", clicks: "265" },
          { date: "06/02", channel: "Wellness Digest", clicks: "220" },
        ],
      },
    ],
    [],
  );

  const activeCampaign = campaigns.find((c) => c.id === activeCampaignId) ?? campaigns[0]!;

  function selectCampaign(id: string) {
    if (id === activeCampaignId) return;
    setActiveCampaignId(id);
    setSwapKey((k) => k + 1);
  }

  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;

    if (typeof window === "undefined") {
      setVisible(true);
      return;
    }

    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
    if (reduceMotion) {
      setVisible(true);
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.18 },
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section className="container metrics-section">
      <div className="metrics-grid">
        <div className="metrics-content">
          <h2 className="metrics-title">Mide el impacto real.</h2>
          <p className="metrics-sub">Clicks verificados y métricas transparentes desde tu panel.</p>
          <ul className="metrics-list">
            <li className="metrics-item">
              <CheckIcon />
              <span>Clicks registrados en tiempo real</span>
            </li>
            <li className="metrics-item">
              <CheckIcon />
              <span>Historial por campaña</span>
            </li>
            <li className="metrics-item">
              <CheckIcon />
              <span>Estado verificable de publicación</span>
            </li>
          </ul>
        </div>

        <div className="metrics-visual">
          <div ref={panelRef} className="metrics-panel" data-visible={visible ? "true" : "false"}>
            <div className="metrics-badge">Activo</div>

            <div className="metrics-switch">
              <div className="metrics-switch-label">Campañas</div>
              <div className="metrics-pills" role="tablist" aria-label="Campañas de ejemplo">
                {campaigns.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`metrics-pill${c.id === activeCampaignId ? " active" : ""}`}
                    role="tab"
                    aria-selected={c.id === activeCampaignId}
                    onClick={() => selectCampaign(c.id)}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            <div key={swapKey} className="metrics-swap">
              <div className="metrics-kpis">
                <div className="metrics-kpi">
                  <div className="metrics-kpi-label">CLICKS</div>
                  <div className="metrics-kpi-value">{activeCampaign.kpis.clicks}</div>
                  <div className="metrics-kpi-sub">{activeCampaign.kpis.clicksSub}</div>
                </div>
                <div className="metrics-kpi">
                  <div className="metrics-kpi-label">PUBLICACIONES</div>
                  <div className="metrics-kpi-value">{activeCampaign.kpis.publications}</div>
                  <div className="metrics-kpi-sub">{activeCampaign.kpis.publicationsSub}</div>
                </div>
                <div className="metrics-kpi">
                  <div className="metrics-kpi-label">ÚLTIMA ACTIVIDAD</div>
                  <div className="metrics-kpi-value">{activeCampaign.kpis.last}</div>
                  <div className="metrics-kpi-sub">{activeCampaign.kpis.lastSub}</div>
                </div>
              </div>

              <div className="metrics-table">
                <div className="metrics-head">
                  <div className="metrics-date">Fecha</div>
                  <div>Canal</div>
                  <div className="metrics-clicks">Clicks</div>
                </div>
                <div>
                  {activeCampaign.rows.map((r, idx) => (
                    <div
                      key={`${activeCampaign.id}-${r.date}-${r.channel}`}
                      className={`metrics-row${idx === activeCampaign.rows.length - 1 ? " last" : ""}`}
                    >
                      <div className="metrics-date">{r.date}</div>
                      <div className="metrics-channel" title={r.channel}>
                        {r.channel}
                      </div>
                      <div className="metrics-clicks">{r.clicks}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
