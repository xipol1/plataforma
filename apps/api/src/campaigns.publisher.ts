import { prisma } from "./lib/prisma.js";
import { getProviderByName } from "./providers.js";

function getPublicApiBaseUrl() {
  const fromEnv = process.env.PUBLIC_API_URL ?? process.env.API_PUBLIC_URL ?? "";
  if (fromEnv) return fromEnv.replace(/\/+$/, "");
  const port = Number(process.env.PORT_API ?? process.env.API_PORT ?? 4000);
  return `http://localhost:${port}`;
}

export function startCampaignPublisher() {
  const pollMs = Math.max(2_000, Number(process.env.PUBLISHER_POLL_MS ?? 15_000));
  const maxBatch = Math.max(1, Math.min(25, Number(process.env.PUBLISHER_BATCH ?? 10)));
  const publicApiBaseUrl = getPublicApiBaseUrl();

  async function tick() {
    try {
      const due = await prisma.$queryRaw<{
        id: string;
        copyText: string;
        channelId: string;
        channelName: string;
        platformRef: string | null;
        platform: string;
      }>`
        SELECT
          c.id::text AS id,
          c."copyText" AS "copyText",
          c."channelId"::text AS "channelId",
          ch.name AS "channelName",
          ch."platformRef" AS "platformRef",
          ch.platform::text AS platform
        FROM "Campaign" c
        JOIN "Channel" ch ON ch.id = c."channelId"
        WHERE c.status = 'PUBLISHED'::"CampaignStatus"
          AND c."publishedAt" IS NULL
          AND c."startAt" IS NOT NULL
          AND c."endAt" IS NOT NULL
          AND c."startAt" <= NOW()
          AND c."endAt" > NOW()
          AND ch.status = 'ACTIVE'::"ChannelStatus"
        ORDER BY c."startAt" ASC
        LIMIT ${maxBatch}
      `;

      for (const row of due.rows ?? []) {
        if (row.platform !== "TELEGRAM") {
          try {
            const already = await prisma.$queryRaw<{ count: string }>`
              SELECT COUNT(*)::text AS count
              FROM "AuditLog"
              WHERE "entityType" = 'Campaign' AND "entityId" = ${row.id}::uuid AND action = 'PUBLISH_MANUAL_REQUIRED'
            `;
            const has = Number(already.rows[0]?.count ?? 0) > 0;
            if (!has) {
              await prisma.$queryRaw`
                INSERT INTO "AuditLog"("actorUserId","entityType","entityId","action","meta")
                VALUES (NULL, 'Campaign', ${row.id}::uuid, 'PUBLISH_MANUAL_REQUIRED', ${JSON.stringify({ platform: row.platform, channelId: row.channelId })})
              `;
            }
          } catch {}
          continue;
        }
        if (!row.platformRef) {
          try {
            await prisma.$queryRaw`
              INSERT INTO "AuditLog"("actorUserId","entityType","entityId","action","meta")
              VALUES (NULL, 'Campaign', ${row.id}::uuid, 'PUBLISH_FAILED', ${JSON.stringify({ reason: "MISSING_PLATFORM_REF", channelId: row.channelId })})
            `;
          } catch {}
          continue;
        }

        const provider = getProviderByName("TELEGRAM");
        if (!provider?.capabilities.supportsMessageSend) continue;

        const trackingUrl = `${publicApiBaseUrl}/r/${row.id}`;
        const text = `${row.copyText}\n\n${trackingUrl}`;

        const sent = await provider.sendMessage({ channelRef: row.platformRef, text });
        if (!sent.ok) {
          try {
            await prisma.$queryRaw`
              INSERT INTO "AuditLog"("actorUserId","entityType","entityId","action","meta")
              VALUES (NULL, 'Campaign', ${row.id}::uuid, 'PUBLISH_FAILED', ${JSON.stringify({ reason: "PROVIDER_SEND_FAILED", channelId: row.channelId })})
            `;
          } catch {}
          continue;
        }

        const updated = await prisma.$queryRaw`
          UPDATE "Campaign"
          SET "publishedAt" = NOW()
          WHERE id = ${row.id}::uuid
            AND "publishedAt" IS NULL
        `;
        if ((updated.rowCount ?? 0) > 0) {
          try {
            await prisma.$queryRaw`
              INSERT INTO "AuditLog"("actorUserId","entityType","entityId","action","meta")
              VALUES (NULL, 'Campaign', ${row.id}::uuid, 'PUBLISH_SENT', ${JSON.stringify({ provider: "TELEGRAM", providerRef: sent.providerRef ?? null, channelId: row.channelId })})
            `;
          } catch {}
        }
      }
    } catch {}
  }

  void tick();
  setInterval(() => void tick(), pollMs);
}
