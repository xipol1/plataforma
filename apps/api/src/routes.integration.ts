import express, { Router } from "express";
import { z } from "zod";

import { commissionService, type AdType, type ChannelType } from "./commission.js";
import { listProviders, getProviderByName } from "./providers.js";
import { authRequired, requireRole } from "./middleware/auth.js";
import { prisma } from "./lib/prisma.js";
import crypto from "node:crypto";

const router = Router();

const rateState: Map<string, { count: number; windowStart: number }> = new Map();
function checkRate(userId: string, max: number, windowSeconds: number) {
  const now = Math.floor(Date.now() / 1000);
  const rec = rateState.get(userId);
  if (!rec || now - rec.windowStart >= windowSeconds) {
    rateState.set(userId, { count: 1, windowStart: now });
    return { allowed: true };
  }
  if (rec.count < max) {
    rec.count += 1;
    return { allowed: true };
  }
  return { allowed: false, retryAfter: rec.windowStart + windowSeconds - now };
}
function getClientIp(rawForwardedFor: string | undefined, remoteAddress: string | undefined) {
  if (rawForwardedFor) return rawForwardedFor.split(",")[0]?.trim() ?? "unknown";
  return remoteAddress ?? "unknown";
}

const quoteSchema = z.object({
  amount: z.coerce.number().positive(),
  currency: z.string().length(3).optional(),
  channelType: z.enum(["TELEGRAM", "WHATSAPP", "DISCORD", "INSTAGRAM"]),
  adType: z.enum(["POST", "STORY", "MENTION", "FEATURED"]),
});

router.get("/meta/providers", (_req, res) => {
  return res.status(200).json({ providers: listProviders() });
});

router.post("/campaigns/quote", (req, res) => {
  const parsed = quoteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input", issues: parsed.error.flatten() });
  }

  try {
    const quote = commissionService.quote({
      amount: parsed.data.amount,
      currency: parsed.data.currency?.toUpperCase(),
      channelType: parsed.data.channelType as ChannelType,
      adType: parsed.data.adType as AdType,
    });

    return res.status(200).json(quote);
  } catch (error) {
    return res.status(400).json({ message: error instanceof Error ? error.message : "Invalid quote input" });
  }
});

const verifySchema = z.object({
  platform: z.enum(["TELEGRAM", "WHATSAPP", "DISCORD", "INSTAGRAM"]),
  channelRef: z.string().min(1),
  userRef: z.string().min(1),
});

router.post(
  "/channels/verify",
  authRequired,
  requireRole("CHANNEL_ADMIN", "OPS"),
  async (req, res) => {
    const rate = checkRate(req.user!.id, 10, 60);
    if (!rate.allowed) {
      return res.status(429).json({ message: "Rate limit exceeded", retry_after_seconds: rate.retryAfter });
    }
    const parsed = verifySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid input", issues: parsed.error.flatten() });
    }

    const provider = getProviderByName(parsed.data.platform);
    if (!provider) {
      return res.status(400).json({ message: "Provider not available" });
    }
    if (!provider.capabilities.supportsChannelOwnershipCheck) {
      return res.status(400).json({ message: "Ownership check not supported" });
    }

    try {
      const verified = await provider.verifyChannelOwnership({
        channelRef: parsed.data.channelRef,
        userRef: parsed.data.userRef,
      });
      return res.status(200).json({ verified, provider: provider.name });
    } catch {
      return res.status(500).json({ message: "Provider verification failed" });
    }
  },
);

const intentSchema = z.object({
  campaignId: z
    .string()
    .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, "Invalid UUID"),
  currency: z.string().length(3).optional(),
  idempotencyKey: z.string().min(1).max(100).optional(),
});

router.post("/payments/intent", authRequired, requireRole("ADVERTISER"), async (req, res) => {
  const rate = checkRate(req.user!.id, 5, 60);
  if (!rate.allowed) {
    return res.status(429).json({ message: "Rate limit exceeded", retry_after_seconds: rate.retryAfter });
  }
  const parsed = intentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input", issues: parsed.error.flatten() });
  }

  const { campaignId } = parsed.data;
  const currency = (parsed.data.currency ?? "USD").toLowerCase();
  const idempotencyKey = parsed.data.idempotencyKey ?? null;

  if (process.env.USE_PGMEM === "1" && !process.env.STRIPE_SECRET_KEY) {
    const providerRef = `pi_dev_mock_${campaignId.slice(0, 8)}`;
    return res.status(200).json({
      client_secret: null,
      provider_ref: providerRef,
      amount: 0,
      currency: currency.toUpperCase(),
      dev_mock: true,
      fast_path: true,
    });
  }

  try {
    const existing = await prisma.$queryRaw<{
      providerRef: string | null;
      amount: number;
      currency: string;
      status: "CREATED" | "REQUIRES_PAYMENT" | "SUCCEEDED" | "FAILED" | "RELEASED" | "REFUNDED";
      createdAt: string;
    }>`
      SELECT "providerRef", amount, currency, status::text AS status, "createdAt"::text AS "createdAt"
      FROM "Payment"
      WHERE "campaignId" = ${campaignId}::uuid
      LIMIT 1
    `;
    const pay = existing.rows[0];
    if (pay && pay.status === "REQUIRES_PAYMENT" && pay.providerRef) {
      return res.status(200).json({
        client_secret: null,
        provider_ref: pay.providerRef,
        amount: pay.amount,
        currency: pay.currency,
        idempotent: true,
      });
    }

    const campaignRes = await prisma.$queryRaw<{
      id: string;
      advertiserUserId: string;
      channelPrice: number;
      status: "DRAFT" | "READY_FOR_PAYMENT" | "PAID" | "READY" | "PUBLISHED" | "DISPUTED" | "COMPLETED" | "REFUNDED";
    }>`
      SELECT
        c.id::text AS id,
        c."advertiserUserId"::text AS "advertiserUserId",
        ch."pricePerPost" AS "channelPrice",
        c.status::text AS status
      FROM "Campaign" c
      JOIN "Channel" ch ON ch.id = c."channelId"
      WHERE c.id = ${campaignId}::uuid
      LIMIT 1
    `;

    const campaign = campaignRes.rows[0];
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }
    if (campaign.advertiserUserId !== req.user!.id) {
      return res.status(403).json({ message: "Forbidden" });
    }
    if (!(campaign.status === "DRAFT" || campaign.status === "READY_FOR_PAYMENT")) {
      return res.status(400).json({ message: `Invalid status ${campaign.status} for payment` });
    }

    const amount = campaign.channelPrice;
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      const providerRef = `pi_dev_mock_${campaignId.slice(0, 8)}`;
      let paymentId: string | null = null;
      try {
        await prisma.$queryRaw`
          INSERT INTO "Payment"("campaignId","provider","providerRef","amount","currency","status")
          VALUES (${campaignId}::uuid, 'STRIPE'::"PaymentProvider", ${providerRef}, ${amount}, ${currency.toUpperCase()}, 'REQUIRES_PAYMENT'::"PaymentStatus")
          ON CONFLICT ("campaignId") DO UPDATE SET
            "providerRef" = EXCLUDED."providerRef",
            "amount" = EXCLUDED."amount",
            "currency" = EXCLUDED."currency",
            "status" = EXCLUDED."status"
        `;
        const sel1 = await prisma.$queryRaw<{ id: string }>`
          SELECT id::text AS id FROM "Payment" WHERE "campaignId" = ${campaignId}::uuid LIMIT 1
        `;
        paymentId = sel1.rows[0]?.id ?? null;
      } catch {}
      if (paymentId) {
        try {
          await prisma.$queryRaw`
            INSERT INTO "AuditLog"("actorUserId","entityType","entityId","action","meta")
            VALUES (${req.user!.id}::uuid, 'Payment', ${paymentId}::uuid, 'INTENT_CREATED', ${JSON.stringify({ provider: "STRIPE", providerRef, amount, currency: currency.toUpperCase(), dev_mock: true })})
          `;
        } catch {}
      }
      if (campaign.status === "DRAFT") {
        await prisma.$queryRaw`
          UPDATE "Campaign" SET status = 'READY_FOR_PAYMENT'::"CampaignStatus" WHERE id = ${campaignId}::uuid
        `;
      }
      return res.status(200).json({ client_secret: null, provider_ref: providerRef, amount, currency: currency.toUpperCase(), dev_mock: true });
    }

    const body = new URLSearchParams();
    body.set("amount", String(amount * 100));
    body.set("currency", currency);
    body.set("metadata[campaignId]", campaignId);

    const resp = await fetch("https://api.stripe.com/v1/payment_intents", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
        ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
      },
      body,
    });

    if (!resp.ok) {
      return res.status(502).json({ message: "Stripe error creating intent" });
    }

    const intent = (await resp.json()) as { id: string; client_secret?: string | null; status: string };
    const providerRef = intent.id;
    const clientSecret = intent.client_secret ?? null;

    let paymentId: string | null = null;
    try {
      await prisma.$queryRaw`
        INSERT INTO "Payment"("campaignId","provider","providerRef","amount","currency","status")
        VALUES (${campaignId}::uuid, 'STRIPE'::"PaymentProvider", ${providerRef}, ${amount}, ${currency.toUpperCase()}, 'REQUIRES_PAYMENT'::"PaymentStatus")
        ON CONFLICT ("campaignId") DO UPDATE SET
          "providerRef" = EXCLUDED."providerRef",
          "amount" = EXCLUDED."amount",
          "currency" = EXCLUDED."currency",
          "status" = EXCLUDED."status"
      `;
      const sel2 = await prisma.$queryRaw<{ id: string }>`
        SELECT id::text AS id FROM "Payment" WHERE "campaignId" = ${campaignId}::uuid LIMIT 1
      `;
      paymentId = sel2.rows[0]?.id ?? null;
    } catch {}
    if (paymentId) {
      try {
        await prisma.$queryRaw`
          INSERT INTO "AuditLog"("actorUserId","entityType","entityId","action","meta")
          VALUES (${req.user!.id}::uuid, 'Payment', ${paymentId}::uuid, 'INTENT_CREATED', ${JSON.stringify({ provider: "STRIPE", providerRef, amount, currency: currency.toUpperCase(), idempotencyKey })})
        `;
      } catch {}
    }

    if (campaign.status === "DRAFT") {
      await prisma.$queryRaw`
        UPDATE "Campaign" SET status = 'READY_FOR_PAYMENT'::"CampaignStatus" WHERE id = ${campaignId}::uuid
      `;
    }

    return res.status(200).json({ client_secret: clientSecret, provider_ref: providerRef, amount, currency: currency.toUpperCase() });
  } catch (e) {
    console.error("[payments/intent] error", e);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/payments/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sigHeader = req.get("stripe-signature") ?? req.get("Stripe-Signature") ?? "";
  const rawBody = (req.body as Buffer)?.toString("utf8") ?? "";

  const ip = getClientIp(req.headers["x-forwarded-for"] as string | undefined, req.ip);
  const rate = checkRate(`webhook:${ip}`, 60, 60);
  if (!rate.allowed) {
    return res.status(429).json({ message: "Rate limit exceeded", retry_after_seconds: rate.retryAfter });
  }

  if (secret) {
    try {
      const timestamp = (sigHeader.match(/t=(\d+)/)?.[1] ?? "");
      const signatures = (sigHeader.match(/v1=([a-f0-9]+)/g) ?? []).map((s) => s.replace("v1=", ""));
      const payload = `${timestamp}.${rawBody}`;
      const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
      if (!timestamp || !signatures.includes(expected)) {
        return res.status(400).json({ message: "Invalid signature" });
      }
    } catch {
      return res.status(400).json({ message: "Invalid signature" });
    }
  }

  let event: { type?: string; data?: { object?: { id?: string; status?: string } } };
  try {
    event = JSON.parse(rawBody);
  } catch (e) {
    console.error("[webhook] parse error", e);
    return res.status(400).json({ message: "Invalid JSON" });
  }
  const type = event.type ?? "";
  const pi = event.data?.object?.id ?? "";

  if (!pi) {
    return res.status(400).json({ message: "Invalid webhook payload" });
  }

  try {
    if (type === "payment_intent.succeeded") {
      const updated = await prisma.$queryRaw<{ campaignId: string }>`
        UPDATE "Payment"
        SET status = 'SUCCEEDED'::"PaymentStatus"
        WHERE provider = 'STRIPE'::"PaymentProvider" AND "providerRef" = ${pi}
        RETURNING "campaignId"::text AS "campaignId"
      `;
      const campaignId = updated.rows[0]?.campaignId;
      try {
        await prisma.$queryRaw`
          INSERT INTO "AuditLog"("actorUserId","entityType","entityId","action","meta")
          VALUES (NULL, 'Payment', (SELECT id FROM "Payment" WHERE "providerRef" = ${pi} LIMIT 1), 'WEBHOOK_EVENT', ${JSON.stringify({ type })})
        `;
      } catch {}
      if (campaignId) {
        await prisma.$queryRaw`
          UPDATE "Campaign" SET status = 'PAID'::"CampaignStatus" WHERE id = ${campaignId}::uuid
        `;
      }
    } else if (type === "payment_intent.payment_failed") {
      await prisma.$queryRaw`
        UPDATE "Payment"
        SET status = 'FAILED'::"PaymentStatus"
        WHERE provider = 'STRIPE'::"PaymentProvider" AND "providerRef" = ${pi}
      `;
      try {
        await prisma.$queryRaw`
          INSERT INTO "AuditLog"("actorUserId","entityType","entityId","action","meta")
          VALUES (NULL, 'Payment', (SELECT id FROM "Payment" WHERE "providerRef" = ${pi} LIMIT 1), 'WEBHOOK_EVENT', ${JSON.stringify({ type })})
        `;
      } catch {}
    }

    return res.status(200).json({ received: true });
  } catch (e) {
    console.error("[webhook] handler error", e);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/payments/:campaignId", authRequired, async (req, res) => {
  const campaignId = String(req.params.campaignId);
  if (!campaignId || !/^[0-9a-f-]{36}$/i.test(campaignId)) {
    return res.status(400).json({ message: "Invalid campaign id" });
  }
  try {
    const result = await prisma.$queryRaw<{
      id: string;
      campaignId: string;
      provider: "STRIPE";
      providerRef: string | null;
      amount: number;
      currency: string;
      status: "CREATED" | "REQUIRES_PAYMENT" | "SUCCEEDED" | "FAILED" | "RELEASED" | "REFUNDED";
      createdAt: string;
    }>`
      SELECT
        id::text,
        "campaignId"::text,
        provider::text AS provider,
        "providerRef",
        amount,
        currency,
        status::text AS status,
        "createdAt"::text
      FROM "Payment"
      WHERE "campaignId" = ${campaignId}::uuid
      LIMIT 1
    `;
    const payment = result.rows[0];
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }
    if (req.user!.role !== "OPS") {
      const campaign = await prisma.$queryRaw<{ advertiserUserId: string }>`
        SELECT "advertiserUserId"::text AS "advertiserUserId"
        FROM "Campaign" WHERE id = ${campaignId}::uuid
      `;
      if (campaign.rows[0]?.advertiserUserId !== req.user!.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }
    return res.status(200).json(payment);
  } catch (e) {
    console.error("[payments/:campaignId] error", e);
    if (process.env.USE_PGMEM === "1") {
      const providerRef = `pi_dev_mock_${campaignId.slice(0, 8)}`;
      return res.status(200).json({
        client_secret: null,
        provider_ref: providerRef,
        amount: 0,
        currency: "USD",
        dev_mock: true,
        degraded: true,
      });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
});

const refundSchema = z.object({
  campaignId: z.string().uuid(),
  reason: z.string().optional(),
});

router.post("/payments/refund", authRequired, requireRole("OPS"), async (req, res) => {
  const parsed = refundSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input", issues: parsed.error.flatten() });
  }
  const { campaignId, reason } = parsed.data;

  try {
    const paymentRes = await prisma.$queryRaw<{ providerRef: string | null }>`
      SELECT "providerRef"
      FROM "Payment"
      WHERE "campaignId" = ${campaignId}::uuid
      LIMIT 1
    `;
    const providerRef = paymentRes.rows[0]?.providerRef;
    if (!providerRef) {
      return res.status(404).json({ message: "Payment not found" });
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return res.status(500).json({ message: "Stripe not configured" });
    }

    // Find latest charge from PI
    const piResp = await fetch(`https://api.stripe.com/v1/payment_intents/${providerRef}`, {
      headers: { Authorization: `Bearer ${stripeKey}` },
    });
    if (!piResp.ok) {
      return res.status(502).json({ message: "Stripe error retrieving intent" });
    }
    const pi = (await piResp.json()) as { charges?: { data?: Array<{ id: string }> } };
    const chargeId = pi.charges?.data?.[0]?.id;
    if (!chargeId) {
      return res.status(400).json({ message: "No charge to refund" });
    }

    const body = new URLSearchParams();
    body.set("charge", chargeId);
    if (reason) body.set("reason", reason);

    const refundResp = await fetch(`https://api.stripe.com/v1/refunds`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    if (!refundResp.ok) {
      return res.status(502).json({ message: "Stripe error creating refund" });
    }

    await prisma.$queryRaw`
      UPDATE "Payment" SET status = 'REFUNDED'::"PaymentStatus" WHERE "campaignId" = ${campaignId}::uuid
    `;
    await prisma.$queryRaw`
      UPDATE "Campaign" SET status = 'REFUNDED'::"CampaignStatus" WHERE id = ${campaignId}::uuid
    `;

    return res.status(200).json({ refunded: true });
  } catch (e) {
    console.error("[payments/:id] error", e);
    return res.status(500).json({ message: "Internal server error" });
  }
});

const releaseSchema = z.object({
  campaignId: z.string().uuid(),
});

router.post("/payments/release", authRequired, requireRole("OPS"), async (req, res) => {
  const parsed = releaseSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input", issues: parsed.error.flatten() });
  }
  const { campaignId } = parsed.data;

  try {
    const statusRes = await prisma.$queryRaw<{
      campaignStatus: "DRAFT" | "READY_FOR_PAYMENT" | "PAID" | "READY" | "PUBLISHED" | "DISPUTED" | "COMPLETED" | "REFUNDED";
      paymentStatus: "CREATED" | "REQUIRES_PAYMENT" | "SUCCEEDED" | "FAILED" | "RELEASED" | "REFUNDED" | null;
    }>`
      SELECT
        c.status::text AS "campaignStatus",
        p.status::text AS "paymentStatus"
      FROM "Campaign" c
      LEFT JOIN "Payment" p ON p."campaignId" = c.id
      WHERE c.id = ${campaignId}::uuid
      LIMIT 1
    `;
    const row = statusRes.rows[0];
    if (!row) {
      return res.status(404).json({ message: "Campaign not found" });
    }
    if (row.campaignStatus !== "COMPLETED") {
      return res.status(400).json({ message: "Campaign not completed" });
    }
    if (row.paymentStatus !== "SUCCEEDED") {
      return res.status(400).json({ message: "Payment not succeeded" });
    }

    await prisma.$queryRaw`
      UPDATE "Payment"
      SET status = 'RELEASED'::"PaymentStatus"
      WHERE "campaignId" = ${campaignId}::uuid
    `;

    return res.status(200).json({ released: true });
  } catch (e) {
    console.error("[payments/refund] error", e);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
