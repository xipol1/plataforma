"use client";

import { useEffect, useMemo, useState } from "react";
import ChatPanel from "../../../../components/ChatPanel";
import { useParams } from "next/navigation";
import { apiFetch } from "../../../../lib/api";

type CampaignDetail = {
  id: string;
  status: string;
  createdAt: string;
  scheduledAt: string | null;
  startAt: string | null;
  endAt: string | null;
  publishedAt: string | null;
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

function brandFromEmail(email: string) {
  const local = (email ?? "").split("@")[0] ?? "";
  const cleaned = local.replace(/[._-]+/g, " ").trim();
  if (!cleaned) return "Marca";
  return cleaned.replace(/\b\w/g, (m) => m.toUpperCase());
}

function toDatetimeLocalValue(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function CreatorCampaignDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const fmtUSD0 = useMemo(() => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }), []);

  const [status, setStatus] = useState("");
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [msg, setMsg] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");

  useEffect(() => {
    setStatus("");

    void (async () => {
      try {
        const r = await apiFetch(`/creator/campaigns/${id}`);
        const data = await r.json().catch(() => ({}));
        if (!r.ok) {
          setStatus((data as { message?: string }).message ?? "No se pudo cargar el detalle");
          setCampaign(null);
          return;
        }
        const c = data as CampaignDetail;
        setCampaign(c);
        setStartAt(toDatetimeLocalValue(c.startAt ?? c.scheduledAt));
        setEndAt(toDatetimeLocalValue(c.endAt));
      } catch {
        setStatus("API no disponible");
      }
    })();
  }, [id]);

  async function accept() {
    setMsg("Aceptando…");
    try {
      const r = await apiFetch(`/creator/inbox/${id}/accept`, { method: "POST" });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setMsg((data as { message?: string }).message ?? "No se pudo aceptar");
        return;
      }
      setMsg("Aceptada");
      setCampaign((prev) => (prev ? { ...prev, scheduledAt: (data as { scheduledAt?: string | null }).scheduledAt ?? prev.scheduledAt } : prev));
      setTimeout(() => setMsg(""), 1500);
    } catch {
      setMsg("API no disponible");
    }
  }

  async function reject() {
    setMsg("Rechazando…");
    try {
      const r = await apiFetch(`/creator/inbox/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setMsg((data as { message?: string }).message ?? "No se pudo rechazar");
        return;
      }
      setMsg("Rechazada");
      setCampaign((prev) => (prev ? { ...prev, status: (data as { status?: string }).status ?? prev.status } : prev));
    } catch {
      setMsg("API no disponible");
    }
  }

  async function proposeSchedule() {
    const s = startAt ? new Date(startAt).toISOString() : "";
    const e = endAt ? new Date(endAt).toISOString() : "";
    if (!s || !e) {
      setMsg("Selecciona inicio y fin");
      return;
    }
    if (new Date(e).getTime() <= new Date(s).getTime()) {
      setMsg("Fin debe ser posterior al inicio");
      return;
    }
    setMsg("Enviando propuesta…");
    try {
      const r = await apiFetch(`/creator/schedule-proposal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: id, startAt: s, endAt: e }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setMsg((data as { message?: string }).message ?? "No se pudo proponer");
        return;
      }
      setMsg("Propuesta enviada");
      setCampaign((prev) => (prev ? { ...prev, scheduledAt: (data as { scheduledAt?: string | null }).scheduledAt ?? prev.scheduledAt } : prev));
      setTimeout(() => setMsg(""), 1500);
    } catch {
      setMsg("API no disponible");
    }
  }

  async function confirmPublished() {
    setMsg("Confirmando publicación…");
    try {
      const s = startAt ? new Date(startAt).toISOString() : undefined;
      const e = endAt ? new Date(endAt).toISOString() : undefined;
      const r = await apiFetch(`/creator/inbox/${id}/confirm-published`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startAt: s, endAt: e }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setMsg((data as { message?: string }).message ?? "No se pudo publicar");
        return;
      }
      setMsg("Publicada");
      setCampaign((prev) =>
        prev
          ? {
              ...prev,
              status: (data as { status?: string }).status ?? prev.status,
              startAt: (data as { startAt?: string | null }).startAt ?? prev.startAt,
              endAt: (data as { endAt?: string | null }).endAt ?? prev.endAt,
            }
          : prev,
      );
      setTimeout(() => setMsg(""), 1500);
    } catch {
      setMsg("API no disponible");
    }
  }

  return (
    <main className="container">
      <section className="card reveal">
        <div className="spaced">
          <div>
            <h1 className="title">Detalle de solicitud</h1>
            <p className="subtitle">Gestiona propuesta, calendario y decisión.</p>
          </div>
          <a className="btn btn-outline" href="/app/creator">Volver</a>
        </div>
        {status && <div className="badge mt-xs" role="status" aria-live="polite">{status}</div>}
        {msg && <div className="badge mt-xs" role="status" aria-live="polite">{msg}</div>}

        {campaign && (
          <div className="grid-split mt-sm">
            <div className="feature-card">
              <div className="spaced">
                <div>
                  <div className="muted">Marca</div>
                  <div style={{ fontWeight: 950 }}>{brandFromEmail(campaign.advertiserEmail)}</div>
                </div>
                <span className="badge">{campaign.status}</span>
              </div>

              <div className="kpi-grid mt-sm">
                <div className="kpi"><div className="label">Canal</div><div className="value">{campaign.channelName}</div></div>
                <div className="kpi"><div className="label">Categoría</div><div className="value">{campaign.category}</div></div>
                <div className="kpi"><div className="label">Precio</div><div className="value">{fmtUSD0.format(campaign.pricePerPost)}</div></div>
                <div className="kpi"><div className="label">Audiencia</div><div className="value">{campaign.audienceSize.toLocaleString("es-ES")}</div></div>
              </div>

              <div className="mt-sm" style={{ whiteSpace: "pre-wrap" }}>{campaign.copyText}</div>

              <div className="row mt-sm" style={{ gap: "0.5rem" }}>
                <a className="btn" href={campaign.destinationUrl} target="_blank" rel="noreferrer">Destino</a>
                <a className="btn btn-outline" href={`/campaigns/${campaign.id}`} target="_blank" rel="noreferrer">Ver campaña (anunciante)</a>
              </div>
            </div>

            <div className="feature-card">
              <h3 className="feature-title">Acciones</h3>
              <p className="feature-desc">Acepta, rechaza o propone un calendario.</p>

              <div className="row mt-xs" style={{ gap: "0.5rem" }}>
                <button className="btn btn-primary" onClick={() => void accept()}>Aceptar</button>
                <button className="btn btn-secondary" onClick={() => void reject()}>Rechazar</button>
                {(campaign.status === "SUBMITTED" || campaign.status === "PAID" || campaign.status === "READY") && (
                  <button className="btn btn-outline" onClick={() => void confirmPublished()}>Confirmar publicado</button>
                )}
              </div>

              <div className="mt-sm" style={{ fontWeight: 950 }}>Ajustar calendario</div>
              <div className="toolbar mt-xs">
                <label className="label field-md">
                  Inicio
                  <input type="datetime-local" className="input" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
                </label>
                <label className="label field-md">
                  Fin
                  <input type="datetime-local" className="input" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
                </label>
                <button className="btn btn-outline" onClick={() => void proposeSchedule()}>Enviar propuesta</button>
              </div>

              <div className="kpi-grid mt-sm">
                <div className="kpi"><div className="label">Programada</div><div className="value">{campaign.scheduledAt ? new Date(campaign.scheduledAt).toLocaleString("es-ES") : "-"}</div></div>
                <div className="kpi"><div className="label">Publicada</div><div className="value">{campaign.publishedAt ? new Date(campaign.publishedAt).toLocaleString("es-ES") : "-"}</div></div>
                <div className="kpi"><div className="label">Creada</div><div className="value">{new Date(campaign.createdAt).toLocaleString("es-ES")}</div></div>
                <div className="kpi"><div className="label">Plataforma</div><div className="value">{campaign.platform}</div></div>
              </div>
            </div>
          </div>
        )}

        {campaign && (
          <div className="mt-md">
            <ChatPanel campaignId={campaign.id} />
          </div>
        )}
      </section>
    </main>
  );
}
