"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "../lib/api";
 
 type Channel = {
   id: string;
   name: string;
   category: string;
   audienceSize: number;
   pricePerPost: number;
   platform: string;
   publishedCount?: number;
  engagementHint?: string;
 };
 
 export default function ChannelsPage() {
  type ChannelMetrics = {
    window_days: number;
    total: number;
    valid: number;
    invalid: number;
    top_campaigns: Array<{ campaignId: string; valid: number }>;
    by_hour: Array<{ hour: number; valid: number; total: number }>;
    by_dow: Array<{ dow: number; valid: number; total: number }>;
    invalid_reasons: Array<{ reason: string | null; count: number }>;
    active_by_hour?: Array<{ hour: number; users: number }>;
    active_by_dow?: Array<{ dow: number; users: number }>;
  };

  const isDev = process.env.NODE_ENV !== "production";
  const fmtInt = useMemo(() => new Intl.NumberFormat("es-ES"), []);
  const fmtUSD = useMemo(() => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }), []);
  const dowNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  const filler: Channel[] = useMemo(() => ([
    { id: "f1", name: "Hacking Ético España", category: "seguridad", audienceSize: 8700, pricePerPost: 105, platform: "TELEGRAM", publishedCount: 9 },
    { id: "f2", name: "Cocina Creativa MX", category: "food", audienceSize: 15300, pricePerPost: 85, platform: "TELEGRAM", publishedCount: 17 },
    { id: "f3", name: "Startups Madrid", category: "negocios", audienceSize: 11800, pricePerPost: 130, platform: "TELEGRAM", publishedCount: 21 },
    { id: "f4", name: "Viajes Low Cost LATAM", category: "viajes", audienceSize: 20450, pricePerPost: 90, platform: "TELEGRAM", publishedCount: 26 },
    { id: "f5", name: "Finanzas Personales Pro", category: "finanzas", audienceSize: 22000, pricePerPost: 150, platform: "TELEGRAM", publishedCount: 31 },
  ]), []);

  const [channels, setChannels] = useState<Channel[]>([]);
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState<"ALL" | "TELEGRAM" | "DISCORD" | "WHATSAPP">("ALL");
  const [sizeBucket, setSizeBucket] = useState<"ALL" | "LT10" | "10_25" | "GTE25">("ALL");
  const [priceBucket, setPriceBucket] = useState<"ALL" | "LT100" | "100_200" | "GTE200">("ALL");
  const [sortBy, setSortBy] = useState<"price" | "size" | "popularity" | "performance">("popularity");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState<Record<string, true>>({});
  const [compare, setCompare] = useState<string[]>([]);

  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "metrics" | "best">("overview");
  const [detailsMetrics, setDetailsMetrics] = useState<ChannelMetrics | null>(null);

  const [metricsByChannel, setMetricsByChannel] = useState<Record<string, { ctr: number; valid: number; total: number }>>({});
  const inFlightMetrics = useRef<Record<string, true>>({});

  const [openSaved, setOpenSaved] = useState(false);
  const [openFilters, setOpenFilters] = useState(false);
  const [openCompare, setOpenCompare] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const [recommended, setRecommended] = useState<Channel[]>([]);
  const [hasHistory, setHasHistory] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
 
   useEffect(() => {
    apiFetch(`/channels?limit=20`, { auth: false })
       .then((r) => r.json())
       .then((data) => {
         if (Array.isArray(data)) {
           setChannels(data);
           setStatus("");
         } else {
           setStatus("Error cargando canales");
           setChannels([]);
         }
       })
       .catch(() => {
         setStatus("API no disponible");
         setChannels([]);
       });
   }, []);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("favoriteChannels") ?? "[]";
      const ids = JSON.parse(raw) as string[];
      const next: Record<string, true> = {};
      ids.filter(Boolean).forEach((id) => { next[id] = true; });
      setFavorites(next);
    } catch {
      setFavorites({});
    }
  }, []);

  useEffect(() => {
    try {
      const ids = Object.keys(favorites);
      window.localStorage.setItem("favoriteChannels", JSON.stringify(ids));
    } catch {}
  }, [favorites]);

  function getSizeBucket(n: number) {
    if (n < 10_000) return "LT10";
    if (n < 25_000) return "10_25";
    return "GTE25";
  }

  function getPriceBucket(n: number) {
    if (n < 100) return "LT100";
    if (n < 200) return "100_200";
    return "GTE200";
  }

  const items = useMemo(() => (channels.length > 0 ? channels : (isDev ? filler : [])), [channels, filler, isDev]);

  function platformLabel(p: string) {
    if (p === "TELEGRAM") return "Telegram";
    if (p === "DISCORD") return "Discord";
    if (p === "WHATSAPP") return "WhatsApp";
    return p;
  }
  function guessImage(category: string) {
    const k = (category ?? "").toLowerCase();
    if (k.includes("deport") || k.includes("run")) return "/adflow/Running.opt.jpg";
    if (k.includes("startup") || k.includes("negocio")) return "/adflow/Startup.opt.jpg";
    return "/adflow/lifestyle.opt.jpg";
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((c) => {
        if (favoritesOnly && !favorites[c.id]) return false;
        if (platform !== "ALL" && c.platform !== platform) return false;
        if (sizeBucket !== "ALL" && getSizeBucket(c.audienceSize) !== sizeBucket) return false;
        if (priceBucket !== "ALL" && getPriceBucket(c.pricePerPost) !== priceBucket) return false;
        if (!q) return true;
        const hay = `${c.name} ${c.category} ${c.platform}`.toLowerCase();
        return hay.includes(q);
      })
      .slice();
  }, [favorites, favoritesOnly, items, platform, priceBucket, query, sizeBucket]);

  function getPerf(id: string) {
    return metricsByChannel[id]?.ctr ?? null;
  }

  const sorted = useMemo(() => {
    const next = filtered.slice();
    next.sort((a, b) => {
      if (sortBy === "price") return a.pricePerPost - b.pricePerPost;
      if (sortBy === "size") return b.audienceSize - a.audienceSize;
      if (sortBy === "popularity") return (b.publishedCount ?? 0) - (a.publishedCount ?? 0);
      const pa = getPerf(a.id);
      const pb = getPerf(b.id);
      if (pa == null && pb == null) return (b.publishedCount ?? 0) - (a.publishedCount ?? 0);
      if (pa == null) return 1;
      if (pb == null) return -1;
      return pb - pa;
    });
    return next;
  }, [filtered, sortBy, metricsByChannel]);

  const visible = useMemo(() => sorted.slice(0, 60), [sorted]);

  async function ensureMetrics(id: string) {
    if (metricsByChannel[id] || inFlightMetrics.current[id]) return;
    inFlightMetrics.current[id] = true;
    try {
      const r = await apiFetch(`/channels/${id}/metrics`);
      if (!r.ok) return;
      const data = await r.json() as ChannelMetrics;
      const total = data.total ?? 0;
      const valid = data.valid ?? 0;
      const ctr = total ? Number(((valid / total) * 100).toFixed(1)) : 0;
      setMetricsByChannel((m) => ({ ...m, [id]: { ctr, total, valid } }));
    } catch {
    } finally {
      delete inFlightMetrics.current[id];
    }
  }

  useEffect(() => {
    const seed = visible.slice(0, sortBy === "performance" ? 24 : 12).map((c) => c.id);
    seed.forEach((id) => { void ensureMetrics(id); });
  }, [visible, sortBy]);

  useEffect(() => {
    if (!selectedChannel?.id) return;
    const id = selectedChannel.id;
    document.body.style.overflow = "hidden";
    closeBtnRef.current?.focus();
    apiFetch(`/channels/${id}/metrics`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: ChannelMetrics) => {
        setDetailsMetrics(data);
        const total = data.total ?? 0;
        const valid = data.valid ?? 0;
        const ctr = total ? Number(((valid / total) * 100).toFixed(1)) : 0;
        setMetricsByChannel((m) => ({ ...m, [id]: { ctr, total, valid } }));
        setActiveTab("metrics");
      })
      .catch(() => {
        setDetailsMetrics(null);
        setActiveTab("overview");
      });
  }, [selectedChannel?.id]);

  useEffect(() => {
    if (selectedChannel) return;
    if (openSaved || openFilters || openCompare) {
      document.body.style.overflow = "hidden";
      closeBtnRef.current?.focus();
    } else {
      document.body.style.overflow = "";
    }
  }, [openCompare, openFilters, openSaved, selectedChannel]);

  useEffect(() => {
    apiFetch(`/campaigns/inbox?limit=200&offset=0`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(async (rows: Array<{ channelId?: string }>) => {
        const ids = Array.from(new Set(rows.map((r) => r.channelId).filter((x): x is string => !!x)));
        if (!ids.length) return;
        setHasHistory(true);
        const sample = ids.slice(0, 8);
        const chans = (await Promise.all(sample.map(async (id) => {
          try {
            const res = await apiFetch(`/channels/${id}`, { auth: false });
            if (!res.ok) return null;
            return (await res.json()) as Channel;
          } catch {
            return null;
          }
        }))).filter((c): c is Channel => !!c);
        if (!chans.length) return;
        const counts: Record<string, number> = {};
        const pcounts: Record<string, number> = {};
        chans.forEach((c) => {
          counts[c.category] = (counts[c.category] ?? 0) + 1;
          pcounts[c.platform] = (pcounts[c.platform] ?? 0) + 1;
        });
        const topCategory = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
        const topPlatform = Object.entries(pcounts).sort((a, b) => b[1] - a[1])[0]?.[0];
        const next = items
          .filter((c) => (topCategory ? c.category === topCategory : true) || (topPlatform ? c.platform === topPlatform : true))
          .filter((c) => !ids.includes(c.id))
          .slice(0, 6);
        setRecommended(next);
      })
      .catch(() => {});
  }, [items.length]);

  const globalMetrics = useMemo(() => {
    const count = filtered.length;
    const avgPrice = count ? Math.round(filtered.reduce((a, b) => a + (b.pricePerPost ?? 0), 0) / count) : 0;
    const avgSize = count ? Math.round(filtered.reduce((a, b) => a + (b.audienceSize ?? 0), 0) / count) : 0;
    const withCtr = filtered.map((c) => metricsByChannel[c.id]?.ctr).filter((x): x is number => typeof x === "number");
    const avgCtr = withCtr.length ? Number((withCtr.reduce((a, b) => a + b, 0) / withCtr.length).toFixed(1)) : null;
    return { count, avgPrice, avgSize, avgCtr };
  }, [filtered, metricsByChannel]);

  function toggleFavorite(id: string) {
    setFavorites((m) => {
      const next = { ...m };
      if (next[id]) delete next[id];
      else next[id] = true;
      return next;
    });
  }

  function toggleCompare(id: string) {
    setCompare((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  }

  const compareItems = useMemo(() => compare.map((id) => items.find((c) => c.id === id)).filter((c): c is Channel => !!c), [compare, items]);
  const compareGrid = useMemo(() => {
    const cols = Math.max(1, compareItems.length);
    return { gridTemplateColumns: `220px repeat(${cols}, minmax(0, 1fr))` } as const;
  }, [compareItems.length]);

  function closeAllModals() {
    setSelectedChannel(null);
    setOpenSaved(false);
    setOpenFilters(false);
    setOpenCompare(false);
    setDetailsMetrics(null);
    setActiveTab("overview");
    document.body.style.overflow = "";
  }

  function isCompareDisabled(id: string) {
    return !compare.includes(id) && compare.length >= 3;
  }

  return (
    <main className="container">
      <section className="card reveal">
        <div className="market-header">
          <div>
            <h1 className="title">Descubre canales para tu próxima campaña</h1>
            <p className="subtitle">Filtra por categoría, tamaño y precio para encontrar la mejor oportunidad.</p>
          </div>
          <div className="row" style={{ gap: "0.5rem", alignItems: "flex-start" }}>
            <button
              className="btn"
              aria-expanded={toolsOpen}
              aria-controls="market-tools"
              onClick={() => setToolsOpen((v) => !v)}
            >
              {toolsOpen ? "Ocultar barra" : "Mostrar barra"}
            </button>
            <button className="btn" onClick={() => { setOpenSaved(true); setOpenFilters(false); setOpenCompare(false); }}>
              Guardados ({Object.keys(favorites).length})
            </button>
            <button className="btn btn-primary" onClick={() => { setOpenFilters(true); setOpenSaved(false); setOpenCompare(false); }}>Filtros avanzados</button>
          </div>
        </div>

        <div id="market-tools" className={`market-tools ${toolsOpen ? "open" : "collapsed"}`}>
          <div className="market-search">
            <input
              className="input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre o categoría"
              aria-label="Buscar canales"
            />
          </div>
          <div className="market-filters">
            <div className="filter-group">
              <span className="filter-label">Plataforma</span>
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

            <div className="filter-group">
              <span className="filter-label">Tamaño</span>
              {([
                { id: "LT10", label: "<10k" },
                { id: "10_25", label: "10–25k" },
                { id: "GTE25", label: "25k+" },
              ] as const).map((b) => (
                <button
                  key={b.id}
                  className={`filter-chip ${sizeBucket === b.id ? "active" : ""}`}
                  onClick={() => setSizeBucket((cur) => (cur === b.id ? "ALL" : b.id))}
                  type="button"
                >
                  {b.label}
                </button>
              ))}
            </div>

            <div className="filter-group">
              <span className="filter-label">Precio</span>
              {([
                { id: "LT100", label: "<100" },
                { id: "100_200", label: "100–200" },
                { id: "GTE200", label: "200+" },
              ] as const).map((b) => (
                <button
                  key={b.id}
                  className={`filter-chip ${priceBucket === b.id ? "active" : ""}`}
                  onClick={() => setPriceBucket((cur) => (cur === b.id ? "ALL" : b.id))}
                  type="button"
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          <div className="market-right">
            <label className="row" style={{ gap: "0.4rem" }}>
              <input
                type="checkbox"
                checked={favoritesOnly}
                onChange={(e) => setFavoritesOnly(e.target.checked)}
              />
              <span>Mostrar solo favoritos</span>
            </label>

            <label className="row" style={{ gap: "0.5rem" }}>
              <span className="muted">Ordenar por</span>
              <select className="select" value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
                <option value="price">Precio</option>
                <option value="size">Tamaño</option>
                <option value="popularity">Popularidad</option>
                <option value="performance">Rendimiento</option>
              </select>
            </label>
          </div>
        </div>

        <div className="market-metrics">
          <div className="mini-card">
            <div className="label">Canales activos</div>
            <div className="value">{fmtInt.format(globalMetrics.count)}</div>
          </div>
          <div className="mini-card">
            <div className="label">Precio medio</div>
            <div className="value">{globalMetrics.count ? fmtUSD.format(globalMetrics.avgPrice) : "—"}</div>
          </div>
          <div className="mini-card">
            <div className="label">Tamaño medio</div>
            <div className="value">{globalMetrics.count ? `${fmtInt.format(globalMetrics.avgSize)}` : "—"}</div>
          </div>
          <div className="mini-card">
            <div className="label">Conversión media</div>
            <div className="value">{globalMetrics.avgCtr != null ? `${globalMetrics.avgCtr}%` : "—"}</div>
          </div>
        </div>

        {hasHistory && recommended.length > 0 && (
          <div className="market-reco">
            <div className="spaced" style={{ alignItems: "baseline" }}>
              <h2 className="title">Recomendados para ti</h2>
              <span className="muted">Basado en tus campañas previas</span>
            </div>
            <div className="channels-market-grid">
              {recommended.map((c) => (
                <div key={c.id} className="channel-compact group">
                  <div className="channel-img-wrap">
                    <img className="channel-img" src={guessImage(c.category)} alt={c.category} loading="lazy" decoding="async" />
                  </div>
                  <div className="channel-pills">
                    <span className="pill violet">{c.category}</span>
                    <span className="pill violet">{platformLabel(c.platform)}</span>
                  </div>
                  <div className="channel-card-title">{c.name}</div>
                  <div className="channel-card-meta">
                    {platformLabel(c.platform)} · {fmtInt.format(c.audienceSize)} miembros · {fmtInt.format(c.publishedCount ?? 0)} anuncios
                  </div>
                  {c.engagementHint && <div className="channel-card-eng">{c.engagementHint}</div>}
                  <div className="channel-bottom">
                    <div className="channel-price">
                      <div className="amount">{fmtUSD.format(c.pricePerPost)}</div>
                      <div className="label">por publicación</div>
                    </div>
                    <div className="channel-cta">
                      <a className="btn btn-primary cta-gradient" href={`/campaigns/new?channelId=${c.id}`}>Comprar espacio</a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {status && <p className="badge">{status}</p>}

        {items.length === 0 && !status ? (
          <div className="feature-card mt-sm">
            <h3 className="feature-title">Aún no hay canales disponibles</h3>
            <p className="feature-desc">Vuelve en unos minutos o prueba más tarde.</p>
            <div className="row mt-xs">
              <a className="btn btn-primary" href="/campaigns/new">Crear campaña</a>
              <a className="btn" href="/about">Ver cómo funciona</a>
            </div>
          </div>
        ) : (
        <div className="channels-market-grid">
          {visible.map((c) => (
            <div key={c.id} className="channel-compact group">
              <div className="channel-img-wrap">
                <img className="channel-img" src={guessImage(c.category)} alt={c.category} loading="lazy" decoding="async" />
              </div>
              <div className="channel-pills">
                <span className="pill violet">{c.category}</span>
                <span className="pill violet">{platformLabel(c.platform)}</span>
              </div>
              <div className="channel-card-title">{c.name}</div>
              <div className="channel-card-meta">
                {platformLabel(c.platform)} · {fmtInt.format(c.audienceSize)} miembros · {fmtInt.format(c.publishedCount ?? 0)} anuncios
              </div>
              {c.engagementHint && <div className="channel-card-eng">{c.engagementHint}</div>}
              <div className="channel-bottom">
                <div className="channel-price">
                  <div className="amount">{fmtUSD.format(c.pricePerPost)}</div>
                  <div className="label">por publicación</div>
                </div>
                <div className="channel-cta">
                  <a className="btn btn-primary cta-gradient" href={`/campaigns/new?channelId=${c.id}`}>Comprar espacio</a>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}

        {compare.length > 0 && (
          <div className="compare-fab">
            <button className="btn btn-primary" onClick={() => { setOpenCompare(true); setOpenSaved(false); setOpenFilters(false); }}>
              Comparar ({compare.length}/3)
            </button>
          </div>
        )}

        {(selectedChannel || openSaved || openFilters || openCompare) && (
          <div className="modal-backdrop" onClick={closeAllModals}>
            <div
              className="modal-card modal-wide"
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title-market"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => { if (e.key === "Escape") closeAllModals(); }}
              tabIndex={-1}
            >
              <div className="modal-header">
                <h3 id="modal-title-market" className="modal-title">
                  {selectedChannel ? selectedChannel.name : openCompare ? "Comparativa" : openSaved ? "Guardados" : "Filtros avanzados"}
                </h3>
                <button ref={closeBtnRef} className="modal-close" onClick={closeAllModals}>Cerrar</button>
              </div>

              {openSaved && !selectedChannel && !openCompare && !openFilters && (
                <div className="modal-content">
                  <div className="grid" style={{ gap: "0.5rem" }}>
                    {Object.keys(favorites).length === 0 && (
                      <div className="feature-card">
                        <h4 className="feature-title">Aún no tienes guardados</h4>
                        <p className="feature-desc">Marca un canal con ♡ para tenerlo a mano aquí.</p>
                      </div>
                    )}
                    {Object.keys(favorites).map((id) => {
                      const c = items.find((x) => x.id === id);
                      if (!c) return null;
                      return (
                        <div key={id} className="list-item">
                          <div className="spaced" style={{ gap: "0.75rem" }}>
                            <div>
                              <div style={{ fontWeight: 800 }}>{c.name}</div>
                              <div className="muted">{c.category} · {c.platform} · {fmtInt.format(c.audienceSize)} suscr.</div>
                            </div>
                            <div className="row" style={{ gap: "0.5rem" }}>
                              <button className="btn" onClick={() => setSelectedChannel(c)}>Ver detalles</button>
                              <a className="btn btn-primary" href={`/campaigns/new?channelId=${c.id}`}>Crear campaña</a>
                              <button className="btn btn-outline" onClick={() => toggleCompare(c.id)} disabled={isCompareDisabled(c.id)}>
                                {compare.includes(c.id) ? "Comparando" : "Comparar"}
                              </button>
                              <button className="btn" onClick={() => toggleFavorite(c.id)}>Quitar</button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {openFilters && !selectedChannel && !openCompare && !openSaved && (
                <div className="modal-content">
                  <div className="grid" style={{ gap: "0.75rem" }}>
                    <div className="kpi-grid">
                      <div className="kpi">
                        <div className="label">Plataforma</div>
                        <div className="value">
                          <select className="select" value={platform} onChange={(e) => setPlatform(e.target.value as typeof platform)}>
                            <option value="ALL">Todas</option>
                            <option value="TELEGRAM">Telegram</option>
                          </select>
                        </div>
                      </div>
                      <div className="kpi">
                        <div className="label">Tamaño</div>
                        <div className="value">
                          <select className="select" value={sizeBucket} onChange={(e) => setSizeBucket(e.target.value as typeof sizeBucket)}>
                            <option value="ALL">Todos</option>
                            <option value="LT10">&lt;10k</option>
                            <option value="10_25">10–25k</option>
                            <option value="GTE25">25k+</option>
                          </select>
                        </div>
                      </div>
                      <div className="kpi">
                        <div className="label">Precio</div>
                        <div className="value">
                          <select className="select" value={priceBucket} onChange={(e) => setPriceBucket(e.target.value as typeof priceBucket)}>
                            <option value="ALL">Todos</option>
                            <option value="LT100">&lt;100</option>
                            <option value="100_200">100–200</option>
                            <option value="GTE200">200+</option>
                          </select>
                        </div>
                      </div>
                      <div className="kpi">
                        <div className="label">Orden</div>
                        <div className="value">
                          <select className="select" value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
                            <option value="price">Precio</option>
                            <option value="size">Tamaño</option>
                            <option value="popularity">Popularidad</option>
                            <option value="performance">Rendimiento</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="row" style={{ justifyContent: "space-between" }}>
                      <label className="row" style={{ gap: "0.4rem" }}>
                        <input type="checkbox" checked={favoritesOnly} onChange={(e) => setFavoritesOnly(e.target.checked)} />
                        <span>Mostrar solo favoritos</span>
                      </label>
                      <button
                        className="btn"
                        onClick={() => {
                          setQuery("");
                          setPlatform("ALL");
                          setSizeBucket("ALL");
                          setPriceBucket("ALL");
                          setSortBy("popularity");
                          setFavoritesOnly(false);
                        }}
                      >
                        Limpiar filtros
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {openCompare && !selectedChannel && !openSaved && !openFilters && (
                <div className="modal-content">
                  {compareItems.length === 0 ? (
                    <div className="feature-card">
                      <h4 className="feature-title">Selecciona hasta 3 canales</h4>
                      <p className="feature-desc">Usa el botón “Comparar” en las cards para construir tu tabla.</p>
                    </div>
                  ) : (
                    <div className="compare-table">
                      <div className="compare-row head" style={compareGrid}>
                        <div className="cell">Campo</div>
                        {compareItems.map((c) => (
                          <div key={c.id} className="cell">{c.name}</div>
                        ))}
                      </div>
                      {([
                        { label: "Plataforma", get: (c: Channel) => c.platform },
                        { label: "Categoría", get: (c: Channel) => c.category },
                        { label: "Suscriptores", get: (c: Channel) => fmtInt.format(c.audienceSize) },
                        { label: "Campañas previas", get: (c: Channel) => fmtInt.format(c.publishedCount ?? 0) },
                        { label: "CTR medio", get: (c: Channel) => (getPerf(c.id) != null ? `${getPerf(c.id)}%` : "—") },
                        { label: "Precio", get: (c: Channel) => fmtUSD.format(c.pricePerPost) },
                      ] as const).map((row) => (
                        <div key={row.label} className="compare-row" style={compareGrid}>
                          <div className="cell muted">{row.label}</div>
                          {compareItems.map((c) => (
                            <div key={c.id} className="cell">{row.get(c)}</div>
                          ))}
                        </div>
                      ))}
                      <div className="compare-actions">
                        <button className="btn" onClick={() => setCompare([])}>Limpiar</button>
                        <div className="row" style={{ gap: "0.5rem" }}>
                          {compareItems.map((c) => (
                            <a key={c.id} className="btn btn-primary" href={`/campaigns/new?channelId=${c.id}`}>Crear campaña</a>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedChannel && (
                <>
                  <div className="modal-content">
                    <div className="tabs" role="tablist" aria-label="Detalle de canal">
                      <button className={`tab ${activeTab === "overview" ? "active" : ""}`} type="button" onClick={() => setActiveTab("overview")}>Resumen</button>
                      <button className={`tab ${activeTab === "metrics" ? "active" : ""}`} type="button" onClick={() => setActiveTab("metrics")}>Métricas</button>
                      <button className={`tab ${activeTab === "best" ? "active" : ""}`} type="button" onClick={() => setActiveTab("best")}>Mejor momento</button>
                    </div>

                    <div className="modal-kpis">
                      <div className="kpi"><div className="label">Audiencia</div><div className="value">{fmtInt.format(selectedChannel.audienceSize)}</div></div>
                      <div className="kpi"><div className="label">Precio</div><div className="value">{fmtUSD.format(selectedChannel.pricePerPost)}</div></div>
                      <div className="kpi"><div className="label">Campañas previas</div><div className="value">{fmtInt.format(selectedChannel.publishedCount ?? 0)}</div></div>
                      <div className="kpi"><div className="label">CTR medio</div><div className="value">{getPerf(selectedChannel.id) != null ? `${getPerf(selectedChannel.id)}%` : "—"}</div></div>
                    </div>

                    {activeTab === "overview" && (
                      <div className="grid" style={{ gridTemplateColumns: "2fr 1fr", marginTop: "0.75rem", alignItems: "center" }}>
                        <div className="feature-card">
                          <h4 className="feature-title">Resumen</h4>
                          <p className="feature-desc">
                            Categoría: <strong>{selectedChannel.category}</strong> · Plataforma: <strong>{selectedChannel.platform}</strong>
                          </p>
                          <p className="feature-desc">Recomendación: compara precio vs CTR para decidir con confianza.</p>
                        </div>
                        <div className="feature-card">
                          <h4 className="feature-title">Precio</h4>
                          <p className="feature-desc">{fmtUSD.format(selectedChannel.pricePerPost)} por publicación.</p>
                        </div>
                      </div>
                    )}

                    {activeTab === "metrics" && (
                      <div style={{ marginTop: "0.75rem" }}>
                        <div className="kpi-grid">
                          <div className="kpi"><div className="label">Clicks</div><div className="value">{fmtInt.format(detailsMetrics?.total ?? 0)}</div></div>
                          <div className="kpi"><div className="label">Válidos</div><div className="value">{fmtInt.format(detailsMetrics?.valid ?? 0)}</div></div>
                          <div className="kpi"><div className="label">Inválidos</div><div className="value">{fmtInt.format(detailsMetrics?.invalid ?? 0)}</div></div>
                          <div className="kpi"><div className="label">CTR</div><div className="value">{detailsMetrics && detailsMetrics.total ? ((detailsMetrics.valid / detailsMetrics.total) * 100).toFixed(1) : "0.0"}%</div></div>
                        </div>
                        <h4 className="feature-title" style={{ marginTop: "0.75rem" }}>Distribución por hora</h4>
                        <div className="chart">
                          {Array.from({ length: 24 }).map((_, h) => {
                            const v = (detailsMetrics?.by_hour.find((x) => x.hour === h)?.valid ?? 0);
                            const max = Math.max(1, ...(detailsMetrics?.by_hour.map((x) => x.valid) ?? [1]));
                            return <div key={h} className="bar" title={`${h}:00`} style={{ height: `${(v / max) * 120}px` }} />;
                          })}
                        </div>
                        <h4 className="feature-title" style={{ marginTop: "0.75rem" }}>Distribución por día</h4>
                        <div className="chart">
                          {Array.from({ length: 7 }).map((_, d) => {
                            const v = (detailsMetrics?.by_dow.find((x) => x.dow === d)?.valid ?? 0);
                            const max = Math.max(1, ...(detailsMetrics?.by_dow.map((x) => x.valid) ?? [1]));
                            return <div key={d} className="bar alt" title={dowNames[d]} style={{ height: `${(v / max) * 120}px` }} />;
                          })}
                        </div>
                        <h4 className="feature-title" style={{ marginTop: "0.75rem" }}>Motivos de inválidos</h4>
                        <ul className="list">
                          {(detailsMetrics?.invalid_reasons ?? []).map((r, i) => (
                            <li key={i} className="list-item">
                              <div className="spaced">
                                <div>{r.reason ?? "NONE"}</div>
                                <span className="badge">{fmtInt.format(r.count)}</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {activeTab === "best" && (
                      <div style={{ marginTop: "0.75rem" }}>
                        <h4 className="feature-title">Mejores horas</h4>
                        <ul className="list">
                          {(() => {
                            const source = detailsMetrics?.active_by_hour && detailsMetrics.active_by_hour.length
                              ? detailsMetrics.active_by_hour.map((x) => ({ hour: x.hour, score: x.users }))
                              : (detailsMetrics?.by_hour ?? []).map((x) => ({ hour: x.hour, score: x.valid }));
                            const sorted = source.slice().sort((a, b) => b.score - a.score).slice(0, 3);
                            return (sorted.length ? sorted : [{ hour: 10, score: 0 }]).map((h, i) => (
                              <li key={i} className="list-item">
                                <div className="spaced">
                                  <div>{String(h.hour).padStart(2, "0")}:00</div>
                                  <span className="badge">Usuarios activos: {fmtInt.format(h.score)}</span>
                                </div>
                              </li>
                            ));
                          })()}
                        </ul>
                        <h4 className="feature-title">Mejores días</h4>
                        <ul className="list">
                          {(() => {
                            const source = detailsMetrics?.active_by_dow && detailsMetrics.active_by_dow.length
                              ? detailsMetrics.active_by_dow.map((x) => ({ dow: x.dow, score: x.users }))
                              : (detailsMetrics?.by_dow ?? []).map((x) => ({ dow: x.dow, score: x.valid }));
                            const sorted = source.slice().sort((a, b) => b.score - a.score).slice(0, 2);
                            return (sorted.length ? sorted : [{ dow: 2, score: 0 }]).map((d, i) => (
                              <li key={i} className="list-item">
                                <div className="spaced">
                                  <div>{dowNames[d.dow]}</div>
                                  <span className="badge">Usuarios activos: {fmtInt.format(d.score)}</span>
                                </div>
                              </li>
                            ));
                          })()}
                        </ul>
                        <div className="feature-card">
                          <h4 className="feature-title">Recomendación</h4>
                          <p className="feature-desc">Publica en los top días y horas del canal para maximizar resultados. Ajusta el presupuesto según tu objetivo.</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="modal-footer">
                    <button className="btn" onClick={() => toggleFavorite(selectedChannel.id)}>
                      {favorites[selectedChannel.id] ? "Guardado" : "Guardar"} {favorites[selectedChannel.id] ? "♥" : "♡"}
                    </button>
                    <button className="btn btn-outline" onClick={() => toggleCompare(selectedChannel.id)} disabled={isCompareDisabled(selectedChannel.id)}>
                      {compare.includes(selectedChannel.id) ? "Comparando" : "Comparar"}
                    </button>
                    <a className="btn btn-primary" href={`/campaigns/new?channelId=${selectedChannel.id}`}>Crear campaña</a>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  );
 }
