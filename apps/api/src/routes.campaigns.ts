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
  } catch (e) {
    console.error("[campaigns] summary error", e);
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
        "scheduledAt",
        status::text,
        "createdAt"
    `;

    return res.status(201).json(result.rows[0]);
  } catch (e) {
    console.error("[campaigns] create error", e);
    return res.status(500).json({
      message: "Internal server error",
      error: String((e as { message?: string }).message ?? e),
    });
  }
});

router.get("/campaigns/inbox", authRequired, requireRole("ADVERTISER"), async (req, res) => {
  const parsed = advertiserCampaignsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid query", issues: parsed.error.flatten() });
  }

  const { status, limit, offset } = parsed.data;
  const values: unknown[] = [req.user!.id];
  const conditions: string[] = [`c."advertiserUserId" = $${values.length}::uuid`];

  if (status) {
    values.push(status);
    conditions.push(`c.status = $${values.length}::"CampaignStatus"`);
  }

  values.push(limit);
  const limitParam = `$${values.length}`;
  values.push(offset);
  const offsetParam = `$${values.length}`;

  const query = `
    SELECT
      c.id::text,
      c."advertiserUserId"::text,
      c."channelId"::text,
      ch.name AS "channelName",
      ch.category AS "channelCategory",
      ch.platform::text AS "channelPlatform",
      ch."pricePerPost" AS "channelPrice",
      c."copyText",
      c."destinationUrl",
      c."scheduledAt",
      c."startAt",
      c."endAt",
      c."publishedAt",
      c.status::text,
      c."createdAt"
    FROM "Campaign" c
    JOIN "Channel" ch ON ch.id = c."channelId"
    WHERE ${conditions.join(" AND ")}
    ORDER BY c."createdAt" DESC
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

router.get("/campaigns/summary", authRequired, requireRole("ADVERTISER"), async (req, res) => {
  const queryParsed = z
    .object({
      window_days: z.coerce.number().optional(),
    })
    .safeParse(req.query);
  const windowDaysRaw = queryParsed.success ? queryParsed.data.window_days : undefined;
  const window_days = windowDaysRaw === 7 || windowDaysRaw === 90 ? windowDaysRaw : 30;
  const prev_days = window_days;

  try {
    const campaigns = await prisma.$queryRaw<{ total: string; paid: string; published: string }>`
      SELECT
        COUNT(*)::text AS total,
        SUM(CASE WHEN (status = 'PAID'::"CampaignStatus" OR status = 'SUBMITTED'::"CampaignStatus") THEN 1 ELSE 0 END)::text AS paid,
        SUM(CASE WHEN status = 'PUBLISHED'::"CampaignStatus" THEN 1 ELSE 0 END)::text AS published
      FROM "Campaign"
      WHERE "advertiserUserId" = ${req.user!.id}::uuid
    `;

    const clicks = await prisma.$queryRaw<{ clicks: string; valid: string; invalid: string; clicksPrev: string; validPrev: string; invalidPrev: string }>`
      SELECT
        SUM(CASE WHEN t.ts >= NOW() - (${window_days}::text || ' days')::interval THEN 1 ELSE 0 END)::text AS clicks,
        SUM(CASE WHEN t.ts >= NOW() - (${window_days}::text || ' days')::interval AND t."isValid" THEN 1 ELSE 0 END)::text AS valid,
        SUM(CASE WHEN t.ts >= NOW() - (${window_days}::text || ' days')::interval AND NOT t."isValid" THEN 1 ELSE 0 END)::text AS invalid,
        SUM(CASE WHEN t.ts >= NOW() - ((${window_days + prev_days}::text) || ' days')::interval AND t.ts < NOW() - (${window_days}::text || ' days')::interval THEN 1 ELSE 0 END)::text AS "clicksPrev",
        SUM(CASE WHEN t.ts >= NOW() - ((${window_days + prev_days}::text) || ' days')::interval AND t.ts < NOW() - (${window_days}::text || ' days')::interval AND t."isValid" THEN 1 ELSE 0 END)::text AS "validPrev",
        SUM(CASE WHEN t.ts >= NOW() - ((${window_days + prev_days}::text) || ' days')::interval AND t.ts < NOW() - (${window_days}::text || ' days')::interval AND NOT t."isValid" THEN 1 ELSE 0 END)::text AS "invalidPrev"
      FROM "TrackingClick" t
      JOIN "Campaign" c ON c.id = t."campaignId"
      WHERE c."advertiserUserId" = ${req.user!.id}::uuid
        AND t.ts >= NOW() - ((${window_days + prev_days}::text) || ' days')::interval
    `;

    const spend = await prisma.$queryRaw<{ spend: string; spendPrev: string }>`
      SELECT
        COALESCE(SUM(CASE WHEN p."createdAt" >= NOW() - (${window_days}::text || ' days')::interval THEN p.amount ELSE 0 END), 0)::text AS spend,
        COALESCE(SUM(CASE WHEN p."createdAt" >= NOW() - ((${window_days + prev_days}::text) || ' days')::interval AND p."createdAt" < NOW() - (${window_days}::text || ' days')::interval THEN p.amount ELSE 0 END), 0)::text AS "spendPrev"
      FROM "Payment" p
      JOIN "Campaign" c ON c.id = p."campaignId"
      WHERE c."advertiserUserId" = ${req.user!.id}::uuid
        AND p.status = 'SUCCEEDED'::"PaymentStatus"
        AND p."createdAt" >= NOW() - ((${window_days + prev_days}::text) || ' days')::interval
    `;

    let views = 0;
    let viewsPrev = 0;
    let conversions = 0;
    let conversionsPrev = 0;
    let revenue = 0;
    let revenuePrev = 0;
    try {
      const ev = await prisma.$queryRaw<{ views: string; viewsPrev: string; conversions: string; conversionsPrev: string; revenue: string; revenuePrev: string }>`
        SELECT
          COALESCE(SUM(CASE WHEN e.ts >= NOW() - (${window_days}::text || ' days')::interval AND e.type = 'VIEW' THEN 1 ELSE 0 END), 0)::text AS views,
          COALESCE(SUM(CASE WHEN e.ts >= NOW() - (${window_days}::text || ' days')::interval AND e.type = 'CONVERSION' THEN 1 ELSE 0 END), 0)::text AS conversions,
          COALESCE(SUM(CASE WHEN e.ts >= NOW() - (${window_days}::text || ' days')::interval AND e.type = 'CONVERSION' THEN COALESCE(e.value, 0) ELSE 0 END), 0)::text AS revenue,
          COALESCE(SUM(CASE WHEN e.ts >= NOW() - ((${window_days + prev_days}::text) || ' days')::interval AND e.ts < NOW() - (${window_days}::text || ' days')::interval AND e.type = 'VIEW' THEN 1 ELSE 0 END), 0)::text AS "viewsPrev",
          COALESCE(SUM(CASE WHEN e.ts >= NOW() - ((${window_days + prev_days}::text) || ' days')::interval AND e.ts < NOW() - (${window_days}::text || ' days')::interval AND e.type = 'CONVERSION' THEN 1 ELSE 0 END), 0)::text AS "conversionsPrev",
          COALESCE(SUM(CASE WHEN e.ts >= NOW() - ((${window_days + prev_days}::text) || ' days')::interval AND e.ts < NOW() - (${window_days}::text || ' days')::interval AND e.type = 'CONVERSION' THEN COALESCE(e.value, 0) ELSE 0 END), 0)::text AS "revenuePrev"
        FROM "TrackingEvent" e
        JOIN "Campaign" c ON c.id = e."campaignId"
        WHERE c."advertiserUserId" = ${req.user!.id}::uuid
          AND e.ts >= NOW() - ((${window_days + prev_days}::text) || ' days')::interval
      `;
      const r = ev.rows[0];
      views = Number(r?.views ?? 0);
      viewsPrev = Number(r?.viewsPrev ?? 0);
      conversions = Number(r?.conversions ?? 0);
      conversionsPrev = Number(r?.conversionsPrev ?? 0);
      revenue = Number(r?.revenue ?? 0);
      revenuePrev = Number(r?.revenuePrev ?? 0);
    } catch {}

    const clicksRow = clicks.rows[0] ?? { clicks: "0", valid: "0", invalid: "0", clicksPrev: "0", validPrev: "0", invalidPrev: "0" };
    const spendRow = spend.rows[0] ?? { spend: "0", spendPrev: "0" };
    const cRow = campaigns.rows[0] ?? { total: "0", paid: "0", published: "0" };

    const clicksCur = Number(clicksRow.clicks ?? 0);
    const validCur = Number(clicksRow.valid ?? 0);
    const invalidCur = Number(clicksRow.invalid ?? 0);
    const clicksPrev = Number(clicksRow.clicksPrev ?? 0);
    const validPrev = Number(clicksRow.validPrev ?? 0);
    const invalidPrev = Number(clicksRow.invalidPrev ?? 0);
    const spendCur = Number(spendRow.spend ?? 0);
    const spendPrev = Number(spendRow.spendPrev ?? 0);

    const ctr = clicksCur ? Number(((validCur / clicksCur) * 100).toFixed(1)) : 0;
    const ctrPrev = clicksPrev ? Number(((validPrev / clicksPrev) * 100).toFixed(1)) : 0;
    const cpc = clicksCur ? Number((spendCur / clicksCur).toFixed(2)) : 0;
    const cpcPrev = clicksPrev ? Number((spendPrev / clicksPrev).toFixed(2)) : 0;
    const cpa = conversions ? Number((spendCur / conversions).toFixed(2)) : 0;
    const cpaPrev = conversionsPrev ? Number((spendPrev / conversionsPrev).toFixed(2)) : 0;
    const cvr = clicksCur ? Number(((conversions / clicksCur) * 100).toFixed(1)) : 0;
    const cvrPrev = clicksPrev ? Number(((conversionsPrev / clicksPrev) * 100).toFixed(1)) : 0;
    const roas = spendCur ? Number((revenue / spendCur).toFixed(2)) : 0;
    const roasPrev = spendPrev ? Number((revenuePrev / spendPrev).toFixed(2)) : 0;

    const clicksByMonth = await prisma.$queryRaw<{ month: string; valid: string }>`
      SELECT
        date_trunc('month', t.ts)::text AS month,
        SUM(CASE WHEN t."isValid" THEN 1 ELSE 0 END)::text AS valid
      FROM "TrackingClick" t
      JOIN "Campaign" c ON c.id = t."campaignId"
      WHERE c."advertiserUserId" = ${req.user!.id}::uuid
        AND t.ts >= date_trunc('month', NOW()) - INTERVAL '11 months'
      GROUP BY 1
      ORDER BY 1 ASC
    `;
    const mapByMonth = new Map<string, number>();
    for (const r of clicksByMonth.rows ?? []) {
      const key = String(r.month ?? "").slice(0, 7);
      if (key) mapByMonth.set(key, Number(r.valid ?? 0));
    }
    const now = new Date();
    const months: string[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months.push(ym);
    }
    const series = months.map((m) => mapByMonth.get(m) ?? 0);

    return res.status(200).json({
      window_days,
      total: Number(cRow.total ?? 0),
      paid: Number(cRow.paid ?? 0),
      published: Number(cRow.published ?? 0),

      spend: spendCur,
      spend_prev: spendPrev,
      impressions: views,
      impressions_prev: viewsPrev,
      clicks: clicksCur,
      clicks_prev: clicksPrev,
      roas,
      roas_prev: roasPrev,

      ctr,
      ctr_prev: ctrPrev,
      cpc,
      cpc_prev: cpcPrev,
      cpa,
      cpa_prev: cpaPrev,
      conversions,
      conversions_prev: conversionsPrev,
      cvr,
      cvr_prev: cvrPrev,

      valid: validCur,
      valid_prev: validPrev,
      invalid: invalidCur,
      invalid_prev: invalidPrev,
      revenue,
      revenue_prev: revenuePrev,

      clicksByMonth: series,
    });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/campaigns/events", authRequired, requireRole("ADVERTISER"), async (req, res) => {
  try {
    const rows = await prisma.$queryRaw<{
      action: string;
      entityType: string;
      entityId: string;
      createdAt: string;
      meta: string | null;
    }>`
      SELECT
        action::text AS action,
        "entityType"::text AS "entityType",
        "entityId"::text AS "entityId",
        ts AS "createdAt",
        "meta"::text AS meta
      FROM "AuditLog"
      WHERE ("entityType" = 'Campaign' AND "entityId" IN (
              SELECT id FROM "Campaign" WHERE "advertiserUserId" = ${req.user!.id}::uuid
            ))
         OR ("entityType" = 'Payment' AND "entityId" IN (
              SELECT id FROM "Payment" WHERE "campaignId" IN (
                SELECT id FROM "Campaign" WHERE "advertiserUserId" = ${req.user!.id}::uuid
              )
            ))
      ORDER BY ts DESC
      LIMIT 20
    `;
    return res.status(200).json(
      rows.rows.map((r) => ({
        type: r.action,
        entity: r.entityType,
        entityId: r.entityId,
        ts: r.createdAt,
        meta: r.meta ? (() => { try { return JSON.parse(r.meta!); } catch { return null; } })() : null,
      })),
    );
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
      "scheduledAt",
      status::text,
      "createdAt"
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

router.get("/campaigns/ops/requests", authRequired, requireRole("OPS"), async (req, res) => {
  const opsRequestsQuerySchema = z.object({
    status: z
      .enum([
        "DRAFT",
        "READY_FOR_PAYMENT",
        "PAID",
        "READY",
        "PUBLISHED",
        "DISPUTED",
        "COMPLETED",
        "REFUNDED",
      ])
      .optional(),
    action: z.enum(["SCHEDULE_REQUEST", "SCHEDULE_PROPOSAL"]).optional(),
    channelId: z.string().uuid().optional(),
    limit: z.coerce.number().min(1).max(200).default(50),
    offset: z.coerce.number().min(0).default(0),
  });
  const parsed = opsRequestsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid query", issues: parsed.error.flatten() });
  }
  const { status, action, channelId, limit, offset } = parsed.data;

  const conditions: string[] = [`a."entityType" = 'Campaign'`];
  const values: unknown[] = [];

  if (action) {
    values.push(action);
    conditions.push(`a.action = $${values.length}`);
  } else {
    conditions.push(`a.action IN ('SCHEDULE_REQUEST','SCHEDULE_PROPOSAL')`);
  }
  if (status) {
    values.push(status);
    conditions.push(`c.status::text = $${values.length}`);
  }
  if (channelId) {
    values.push(channelId);
    conditions.push(`c."channelId" = $${values.length}::uuid`);
  }

  const countQuery = `
    SELECT COUNT(*)::int AS total
    FROM "AuditLog" a
    JOIN "Campaign" c ON c.id = a."entityId"
    JOIN "Channel" ch ON ch.id = c."channelId"
    WHERE ${conditions.join(" AND ")}
  `;
  const countNoJoinQuery = `
    SELECT COUNT(*)::int AS total
    FROM "AuditLog" a
    WHERE a."entityType" = 'Campaign'
      AND a.action IN ('SCHEDULE_REQUEST','SCHEDULE_PROPOSAL')
  `;
  const pageValues = [...values];
  pageValues.push(limit);
  const limitParam = `$${pageValues.length}`;
  pageValues.push(offset);
  const offsetParam = `$${pageValues.length}`;

  const query = `
    SELECT
      a."ts" AS "createdAt",
      a."entityId"::text AS "campaignId",
      a.action::text AS action,
      a.meta::text AS meta,
      c.status::text AS status,
      c."scheduledAt" AS "scheduledAt",
      ch.name AS "channelName"
    FROM "AuditLog" a
    JOIN "Campaign" c ON c.id = a."entityId"
    JOIN "Channel" ch ON ch.id = c."channelId"
    WHERE ${conditions.join(" AND ")}
    ORDER BY a."ts" DESC
    LIMIT ${limitParam}
    OFFSET ${offsetParam}
  `;

  try {
    const countRes = (status || channelId) ? await prisma.$query(countQuery, values) : await prisma.$query(countNoJoinQuery);
    const total = Number(countRes.rows[0]?.total ?? 0);
    try {
      const result = await prisma.$query(query, pageValues);
      res.setHeader("X-Total-Count", String(total));
      return res.status(200).json(result.rows);
    } catch {
      res.setHeader("X-Total-Count", String(total));
      return res.status(200).json([]);
    }
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
      channelName: string;
      channelCategory: string;
      channelPlatform: string;
      channelPrice: number;
      copyText: string;
      destinationUrl: string;
      scheduledAt: string | null;
      startAt: string | null;
      endAt: string | null;
      publishedAt: string | null;
      status: CampaignStatus;
      createdAt: string;
    }>`
      SELECT
        c.id::text,
        c."advertiserUserId"::text,
        c."channelId"::text,
        ch.name AS "channelName",
        ch.category AS "channelCategory",
        ch.platform::text AS "channelPlatform",
        ch."pricePerPost" AS "channelPrice",
        c."copyText",
        c."destinationUrl",
        c."scheduledAt",
        c."startAt",
        c."endAt",
        c."publishedAt",
        c.status::text,
        c."createdAt"
      FROM "Campaign" c
      JOIN "Channel" ch ON ch.id = c."channelId"
      WHERE c.id = ${id}::uuid
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

router.get("/campaigns/:id/tracking-stats", authRequired, async (req, res) => {
  const parsed = idParamSchema.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid id", issues: parsed.error.flatten() });
  }
  const { id } = parsed.data;
  try {
    const campaignRes = await prisma.$queryRaw<{ advertiserUserId: string; ownerUserId: string }>`
      SELECT
        c."advertiserUserId"::text AS "advertiserUserId",
        ch."ownerUserId"::text AS "ownerUserId"
      FROM "Campaign" c
      JOIN "Channel" ch ON ch.id = c."channelId"
      WHERE c.id = ${id}::uuid
      LIMIT 1
    `;
    const row = campaignRes.rows[0];
    if (!row) return res.status(404).json({ message: "Campaign not found" });

    const role = req.user!.role;
    const uid = req.user!.id;
    const allowed = role === "OPS" || (role === "ADVERTISER" && row.advertiserUserId === uid) || (role === "CHANNEL_ADMIN" && row.ownerUserId === uid);
    if (!allowed) return res.status(403).json({ message: "Forbidden" });

    const totals = await prisma.$queryRaw<{ total: string; valid: string; invalid: string }>`
      SELECT
        COUNT(*)::text AS total,
        SUM(CASE WHEN "isValid" THEN 1 ELSE 0 END)::text AS valid,
        SUM(CASE WHEN NOT "isValid" THEN 1 ELSE 0 END)::text AS invalid
      FROM "TrackingClick"
      WHERE "campaignId" = ${id}::uuid
        AND ts >= NOW() - ('30 days')::interval
    `;
    let eventsRow: { views: string; conversions: string } | null = null;
    try {
      const events = await prisma.$queryRaw<{ views: string; conversions: string }>`
        SELECT
          SUM(CASE WHEN type = 'VIEW' THEN 1 ELSE 0 END)::text AS views,
          SUM(CASE WHEN type = 'CONVERSION' THEN 1 ELSE 0 END)::text AS conversions
        FROM "TrackingEvent"
        WHERE "campaignId" = ${id}::uuid
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
    });
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
    return res.status(400).json({ message: "Invalid id", code: "INVALID_ID", issues: idParsed.error.flatten() });
  }

  const statusParsed = statusSchema.safeParse(req.body);
  if (!statusParsed.success) {
    return res.status(400).json({ message: "Invalid status", code: "INVALID_STATUS", issues: statusParsed.error.flatten() });
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
      return res.status(404).json({ message: "Campaign not found", code: "NOT_FOUND" });
    }

    if (!canTransition(current as CampaignStatus, next as CampaignStatus)) {
      return res.status(400).json({ message: `Invalid transition ${current} -> ${next}`, code: "INVALID_TRANSITION" });
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
    return res.status(500).json({ message: "Internal server error", code: "INTERNAL" });
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
    return res.status(400).json({ message: "Invalid id", code: "INVALID_ID", issues: idParsed.error.flatten() });
  }

  const bodyParsed = publishSchema.safeParse(req.body);
  if (!bodyParsed.success) {
    return res.status(400).json({ message: "Invalid body", code: "INVALID_BODY", issues: bodyParsed.error.flatten() });
  }

  const { id } = idParsed.data;
  const { startAt, endAt } = bodyParsed.data;

  try {
    const payRes = await prisma.$queryRaw<{ status: string | null }>`
      SELECT p.status::text AS status
      FROM "Payment" p
      WHERE p."campaignId" = ${id}::uuid
      LIMIT 1
    `;
    const payStatus = payRes.rows[0]?.status ?? null;
    if (payStatus !== "SUCCEEDED") {
      return res.status(400).json({ message: "Payment not succeeded", code: "PAYMENT_NOT_SUCCEEDED" });
    }

    const now = Date.now();
    const s = new Date(startAt).getTime();
    const e = new Date(endAt).getTime();
    if (Number.isNaN(s) || Number.isNaN(e)) {
      return res.status(400).json({ message: "Invalid start/end times", code: "INVALID_BODY" });
    }
    if (s < now + 30 * 60 * 1000) {
      return res.status(400).json({ message: "Start must be at least 30 minutes in future", code: "INVALID_WINDOW" });
    }
    if (e <= s) {
      return res.status(400).json({ message: "End must be after start", code: "INVALID_WINDOW" });
    }
    if (e - s > 14 * 24 * 60 * 60 * 1000) {
      return res.status(400).json({ message: "Window must be <= 14 days", code: "INVALID_WINDOW" });
    }

    const currentRes = await prisma.$queryRaw<{ status: CampaignStatus }>`
      SELECT status::text AS status FROM "Campaign" WHERE id = ${id}::uuid LIMIT 1
    `;
    const current = currentRes.rows[0]?.status;
    if (!current) {
      return res.status(404).json({ message: "Campaign not found", code: "NOT_FOUND" });
    }
    if (!canTransition(current as CampaignStatus, "PUBLISHED" as CampaignStatus)) {
      return res.status(400).json({ message: `Invalid transition ${current} -> PUBLISHED`, code: "INVALID_TRANSITION" });
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
    return res.status(500).json({ message: "Internal server error", code: "INTERNAL" });
  }
});

router.post("/campaigns/:id/request-publish", authRequired, requireRole("ADVERTISER"), async (req, res) => {
  const idParsed = idParamSchema.safeParse(req.params);
  if (!idParsed.success) {
    return res.status(400).json({ message: "Invalid id", code: "INVALID_ID", issues: idParsed.error.flatten() });
  }
  const { id } = idParsed.data;
  try {
    const ownRes = await prisma.$queryRaw<{ advertiserUserId: string; ownerUserId: string; status: string }>`
      SELECT
        c."advertiserUserId"::text AS "advertiserUserId",
        ch."ownerUserId"::text AS "ownerUserId",
        c.status::text AS status
      FROM "Campaign" c
      JOIN "Channel" ch ON ch.id = c."channelId"
      WHERE c.id = ${id}::uuid
      LIMIT 1
    `;
    const owner = ownRes.rows[0]?.advertiserUserId;
    const ownerUserId = ownRes.rows[0]?.ownerUserId;
    const status = ownRes.rows[0]?.status;
    if (!owner) {
      return res.status(404).json({ message: "Campaign not found", code: "NOT_FOUND" });
    }
    if (owner !== req.user!.id) {
      return res.status(403).json({ message: "Forbidden", code: "FORBIDDEN" });
    }
    if (!(status === "PAID" || status === "SUBMITTED")) {
      return res.status(400).json({ message: "Campaign must be SUBMITTED to request publish", code: "INVALID_STATE" });
    }

    const payRes = await prisma.$queryRaw<{ status: string | null }>`
      SELECT p.status::text AS status
      FROM "Payment" p
      WHERE p."campaignId" = ${id}::uuid
      LIMIT 1
    `;
    const payStatus = payRes.rows[0]?.status ?? null;
    if (payStatus !== "SUCCEEDED") {
      return res.status(400).json({ message: "Payment not succeeded", code: "PAYMENT_NOT_SUCCEEDED" });
    }

    if (status === "PAID") {
      await prisma.$queryRaw`
        UPDATE "Campaign" SET status = 'SUBMITTED'::"CampaignStatus" WHERE id = ${id}::uuid
      `;
    }

    try {
      await prisma.$queryRaw`
        INSERT INTO "AuditLog"("actorUserId","entityType","entityId","action","meta")
        VALUES (${req.user!.id}::uuid, 'Campaign', ${id}::uuid, 'SCHEDULE_REQUEST', NULL)
      `;
    } catch {}

    try {
      await prisma.$queryRaw`
        INSERT INTO "ChatConversation"("campaignId","advertiserUserId","ownerUserId")
        VALUES (${id}::uuid, ${owner}::uuid, ${ownerUserId}::uuid)
        ON CONFLICT ("campaignId") DO UPDATE SET
          "advertiserUserId" = EXCLUDED."advertiserUserId",
          "ownerUserId" = EXCLUDED."ownerUserId"
      `;
    } catch {}

    return res.status(200).json({ requested: true });
  } catch {
    return res.status(500).json({ message: "Internal server error", code: "INTERNAL" });
  }
});
