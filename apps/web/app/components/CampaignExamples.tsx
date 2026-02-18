 "use client";
 
import { useEffect, useRef, useState } from "react";
 
 type Example = {
   name: string;
   stats: {
     impressions: number;
     clicks: number;
     ctr: number;
     conversions: number;
     cvr: number;
     spend: number;
     cpc: number;
     cpa: number;
     roas: number;
     monthly: number[];
     notes: string;
   };
   link: string;
 };
 
 const examples: Example[] = [
   {
     name: "Crypto Daily LATAM",
     stats: {
       impressions: 78000,
       clicks: 2420,
       ctr: 3.1,
       conversions: 210,
       cvr: 8.7,
       spend: 2640,
       cpc: 1.09,
       cpa: 12.57,
       roas: 3.4,
       monthly: [280, 340, 310, 420, 390, 680],
       notes: "Buen encaje audiencia-producto; CTA claro; ROAS alto por fidelidad.",
     },
     link: "/channels",
   },
   {
     name: "Ecommerce Growth Hub",
     stats: {
       impressions: 54000,
       clicks: 1296,
       ctr: 2.4,
       conversions: 95,
       cvr: 7.3,
       spend: 1850,
       cpc: 1.43,
       cpa: 19.47,
       roas: 2.2,
       monthly: [180, 200, 210, 240, 230, 236],
       notes: "CTR moderado; mejorar oferta y creatividad para bajar CPA.",
     },
     link: "/campaigns/new",
   },
   {
     name: "IA Builders ESP",
     stats: {
       impressions: 42000,
       clicks: 1176,
       ctr: 2.8,
       conversions: 88,
       cvr: 7.5,
       spend: 1420,
       cpc: 1.21,
       cpa: 16.14,
       roas: 2.8,
       monthly: [120, 140, 160, 210, 240, 306],
       notes: "Audiencia técnica receptiva; buen rendimiento en contenido educativo.",
     },
     link: "/channels",
   },
 ];
 
 export default function CampaignExamples() {
 const [open, setOpen] = useState<number | null>(null);
 const closeBtnRef = useRef<HTMLButtonElement | null>(null);
 function fmtNumber(n: number) { return n.toLocaleString("es-ES"); }
 function fmtUSD(n: number) { return `USD ${n}`; }
 useEffect(() => {
   if (open !== null) {
     document.body.style.overflow = "hidden";
     closeBtnRef.current?.focus();
   } else {
     document.body.style.overflow = "";
   }
 }, [open]);
 
  return (
    <div className="grid-2">
      {examples.map((ex, i) => (
        <div key={ex.name} className="feature-card">
          <div className="spaced">
            <h3 className="feature-title">{ex.name}</h3>
          </div>
          <p className="feature-desc">Explora rendimiento real y decide con confianza.</p>
          <div className="row mt-xs" style={{ marginTop: "0.35rem" }}>
            <span className="badge">CTR {ex.stats.ctr}%</span>
            <span className="badge">ROAS {ex.stats.roas}x</span>
            <span className="badge">CPC USD {ex.stats.cpc}</span>
          </div>
          <div className="row mt-xs" style={{ marginTop: "0.5rem", gap: "0.5rem" }}>
            <button className="btn btn-primary" onClick={() => setOpen(i)}>Ver estadísticas</button>
            <a className="btn btn-outline" href={ex.link}>Ver canal</a>
          </div>
          
          {/* per-card inline details removed; modal below */}
         </div>
       ))}
      {open !== null && (
        <div className="modal-backdrop" onClick={() => setOpen(null)}>
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title-examples"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => { if (e.key === "Escape") setOpen(null); }}
            tabIndex={-1}
          >
            <div className="modal-header">
              <h3 id="modal-title-examples" className="modal-title">{examples[open].name}</h3>
              <button ref={closeBtnRef} className="modal-close" onClick={() => setOpen(null)}>Cerrar</button>
            </div>
            <div className="modal-content">
              {(() => {
                const idx = open!;
                const ex = examples[idx];
                const monthly = ex.stats.monthly;
                const last = monthly.at(-1) ?? 0;
                const prev = monthly.at(-2) ?? last;
                const maxMonthly = Math.max(...monthly);
                const points = monthly
                  .map((v, i) => {
                    const x = (i / (monthly.length - 1)) * 600;
                    const y = 180 - (v / maxMonthly) * 150 - 10;
                    return `${x},${y}`;
                  })
                  .join(" ");
                const trendUp = last - prev >= 0;
                return (
              <>
              <div>
                <div className="modal-kpis">
                  <div className="kpi"><div className="label">Impresiones</div><div className="value">{fmtNumber(ex.stats.impressions)}</div></div>
                  <div className="kpi"><div className="label">Clicks</div><div className="value">{fmtNumber(ex.stats.clicks)}</div></div>
                  <div className="kpi"><div className="label">CTR</div><div className="value">{ex.stats.ctr}%</div></div>
                  <div className="kpi"><div className="label">Conversiones</div><div className="value">{ex.stats.conversions}</div></div>
                  <div className="kpi"><div className="label">CVR</div><div className="value">{ex.stats.cvr}%</div></div>
                  <div className="kpi"><div className="label">Spend</div><div className="value">{fmtUSD(ex.stats.spend)}</div></div>
                  <div className="kpi"><div className="label">CPC</div><div className="value">{fmtUSD(ex.stats.cpc)}</div></div>
                  <div className="kpi"><div className="label">CPA</div><div className="value">{fmtUSD(ex.stats.cpa)}</div></div>
                  <div className="kpi"><div className="label">ROAS</div><div className="value">{ex.stats.roas}x</div></div>
                </div>
                <div className="grid" style={{ gridTemplateColumns: "2fr 1fr", marginTop: "0.75rem", alignItems: "center" }}>
                  <svg className="line-chart" viewBox="0 0 600 180" preserveAspectRatio="none">
                    <polyline
                      fill="none"
                      stroke="var(--primary)"
                      strokeWidth="2"
                      points={points}
                    />
                  </svg>
                  <div className="donut" />
                </div>
                <p className="feature-desc" style={{ marginTop: "0.5rem" }}>{ex.stats.notes}</p>
              </div>
              <div>
                <div className="kpi-grid">
                  <div className="kpi"><div className="label">Último mes</div><div className="value">{last}</div></div>
                  <div className="kpi"><div className="label">Mejor mes</div><div className="value">{Math.max(...monthly)}</div></div>
                  <div className="kpi"><div className="label">Peor mes</div><div className="value">{Math.min(...monthly)}</div></div>
                  <div className="kpi"><div className="label">Tendencia</div><div className="value">{trendUp ? "↑" : "↓"}</div></div>
                </div>
              </div>
              </>
                );
              })()}
            </div>
            <div className="modal-footer">
              <a className="btn btn-primary" href="/login">Login/Register</a>
            </div>
          </div>
        </div>
      )}
     </div>
   );
 }
