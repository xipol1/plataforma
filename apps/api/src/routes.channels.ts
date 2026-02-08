import { Router } from "express";

import { createChannelSchema, listChannelsQuerySchema, updateChannelSchema } from "./channels.schemas.js";
import { prisma } from "./lib/prisma.js";
import { authOptional, authRequired, requireRole } from "./middleware/auth.js";

const router = Router();

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

export default router;
