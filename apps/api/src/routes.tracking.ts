import { Router } from "express";
import { z } from "zod";

import { prisma } from "./lib/prisma.js";
import { authRequired, requireRole } from "./middleware/auth.js";

type CampaignForRedirect = {
  id: string;
  destinationUrl: string;
  status: "DRAFT" | "READY_FOR_PAYMENT" | "PAID" | "READY" | "PUBLISHED" | "DISPUTED" | "COMPLETED" | "REFUNDED";
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
  return {
    dedupSeconds: Number(process.env.TRACKING_DEDUP_SECONDS ?? 60),
    rateLimitRequests: Number(process.env.TRACKING_RATE_LIMIT_REQUESTS ?? 30),
    rateLimitWindowSeconds: Number(process.env.TRACKING_RATE_LIMIT_WINDOW_SECONDS ?? 300),
    fallbackUrl: process.env.TRACKING_FALLBACK_URL ?? "https://example.com",
  };
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
  const userAgent = req.get("user-agent") ?? "unknown";
  const referrer = req.get("referer") ?? null;

  try {
    const campaignResult = await prisma.$queryRaw<CampaignForRedirect>`
      SELECT id::text, "destinationUrl", status::text, "startAt"::text, "endAt"::text
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

    await prisma.$queryRaw`
      INSERT INTO "TrackingClick" ("campaignId", ip, "userAgent", referrer, "isValid", "invalidReason")
      VALUES (
        ${campaign.id}::uuid,
        ${ip},
        ${userAgent},
        ${referrer},
        ${isValid},
        ${invalidReason ? `${invalidReason}` : null}::"TrackingInvalidReason"
      )
    `;

    return res.redirect(302, campaign.destinationUrl);
  } catch {
    return res.redirect(302, config.fallbackUrl);
  }
});

export default router;

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

    return res.status(200).json({
      window_days: 30,
      total: Number(totals.rows[0]?.total ?? 0),
      valid: Number(totals.rows[0]?.valid ?? 0),
      invalid: Number(totals.rows[0]?.invalid ?? 0),
      reasons: byReason.rows.map((r) => ({ reason: r.reason, count: Number(r.count) })),
    });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});
