import { Router } from "express";

import { canTransition } from "./campaigns.state.js";
import {
  advertiserCampaignsQuerySchema,
  createCampaignSchema,
  idParamSchema,
  inboxCampaignsQuerySchema,
  opsCampaignsQuerySchema,
  type CampaignStatus,
} from "./campaigns.schemas.js";
import { prisma } from "./lib/prisma.js";
import { authRequired, requireRole } from "./middleware/auth.js";

type CampaignRow = {
  id: string;
  advertiserUserId: string;
  channelId: string;
  copyText: string;
  destinationUrl: string;
  scheduledAt: string | null;
  status: CampaignStatus;
  createdAt: string;
  publishedAt: string | null;
  startAt: string | null;
  endAt: string | null;
  channelOwnerUserId: string;
};

type ExecutionStatus = "EXECUTED_OK" | "EXECUTED_NO_CLICKS" | "INVALID_TRAFFIC";

const router = Router();

async function getCampaignById(id: string): Promise<CampaignRow | null> {
  const result = await prisma.$queryRaw<CampaignRow>`
    SELECT
      c.id::text,
      c."advertiserUserId"::text,
      c."channelId"::text,
      c."copyText",
      c."destinationUrl",
      c."scheduledAt"::text,
      c.status::text,
      c."createdAt"::text,
      c."publishedAt"::text,
      c."startAt"::text,
      c."endAt"::text,
      ch."ownerUserId"::text AS "channelOwnerUserId"
    FROM "Campaign" c
    JOIN "Channel" ch ON ch.id = c."channelId"
    WHERE c.id = ${id}::uuid
    LIMIT 1
  `;

  return result.rows[0] ?? null;
}

function canAccessCampaign(user: { id: string; role: string }, campaign: CampaignRow) {
  if (user.role === "OPS") return true;
  if (user.role === "ADVERTISER") return campaign.advertiserUserId === user.id;
  if (user.role === "CHANNEL_ADMIN") return campaign.channelOwnerUserId === user.id;
  return false;
}

async function computeExecutionStatus(campaignId: string): Promise<ExecutionStatus> {
  const campaign = await prisma.$queryRaw<{ status: CampaignStatus }>`
    SELECT status::text FROM "Campaign" WHERE id = ${campaignId}::uuid LIMIT 1
  `;

  const status = campaign.rows[0]?.status;
  const counts = await prisma.$queryRaw<{ total: string; valid: string; invalid: string }>`
    SELECT
      COUNT(*)::text AS total,
      COUNT(*) FILTER (WHERE "isValid" = true)::text AS valid,
      COUNT(*) FILTER (WHERE "isValid" = false)::text AS invalid
    FROM "TrackingClick"
    WHERE "campaignId" = ${campaignId}::uuid
  `;

  const total = Number(counts.rows[0]?.total ?? 0);
  const valid = Number(counts.rows[0]?.valid ?? 0);
  const invalid = Number(counts.rows[0]?.invalid ?? 0);

  if (total > 0 && invalid / total > 0.8) return "INVALID_TRAFFIC";
  if (status === "PUBLISHED" || status === "COMPLETED") {
    return valid > 0 ? "EXECUTED_OK" : "EXECUTED_NO_CLICKS";
  }

  return "EXECUTED_NO_CLICKS";
}

router.post("/campaigns", authRequired, requireRole("ADVERTISER"), async (req, res) => {
  const parsed = createCampaignSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid input", issues: parsed.error.flatten() });

  const input = parsed.data;

  try {
    const activeChannel = await prisma.$queryRaw<{ id: string }>`
      SELECT id::text FROM "Channel"
      WHERE id = ${input.channelId}::uuid AND status = 'ACTIVE'::"ChannelStatus"
      LIMIT 1
    `;

    if (!activeChannel.rows[0]) return res.status(400).json({ message: "Channel must be ACTIVE" });

    const campaign = await prisma.$queryRaw<CampaignRow>`
      INSERT INTO "Campaign" (
        "advertiserUserId", "channelId", "copyText", "destinationUrl", "scheduledAt", status
      ) VALUES (
        ${req.user!.id}::uuid,
        ${input.channelId}::uuid,
        ${input.copyText},
        ${input.destinationUrl},
        ${input.scheduledAt ? `${input.scheduledAt}` : null}::timestamptz,
        'DRAFT'::"CampaignStatus"
      )
      RETURNING
        id::text,
        "advertiserUserId"::text,
        "channelId"::text,
        "copyText",
        "destinationUrl",
        "scheduledAt"::text,
        status::text,
        "createdAt"::text,
        "publishedAt"::text,
        "startAt"::text,
        "endAt"::text,
        ''::text as "channelOwnerUserId"
    `;

    return res.status(201).json(campaign.rows[0]);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/campaigns", authRequired, requireRole("ADVERTISER"), async (req, res) => {
  const parsed = advertiserCampaignsQuerySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ message: "Invalid query", issues: parsed.error.flatten() });

  const { status, limit, offset } = parsed.data;
  const values: unknown[] = [req.user!.id];
  let where = `WHERE c."advertiserUserId" = $1::uuid`;
  if (status) {
    values.push(status);
    where += ` AND c.status = $${values.length}::"CampaignStatus"`;
  }

  values.push(limit, offset);
  const limitParam = `$${values.length - 1}`;
  const offsetParam = `$${values.length}`;

  try {
    const result = await prisma.$query(
      `SELECT
          c.id::text,
          c."advertiserUserId"::text,
          c."channelId"::text,
          c."copyText",
          c."destinationUrl",
          c."scheduledAt"::text,
          c.status::text,
          c."createdAt"::text,
          c."publishedAt"::text,
          c."startAt"::text,
          c."endAt"::text,
          ch."ownerUserId"::text AS "channelOwnerUserId"
       FROM "Campaign" c
       JOIN "Channel" ch ON ch.id = c."channelId"
       ${where}
       ORDER BY c."createdAt" DESC
       LIMIT ${limitParam}
       OFFSET ${offsetParam}`,
      values,
    );

    return res.status(200).json(result.rows);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/inbox/campaigns", authRequired, requireRole("CHANNEL_ADMIN"), async (req, res) => {
  const parsed = inboxCampaignsQuerySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ message: "Invalid query", issues: parsed.error.flatten() });

  const { status, limit, offset } = parsed.data;
  const values: unknown[] = [req.user!.id];
  let where = `WHERE ch."ownerUserId" = $1::uuid`;
  if (status) {
    values.push(status);
    where += ` AND c.status = $${values.length}::"CampaignStatus"`;
  }

  values.push(limit, offset);
  const limitParam = `$${values.length - 1}`;
  const offsetParam = `$${values.length}`;

  try {
    const result = await prisma.$query(
      `SELECT
          c.id::text,
          c."advertiserUserId"::text,
          c."channelId"::text,
          c."copyText",
          c."destinationUrl",
          c."scheduledAt"::text,
          c.status::text,
          c."createdAt"::text,
          c."publishedAt"::text,
          c."startAt"::text,
          c."endAt"::text,
          ch."ownerUserId"::text AS "channelOwnerUserId"
       FROM "Campaign" c
       JOIN "Channel" ch ON ch.id = c."channelId"
       ${where}
       ORDER BY c."createdAt" DESC
       LIMIT ${limitParam}
       OFFSET ${offsetParam}`,
      values,
    );

    return res.status(200).json(result.rows);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/campaigns/:id", authRequired, requireRole("ADVERTISER", "CHANNEL_ADMIN", "OPS"), async (req, res) => {
  const parsed = idParamSchema.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ message: "Invalid params", issues: parsed.error.flatten() });

  try {
    const campaign = await getCampaignById(parsed.data.id);
    if (!campaign || !canAccessCampaign(req.user!, campaign)) return res.status(404).json({ message: "Campaign not found" });

    return res.status(200).json(campaign);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/ops/campaigns", authRequired, requireRole("OPS"), async (req, res) => {
  const parsed = opsCampaignsQuerySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ message: "Invalid query", issues: parsed.error.flatten() });

  const { status, channelId, advertiserUserId, limit, offset } = parsed.data;
  const values: unknown[] = [];
  const whereParts: string[] = [];

  if (status) {
    values.push(status);
    whereParts.push(`c.status = $${values.length}::"CampaignStatus"`);
  }
  if (channelId) {
    values.push(channelId);
    whereParts.push(`c."channelId" = $${values.length}::uuid`);
  }
  if (advertiserUserId) {
    values.push(advertiserUserId);
    whereParts.push(`c."advertiserUserId" = $${values.length}::uuid`);
  }

  values.push(limit, offset);
  const limitParam = `$${values.length - 1}`;
  const offsetParam = `$${values.length}`;
  const where = whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : "";

  try {
    const result = await prisma.$query(
      `SELECT
          c.id::text,
          c."advertiserUserId"::text,
          c."channelId"::text,
          c."copyText",
          c."destinationUrl",
          c."scheduledAt"::text,
          c.status::text,
          c."createdAt"::text,
          c."publishedAt"::text,
          c."startAt"::text,
          c."endAt"::text,
          ch."ownerUserId"::text AS "channelOwnerUserId"
       FROM "Campaign" c
       JOIN "Channel" ch ON ch.id = c."channelId"
       ${where}
       ORDER BY c."createdAt" DESC
       LIMIT ${limitParam}
       OFFSET ${offsetParam}`,
      values,
    );

    return res.status(200).json(result.rows);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/campaigns/:id/stats", authRequired, requireRole("ADVERTISER", "CHANNEL_ADMIN", "OPS"), async (req, res) => {
  const parsed = idParamSchema.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ message: "Invalid params", issues: parsed.error.flatten() });

  try {
    const campaign = await getCampaignById(parsed.data.id);
    if (!campaign || !canAccessCampaign(req.user!, campaign)) return res.status(404).json({ message: "Campaign not found" });

    const totalResult = await prisma.$queryRaw<{ count: string }>`
      SELECT COUNT(*)::text as count
      FROM "TrackingClick"
      WHERE "campaignId" = ${parsed.data.id}::uuid
        AND "isValid" = true
    `;

    const last24hResult = await prisma.$queryRaw<{ count: string }>`
      SELECT COUNT(*)::text as count
      FROM "TrackingClick"
      WHERE "campaignId" = ${parsed.data.id}::uuid
        AND "isValid" = true
        AND ts >= NOW() - INTERVAL '24 hours'
    `;

    const firstResult = await prisma.$queryRaw<{ ts: string | null }>`
      SELECT COALESCE(MIN(ts)::text, NULL) as ts
      FROM "TrackingClick"
      WHERE "campaignId" = ${parsed.data.id}::uuid
        AND "isValid" = true
    `;

    const lastResult = await prisma.$queryRaw<{ ts: string | null }>`
      SELECT COALESCE(MAX(ts)::text, NULL) as ts
      FROM "TrackingClick"
      WHERE "campaignId" = ${parsed.data.id}::uuid
        AND "isValid" = true
    `;

    const executionStatus = await computeExecutionStatus(parsed.data.id);

    return res.status(200).json({
      campaignId: parsed.data.id,
      valid_clicks_total: Number(totalResult.rows[0]?.count ?? 0),
      valid_clicks_last_24h: Number(last24hResult.rows[0]?.count ?? 0),
      first_valid_click_at: firstResult.rows[0]?.ts ?? null,
      last_valid_click_at: lastResult.rows[0]?.ts ?? null,
      execution_status: executionStatus,
    });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/campaigns/:id/submit", authRequired, requireRole("ADVERTISER"), async (req, res) => {
  const parsed = idParamSchema.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ message: "Invalid params", issues: parsed.error.flatten() });

  try {
    const campaign = await getCampaignById(parsed.data.id);
    if (!campaign || campaign.advertiserUserId !== req.user!.id) return res.status(404).json({ message: "Campaign not found" });

    if (!canTransition(campaign.status, "READY_FOR_PAYMENT")) return res.status(409).json({ message: "Invalid status transition" });

    const updated = await prisma.$queryRaw<CampaignRow>`
      UPDATE "Campaign"
      SET status = 'READY_FOR_PAYMENT'::"CampaignStatus"
      WHERE id = ${parsed.data.id}::uuid
      RETURNING
        id::text,
        "advertiserUserId"::text,
        "channelId"::text,
        "copyText",
        "destinationUrl",
        "scheduledAt"::text,
        status::text,
        "createdAt"::text,
        "publishedAt"::text,
        "startAt"::text,
        "endAt"::text,
        ''::text as "channelOwnerUserId"
    `;

    return res.status(200).json(updated.rows[0]);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/ops/campaigns/:id/mark-paid", authRequired, requireRole("OPS"), async (req, res) => {
  const parsed = idParamSchema.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ message: "Invalid params", issues: parsed.error.flatten() });

  try {
    const campaign = await getCampaignById(parsed.data.id);
    if (!campaign) return res.status(404).json({ message: "Campaign not found" });

    if (!canTransition(campaign.status, "PAID")) return res.status(409).json({ message: "Invalid status transition" });

    const updated = await prisma.$queryRaw<CampaignRow>`
      UPDATE "Campaign"
      SET status = 'PAID'::"CampaignStatus"
      WHERE id = ${parsed.data.id}::uuid
      RETURNING
        id::text,
        "advertiserUserId"::text,
        "channelId"::text,
        "copyText",
        "destinationUrl",
        "scheduledAt"::text,
        status::text,
        "createdAt"::text,
        "publishedAt"::text,
        "startAt"::text,
        "endAt"::text,
        ''::text as "channelOwnerUserId"
    `;

    return res.status(200).json(updated.rows[0]);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/campaigns/:id/confirm-published", authRequired, requireRole("CHANNEL_ADMIN", "OPS"), async (req, res) => {
  const parsed = idParamSchema.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ message: "Invalid params", issues: parsed.error.flatten() });

  try {
    const campaign = await getCampaignById(parsed.data.id);
    if (!campaign) return res.status(404).json({ message: "Campaign not found" });

    if (req.user!.role === "CHANNEL_ADMIN" && campaign.channelOwnerUserId !== req.user!.id) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    if (!canTransition(campaign.status, "PUBLISHED")) return res.status(409).json({ message: "Invalid status transition" });

    const updated = await prisma.$queryRaw<CampaignRow>`
      UPDATE "Campaign"
      SET
        status = 'PUBLISHED'::"CampaignStatus",
        "publishedAt" = NOW(),
        "startAt" = COALESCE("startAt", NOW()),
        "endAt" = COALESCE("endAt", NOW() + INTERVAL '30 days')
      WHERE id = ${parsed.data.id}::uuid
      RETURNING
        id::text,
        "advertiserUserId"::text,
        "channelId"::text,
        "copyText",
        "destinationUrl",
        "scheduledAt"::text,
        status::text,
        "createdAt"::text,
        "publishedAt"::text,
        "startAt"::text,
        "endAt"::text,
        ''::text as "channelOwnerUserId"
    `;

    return res.status(200).json(updated.rows[0]);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/ops/campaigns/:id/complete", authRequired, requireRole("OPS"), async (req, res) => {
  const parsed = idParamSchema.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ message: "Invalid params", issues: parsed.error.flatten() });

  try {
    const campaign = await getCampaignById(parsed.data.id);
    if (!campaign) return res.status(404).json({ message: "Campaign not found" });

    if (!canTransition(campaign.status, "COMPLETED")) return res.status(409).json({ message: "Invalid status transition" });

    const updated = await prisma.$queryRaw<CampaignRow>`
      UPDATE "Campaign"
      SET status = 'COMPLETED'::"CampaignStatus"
      WHERE id = ${parsed.data.id}::uuid
      RETURNING
        id::text,
        "advertiserUserId"::text,
        "channelId"::text,
        "copyText",
        "destinationUrl",
        "scheduledAt"::text,
        status::text,
        "createdAt"::text,
        "publishedAt"::text,
        "startAt"::text,
        "endAt"::text,
        ''::text as "channelOwnerUserId"
    `;

    return res.status(200).json(updated.rows[0]);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
