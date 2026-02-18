import { Router } from "express";
import { z } from "zod";

import { prisma } from "./lib/prisma.js";
import { authRequired, requireRole } from "./middleware/auth.js";

type CampaignForRedirect = {
  id: string;
  destinationUrl: string;
  status: "DRAFT" | "READY_FOR_PAYMENT" | "PAID" | "SUBMITTED" | "READY" | "PUBLISHED" | "DISPUTED" | "COMPLETED" | "REFUNDED";
  startAt: string | null;
  endAt: string | null;
};

type InvalidReason = "DUPLICATE" | "OUT_OF_WINDOW" | "CAMPAIGN_INACTIVE" | "RATE_LIMIT";

const router = Router();

const redirectParamsSchema = z.object({
  campaignId: z.string().uuid(),
});

function getClientIp(rawForwardedFor: string | undefined, remoteAddress: string | undefined) {
  if (rawForwardedFor) return rawForwardedFor.split(",")[0]?.trim() ?? "unknown";
  return remoteAddress ?? "unknown";
}

function getTrackingConfig() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    dedupSeconds: Number(process.env.TRACKING_DEDUP_SECONDS ?? 60),
    rateLimitRequests: Number(process.env.TRACKING_RATE_LIMIT_REQUESTS ?? 30),
    rateLimitWindowSeconds: Number(process.env.TRACKING_RATE_LIMIT_WINDOW_SECONDS ?? 300),
    fallbackUrl: process.env.TRACKING_FALLBACK_URL ?? (isProd ? "/" : "http://localhost:3000"),
  };
}

function normalizeUserAgent(ua: string) {
  return ua.toLowerCase().replace(/\s+/g, " ").trim();
}

const TRACKING_GIF = Buffer.from(
  "R0lGODlhAQABAPAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==",
  "base64",
);

function appendQueryParam(url: string, params: Record<string, string>) {
  try {
    const u = new URL(url);
    for (const [k, v] of Object.entries(params)) {
      if (!u.searchParams.has(k)) u.searchParams.set(k, v);
    }
    return u.toString();
  } catch {
    try {
      const u = new URL(url, "http://localhost");
      for (const [k, v] of Object.entries(params)) {
        if (!u.searchParams.has(k)) u.searchParams.set(k, v);
      }
      const out = `${u.pathname}${u.search}${u.hash}`;
      return out.startsWith("/") ? out : `/${out}`;
    } catch {
      const joiner = url.includes("?") ? "&" : "?";
      const qs = Object.entries(params)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join("&");
      return `${url}${joiner}${qs}`;
    }
  }
}

function isHttpUrl(url: string) {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

async function isValidClick(campaign: CampaignForRedirect, ip: string, userAgent: string) {
  const config = getTrackingConfig();

  if (campaign.status !== "PUBLISHED") {
    return { isValid: false, invalidReason: "CAMPAIGN_INACTIVE" as InvalidReason };
  }

  if (!campaign.startAt || !campaign.endAt) {
    return { isValid: false, invalidReason: "OUT_OF_WINDOW" as InvalidReason };
  }

  const now = Date.now();
  const startAt = new Date(campaign.startAt).getTime();
  const endAt = new Date(campaign.endAt).getTime();

  if (Number.isNaN(startAt) || Number.isNaN(endAt) || now < startAt || now > endAt) {
    return { isValid: false, invalidReason: "OUT_OF_WINDOW" as InvalidReason };
  }

  const duplicateResult = await prisma.$queryRaw<{ count: string }>`
    SELECT COUNT(*)::text AS count
    FROM "TrackingClick"
    WHERE "campaignId" = ${campaign.id}::uuid
      AND ip = ${ip}
      AND "userAgent" = ${userAgent}
      AND ts >= NOW() - (${config.dedupSeconds}::text || ' seconds')::interval
  `;

  if (Number(duplicateResult.rows[0]?.count ?? 0) > 0) {
    return { isValid: false, invalidReason: "DUPLICATE" as InvalidReason };
  }

  return { isValid: true, invalidReason: null as InvalidReason | null };
}

router.get("/r/:campaignId", async (req, res) => {
  const parsed = redirectParamsSchema.safeParse(req.params);
  if (!parsed.success) {
    return res.status(302).redirect(getTrackingConfig().fallbackUrl);
  }

  const { campaignId } = parsed.data;
  const config = getTrackingConfig();
  const ip = getClientIp(req.headers["x-forwarded-for"] as string | undefined, req.ip);
  const userAgent = normalizeUserAgent(req.get("user-agent") ?? "unknown");
  const referrer = req.get("referer") ?? null;

  try {
    const campaignResult = await prisma.$queryRaw<CampaignForRedirect>`
      SELECT id::text, "destinationUrl", status::text, "startAt", "endAt"
      FROM "Campaign"
      WHERE id = ${campaignId}::uuid
      LIMIT 1
    `;

    const campaign = campaignResult.rows[0];
    if (!campaign) {
      return res.redirect(302, config.fallbackUrl);
    }

    const rateResult = await prisma.$queryRaw<{ count: string }>`
      SELECT COUNT(*)::text AS count
      FROM "TrackingClick"
      WHERE ip = ${ip}
        AND ts >= NOW() - (${config.rateLimitWindowSeconds}::text || ' seconds')::interval
    `;

    let isValid = false;
    let invalidReason: InvalidReason | null = null;

    if (Number(rateResult.rows[0]?.count ?? 0) >= config.rateLimitRequests) {
      invalidReason = "RATE_LIMIT";
    } else {
      const validity = await isValidClick(campaign, ip, userAgent);
      isValid = validity.isValid;
      invalidReason = validity.invalidReason;
    }

    const ins = await prisma.$queryRaw<{ id: string }>`
      INSERT INTO "TrackingClick" ("campaignId", ip, "userAgent", referrer, "isValid", "invalidReason")
      VALUES (
        ${campaign.id}::uuid,
        ${ip},
        ${userAgent},
        ${referrer},
        ${isValid},
        ${invalidReason}::"TrackingInvalidReason"
      )
      RETURNING id::text AS id
    `;
    const clickId = ins.rows[0]?.id ?? "";
    const safeDest = isHttpUrl(campaign.destinationUrl) ? campaign.destinationUrl : config.fallbackUrl;
    const dest = clickId && isValid ? appendQueryParam(safeDest, { af_click: clickId, af_campaign: campaign.id }) : safeDest;
    return res.redirect(302, dest);
  } catch {
    return res.redirect(302, config.fallbackUrl);
  }
});

export default router;

router.get("/t/view/:campaignId.gif", async (req, res) => {
  const campaignId = String(req.params.campaignId);
  const clickId = String(req.query.clickId ?? req.query.af_click ?? "");
  const ip = getClientIp(req.headers["x-forwarded-for"] as string | undefined, req.ip);
  const userAgent = normalizeUserAgent(req.get("user-agent") ?? "unknown");
  const referrer = req.get("referer") ?? null;
  const type = String(req.query.type ?? "VIEW").slice(0, 50);
  try {
    await prisma.$queryRaw`
      INSERT INTO "TrackingEvent" ("campaignId","clickId","type","ip","userAgent","referrer")
      VALUES (${campaignId}::uuid, ${clickId ? `${clickId}` : null}::uuid, ${type}, ${ip}, ${userAgent}, ${referrer})
    `;
  } catch {}
  res.setHeader("Content-Type", "image/gif");
  res.setHeader("Cache-Control", "no-store, max-age=0");
  return res.status(200).send(TRACKING_GIF);
});

router.get("/t/conv/:clickId.gif", async (req, res) => {
  const clickId = String(req.params.clickId);
  const type = String(req.query.type ?? "CONVERSION").slice(0, 50);
  const valueRaw = req.query.value != null ? String(req.query.value) : "";
  const currency = req.query.currency != null ? String(req.query.currency).slice(0, 10) : null;
  const ip = getClientIp(req.headers["x-forwarded-for"] as string | undefined, req.ip);
  const userAgent = normalizeUserAgent(req.get("user-agent") ?? "unknown");
  const referrer = req.get("referer") ?? null;
  const value = valueRaw ? Number(valueRaw) : null;
  try {
    const c = await prisma.$queryRaw<{ campaignId: string; isValid: boolean }>`
      SELECT "campaignId"::text AS "campaignId", "isValid"
      FROM "TrackingClick"
      WHERE id = ${clickId}::uuid
      LIMIT 1
    `;
    const campaignId = c.rows[0]?.campaignId;
    const clickValid = Boolean(c.rows[0]?.isValid);
    if (campaignId && clickValid) {
      const config = getTrackingConfig();
      const dupe = await prisma.$queryRaw<{ count: string }>`
        SELECT COUNT(*)::text AS count
        FROM "TrackingEvent"
        WHERE "clickId" = ${clickId}::uuid
          AND type = ${type}
          AND ts >= NOW() - (${config.dedupSeconds}::text || ' seconds')::interval
      `;
      if (Number(dupe.rows[0]?.count ?? 0) === 0) {
      await prisma.$queryRaw`
        INSERT INTO "TrackingEvent" ("campaignId","clickId","type","value","currency","ip","userAgent","referrer")
        VALUES (
          ${campaignId}::uuid,
          ${clickId}::uuid,
          ${type},
          ${Number.isFinite(value as number) ? value : null},
          ${currency},
          ${ip},
          ${userAgent},
          ${referrer}
        )
      `;
      }
    }
  } catch {}
  res.setHeader("Content-Type", "image/gif");
  res.setHeader("Cache-Control", "no-store, max-age=0");
  return res.status(200).send(TRACKING_GIF);
});

router.get("/tracking/stats/:campaignId", authRequired, requireRole("OPS"), async (req, res) => {
  const campaignId = String(req.params.campaignId);
  if (!campaignId || !/^[0-9a-f-]{36}$/i.test(campaignId)) {
    return res.status(400).json({ message: "Invalid campaign id" });
  }
  try {
    const totals = await prisma.$queryRaw<{
      total: string;
      valid: string;
      invalid: string;
    }>`
      SELECT
        COUNT(*)::text AS total,
        SUM(CASE WHEN "isValid" THEN 1 ELSE 0 END)::text AS valid,
        SUM(CASE WHEN NOT "isValid" THEN 1 ELSE 0 END)::text AS invalid
      FROM "TrackingClick"
      WHERE "campaignId" = ${campaignId}::uuid
        AND ts >= NOW() - ('30 days')::interval
    `;

    const byReason = await prisma.$queryRaw<{ reason: string; count: string }>`
      SELECT COALESCE("invalidReason"::text, 'NONE') AS reason, COUNT(*)::text AS count
      FROM "TrackingClick"
      WHERE "campaignId" = ${campaignId}::uuid
        AND ts >= NOW() - ('30 days')::interval
      GROUP BY reason
      ORDER BY count DESC
    `;

    let eventsRow: { views: string; conversions: string } | null = null;
    try {
      const events = await prisma.$queryRaw<{ views: string; conversions: string }>`
        SELECT
          SUM(CASE WHEN type = 'VIEW' THEN 1 ELSE 0 END)::text AS views,
          SUM(CASE WHEN type = 'CONVERSION' THEN 1 ELSE 0 END)::text AS conversions
        FROM "TrackingEvent"
        WHERE "campaignId" = ${campaignId}::uuid
          AND ts >= NOW() - ('30 days')::interval
      `;
      eventsRow = events.rows[0] ?? null;
    } catch {}

    return res.status(200).json({
      window_days: 30,
      total: Number(totals.rows[0]?.total ?? 0),
      valid: Number(totals.rows[0]?.valid ?? 0),
      invalid: Number(totals.rows[0]?.invalid ?? 0),
      views: Number(eventsRow?.views ?? 0),
      conversions: Number(eventsRow?.conversions ?? 0),
      reasons: byReason.rows.map((r) => ({ reason: r.reason, count: Number(r.count) })),
    });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});
