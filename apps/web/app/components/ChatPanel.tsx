"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api";

type ChatItem = {
  id: string;
  senderUserId: string;
  body: string;
  status: string;
  createdAt: string;
  reviewedAt: string | null;
  rejectionReason: string | null;
  flags: string | null;
};

type ChatResponse =
  | { enabled: true; conversationId: string; campaignId: string; myUserId: string; items: ChatItem[] }
  | { message: string; code?: string; requires?: { payment_succeeded: boolean; publish_requested: boolean } };

export default function ChatPanel({ campaignId }: { campaignId: string }) {
  const [status, setStatus] = useState<string>("");
  const [items, setItems] = useState<ChatItem[]>([]);
  const [myUserId, setMyUserId] = useState<string>("");
  const [draft, setDraft] = useState<string>("");
  const [sending, setSending] = useState(false);

  const fmt = useMemo(
    () =>
      new Intl.DateTimeFormat("es-ES", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
    [],
  );

  async function load() {
    setStatus("Cargando chat…");
    try {
      const r = await apiFetch(`/chat/${campaignId}/messages`);
      const data = (await r.json().catch(() => ({}))) as ChatResponse;
      if (!r.ok) {
        if (r.status === 409 && "requires" in data && data.requires) {
          const reqs = data.requires;
          const parts: string[] = [];
          if (!reqs.payment_succeeded) parts.push("pago confirmado");
          if (!reqs.publish_requested) parts.push("solicitud de publicación");
          setStatus(parts.length ? `Chat disponible cuando haya: ${parts.join(" + ")}` : (data.message ?? "Chat no disponible"));
          setItems([]);
          return;
        }
        setStatus(("message" in data && data.message) ? data.message : "No se pudo cargar chat");
        setItems([]);
        return;
      }
      if ("enabled" in data && data.enabled) {
        setItems(Array.isArray(data.items) ? data.items : []);
        setMyUserId(data.myUserId ?? "");
        setStatus("");
        return;
      }
      setStatus("Chat no disponible");
      setItems([]);
    } catch {
      setStatus("API no disponible");
      setItems([]);
    }
  }

  async function send() {
    const body = String(draft ?? "").trim();
    if (!body) return;
    setSending(true);
    setStatus("Enviando a revisión…");
    try {
      const r = await apiFetch(`/chat/${campaignId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setStatus((data as { message?: string }).message ?? "No se pudo enviar");
        setSending(false);
        return;
      }
      setDraft("");
      setStatus("Enviado. Pendiente de revisión.");
      setSending(false);
      void load();
    } catch {
      setStatus("API no disponible");
      setSending(false);
    }
  }

  useEffect(() => {
    void load();
    const t = window.setInterval(() => void load(), 10000);
    return () => window.clearInterval(t);
  }, [campaignId]);

  return (
    <div className="feature-card">
      <div className="spaced" aria-live="polite">
        <div>
          <h3 className="feature-title">Chat (con revisión)</h3>
          <p className="feature-desc">Tus mensajes se revisan antes de entregarse al otro usuario.</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => void load()}>Refrescar</button>
      </div>

      {status && <div className="badge mt-xs" role="status" aria-live="polite">{status}</div>}

      <div className="mt-sm" style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: 320, overflow: "auto" }}>
        {items.length === 0 && !status ? (
          <div className="muted">Aún no hay mensajes.</div>
        ) : null}
        {items.map((m) => {
          const mine = myUserId && m.senderUserId === myUserId;
          const when = m.createdAt ? fmt.format(new Date(m.createdAt)) : "";
          const badge = mine && m.status !== "APPROVED" ? `· ${m.status}` : "";
          const rejected = mine && m.status === "REJECTED";
          return (
            <div key={m.id} style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start" }}>
              <div style={{ maxWidth: "80%", padding: "0.6rem 0.75rem", borderRadius: 14, background: mine ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="muted" style={{ fontSize: 12 }}>{when} {badge}</div>
                <div style={{ whiteSpace: "pre-wrap" }}>{m.body}</div>
                {rejected && (
                  <div className="muted mt-xs" style={{ fontSize: 12 }}>
                    Rechazado: {m.rejectionReason ?? "sin detalle"}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="toolbar mt-sm">
        <label className="label field-lg" style={{ width: "100%" }}>
          Mensaje
          <textarea className="input" rows={3} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Escribe aquí… (evita datos de contacto)" />
        </label>
        <button className="btn btn-primary" onClick={() => void send()} disabled={sending || !String(draft ?? "").trim()}>
          Enviar
        </button>
      </div>
    </div>
  );
}
