import { Router } from "express";
import { z } from "zod";

import { createChannelSchema, listChannelsQuerySchema, updateChannelSchema } from "./channels.schemas.js";
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
        "createdAt"::text
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

  const { category, min_price, max_price, min_audience, limit, offset } = parsed.data;
  const conditions: string[] = ['status = \'ACTIVE\'::"ChannelStatus"'];
  const values: unknown[] = [];

  if (category) {
    values.push(category);
    conditions.push(`category = $${values.length}`);
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
      "createdAt"::text
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
      platform: "TELEGRAM";
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
        "createdAt"::text
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
      "createdAt"::text
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

const activateSchema = z.object({
  platform: z.literal("TELEGRAM"),
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
    if (!provider.capabilities.supportsChannelOwnershipCheck) {
      return res.status(400).json({ message: "Ownership check not supported" });
    }

    const verified = await provider.verifyChannelOwnership({
      channelRef: parsed.data.channelRef,
      userRef: parsed.data.userRef,
    });
    if (!verified) {
      return res.status(400).json({ message: "Ownership not verified" });
    }

    const updated = await prisma.$queryRaw<{
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
      UPDATE "Channel"
      SET status = 'ACTIVE'::"ChannelStatus"
      WHERE id = ${id}::uuid
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
        "createdAt"::text
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
    return res.status(200).json({
      window_days: 30,
      total: Number(totals.rows[0]?.total ?? 0),
      valid: Number(totals.rows[0]?.valid ?? 0),
      invalid: Number(totals.rows[0]?.invalid ?? 0),
      top_campaigns: byCampaign.rows.map((r) => ({ campaignId: r.campaignId, valid: Number(r.valid) })),
    });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
