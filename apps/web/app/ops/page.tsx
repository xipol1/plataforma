"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
 
 export default function OpsPage() {
   const [campaignId, setCampaignId] = useState("44444444-4444-4444-4444-444444444444");
   const [startAt, setStartAt] = useState("");
   const [endAt, setEndAt] = useState("");
   const [msg, setMsg] = useState("");
  const [requests, setRequests] = useState<
    { createdAt: string; campaignId: string; action: string; meta: string | null; status: string; scheduledAt: string | null; channelName: string }[]
  >([]);
  const [edits, setEdits] = useState<Record<string, { startAt?: string; endAt?: string }>>({});
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [actionFilter, setActionFilter] = useState<string>("");
  const [channelFilter, setChannelFilter] = useState<string>("");
  const [limit, setLimit] = useState<number>(20);
  const [offset, setOffset] = useState<number>(0);
  const [chatItems, setChatItems] = useState<
    { id: string; campaignId: string; senderEmail: string; advertiserEmail: string; ownerEmail: string; body: string; flags: string | null; createdAt: string; status: string }[]
  >([]);
  const [chatStatus, setChatStatus] = useState<string>("");
 
  async function fetchRequests(nextOffset?: number) {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (actionFilter) params.set("action", actionFilter);
    if (channelFilter) params.set("channelId", channelFilter);
    params.set("limit", String(limit));
    params.set("offset", String(nextOffset ?? offset));
    const url = `/campaigns/ops/requests?${params.toString()}`;
    try {
      const r = await apiFetch(url);
      if (!r.ok) return;
      const rows = await r.json();
      setRequests(rows ?? []);
      const seed: Record<string, { startAt?: string; endAt?: string }> = {};
      for (const row of rows ?? []) {
        if (row.meta) {
          try {
            const m = JSON.parse(row.meta);
            if (m?.startAt) seed[row.campaignId] = { ...(seed[row.campaignId] ?? {}), startAt: m.startAt };
            if (m?.endAt) seed[row.campaignId] = { ...(seed[row.campaignId] ?? {}), endAt: m.endAt };
          } catch {}
        }
      }
      setEdits(seed);
    } catch {}
  }

  async function fetchChat() {
    setChatStatus("Cargando mensajes…");
    try {
      const r = await apiFetch(`/ops/chat/moderation?status=PENDING_REVIEW&limit=50&offset=0`);
      const data = await r.json().catch(() => ([]));
      if (!r.ok) {
        setChatStatus((data as { message?: string }).message ?? "No se pudo cargar");
        setChatItems([]);
        return;
      }
      setChatItems(Array.isArray(data) ? data : []);
      setChatStatus("");
    } catch {
      setChatStatus("API no disponible");
      setChatItems([]);
    }
  }

  async function approveMsg(id: string) {
    setChatStatus("Aprobando…");
    try {
      const r = await apiFetch(`/ops/chat/moderation/${id}/approve`, { method: "POST" });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setChatStatus((data as { message?: string }).message ?? "No se pudo aprobar");
        return;
      }
      setChatStatus("Aprobado");
      void fetchChat();
    } catch {
      setChatStatus("API no disponible");
    }
  }

  async function rejectMsg(id: string) {
    const reason = window.prompt("Motivo de rechazo (opcional):", "Intento de irse de la plataforma") ?? "";
    setChatStatus("Rechazando…");
    try {
      const r = await apiFetch(`/ops/chat/moderation/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() || undefined }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setChatStatus((data as { message?: string }).message ?? "No se pudo rechazar");
        return;
      }
      setChatStatus("Rechazado");
      void fetchChat();
    } catch {
      setChatStatus("API no disponible");
    }
  }

  useEffect(() => {
    fetchRequests(0);
    void fetchChat();
  }, []);

  async function publish() {
     setMsg("Publicando...");
     try {
      const res = await apiFetch(`/campaigns/${campaignId}/publish`, {
         method: "PATCH",
        headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ startAt, endAt }),
       });
       const data = await res.json();
       setMsg(res.ok ? `Publicado: ${data.status}` : `Error: ${data.message ?? "fallo"}`);
     } catch {
       setMsg("API no disponible");
     }
  }
 
  async function stats() {
     setMsg("Cargando stats...");
     try {
      const res = await apiFetch(`/tracking/stats/${campaignId}`);
       const data = await res.json();
       setMsg(res.ok ? `Clicks: ${data.total}, válidos: ${data.valid}` : `Error: ${data.message ?? "fallo"}`);
     } catch {
       setMsg("API no disponible");
     }
  }
 
  return (
    <main className="container">
      <section className="card reveal">
        <h1 className="title">OPS</h1>
        <p className="subtitle">Publica campañas, gestiona solicitudes y revisa métricas operativas clave.</p>
        <div className="form max-w-640" aria-live="polite">
          <label className="label">
            Campaign ID
            <input className="input" value={campaignId} onChange={(e) => setCampaignId(e.target.value)} />
          </label>
          <div className="grid-2">
            <label className="label">
              Inicio (ISO)
              <input className="input" placeholder="2026-02-08T12:00:00Z" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
            </label>
            <label className="label">
              Fin (ISO)
              <input className="input" placeholder="2026-02-10T12:00:00Z" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
            </label>
          </div>
          <div className="row mt-sm">
            <button onClick={publish} className="btn btn-success">Publicar</button>
            <button onClick={stats} className="btn">Ver stats (30d)</button>
            {msg && <span className="badge" role="status" aria-live="polite">{msg}</span>}
          </div>
        </div>
        <h2 className="title mt-md">Solicitudes de publicación</h2>
        <div className="form max-w-960">
          <div className="grid-4 mb-xs">
            <label className="label">
              Estado
              <select className="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">Todos</option>
                {["DRAFT","READY_FOR_PAYMENT","PAID","SUBMITTED","READY","PUBLISHED","DISPUTED","COMPLETED","REFUNDED"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="label">
              Acción
              <select className="select" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
                <option value="">Todas</option>
                <option value="SCHEDULE_REQUEST">SCHEDULE_REQUEST</option>
                <option value="SCHEDULE_PROPOSAL">SCHEDULE_PROPOSAL</option>
              </select>
            </label>
            <label className="label">
              Canal
              <input className="input" placeholder="channelId" value={channelFilter} onChange={(e) => setChannelFilter(e.target.value)} />
            </label>
            <label className="label">
              Límite
              <input className="input" type="number" min={1} max={200} value={limit} onChange={(e) => setLimit(Number(e.target.value))} />
            </label>
          </div>
          <div className="row mb-sm">
            <button className="btn btn-primary" onClick={() => { setOffset(0); fetchRequests(0); }}>Aplicar</button>
            <button className="btn" onClick={() => { const next = Math.max(0, offset - limit); setOffset(next); fetchRequests(next); }}>Prev</button>
            <button className="btn" onClick={() => { const next = offset + limit; setOffset(next); fetchRequests(next); }}>Next</button>
          </div>
          {requests.length === 0 && <p className="subtitle">No hay solicitudes</p>}
          {requests.map((r) => (
            <div key={`${r.campaignId}-${r.createdAt}`} className="feature-card mb-sm">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <span className="badge">Campaña: {r.campaignId}</span>
                <span className="badge">Canal: {r.channelName}</span>
                <span className="badge">Estado: {r.status}</span>
                <span className="badge">Acción: {r.action}</span>
                <span className="badge">{new Date(r.createdAt).toLocaleString()}</span>
              </div>
              <div className="grid-2 mt-xs">
                <label className="label">
                  Inicio (ISO)
                  <input
                    className="input"
                    value={edits[r.campaignId]?.startAt ?? ""}
                    onChange={(e) => setEdits((prev) => ({ ...prev, [r.campaignId]: { ...(prev[r.campaignId] ?? {}), startAt: e.target.value } }))}
                  />
                </label>
                <label className="label">
                  Fin (ISO)
                  <input
                    className="input"
                    value={edits[r.campaignId]?.endAt ?? ""}
                    onChange={(e) => setEdits((prev) => ({ ...prev, [r.campaignId]: { ...(prev[r.campaignId] ?? {}), endAt: e.target.value } }))}
                  />
                </label>
              </div>
              <div className="row mt-xs">
                <button
                  className="btn btn-success"
                  onClick={async () => {
                    const s = edits[r.campaignId]?.startAt ?? "";
                    const e = edits[r.campaignId]?.endAt ?? "";
                    try {
                      const res = await apiFetch(`/campaigns/${r.campaignId}/publish`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ startAt: s, endAt: e }),
                      });
                      const data = await res.json();
                      setMsg(res.ok ? `Publicado: ${data.status}` : `Error: ${data.message ?? "fallo"}`);
                    } catch {
                      setMsg("API no disponible");
                    }
                  }}
                >
                  Aprobar y publicar
                </button>
              </div>
            </div>
          ))}
        </div>

        <h2 className="title mt-md">Mensajes (moderación)</h2>
        <p className="subtitle">Los mensajes se revisan antes de entregarse al otro usuario.</p>
        <div className="row mb-sm" aria-live="polite">
          <button className="btn btn-primary" onClick={() => void fetchChat()}>Refrescar mensajes</button>
          {chatStatus && <span className="badge" role="status" aria-live="polite">{chatStatus}</span>}
        </div>
        {chatItems.length === 0 && !chatStatus ? <p className="subtitle">No hay mensajes pendientes</p> : null}
        {chatItems.map((m) => (
          <div key={m.id} className="feature-card mb-sm">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span className="badge">Campaña: {m.campaignId}</span>
              <span className="badge">De: {m.senderEmail}</span>
              <span className="badge">Anunciante: {m.advertiserEmail}</span>
              <span className="badge">Creador: {m.ownerEmail}</span>
              <span className="badge">{new Date(m.createdAt).toLocaleString()}</span>
            </div>
            <div className="mt-xs" style={{ whiteSpace: "pre-wrap" }}>{m.body}</div>
            {m.flags ? <div className="muted mt-xs" style={{ whiteSpace: "pre-wrap" }}>Flags: {m.flags}</div> : null}
            <div className="row mt-xs" style={{ gap: "0.5rem" }}>
              <button className="btn btn-success" onClick={() => void approveMsg(m.id)}>Aprobar</button>
              <button className="btn btn-secondary" onClick={() => void rejectMsg(m.id)}>Rechazar</button>
            </div>
          </div>
        ))}

        <div className="row mt-sm">
          <a href="/channels" className="btn">Canales</a>
          <a href="/app/advertiser/inbox" className="btn">Mis campañas</a>
        </div>
      </section>
    </main>
   );
 }
