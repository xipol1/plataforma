import { Router } from "express";
import { z } from "zod";
import { prisma } from "./lib/prisma.js";
import { authRequired, requireRole } from "./middleware/auth.js";
import {
  advertiserCampaignsQuerySchema,
  createCampaignSchema,
  idParamSchema,
  opsCampaignsQuerySchema,
  type CampaignStatus,
} from "./campaigns.schemas.js";
import { canTransition } from "./campaigns.state.js";

const router = Router();

router.get("/campaigns/:id/summary", authRequired, async (req, res) => {
  const parsed = idParamSchema.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid id", issues: parsed.error.flatten() });
  }
  const { id } = parsed.data;
  try {
    const totals = await prisma.$queryRaw<{ total: number; valid: number; invalid: number }>`
      SELECT
        COUNT(*)::int AS total,
        SUM(CASE WHEN "isValid" = true THEN 1 ELSE 0 END)::int AS valid,
        SUM(CASE WHEN "isValid" = false THEN 1 ELSE 0 END)::int AS invalid
      FROM "TrackingClick"
      WHERE "campaignId" = ${id}::uuid
        AND ts >= NOW() - INTERVAL '30 days'
    `;
    const byReason = await prisma.$queryRaw<{ reason: string | null; count: number }>`
      SELECT "invalidReason"::text AS reason, COUNT(*)::int AS count
      FROM "TrackingClick"
      WHERE "campaignId" = ${id}::uuid
        AND ts >= NOW() - INTERVAL '30 days'
        AND "isValid" = false
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

router.post("/campaigns", authRequired, requireRole("ADVERTISER"), async (req, res) => {
  const parsed = createCampaignSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input", issues: parsed.error.flatten() });
  }

  const input = parsed.data;

  try {
    const result = await prisma.$queryRaw<{
      id: string;
      advertiserUserId: string;
      channelId: string;
      copyText: string;
      destinationUrl: string;
      scheduledAt: string | null;
      status: CampaignStatus;
      createdAt: string;
    }>`
      INSERT INTO "Campaign" ("advertiserUserId", "channelId", "copyText", "destinationUrl", "scheduledAt", status)
      VALUES (
        ${req.user!.id}::uuid,
        ${input.channelId}::uuid,
        ${input.copyText},
        ${input.destinationUrl},
        ${input.scheduledAt ?? null},
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
        "createdAt"::text
    `;

    return res.status(201).json(result.rows[0]);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/campaigns/inbox", authRequired, requireRole("ADVERTISER"), async (req, res) => {
  const parsed = advertiserCampaignsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid query", issues: parsed.error.flatten() });
  }

  const { status, limit, offset } = parsed.data;
  const values: unknown[] = [req.user!.id];
  const conditions: string[] = [`"advertiserUserId" = $${values.length}::uuid`];

  if (status) {
    values.push(status);
    conditions.push(`status = $${values.length}::"CampaignStatus"`);
  }

  values.push(limit);
  const limitParam = `$${values.length}`;
  values.push(offset);
  const offsetParam = `$${values.length}`;

  const query = `
    SELECT
      id::text,
      "advertiserUserId"::text,
      "channelId"::text,
      "copyText",
      "destinationUrl",
      "scheduledAt"::text,
      status::text,
      "createdAt"::text
    FROM "Campaign"
    WHERE ${conditions.join(" AND ")}
    ORDER BY "createdAt" DESC
    LIMIT ${limitParam}
    OFFSET ${offsetParam}
  `;

  try {
    const result = await prisma.$query(query, values);
    return res.status(200).json(result.rows);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/campaigns/ops", authRequired, requireRole("OPS"), async (req, res) => {
  const parsed = opsCampaignsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid query", issues: parsed.error.flatten() });
  }

  const { status, channelId, advertiserUserId, limit, offset } = parsed.data;
  const values: unknown[] = [];
  const conditions: string[] = [];

  if (status) {
    values.push(status);
    conditions.push(`status = $${values.length}::"CampaignStatus"`);
  }
  if (channelId) {
    values.push(channelId);
    conditions.push(`"channelId" = $${values.length}::uuid`);
  }
  if (advertiserUserId) {
    values.push(advertiserUserId);
    conditions.push(`"advertiserUserId" = $${values.length}::uuid`);
  }

  values.push(limit);
  const limitParam = `$${values.length}`;
  values.push(offset);
  const offsetParam = `$${values.length}`;

  const query = `
    SELECT
      id::text,
      "advertiserUserId"::text,
      "channelId"::text,
      "copyText",
      "destinationUrl",
      "scheduledAt"::text,
      status::text,
      "createdAt"::text
    FROM "Campaign"
    ${conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""}
    ORDER BY "createdAt" DESC
    LIMIT ${limitParam}
    OFFSET ${offsetParam}
  `;

  try {
    const result = await prisma.$query(query, values);
    return res.status(200).json(result.rows);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/campaigns/:id", authRequired, async (req, res) => {
  const parsed = idParamSchema.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid id", issues: parsed.error.flatten() });
  }

  const { id } = parsed.data;

  try {
    const result = await prisma.$queryRaw<{
      id: string;
      advertiserUserId: string;
      channelId: string;
      copyText: string;
      destinationUrl: string;
      scheduledAt: string | null;
      status: CampaignStatus;
      createdAt: string;
    }>`
      SELECT
        id::text,
        "advertiserUserId"::text,
        "channelId"::text,
        "copyText",
        "destinationUrl",
        "scheduledAt"::text,
        status::text,
        "createdAt"::text
      FROM "Campaign"
      WHERE id = ${id}::uuid
      LIMIT 1
    `;

    const campaign = result.rows[0];
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    if (req.user!.role === "OPS" || req.user!.id === campaign.advertiserUserId) {
      return res.status(200).json(campaign);
    }

    return res.status(404).json({ message: "Campaign not found" });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

const statusSchema = z.object({
  status: z.enum([
    "DRAFT",
    "READY_FOR_PAYMENT",
    "PAID",
    "READY",
    "PUBLISHED",
    "DISPUTED",
    "COMPLETED",
    "REFUNDED",
  ]),
});

router.patch("/campaigns/:id/status", authRequired, requireRole("OPS"), async (req, res) => {
  const idParsed = idParamSchema.safeParse(req.params);
  if (!idParsed.success) {
    return res.status(400).json({ message: "Invalid id", issues: idParsed.error.flatten() });
  }

  const statusParsed = statusSchema.safeParse(req.body);
  if (!statusParsed.success) {
    return res.status(400).json({ message: "Invalid status", issues: statusParsed.error.flatten() });
  }

  const { id } = idParsed.data;
  const next = statusParsed.data.status;

  try {
    const currentRes = await prisma.$queryRaw<{ status: CampaignStatus }>`
      SELECT status::text AS status
      FROM "Campaign"
      WHERE id = ${id}::uuid
      LIMIT 1
    `;

    const current = currentRes.rows[0]?.status;
    if (!current) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    if (!canTransition(current as CampaignStatus, next as CampaignStatus)) {
      return res.status(400).json({ message: `Invalid transition ${current} -> ${next}` });
    }

    const updated = await prisma.$queryRaw<{ status: CampaignStatus }>`
      UPDATE "Campaign"
      SET status = ${next}::"CampaignStatus"
      WHERE id = ${id}::uuid
      RETURNING status::text AS status
    `;

    try {
      await prisma.$queryRaw`
        INSERT INTO "AuditLog"("actorUserId","entityType","entityId","action","meta")
        VALUES (${req.user!.id}::uuid, 'Campaign', ${id}::uuid, 'STATUS_CHANGE', ${JSON.stringify({ to: next })})
      `;
    } catch {}

    return res.status(200).json({ status: updated.rows[0].status });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;

const publishSchema = z.object({
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
});

router.patch("/campaigns/:id/publish", authRequired, requireRole("OPS"), async (req, res) => {
  const idParsed = idParamSchema.safeParse(req.params);
  if (!idParsed.success) {
    return res.status(400).json({ message: "Invalid id", issues: idParsed.error.flatten() });
  }

  const bodyParsed = publishSchema.safeParse(req.body);
  if (!bodyParsed.success) {
    return res.status(400).json({ message: "Invalid body", issues: bodyParsed.error.flatten() });
  }

  const { id } = idParsed.data;
  const { startAt, endAt } = bodyParsed.data;

  try {
    const currentRes = await prisma.$queryRaw<{ status: CampaignStatus }>`
      SELECT status::text AS status FROM "Campaign" WHERE id = ${id}::uuid LIMIT 1
    `;
    const current = currentRes.rows[0]?.status;
    if (!current) {
      return res.status(404).json({ message: "Campaign not found" });
    }
    if (!canTransition(current as CampaignStatus, "PUBLISHED" as CampaignStatus)) {
      return res.status(400).json({ message: `Invalid transition ${current} -> PUBLISHED` });
    }

    const updated = await prisma.$queryRaw`
      UPDATE "Campaign"
      SET "startAt" = ${startAt}::timestamptz, "endAt" = ${endAt}::timestamptz, status = 'PUBLISHED'::"CampaignStatus"
      WHERE id = ${id}::uuid
      RETURNING id::text
    `;

    if ((updated.rowCount ?? 0) === 0) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    try {
      await prisma.$queryRaw`
        INSERT INTO "AuditLog"("actorUserId","entityType","entityId","action","meta")
        VALUES (${req.user!.id}::uuid, 'Campaign', ${id}::uuid, 'PUBLISH', ${JSON.stringify({ startAt, endAt })})
      `;
    } catch {}

    return res.status(200).json({ id, status: "PUBLISHED", startAt, endAt });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});
