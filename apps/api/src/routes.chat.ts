import { Router } from "express";
import { z } from "zod";

import { prisma } from "./lib/prisma.js";
import { authRequired, requireRole } from "./middleware/auth.js";

const router = Router();

const uuidParamSchema = z.object({ campaignId: z.string().uuid() });

const createMessageSchema = z.object({
  body: z.string().min(1).max(2000),
});

const moderationQuerySchema = z.object({
  status: z.enum(["PENDING_REVIEW", "APPROVED", "REJECTED", "BLOCKED"]).optional(),
  limit: z.coerce.number().int().positive().max(100).default(30),
  offset: z.coerce.number().int().nonnegative().default(0),
});

const rejectSchema = z.object({
  reason: z.string().min(1).max(300).optional(),
});

function normalizeText(s: string) {
  return String(s ?? "").trim();
}

function detectOffPlatformSignals(body: string) {
  const text = body.toLowerCase();
  const matches: string[] = [];
  const patterns: Array<{ label: string; re: RegExp }> = [
    { label: "email", re: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i },
    { label: "phone", re: /(\+?\d[\d\s().-]{7,}\d)/ },
    { label: "url", re: /\bhttps?:\/\/\S+|\bwww\.\S+/i },
    { label: "telegram", re: /\b(t\.me\/|telegram|tg|@[\w\d_]{4,})\b/i },
    { label: "whatsapp", re: /\b(wa\.me\/|whatsapp|wsp)\b/i },
    { label: "instagram", re: /\b(instagram|ig\.com\/)\b/i },
    { label: "facebook", re: /\b(facebook|fb\.com\/)\b/i },
  ];

  for (const p of patterns) {
    if (p.re.test(text)) matches.push(p.label);
  }
  return { hasSignals: matches.length > 0, matches };
}

async function getChatContext(campaignId: string) {
  const campaignRes = await prisma.$queryRaw<{
    campaignId: string;
    advertiserUserId: string;
    ownerUserId: string;
    status: string;
  }>`
    SELECT
      c.id::text AS "campaignId",
      c."advertiserUserId"::text AS "advertiserUserId",
      ch."ownerUserId"::text AS "ownerUserId",
      c.status::text AS status
    FROM "Campaign" c
    JOIN "Channel" ch ON ch.id = c."channelId"
    WHERE c.id = ${campaignId}::uuid
    LIMIT 1
  `;
  const campaign = campaignRes.rows[0];
  if (!campaign) return { ok: false as const, code: "NOT_FOUND" as const };

  const payRes = await prisma.$queryRaw<{ status: string | null }>`
    SELECT p.status::text AS status
    FROM "Payment" p
    WHERE p."campaignId" = ${campaignId}::uuid
    LIMIT 1
  `;
  const paymentStatus = payRes.rows[0]?.status ?? null;

  const reqRes = await prisma.$queryRaw<{ count: string }>`
    SELECT COUNT(*)::text AS count
    FROM "AuditLog"
    WHERE "entityType" = 'Campaign'
      AND "entityId" = ${campaignId}::uuid
      AND action = 'SCHEDULE_REQUEST'
  `;
  const hasPublishRequest = Number(reqRes.rows[0]?.count ?? 0) > 0;

  return {
    ok: true as const,
    campaign,
    paymentStatus,
    hasPublishRequest,
  };
}

async function ensureConversation(campaignId: string) {
  const ctx = await getChatContext(campaignId);
  if (!ctx.ok) return ctx;

  if (ctx.paymentStatus !== "SUCCEEDED" || !ctx.hasPublishRequest) {
    return {
      ok: false as const,
      code: "CHAT_NOT_ENABLED" as const,
      requires: {
        payment_succeeded: ctx.paymentStatus === "SUCCEEDED",
        publish_requested: ctx.hasPublishRequest,
      },
    };
  }

  const inserted = await prisma.$queryRaw<{ id: string }>`
    INSERT INTO "ChatConversation"("campaignId","advertiserUserId","ownerUserId")
    VALUES (${campaignId}::uuid, ${ctx.campaign.advertiserUserId}::uuid, ${ctx.campaign.ownerUserId}::uuid)
    ON CONFLICT ("campaignId") DO UPDATE SET
      "advertiserUserId" = EXCLUDED."advertiserUserId",
      "ownerUserId" = EXCLUDED."ownerUserId"
    RETURNING id::text AS id
  `;
  if (inserted.rows[0]?.id) return { ok: true as const, conversationId: inserted.rows[0].id, ctx };

  const existing = await prisma.$queryRaw<{ id: string }>`
    SELECT id::text AS id
    FROM "ChatConversation"
    WHERE "campaignId" = ${campaignId}::uuid
    LIMIT 1
  `;
  const conversationId = existing.rows[0]?.id;
  if (!conversationId) return { ok: false as const, code: "INTERNAL" as const };
  return { ok: true as const, conversationId, ctx };
}

router.get("/chat/:campaignId/messages", authRequired, async (req, res) => {
  const parsed = uuidParamSchema.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid campaign id", issues: parsed.error.flatten() });
  }
  const { campaignId } = parsed.data;

  try {
    const ensured = await ensureConversation(campaignId);
    if (!ensured.ok) {
      if (ensured.code === "NOT_FOUND") return res.status(404).json({ message: "Campaign not found" });
      if (ensured.code === "CHAT_NOT_ENABLED") {
        return res.status(409).json({ message: "Chat no habilitado aún", code: ensured.code, requires: ensured.requires });
      }
      return res.status(500).json({ message: "Internal server error" });
    }

    const { ctx, conversationId } = ensured;
    const isOps = req.user!.role === "OPS";
    const isAdvertiser = ctx.campaign.advertiserUserId === req.user!.id;
    const isOwner = ctx.campaign.ownerUserId === req.user!.id;
    if (!isOps && !isAdvertiser && !isOwner) return res.status(403).json({ message: "Forbidden" });

    const rows = await prisma.$queryRaw<{
      id: string;
      conversationId: string;
      senderUserId: string;
      body: string;
      status: string;
      createdAt: string;
      reviewedAt: string | null;
      rejectionReason: string | null;
      flags: string | null;
    }>`
      SELECT
        m.id::text AS id,
        m."conversationId"::text AS "conversationId",
        m."senderUserId"::text AS "senderUserId",
        m.body,
        m.status::text AS status,
        m."createdAt" AS "createdAt",
        m."reviewedAt" AS "reviewedAt",
        m."rejectionReason" AS "rejectionReason",
        m.flags
      FROM "ChatMessage" m
      WHERE m."conversationId" = ${conversationId}::uuid
      ORDER BY m."createdAt" ASC
      LIMIT 200
    `;

    const visible = (rows.rows ?? []).filter((m) => {
      if (isOps) return true;
      if (m.senderUserId === req.user!.id) return true;
      return m.status === "APPROVED";
    });

    return res.status(200).json({
      enabled: true,
      conversationId,
      campaignId,
      myUserId: req.user!.id,
      items: visible,
    });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/chat/:campaignId/messages", authRequired, async (req, res) => {
  const parsed = uuidParamSchema.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid campaign id", issues: parsed.error.flatten() });
  }
  const bodyParsed = createMessageSchema.safeParse(req.body);
  if (!bodyParsed.success) {
    return res.status(400).json({ message: "Invalid input", issues: bodyParsed.error.flatten() });
  }

  const { campaignId } = parsed.data;
  const body = normalizeText(bodyParsed.data.body);

  try {
    const ensured = await ensureConversation(campaignId);
    if (!ensured.ok) {
      if (ensured.code === "NOT_FOUND") return res.status(404).json({ message: "Campaign not found" });
      if (ensured.code === "CHAT_NOT_ENABLED") {
        return res.status(409).json({ message: "Chat no habilitado aún", code: ensured.code, requires: ensured.requires });
      }
      return res.status(500).json({ message: "Internal server error" });
    }

    const { ctx, conversationId } = ensured;
    const isOps = req.user!.role === "OPS";
    const isAdvertiser = ctx.campaign.advertiserUserId === req.user!.id;
    const isOwner = ctx.campaign.ownerUserId === req.user!.id;
    if (!isOps && !isAdvertiser && !isOwner) return res.status(403).json({ message: "Forbidden" });

    const signals = detectOffPlatformSignals(body);
    const flags = JSON.stringify({ off_platform_signals: signals.matches });

    const ins = await prisma.$queryRaw<{ id: string; status: string; createdAt: string }>`
      INSERT INTO "ChatMessage" ("conversationId","senderUserId","body","status","flags")
      VALUES (
        ${conversationId}::uuid,
        ${req.user!.id}::uuid,
        ${body},
        'PENDING_REVIEW'::"ChatMessageStatus",
        ${flags}
      )
      RETURNING id::text AS id, status::text AS status, "createdAt" AS "createdAt"
    `;
    const row = ins.rows[0];
    return res.status(201).json({
      id: row.id,
      status: row.status,
      createdAt: row.createdAt,
      queued_for_review: true,
      flagged: signals.hasSignals,
      flags: signals.matches,
    });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/ops/chat/moderation", authRequired, requireRole("OPS"), async (req, res) => {
  const parsed = moderationQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid query", issues: parsed.error.flatten() });
  }
  const { status, limit, offset } = parsed.data;

  try {
    const values: unknown[] = [];
    const conditions: string[] = [];
    if (status) {
      values.push(status);
      conditions.push(`m.status = $${values.length}::"ChatMessageStatus"`);
    }
    values.push(limit);
    const limitParam = `$${values.length}`;
    values.push(offset);
    const offsetParam = `$${values.length}`;

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const q = `
      SELECT
        m.id::text AS id,
        m."conversationId"::text AS "conversationId",
        conv."campaignId"::text AS "campaignId",
        m."senderUserId"::text AS "senderUserId",
        us.email AS "senderEmail",
        uadv.email AS "advertiserEmail",
        uown.email AS "ownerEmail",
        m.body,
        m.flags,
        m.status::text AS status,
        m."createdAt" AS "createdAt",
        m."reviewedAt" AS "reviewedAt",
        m."rejectionReason" AS "rejectionReason"
      FROM "ChatMessage" m
      JOIN "ChatConversation" conv ON conv.id = m."conversationId"
      JOIN "User" us ON us.id = m."senderUserId"
      JOIN "User" uadv ON uadv.id = conv."advertiserUserId"
      JOIN "User" uown ON uown.id = conv."ownerUserId"
      ${where}
      ORDER BY m."createdAt" ASC
      LIMIT ${limitParam}
      OFFSET ${offsetParam}
    `;
    const rows = await prisma.$query(q, values);
    return res.status(200).json(rows.rows ?? []);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/ops/chat/moderation/:id/approve", authRequired, requireRole("OPS"), async (req, res) => {
  const parsed = z.object({ id: z.string().uuid() }).safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid id", issues: parsed.error.flatten() });
  }
  const { id } = parsed.data;
  try {
    const updated = await prisma.$queryRaw<{ id: string; status: string }>`
      UPDATE "ChatMessage"
      SET
        status = 'APPROVED'::"ChatMessageStatus",
        "reviewedByUserId" = ${req.user!.id}::uuid,
        "reviewedAt" = NOW(),
        "rejectionReason" = NULL
      WHERE id = ${id}::uuid
      RETURNING id::text AS id, status::text AS status
    `;
    const row = updated.rows[0];
    if (!row) return res.status(404).json({ message: "Message not found" });
    return res.status(200).json(row);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/ops/chat/moderation/:id/reject", authRequired, requireRole("OPS"), async (req, res) => {
  const parsed = z.object({ id: z.string().uuid() }).safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid id", issues: parsed.error.flatten() });
  }
  const bodyParsed = rejectSchema.safeParse(req.body);
  if (!bodyParsed.success) {
    return res.status(400).json({ message: "Invalid input", issues: bodyParsed.error.flatten() });
  }
  const { id } = parsed.data;
  try {
    const updated = await prisma.$queryRaw<{ id: string; status: string }>`
      UPDATE "ChatMessage"
      SET
        status = 'REJECTED'::"ChatMessageStatus",
        "reviewedByUserId" = ${req.user!.id}::uuid,
        "reviewedAt" = NOW(),
        "rejectionReason" = ${bodyParsed.data.reason ?? "Rechazado por política de plataforma"}
      WHERE id = ${id}::uuid
      RETURNING id::text AS id, status::text AS status
    `;
    const row = updated.rows[0];
    if (!row) return res.status(404).json({ message: "Message not found" });
    return res.status(200).json(row);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
