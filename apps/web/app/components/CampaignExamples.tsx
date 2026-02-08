 "use client";
 
 import { useState } from "react";
 
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
 
  return (
    <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
      {examples.map((ex, i) => (
        <div key={ex.name} className="feature-card">
          <div className="spaced">
            <h3 className="feature-title">{ex.name}</h3>
          </div>
          <p className="feature-desc">Pulsa “Ver campaña” o “Estadísticas” para explorar.</p>
          <div className="row" style={{ marginTop: "0.35rem" }}>
            <span className="badge">CTR {ex.stats.ctr}%</span>
            <span className="badge">ROAS {ex.stats.roas}x</span>
            <span className="badge">CPC USD {ex.stats.cpc}</span>
          </div>
          <div className="row" style={{ marginTop: "0.5rem", gap: "0.5rem" }}>
            <a className="btn" href={ex.link}>Ver campaña</a>
            <button className="btn btn-primary" onClick={() => setOpen(i)}>Estadísticas</button>
          </div>
          
          {/* per-card inline details removed; modal below */}
         </div>
       ))}
      {open !== null && (
        <div className="modal-backdrop" onClick={() => setOpen(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{examples[open].name}</h3>
              <button className="modal-close" onClick={() => setOpen(null)}>Cerrar</button>
            </div>
            <div className="modal-content">
              <div>
                <div className="modal-kpis">
                  <div className="kpi"><div className="label">Impresiones</div><div className="value">{examples[open].stats.impressions.toLocaleString("en-US")}</div></div>
                  <div className="kpi"><div className="label">Clicks</div><div className="value">{examples[open].stats.clicks.toLocaleString("en-US")}</div></div>
                  <div className="kpi"><div className="label">CTR</div><div className="value">{examples[open].stats.ctr}%</div></div>
                  <div className="kpi"><div className="label">Conversiones</div><div className="value">{examples[open].stats.conversions}</div></div>
                  <div className="kpi"><div className="label">CVR</div><div className="value">{examples[open].stats.cvr}%</div></div>
                  <div className="kpi"><div className="label">Spend</div><div className="value">USD {examples[open].stats.spend}</div></div>
                  <div className="kpi"><div className="label">CPC</div><div className="value">USD {examples[open].stats.cpc}</div></div>
                  <div className="kpi"><div className="label">CPA</div><div className="value">USD {examples[open].stats.cpa}</div></div>
                  <div className="kpi"><div className="label">ROAS</div><div className="value">{examples[open].stats.roas}x</div></div>
                </div>
                <div className="grid" style={{ gridTemplateColumns: "2fr 1fr", marginTop: "0.75rem", alignItems: "center" }}>
                  <svg className="line-chart" viewBox="0 0 600 180" preserveAspectRatio="none">
                    <polyline
                      fill="none"
                      stroke="var(--primary)"
                      strokeWidth="2"
                      points={examples[open].stats.monthly
                        .map((v, idx) => {
                          const x = (idx / (examples[open].stats.monthly.length - 1)) * 600;
                          const max = Math.max(...examples[open].stats.monthly);
                          const y = 180 - (v / max) * 150 - 10;
                          return `${x},${y}`;
                        })
                        .join(" ")}
                    />
                  </svg>
                  <div className="donut" />
                </div>
                <p className="feature-desc" style={{ marginTop: "0.5rem" }}>{examples[open].stats.notes}</p>
              </div>
              <div>
                <div className="kpi-grid">
                  <div className="kpi"><div className="label">Último mes</div><div className="value">{examples[open].stats.monthly.at(-1)}</div></div>
                  <div className="kpi"><div className="label">Mejor mes</div><div className="value">{Math.max(...examples[open].stats.monthly)}</div></div>
                  <div className="kpi"><div className="label">Peor mes</div><div className="value">{Math.min(...examples[open].stats.monthly)}</div></div>
                  <div className="kpi"><div className="label">Tendencia</div><div className="value">{examples[open].stats.monthly.at(-1) - examples[open].stats.monthly.at(-2) >= 0 ? "↑" : "↓"}</div></div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <a className="btn" href="/channels">Explorar canales</a>
              <a className="btn btn-primary" href="/campaigns/new">Crear campaña</a>
            </div>
          </div>
        </div>
      )}
     </div>
   );
 }
