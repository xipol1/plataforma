import { Router } from "express";
import { z } from "zod";

import { createChannelSchema, listChannelsQuerySchema, updateChannelSchema, updateOwnChannelSchema } from "./channels.schemas.js";
import { prisma } from "./lib/prisma.js";
import { authOptional, authRequired, requireRole } from "./middleware/auth.js";
import { getProviderByName } from "./providers.js";

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

router.post("/channels", authRequired, requireRole("CHANNEL_ADMIN"), async (req, res) => {
  const parsed = createChannelSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input", issues: parsed.error.flatten() });
  }

  const input = parsed.data;

  try {
    const result = await prisma.$queryRaw<{
      id: string;
      ownerUserId: string;
      platform: "TELEGRAM";
      name: string;
      category: string;
      audienceSize: number;
      engagementHint: string;
      pricePerPost: number;
      status: "PENDING" | "ACTIVE" | "SUSPENDED";
      createdAt: string;
    }>`
      INSERT INTO "Channel" (
        "ownerUserId", platform, name, category, "audienceSize", "engagementHint", "pricePerPost", status
      ) VALUES (
        ${req.user!.id}::uuid, ${input.platform}::"ChannelPlatform", ${input.name}, ${input.category}, ${input.audienceSize}, ${input.engagementHint}, ${input.pricePerPost}, 'PENDING'::"ChannelStatus"
      )
      RETURNING
        id::text,
        "ownerUserId"::text,
        platform::text,
        name,
        category,
        "audienceSize",
        "engagementHint",
        "pricePerPost",
        status::text,
        "createdAt"
    `;

    return res.status(201).json(result.rows[0]);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/channels", async (req, res) => {
  const parsed = listChannelsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid query", issues: parsed.error.flatten() });
  }

  const { category, platform, min_price, max_price, min_audience, limit, offset } = parsed.data;
  const conditions: string[] = ['status = \'ACTIVE\'::"ChannelStatus"'];
  const values: unknown[] = [];

  if (category) {
    values.push(category);
    conditions.push(`category = $${values.length}`);
  }

  if (platform) {
    values.push(platform);
    conditions.push(`platform = $${values.length}::"ChannelPlatform"`);
  }

  if (min_price !== undefined) {
    values.push(min_price);
    conditions.push(`"pricePerPost" >= $${values.length}`);
  }

  if (max_price !== undefined) {
    values.push(max_price);
    conditions.push(`"pricePerPost" <= $${values.length}`);
  }

  if (min_audience !== undefined) {
    values.push(min_audience);
    conditions.push(`"audienceSize" >= $${values.length}`);
  }

  values.push(limit);
  const limitParam = `$${values.length}`;
  values.push(offset);
  const offsetParam = `$${values.length}`;

  const query = `
    SELECT
      id::text,
      "ownerUserId"::text,
      platform::text,
      name,
      category,
      "audienceSize",
      "engagementHint",
      "pricePerPost",
      (
        SELECT COUNT(*)::int
        FROM "Campaign" c
        WHERE c."channelId" = "Channel"."id"
          AND (c.status = 'PUBLISHED'::"CampaignStatus" OR c.status = 'COMPLETED'::"CampaignStatus")
      ) AS "publishedCount",
      status::text,
      "createdAt"
    FROM "Channel"
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

router.get("/channels/:id", authOptional, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await prisma.$queryRaw<{
      id: string;
      ownerUserId: string;
      platform: string;
      name: string;
      category: string;
      audienceSize: number;
      engagementHint: string;
      pricePerPost: number;
      status: "PENDING" | "ACTIVE" | "SUSPENDED";
      createdAt: string;
    }>`
      SELECT
        id::text,
        "ownerUserId"::text,
        platform::text,
        name,
        category,
        "audienceSize",
        "engagementHint",
        "pricePerPost",
        status::text,
        "createdAt"
      FROM "Channel"
      WHERE id = ${id}::uuid
      LIMIT 1
    `;

    const channel = result.rows[0];
    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    if (channel.status === "ACTIVE") {
      return res.status(200).json(channel);
    }

    if (req.user && (req.user.role === "OPS" || req.user.id === channel.ownerUserId)) {
      return res.status(200).json(channel);
    }

    return res.status(404).json({ message: "Channel not found" });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.patch("/channels/:id", authRequired, requireRole("OPS"), async (req, res) => {
  const parsed = updateChannelSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input", issues: parsed.error.flatten() });
  }

  const updates = parsed.data;
  const { id } = req.params;

  const setClauses: string[] = [];
  const values: unknown[] = [];

  if (updates.platform !== undefined) {
    values.push(updates.platform);
    setClauses.push(`platform = $${values.length}::"ChannelPlatform"`);
  }
  if (updates.name !== undefined) {
    values.push(updates.name);
    setClauses.push(`name = $${values.length}`);
  }
  if (updates.category !== undefined) {
    values.push(updates.category);
    setClauses.push(`category = $${values.length}`);
  }
  if (updates.audienceSize !== undefined) {
    values.push(updates.audienceSize);
    setClauses.push(`"audienceSize" = $${values.length}`);
  }
  if (updates.engagementHint !== undefined) {
    values.push(updates.engagementHint);
    setClauses.push(`"engagementHint" = $${values.length}`);
  }
  if (updates.pricePerPost !== undefined) {
    values.push(updates.pricePerPost);
    setClauses.push(`"pricePerPost" = $${values.length}`);
  }
  if (updates.status !== undefined) {
    values.push(updates.status);
    setClauses.push(`status = $${values.length}::"ChannelStatus"`);
  }

  values.push(id);

  const query = `
    UPDATE "Channel"
    SET ${setClauses.join(", ")}
    WHERE id = $${values.length}::uuid
    RETURNING
      id::text,
      "ownerUserId"::text,
      platform::text,
      name,
      category,
      "audienceSize",
      "engagementHint",
      "pricePerPost",
      status::text,
      "createdAt"
  `;

  try {
    const result = await prisma.$query(query, values);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Channel not found" });
    }

    return res.status(200).json(result.rows[0]);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/channels/mine", authRequired, requireRole("CHANNEL_ADMIN"), async (req, res) => {
  try {
    const result = await prisma.$queryRaw<{
      id: string;
      name: string;
      category: string;
      audienceSize: number;
      engagementHint: string;
      pricePerPost: number;
      status: "PENDING" | "ACTIVE" | "SUSPENDED";
      createdAt: string;
    }>`
      SELECT
        id::text,
        name,
        category,
        "audienceSize",
        "engagementHint",
        "pricePerPost",
        status::text,
        "createdAt"
      FROM "Channel"
      WHERE "ownerUserId" = ${req.user!.id}::uuid
      ORDER BY "createdAt" DESC
    `;
    return res.status(200).json(result.rows);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.patch("/channels/:id/self", authRequired, requireRole("CHANNEL_ADMIN"), async (req, res) => {
  const parsed = updateOwnChannelSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input", issues: parsed.error.flatten() });
  }
  const updates = parsed.data;
  const { id } = req.params;

  try {
    const ownerRes = await prisma.$queryRaw<{ ownerUserId: string }>`
      SELECT "ownerUserId"::text AS "ownerUserId" FROM "Channel" WHERE id = ${id}::uuid LIMIT 1
    `;
    const ownerUserId = ownerRes.rows[0]?.ownerUserId;
    if (!ownerUserId) {
      return res.status(404).json({ message: "Channel not found" });
    }
    if (ownerUserId !== req.user!.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const setClauses: string[] = [];
    const values: unknown[] = [];
    if (updates.category !== undefined) {
      values.push(updates.category);
      setClauses.push(`category = $${values.length}`);
    }
    if (updates.pricePerPost !== undefined) {
      values.push(updates.pricePerPost);
      setClauses.push(`"pricePerPost" = $${values.length}`);
    }
    if (updates.engagementHint !== undefined) {
      values.push(updates.engagementHint);
      setClauses.push(`"engagementHint" = $${values.length}`);
    }
    values.push(id);

    const query = `
      UPDATE "Channel"
      SET ${setClauses.join(", ")}
      WHERE id = $${values.length}::uuid
      RETURNING
        id::text,
        name,
        category,
        "audienceSize",
        "engagementHint",
        "pricePerPost",
        status::text,
        "createdAt"
    `;
    const result = await prisma.$query(query, values);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Channel not found" });
    }
    try {
      await prisma.$queryRaw`
        INSERT INTO "AuditLog"("actorUserId","entityType","entityId","action","meta")
        VALUES (${req.user!.id}::uuid, 'Channel', ${id}::uuid, 'UPDATE_SELF', ${JSON.stringify(updates)})
      `;
    } catch {}
    return res.status(200).json(result.rows[0]);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/creator/summary", authRequired, requireRole("CHANNEL_ADMIN"), async (req, res) => {
  const parsedQuery = z
    .object({
      window_days: z.coerce.number().optional(),
    })
    .safeParse(req.query);
  const windowDaysRaw = parsedQuery.success ? parsedQuery.data.window_days : undefined;
  const window_days = windowDaysRaw === 7 || windowDaysRaw === 90 ? windowDaysRaw : 30;
  const prev_days = window_days;

  try {
    const earnings = await prisma.$queryRaw<{ earnings: string; earningsPrev: string }>`
      SELECT COALESCE(SUM(p.amount), 0)::text AS earnings
           , COALESCE(SUM(CASE WHEN p."createdAt" < NOW() - (${window_days}::text || ' days')::interval THEN p.amount ELSE 0 END), 0)::text AS "earningsPrev"
      FROM "Payment" p
      JOIN "Campaign" c ON c.id = p."campaignId"
      WHERE c."channelId" IN (SELECT id FROM "Channel" WHERE "ownerUserId" = ${req.user!.id}::uuid)
        AND p.status = 'SUCCEEDED'::"PaymentStatus"
        AND p."createdAt" >= NOW() - ((${window_days + prev_days}::text) || ' days')::interval
    `;
    const counts = await prisma.$queryRaw<{ published: string; completed: string; upcoming: string; totalWindow: string; publishedWindow: string }>`
      SELECT
        (SELECT COUNT(*) FROM "Campaign" c WHERE c."channelId" IN (SELECT id FROM "Channel" WHERE "ownerUserId" = ${req.user!.id}::uuid) AND c.status = 'PUBLISHED'::"CampaignStatus")::text AS published,
        (SELECT COUNT(*) FROM "Campaign" c WHERE c."channelId" IN (SELECT id FROM "Channel" WHERE "ownerUserId" = ${req.user!.id}::uuid) AND c.status = 'COMPLETED'::"CampaignStatus")::text AS completed,
        (SELECT COUNT(*) FROM "Campaign" c WHERE c."channelId" IN (SELECT id FROM "Channel" WHERE "ownerUserId" = ${req.user!.id}::uuid) AND (c.status = 'READY'::"CampaignStatus" OR c.status = 'SUBMITTED'::"CampaignStatus" OR c.status = 'PAID'::"CampaignStatus") AND ((c."scheduledAt" IS NOT NULL AND c."scheduledAt" >= NOW()) OR (c."startAt" IS NOT NULL AND c."startAt" >= NOW())))::text AS upcoming,
        (SELECT COUNT(*) FROM "Campaign" c WHERE c."channelId" IN (SELECT id FROM "Channel" WHERE "ownerUserId" = ${req.user!.id}::uuid) AND c.status <> 'DRAFT'::"CampaignStatus" AND c."createdAt" >= NOW() - (${window_days}::text || ' days')::interval)::text AS "totalWindow",
        (SELECT COUNT(*) FROM "Campaign" c WHERE c."channelId" IN (SELECT id FROM "Channel" WHERE "ownerUserId" = ${req.user!.id}::uuid) AND (c.status = 'PUBLISHED'::"CampaignStatus" OR c.status = 'COMPLETED'::"CampaignStatus") AND COALESCE(c."publishedAt", c."startAt", c."createdAt") >= NOW() - (${window_days}::text || ' days')::interval)::text AS "publishedWindow"
    `;

    const clickStats = await prisma.$queryRaw<{ clicks: string; valid: string; invalid: string; clicksPrev: string; validPrev: string; invalidPrev: string }>`
      SELECT
        COALESCE(SUM(CASE WHEN t.ts >= NOW() - (${window_days}::text || ' days')::interval THEN 1 ELSE 0 END), 0)::text AS clicks,
        COALESCE(SUM(CASE WHEN t.ts >= NOW() - (${window_days}::text || ' days')::interval AND t."isValid" THEN 1 ELSE 0 END), 0)::text AS valid,
        COALESCE(SUM(CASE WHEN t.ts >= NOW() - (${window_days}::text || ' days')::interval AND NOT t."isValid" THEN 1 ELSE 0 END), 0)::text AS invalid,
        COALESCE(SUM(CASE WHEN t.ts >= NOW() - ((${window_days + prev_days}::text) || ' days')::interval AND t.ts < NOW() - (${window_days}::text || ' days')::interval THEN 1 ELSE 0 END), 0)::text AS "clicksPrev",
        COALESCE(SUM(CASE WHEN t.ts >= NOW() - ((${window_days + prev_days}::text) || ' days')::interval AND t.ts < NOW() - (${window_days}::text || ' days')::interval AND t."isValid" THEN 1 ELSE 0 END), 0)::text AS "validPrev",
        COALESCE(SUM(CASE WHEN t.ts >= NOW() - ((${window_days + prev_days}::text) || ' days')::interval AND t.ts < NOW() - (${window_days}::text || ' days')::interval AND NOT t."isValid" THEN 1 ELSE 0 END), 0)::text AS "invalidPrev"
      FROM "TrackingClick" t
      JOIN "Campaign" c ON c.id = t."campaignId"
      JOIN "Channel" ch ON ch.id = c."channelId"
      WHERE ch."ownerUserId" = ${req.user!.id}::uuid
        AND t.ts >= NOW() - ((${window_days + prev_days}::text) || ' days')::interval
    `;

    const clicksByMonth = await prisma.$queryRaw<{ month: string; valid: string }>`
      SELECT
        date_trunc('month', t.ts)::text AS month,
        SUM(CASE WHEN t."isValid" THEN 1 ELSE 0 END)::text AS valid
      FROM "TrackingClick" t
      JOIN "Campaign" c ON c.id = t."campaignId"
      JOIN "Channel" ch ON ch.id = c."channelId"
      WHERE ch."ownerUserId" = ${req.user!.id}::uuid
        AND t.ts >= date_trunc('month', NOW()) - INTERVAL '11 months'
      GROUP BY 1
      ORDER BY 1 ASC
    `;
    const rowE = earnings.rows[0] ?? { earnings: "0", earningsPrev: "0" };
    const rowC = counts.rows[0] ?? {
      published: "0",
      completed: "0",
      upcoming: "0",
      totalWindow: "0",
      publishedWindow: "0",
    };
    const rowT = clickStats.rows[0] ?? { clicks: "0", valid: "0", invalid: "0", clicksPrev: "0", validPrev: "0", invalidPrev: "0" };
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
    let impressions = 0;
    let impressionsPrev = 0;
    try {
      const views = await prisma.$queryRaw<{ views: string; viewsPrev: string }>`
        SELECT
          COALESCE(SUM(CASE WHEN e.ts >= NOW() - (${window_days}::text || ' days')::interval AND e.type = 'VIEW' THEN 1 ELSE 0 END), 0)::text AS views,
          COALESCE(SUM(CASE WHEN e.ts >= NOW() - ((${window_days + prev_days}::text) || ' days')::interval AND e.ts < NOW() - (${window_days}::text || ' days')::interval AND e.type = 'VIEW' THEN 1 ELSE 0 END), 0)::text AS "viewsPrev"
        FROM "TrackingEvent" e
        JOIN "Campaign" c ON c.id = e."campaignId"
        JOIN "Channel" ch ON ch.id = c."channelId"
        WHERE ch."ownerUserId" = ${req.user!.id}::uuid
          AND e.ts >= NOW() - ((${window_days + prev_days}::text) || ' days')::interval
      `;
      impressions = Number(views.rows[0]?.views ?? 0);
      impressionsPrev = Number(views.rows[0]?.viewsPrev ?? 0);
    } catch {}

    const channels = await prisma.$queryRaw<{ avgPrice: string; audience: string }>`
      SELECT
        COALESCE(AVG("pricePerPost"), 0)::text AS "avgPrice",
        COALESCE(SUM("audienceSize"), 0)::text AS audience
      FROM "Channel"
      WHERE "ownerUserId" = ${req.user!.id}::uuid
    `;

    const clicksCur = Number(rowT.clicks ?? 0);
    const validCur = Number(rowT.valid ?? 0);
    const clicksPrev = Number(rowT.clicksPrev ?? 0);
    const validPrev = Number(rowT.validPrev ?? 0);
    const ctr = clicksCur ? Number(((validCur / clicksCur) * 100).toFixed(1)) : 0;
    const ctrPrev = clicksPrev ? Number(((validPrev / clicksPrev) * 100).toFixed(1)) : 0;

    const totalWindow = Number(rowC.totalWindow ?? 0);
    const publishedWindow = Number(rowC.publishedWindow ?? 0);
    const fillRate = totalWindow ? Number(((publishedWindow / totalWindow) * 100).toFixed(1)) : 0;

    const chRow = channels.rows[0] ?? { avgPrice: "0", audience: "0" };

    return res.status(200).json({
      window_days,
      earnings: Number(rowE.earnings ?? 0),
      earnings_prev: Number(rowE.earningsPrev ?? 0),
      published: Number(rowC.published ?? 0),
      completed: Number(rowC.completed ?? 0),
      upcoming: Number(rowC.upcoming ?? 0),
      publications: publishedWindow,
      fill_rate: fillRate,
      ctr_avg: ctr,
      clicks: clicksCur,
      clicks_prev: clicksPrev,
      impressions,
      impressions_prev: impressionsPrev,
      avg_price: Number(chRow.avgPrice ?? 0),
      total_audience: Number(chRow.audience ?? 0),
      ctr_prev: ctrPrev,
      clicksByMonth: series,
    });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/creator/events", authRequired, requireRole("CHANNEL_ADMIN"), async (req, res) => {
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
      WHERE ("entityType" = 'Channel' AND "entityId" IN (
              SELECT id FROM "Channel" WHERE "ownerUserId" = ${req.user!.id}::uuid
            ))
         OR ("entityType" = 'Campaign' AND "entityId" IN (
              SELECT id FROM "Campaign" WHERE "channelId" IN (
                SELECT id FROM "Channel" WHERE "ownerUserId" = ${req.user!.id}::uuid
              )
            ))
         OR ("entityType" = 'Payment' AND "entityId" IN (
              SELECT id FROM "Payment" WHERE "campaignId" IN (
                SELECT id FROM "Campaign" WHERE "channelId" IN (
                  SELECT id FROM "Channel" WHERE "ownerUserId" = ${req.user!.id}::uuid
                )
              )
            ))
      ORDER BY "ts" DESC
      LIMIT 20
    `;
    return res.status(200).json(rows.rows);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/creator/publications", authRequired, requireRole("CHANNEL_ADMIN"), async (req, res) => {
  try {
    const rows = await prisma.$queryRaw<{
      campaignId: string;
      channelId: string;
      when: string | null;
      channel: string;
      platform: string;
      status: string;
    }>`
      SELECT
        c.id::text AS "campaignId",
        ch.id::text AS "channelId",
        COALESCE(c."scheduledAt", c."startAt") AS when,
        ch.name AS channel,
        ch.platform::text AS platform,
        c.status::text AS status
      FROM "Campaign" c
      JOIN "Channel" ch ON ch.id = c."channelId"
      WHERE ch."ownerUserId" = ${req.user!.id}::uuid
        AND (
          c.status = 'READY'::"CampaignStatus"
          OR c.status = 'SUBMITTED'::"CampaignStatus"
          OR c.status = 'PAID'::"CampaignStatus"
          OR c.status = 'PUBLISHED'::"CampaignStatus"
        )
      ORDER BY COALESCE(c."scheduledAt", c."startAt") NULLS LAST
      LIMIT 12
    `;
    return res.status(200).json(rows.rows);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/creator/inbox", authRequired, requireRole("CHANNEL_ADMIN"), async (req, res) => {
  try {
    const rows = await prisma.$queryRaw<{
      id: string;
      status: string;
      createdAt: string;
      scheduledAt: string | null;
      destinationUrl: string;
      copyText: string;
      channelId: string;
      channelName: string;
      platform: string;
      category: string;
      audienceSize: number;
      pricePerPost: number;
      advertiserEmail: string;
    }>`
      SELECT
        c.id::text AS id,
        c.status::text AS status,
        c."createdAt" AS "createdAt",
        c."scheduledAt" AS "scheduledAt",
        c."destinationUrl" AS "destinationUrl",
        c."copyText" AS "copyText",
        ch.id::text AS "channelId",
        ch.name AS "channelName",
        ch.platform::text AS platform,
        ch.category AS category,
        ch."audienceSize" AS "audienceSize",
        ch."pricePerPost" AS "pricePerPost",
        u.email AS "advertiserEmail"
      FROM "Campaign" c
      JOIN "Channel" ch ON ch.id = c."channelId"
      JOIN "User" u ON u.id = c."advertiserUserId"
      WHERE ch."ownerUserId" = ${req.user!.id}::uuid
        AND c.status <> 'DRAFT'::"CampaignStatus"
      ORDER BY c."createdAt" DESC
      LIMIT 50
    `;
    return res.status(200).json(rows.rows);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/creator/campaigns/:id", authRequired, requireRole("CHANNEL_ADMIN"), async (req, res) => {
  const parsed = z.object({ id: z.string().uuid() }).safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid id", issues: parsed.error.flatten() });
  }
  const { id } = parsed.data;
  try {
    const result = await prisma.$queryRaw<{
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
    }>`
      SELECT
        c.id::text AS id,
        c.status::text AS status,
        c."createdAt" AS "createdAt",
        c."scheduledAt" AS "scheduledAt",
        c."startAt" AS "startAt",
        c."endAt" AS "endAt",
        c."publishedAt" AS "publishedAt",
        c."destinationUrl" AS "destinationUrl",
        c."copyText" AS "copyText",
        ch.id::text AS "channelId",
        ch.name AS "channelName",
        ch.platform::text AS platform,
        ch.category AS category,
        ch."audienceSize" AS "audienceSize",
        ch."pricePerPost" AS "pricePerPost",
        u.email AS "advertiserEmail"
      FROM "Campaign" c
      JOIN "Channel" ch ON ch.id = c."channelId"
      JOIN "User" u ON u.id = c."advertiserUserId"
      WHERE c.id = ${id}::uuid
        AND ch."ownerUserId" = ${req.user!.id}::uuid
      LIMIT 1
    `;
    const row = result.rows[0];
    if (!row) return res.status(404).json({ message: "Campaign not found" });
    return res.status(200).json(row);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/creator/inbox/:id/accept", authRequired, requireRole("CHANNEL_ADMIN"), async (req, res) => {
  const parsed = z.object({ id: z.string().uuid() }).safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid id", issues: parsed.error.flatten() });
  }
  const { id } = parsed.data;
  try {
    const updated = await prisma.$queryRaw<{ id: string; scheduledAt: string | null; status: string }>`
      UPDATE "Campaign" c
      SET "scheduledAt" = COALESCE(c."scheduledAt", date_trunc('hour', NOW() + INTERVAL '24 hours'))
      FROM "Channel" ch
      WHERE c."channelId" = ch.id
        AND c.id = ${id}::uuid
        AND ch."ownerUserId" = ${req.user!.id}::uuid
        AND c.status <> 'DRAFT'::"CampaignStatus"
      RETURNING c.id::text AS id, c."scheduledAt" AS "scheduledAt", c.status::text AS status
    `;
    const row = updated.rows[0];
    if (!row) return res.status(404).json({ message: "Campaign not found" });
    try {
      await prisma.$queryRaw`
        INSERT INTO "AuditLog"("actorUserId","entityType","entityId","action","meta")
        VALUES (${req.user!.id}::uuid, 'Campaign', ${id}::uuid, 'CREATOR_ACCEPT', ${JSON.stringify({ scheduledAt: row.scheduledAt })})
      `;
    } catch {}
    return res.status(200).json({ accepted: true, scheduledAt: row.scheduledAt, status: row.status });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/creator/inbox/:id/reject", authRequired, requireRole("CHANNEL_ADMIN"), async (req, res) => {
  const parsed = z.object({ id: z.string().uuid() }).safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid id", issues: parsed.error.flatten() });
  }
  const reasonParsed = z.object({ reason: z.string().max(500).optional() }).safeParse(req.body);
  const reason = reasonParsed.success ? reasonParsed.data.reason : undefined;
  const { id } = parsed.data;
  try {
    const updated = await prisma.$queryRaw<{ id: string; status: string }>`
      UPDATE "Campaign" c
      SET status = 'DISPUTED'::"CampaignStatus"
      FROM "Channel" ch
      WHERE c."channelId" = ch.id
        AND c.id = ${id}::uuid
        AND ch."ownerUserId" = ${req.user!.id}::uuid
        AND c.status <> 'DRAFT'::"CampaignStatus"
      RETURNING c.id::text AS id, c.status::text AS status
    `;
    const row = updated.rows[0];
    if (!row) return res.status(404).json({ message: "Campaign not found" });
    try {
      await prisma.$queryRaw`
        INSERT INTO "AuditLog"("actorUserId","entityType","entityId","action","meta")
        VALUES (${req.user!.id}::uuid, 'Campaign', ${id}::uuid, 'CREATOR_REJECT', ${JSON.stringify({ reason: reason ?? null })})
      `;
    } catch {}
    return res.status(200).json({ rejected: true, status: row.status });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

const creatorPublishSchema = z
  .object({
    startAt: z.string().datetime().optional(),
    endAt: z.string().datetime().optional(),
  })
  .optional();

router.post("/creator/inbox/:id/confirm-published", authRequired, requireRole("CHANNEL_ADMIN"), async (req, res) => {
  const parsed = z.object({ id: z.string().uuid() }).safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid id", issues: parsed.error.flatten() });
  }
  const bodyParsed = creatorPublishSchema?.safeParse(req.body);
  if (bodyParsed && !bodyParsed.success) {
    return res.status(400).json({ message: "Invalid body", issues: bodyParsed.error.flatten() });
  }

  const { id } = parsed.data;
  const startAtRaw = bodyParsed?.success ? bodyParsed.data?.startAt : undefined;
  const endAtRaw = bodyParsed?.success ? bodyParsed.data?.endAt : undefined;

  try {
    const ownRes = await prisma.$queryRaw<{ ownerUserId: string; status: string; scheduledAt: string | null; endAt: string | null }>`
      SELECT
        ch."ownerUserId"::text AS "ownerUserId",
        c.status::text AS status,
        c."scheduledAt" AS "scheduledAt",
        c."endAt" AS "endAt"
      FROM "Campaign" c
      JOIN "Channel" ch ON ch.id = c."channelId"
      WHERE c.id = ${id}::uuid
      LIMIT 1
    `;
    const row = ownRes.rows[0];
    if (!row) return res.status(404).json({ message: "Campaign not found" });
    if (row.ownerUserId !== req.user!.id) return res.status(403).json({ message: "Forbidden" });
    if (!(row.status === "SUBMITTED" || row.status === "PAID" || row.status === "READY")) {
      return res.status(400).json({ message: `Invalid status ${row.status} to publish` });
    }

    const payRes = await prisma.$queryRaw<{ status: string | null }>`
      SELECT p.status::text AS status
      FROM "Payment" p
      WHERE p."campaignId" = ${id}::uuid
      LIMIT 1
    `;
    const payStatus = payRes.rows[0]?.status ?? null;
    if (payStatus !== "SUCCEEDED") {
      return res.status(400).json({ message: "Payment not succeeded" });
    }

    const minStart = Date.now() + 35 * 60 * 1000;
    const preferredStart = startAtRaw ?? row.scheduledAt ?? null;
    let startAtMs = preferredStart ? new Date(preferredStart).getTime() : Number.NaN;
    if (Number.isNaN(startAtMs) || startAtMs < minStart) startAtMs = minStart;

    const preferredEnd = endAtRaw ?? row.endAt ?? null;
    let endAtMs = preferredEnd ? new Date(preferredEnd).getTime() : Number.NaN;
    if (Number.isNaN(endAtMs) || endAtMs <= startAtMs) endAtMs = startAtMs + 24 * 60 * 60 * 1000;
    const maxWindowMs = 14 * 24 * 60 * 60 * 1000;
    if (endAtMs - startAtMs > maxWindowMs) endAtMs = startAtMs + maxWindowMs;

    const startAt = new Date(startAtMs).toISOString();
    const endAt = new Date(endAtMs).toISOString();

    const updated = await prisma.$queryRaw<{ id: string; status: string; startAt: string | null; endAt: string | null }>`
      UPDATE "Campaign"
      SET
        "startAt" = ${startAt}::timestamptz,
        "endAt" = ${endAt}::timestamptz,
        status = 'PUBLISHED'::"CampaignStatus"
      WHERE id = ${id}::uuid
        AND "channelId" IN (
          SELECT id
          FROM "Channel"
          WHERE "ownerUserId" = ${req.user!.id}::uuid
        )
      RETURNING id::text AS id, status::text AS status, "startAt" AS "startAt", "endAt" AS "endAt"
    `;
    const out = updated.rows[0];
    if (!out) return res.status(404).json({ message: "Campaign not found" });

    try {
      await prisma.$queryRaw`
        INSERT INTO "AuditLog"("actorUserId","entityType","entityId","action","meta")
        VALUES (${req.user!.id}::uuid, 'Campaign', ${id}::uuid, 'CREATOR_CONFIRM_PUBLISH', ${JSON.stringify({ startAt, endAt })})
      `;
    } catch {}

    return res.status(200).json(out);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/creator/channel-metrics", authRequired, requireRole("CHANNEL_ADMIN"), async (req, res) => {
  const parsedQuery = z
    .object({ window_days: z.coerce.number().optional() })
    .safeParse(req.query);
  const windowDaysRaw = parsedQuery.success ? parsedQuery.data.window_days : undefined;
  const window_days = windowDaysRaw === 7 || windowDaysRaw === 90 ? windowDaysRaw : 30;
  try {
    const clicks = await prisma.$queryRaw<{ channelId: string; clicks: string; valid: string }>`
      SELECT
        ch.id::text AS "channelId",
        COALESCE(COUNT(t.*), 0)::text AS clicks,
        COALESCE(SUM(CASE WHEN t."isValid" THEN 1 ELSE 0 END), 0)::text AS valid
      FROM "Channel" ch
      LEFT JOIN "Campaign" c ON c."channelId" = ch.id
      LEFT JOIN "TrackingClick" t ON t."campaignId" = c.id AND t.ts >= NOW() - (${window_days}::text || ' days')::interval
      WHERE ch."ownerUserId" = ${req.user!.id}::uuid
      GROUP BY ch.id
    `;

    let viewsMap = new Map<string, number>();
    try {
      const views = await prisma.$queryRaw<{ channelId: string; views: string }>`
        SELECT
          ch.id::text AS "channelId",
          COALESCE(SUM(CASE WHEN e.type = 'VIEW' THEN 1 ELSE 0 END), 0)::text AS views
        FROM "Channel" ch
        LEFT JOIN "Campaign" c ON c."channelId" = ch.id
        LEFT JOIN "TrackingEvent" e ON e."campaignId" = c.id AND e.ts >= NOW() - (${window_days}::text || ' days')::interval
        WHERE ch."ownerUserId" = ${req.user!.id}::uuid
        GROUP BY ch.id
      `;
      viewsMap = new Map((views.rows ?? []).map((r) => [r.channelId, Number(r.views ?? 0)]));
    } catch {}

    const payload = (clicks.rows ?? []).map((r) => {
      const clicksCur = Number(r.clicks ?? 0);
      const validCur = Number(r.valid ?? 0);
      const ctr = clicksCur ? Number(((validCur / clicksCur) * 100).toFixed(1)) : 0;
      const impressions = viewsMap.get(r.channelId) ?? 0;
      return { channelId: r.channelId, clicks: clicksCur, impressions, ctr };
    });
    return res.status(200).json({ window_days, items: payload });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/creator/billing/summary", authRequired, requireRole("CHANNEL_ADMIN"), async (req, res) => {
  const parsed = z
    .object({
      window_days: z.coerce.number().optional(),
      limit: z.coerce.number().optional(),
    })
    .safeParse(req.query);
  const windowDaysRaw = parsed.success ? parsed.data.window_days : undefined;
  const window_days = windowDaysRaw === 7 || windowDaysRaw === 90 ? windowDaysRaw : 30;
  const limitRaw = parsed.success ? parsed.data.limit : undefined;
  const limit = Math.max(1, Math.min(10, Number(limitRaw ?? 5)));

  try {
    const earnings = await prisma.$queryRaw<{ earnings: string }>`
      SELECT COALESCE(SUM(p.amount), 0)::text AS earnings
      FROM "Payment" p
      JOIN "Campaign" c ON c.id = p."campaignId"
      JOIN "Channel" ch ON ch.id = c."channelId"
      WHERE ch."ownerUserId" = ${req.user!.id}::uuid
        AND p.status = 'SUCCEEDED'::"PaymentStatus"
        AND p."createdAt" >= NOW() - (${window_days}::text || ' days')::interval
    `;

    const inv = await prisma.$queryRaw<{ id: string; amount: number; currency: string; status: string; createdAt: string }>`
      SELECT
        p.id::text AS id,
        p.amount,
        p.currency,
        p.status::text AS status,
        p."createdAt" AS "createdAt"
      FROM "Payment" p
      JOIN "Campaign" c ON c.id = p."campaignId"
      JOIN "Channel" ch ON ch.id = c."channelId"
      WHERE ch."ownerUserId" = ${req.user!.id}::uuid
      ORDER BY p."createdAt" DESC
      LIMIT ${limit}
    `;

    const earningsRow = earnings.rows[0] ?? { earnings: "0" };
    const invoices = (inv.rows ?? []).map((r) => ({
      code: `INV-${String(r.id ?? "").slice(0, 6).toUpperCase()}`,
      amount: r.amount ?? 0,
      currency: r.currency ?? "USD",
      status: r.status ?? "UNKNOWN",
      createdAt: r.createdAt ?? "",
    }));

    return res.status(200).json({
      window_days,
      earnings: Number(earningsRow.earnings ?? 0),
      pending_payouts: 0,
      invoices,
    });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

const payoutSchema = z.object({
  method: z.enum(["bank", "stripe"]),
  identifier: z.string().min(1).max(200),
});

router.get("/creator/payout-config", authRequired, requireRole("CHANNEL_ADMIN"), async (req, res) => {
  try {
    const result = await prisma.$queryRaw<{ method: string; identifier: string; updatedAt: string }>`
      SELECT method::text AS method, identifier, "updatedAt" AS "updatedAt"
      FROM "PayoutConfig"
      WHERE "userId" = ${req.user!.id}::uuid
      LIMIT 1
    `;
    const row = result.rows[0];
    if (!row) {
      return res.status(404).json({ message: "Not configured" });
    }
    return res.status(200).json({ method: row.method, identifier: row.identifier, updatedAt: row.updatedAt });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/creator/payout-config", authRequired, requireRole("CHANNEL_ADMIN"), async (req, res) => {
  const parsed = payoutSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input", issues: parsed.error.flatten() });
  }
  const method = parsed.data.method.toUpperCase() === "STRIPE" ? "STRIPE" : "BANK";
  try {
    await prisma.$queryRaw`
      INSERT INTO "PayoutConfig"("userId","method","identifier","updatedAt")
      VALUES (${req.user!.id}::uuid, ${method}::"PayoutMethod", ${parsed.data.identifier}, NOW())
      ON CONFLICT ("userId") DO UPDATE SET
        "method" = EXCLUDED."method",
        "identifier" = EXCLUDED."identifier",
        "updatedAt" = NOW()
    `;
    try {
      await prisma.$queryRaw`
        INSERT INTO "AuditLog"("actorUserId","entityType","entityId","action","meta")
        VALUES (${req.user!.id}::uuid, 'User', ${req.user!.id}::uuid, 'PAYOUT_CONFIG_SET', ${JSON.stringify(parsed.data)})
      `;
    } catch {}
    return res.status(200).json({ saved: true });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

const scheduleSchema = z.object({
  campaignId: z.string().uuid(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
});

router.post("/creator/schedule-proposal", authRequired, requireRole("CHANNEL_ADMIN"), async (req, res) => {
  const parsed = scheduleSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input", issues: parsed.error.flatten() });
  }
  const { campaignId, startAt, endAt } = parsed.data;
  try {
    const ownRes = await prisma.$queryRaw<{ ownerUserId: string }>`
      SELECT ch."ownerUserId"::text AS "ownerUserId"
      FROM "Campaign" c
      JOIN "Channel" ch ON ch.id = c."channelId"
      WHERE c.id = ${campaignId}::uuid
      LIMIT 1
    `;
    const ownerUserId = ownRes.rows[0]?.ownerUserId;
    if (!ownerUserId) {
      return res.status(404).json({ message: "Campaign not found" });
    }
    if (ownerUserId !== req.user!.id) {
      return res.status(403).json({ message: "Forbidden" });
    }
    await prisma.$queryRaw`
      UPDATE "Campaign"
      SET "scheduledAt" = ${startAt}::timestamptz, "endAt" = ${endAt}::timestamptz
      WHERE id = ${campaignId}::uuid
    `;
    try {
      await prisma.$queryRaw`
        INSERT INTO "AuditLog"("actorUserId","entityType","entityId","action","meta")
        VALUES (${req.user!.id}::uuid, 'Campaign', ${campaignId}::uuid, 'SCHEDULE_PROPOSAL', ${JSON.stringify({ startAt, endAt })})
      `;
    } catch {}
    return res.status(200).json({ accepted: true, scheduledAt: startAt });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});
const activateSchema = z.object({
  platform: z.enum(["TELEGRAM", "DISCORD", "WHATSAPP"]),
  channelRef: z.string().min(1),
  userRef: z.string().min(1),
});

router.post("/channels/:id/activate", authRequired, requireRole("CHANNEL_ADMIN"), async (req, res) => {
  const rate = checkRate(req.user!.id, 10, 60);
  if (!rate.allowed) {
    return res.status(429).json({ message: "Rate limit exceeded", retry_after_seconds: rate.retryAfter });
  }
  const parsed = activateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input", issues: parsed.error.flatten() });
  }
  const { id } = req.params;
  try {
    const result = await prisma.$queryRaw<{
      ownerUserId: string;
      status: "PENDING" | "ACTIVE" | "SUSPENDED";
      platform: "TELEGRAM";
      name: string;
    }>`
      SELECT "ownerUserId"::text AS "ownerUserId", status::text AS status, platform::text AS platform, name
      FROM "Channel"
      WHERE id = ${id}::uuid
      LIMIT 1
    `;
    const channel = result.rows[0];
    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }
    if (channel.ownerUserId !== req.user!.id) {
      return res.status(403).json({ message: "Forbidden" });
    }
    if (channel.status !== "PENDING") {
      return res.status(400).json({ message: "Channel not in pending status" });
    }

    const provider = getProviderByName(parsed.data.platform);
    if (!provider) {
      return res.status(400).json({ message: "Provider not available" });
    }
    if (provider.capabilities.supportsChannelOwnershipCheck) {
      const verified = await provider.verifyChannelOwnership({
        channelRef: parsed.data.channelRef,
        userRef: parsed.data.userRef,
      });
      if (!verified) {
        return res.status(400).json({ message: "Ownership not verified" });
      }
    }

    const updated = await prisma.$queryRaw<{
      id: string;
      ownerUserId: string;
      platform: string;
      platformRef: string | null;
      platformUserRef: string | null;
      name: string;
      category: string;
      audienceSize: number;
      engagementHint: string;
      pricePerPost: number;
      status: "PENDING" | "ACTIVE" | "SUSPENDED";
      createdAt: string;
    }>`
      UPDATE "Channel"
      SET
        status = 'ACTIVE'::"ChannelStatus",
        "platformRef" = ${parsed.data.channelRef},
        "platformUserRef" = ${parsed.data.userRef}
      WHERE id = ${id}::uuid
      RETURNING
        id::text,
        "ownerUserId"::text,
        platform::text,
        "platformRef",
        "platformUserRef",
        name,
        category,
        "audienceSize",
        "engagementHint",
        "pricePerPost",
        status::text,
        "createdAt"
    `;

    try {
      await prisma.$queryRaw`
        INSERT INTO "AuditLog"("actorUserId","entityType","entityId","action","meta")
        VALUES (${req.user!.id}::uuid, 'Channel', ${id}::uuid, 'ACTIVATE', ${JSON.stringify({ platform: parsed.data.platform, channelRef: parsed.data.channelRef, userRef: parsed.data.userRef })})
      `;
    } catch {}

    return res.status(200).json(updated.rows[0]);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/channels/:id/metrics", authRequired, async (req, res) => {
  const { id } = req.params;
  try {
    const totals = await prisma.$queryRaw<{ total: number; valid: number; invalid: number }>`
      SELECT
        COUNT(*)::int AS total,
        SUM(CASE WHEN t."isValid" = true THEN 1 ELSE 0 END)::int AS valid,
        SUM(CASE WHEN t."isValid" = false THEN 1 ELSE 0 END)::int AS invalid
      FROM "TrackingClick" t
      JOIN "Campaign" c ON c."id" = t."campaignId"
      WHERE c."channelId" = ${id}::uuid
        AND t.ts >= NOW() - INTERVAL '30 days'
    `;
    const byCampaign = await prisma.$queryRaw<{ campaignId: string; valid: number }>`
      SELECT t."campaignId"::text AS "campaignId", SUM(CASE WHEN t."isValid" = true THEN 1 ELSE 0 END)::int AS valid
      FROM "TrackingClick" t
      JOIN "Campaign" c ON c."id" = t."campaignId"
      WHERE c."channelId" = ${id}::uuid
        AND t.ts >= NOW() - INTERVAL '30 days'
      GROUP BY t."campaignId"
      ORDER BY valid DESC
    `;
    const byHour = await prisma.$queryRaw<{ hour: number; valid: number; total: number }>`
      SELECT
        EXTRACT(HOUR FROM t.ts)::int AS hour,
        SUM(CASE WHEN t."isValid" THEN 1 ELSE 0 END)::int AS valid,
        COUNT(*)::int AS total
      FROM "TrackingClick" t
      JOIN "Campaign" c ON c."id" = t."campaignId"
      WHERE c."channelId" = ${id}::uuid
        AND t.ts >= NOW() - INTERVAL '30 days'
      GROUP BY hour
      ORDER BY hour ASC
    `;
    const byDow = await prisma.$queryRaw<{ dow: number; valid: number; total: number }>`
      SELECT
        EXTRACT(DOW FROM t.ts)::int AS dow,
        SUM(CASE WHEN t."isValid" THEN 1 ELSE 0 END)::int AS valid,
        COUNT(*)::int AS total
      FROM "TrackingClick" t
      JOIN "Campaign" c ON c."id" = t."campaignId"
      WHERE c."channelId" = ${id}::uuid
        AND t.ts >= NOW() - INTERVAL '30 days'
      GROUP BY dow
      ORDER BY dow ASC
    `;
    const activeByHour = await prisma.$queryRaw<{ hour: number; users: number }>`
      SELECT
        EXTRACT(HOUR FROM t.ts)::int AS hour,
        COUNT(DISTINCT (t.ip || '|' || t."userAgent"))::int AS users
      FROM "TrackingClick" t
      JOIN "Campaign" c ON c."id" = t."campaignId"
      WHERE c."channelId" = ${id}::uuid
        AND t.ts >= NOW() - INTERVAL '30 days'
        AND t."isValid" = true
      GROUP BY hour
      ORDER BY hour ASC
    `;
    const activeByDow = await prisma.$queryRaw<{ dow: number; users: number }>`
      SELECT
        EXTRACT(DOW FROM t.ts)::int AS dow,
        COUNT(DISTINCT (t.ip || '|' || t."userAgent"))::int AS users
      FROM "TrackingClick" t
      JOIN "Campaign" c ON c."id" = t."campaignId"
      WHERE c."channelId" = ${id}::uuid
        AND t.ts >= NOW() - INTERVAL '30 days'
        AND t."isValid" = true
      GROUP BY dow
      ORDER BY dow ASC
    `;
    const byReason = await prisma.$queryRaw<{ reason: string | null; count: number }>`
      SELECT "invalidReason"::text AS reason, COUNT(*)::int AS count
      FROM "TrackingClick" t
      JOIN "Campaign" c ON c."id" = t."campaignId"
      WHERE c."channelId" = ${id}::uuid
        AND t.ts >= NOW() - INTERVAL '30 days'
        AND t."isValid" = false
      GROUP BY reason
      ORDER BY count DESC
    `;
    return res.status(200).json({
      window_days: 30,
      total: Number(totals.rows[0]?.total ?? 0),
      valid: Number(totals.rows[0]?.valid ?? 0),
      invalid: Number(totals.rows[0]?.invalid ?? 0),
      top_campaigns: byCampaign.rows.map((r) => ({ campaignId: r.campaignId, valid: Number(r.valid) })),
      by_hour: byHour.rows.map((r) => ({ hour: r.hour, valid: Number(r.valid), total: Number(r.total) })),
      by_dow: byDow.rows.map((r) => ({ dow: r.dow, valid: Number(r.valid), total: Number(r.total) })),
      invalid_reasons: byReason.rows.map((r) => ({ reason: r.reason, count: Number(r.count) })),
      active_by_hour: activeByHour.rows.map((r) => ({ hour: r.hour, users: Number(r.users) })),
      active_by_dow: activeByDow.rows.map((r) => ({ dow: r.dow, users: Number(r.users) })),
    });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
