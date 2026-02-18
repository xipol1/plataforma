"use client";

import { useEffect, useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import ChatPanel from "../../components/ChatPanel";
import { getApiUrl, apiFetch } from "../../lib/api";

type Campaign = {
  id: string;
  channelId: string;
  channelName: string;
  channelCategory: string;
  channelPlatform?: string;
  channelPrice: number;
  copyText: string;
  destinationUrl: string;
  scheduledAt: string | null;
  startAt: string | null;
  endAt: string | null;
  publishedAt: string | null;
  status: string;
  createdAt: string;
};

type PaymentStatus = { status: string; provider: string; providerRef: string; amount: number; currency: string };

function StripePay({ onResult }: { onResult: (ok: boolean, message?: string) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [msg, setMsg] = useState("");

  async function confirm() {
    if (!stripe || !elements) return;
    setMsg("Confirmando pago…");
    const res = await stripe.confirmPayment({ elements, redirect: "if_required" });
    if (res.error) {
      const m = res.error.message ?? "Error confirmando";
      setMsg(m);
      onResult(false, m);
      return;
    }
    setMsg("Pago confirmado");
    onResult(true);
  }

  return (
    <div className="mt-sm">
      <PaymentElement />
      <div className="row mt-xs">
        <button className="btn btn-primary" onClick={() => void confirm()} disabled={!stripe || !elements}>Pagar</button>
        {msg && <span className="badge">{msg}</span>}
      </div>
    </div>
  );
}

export default function CampaignDetailClient({ id }: { id: string }) {
  const apiUrl = getApiUrl();

  const [status, setStatus] = useState("");
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [pay, setPay] = useState<PaymentStatus | null>(null);
  const [flowMsg, setFlowMsg] = useState("");
  const [intent, setIntent] = useState<{ providerRef: string | null; clientSecret: string | null; amount: number; currency: string } | null>(null);
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
  const stripePromise = useMemo(() => (publishableKey ? loadStripe(publishableKey) : null), [publishableKey]);

  async function loadCampaign() {
    setStatus("");
    try {
      const r = await apiFetch(`/campaigns/${id}`);
      if (!r.ok) {
        setStatus("Campaña no encontrada");
        setCampaign(null);
        return;
      }
      const data = (await r.json()) as Campaign;
      setCampaign(data);
    } catch {
      setStatus("API no disponible");
    }
  }

  useEffect(() => {
    void loadCampaign();
  }, [apiUrl, id]);

  async function refreshPayment() {
    setFlowMsg("Consultando pago…");
    try {
      const r = await apiFetch(`/payments/${id}`);
      const data = await r.json();
      if (!r.ok) {
        setFlowMsg((data as { message?: string }).message ?? "No hay pago asociado");
        setPay(null);
        return;
      }
      setPay(data as PaymentStatus);
      setFlowMsg("");
    } catch {
      setFlowMsg("API no disponible");
    }
  }

  async function createIntent() {
    setFlowMsg("Creando pago…");
    try {
      const idem = crypto.randomUUID();
      const r = await apiFetch(`/payments/intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: id, idempotencyKey: idem }),
      });
      const data = await r.json();
      if (!r.ok) {
        setFlowMsg((data as { message?: string }).message ?? "Error creando pago");
        return;
      }
      setIntent({
        providerRef: (data as any).provider_ref ?? null,
        clientSecret: (data as any).client_secret ?? null,
        amount: (data as any).amount ?? 0,
        currency: (data as any).currency ?? "USD",
      });
      setFlowMsg((data as any).client_secret ? "Pago listo para confirmar" : "Pago creado (modo dev)");
      void refreshPayment();
      void loadCampaign();
    } catch {
      setFlowMsg("API no disponible");
    }
  }

  async function requestPublish() {
    setFlowMsg("Solicitando publicación…");
    try {
      const r = await apiFetch(`/campaigns/${id}/request-publish`, { method: "POST" });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setFlowMsg((data as { message?: string }).message ?? "No se pudo solicitar publicación");
        return;
      }
      setFlowMsg("Solicitud enviada. OPS revisará y programará.");
    } catch {
      setFlowMsg("API no disponible");
    }
  }

  const trackingUrl = `${apiUrl}/r/${id}`;
  const viewPixel = `${apiUrl}/t/view/${id}.gif`;

  return (
    <main className="container">
      <section className="card reveal">
        <div className="spaced">
          <div>
            <h1 className="title">Detalle de campaña</h1>
            <p className="subtitle">Gestiona pago, publicación y tracking desde un solo lugar.</p>
          </div>
          <a className="btn btn-outline" href="/app/advertiser/inbox">Volver</a>
        </div>
        {status && <div className="badge mt-xs">{status}</div>}

        {campaign && (
          <div className="grid-split mt-sm">
            <div className="feature-card">
              <div className="spaced">
                <div>
                  <div className="muted">Canal</div>
                  <div style={{ fontWeight: 950 }}>{campaign.channelName} · {campaign.channelCategory}</div>
                </div>
                <span className="badge">{campaign.status}</span>
              </div>
              <div className="kpi-grid mt-sm">
                <div className="kpi"><div className="label">Presupuesto</div><div className="value">USD {campaign.channelPrice}</div></div>
                <div className="kpi"><div className="label">Plataforma</div><div className="value">{campaign.channelPlatform ?? "-"}</div></div>
                <div className="kpi"><div className="label">Creada</div><div className="value">{new Date(campaign.createdAt).toLocaleDateString("es-ES")}</div></div>
                <div className="kpi"><div className="label">Programada</div><div className="value">{campaign.startAt ? new Date(campaign.startAt).toLocaleString("es-ES") : campaign.scheduledAt ? new Date(campaign.scheduledAt).toLocaleString("es-ES") : "-"}</div></div>
                <div className="kpi"><div className="label">Publicada</div><div className="value">{campaign.publishedAt ? new Date(campaign.publishedAt).toLocaleString("es-ES") : "-"}</div></div>
              </div>
              <div className="mt-sm" style={{ whiteSpace: "pre-wrap" }}>{campaign.copyText}</div>
              <div className="row mt-sm" style={{ gap: "0.5rem" }}>
                <a className="btn" href={campaign.destinationUrl} target="_blank" rel="noreferrer">Destino</a>
                <a className="btn btn-outline" href={trackingUrl} target="_blank" rel="noreferrer">Link tracking</a>
              </div>
            </div>

            <div className="feature-card">
              <h3 className="feature-title">Presupuesto → Pago → Publicación</h3>
              <p className="feature-desc">Confirma el pago y solicita publicación a OPS. El envío al canal se hará automáticamente al llegar la fecha programada.</p>
              <div className="row mt-xs" style={{ gap: "0.5rem" }}>
                <button className="btn btn-primary" onClick={() => void createIntent()}>Crear pago</button>
                <button className="btn" onClick={() => void refreshPayment()}>Estado de pago</button>
                <button className="btn btn-secondary" onClick={() => void requestPublish()}>Solicitar publicación</button>
              </div>
              {flowMsg && <div className="badge mt-xs" role="status" aria-live="polite">{flowMsg}</div>}

              <div className="kpi-grid mt-sm">
                <div className="kpi"><div className="label">Pago</div><div className="value">{pay?.status ?? "-"}</div></div>
                <div className="kpi"><div className="label">Provider</div><div className="value">{pay?.provider ?? "-"}</div></div>
                <div className="kpi"><div className="label">Ref</div><div className="value">{pay?.providerRef ?? "-"}</div></div>
                <div className="kpi"><div className="label">Total</div><div className="value">{pay ? `USD ${pay.amount}` : "-"}</div></div>
              </div>

              {stripePromise && intent?.clientSecret ? (
                <Elements stripe={stripePromise} options={{ clientSecret: intent.clientSecret }}>
                  <StripePay
                    onResult={(ok) => {
                      setFlowMsg(ok ? "Pago confirmado" : "Pago cancelado");
                      void refreshPayment();
                      void loadCampaign();
                    }}
                  />
                </Elements>
              ) : null}
            </div>
          </div>
        )}
      </section>

      <section className="card reveal mt-md">
        <h2 className="exec-section-title">Chat</h2>
        <p className="exec-section-sub">Coordina detalles con el creador. Los mensajes pasan por revisión.</p>
        <div className="mt-sm">
          <ChatPanel campaignId={id} />
        </div>
      </section>

      <section className="card reveal mt-md">
        <h2 className="exec-section-title">Tracking</h2>
        <p className="exec-section-sub">Mide clicks con el redirect y atribuye conversiones con el pixel.</p>
        <div className="feature-card mt-sm">
          <div className="kpi-grid">
            <div className="kpi"><div className="label">Enlace</div><div className="value">{trackingUrl}</div></div>
            <div className="kpi"><div className="label">Pixel vista</div><div className="value">{viewPixel}</div></div>
            <div className="kpi"><div className="label">Pixel conversión</div><div className="value">{`${apiUrl}/t/conv/{af_click}.gif?type=CONVERSION&value=123&currency=USD`}</div></div>
            <div className="kpi"><div className="label">Parámetros</div><div className="value">af_click · af_campaign</div></div>
          </div>
        </div>
      </section>
    </main>
  );
}
