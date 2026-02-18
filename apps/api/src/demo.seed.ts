import { hashPassword } from "./auth/password.js";
import { prisma } from "./lib/prisma.js";

export async function ensureDemoSeed() {
  const isProd = process.env.NODE_ENV === "production";
  const usePgMem = process.env.USE_PGMEM === "1";
  const enabled = process.env.AUTO_SEED_DEMO !== "0";
  if (isProd || usePgMem || !enabled) return;

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    return;
  }

  try {
    const now = new Date().toISOString();

    const opsHash = await hashPassword("ops12345");
    const advHash = await hashPassword("advertiser123");
    const adminHash = await hashPassword("admin123");
    const blogHash = await hashPassword("blogadmin123");

    await prisma.$queryRaw`
      INSERT INTO "User"(email, "passwordHash", role, "createdAt")
      VALUES
        ('ops@plataforma.local', ${opsHash}, 'OPS'::"UserRole", ${now}::timestamptz),
        ('advertiser@plataforma.local', ${advHash}, 'ADVERTISER'::"UserRole", ${now}::timestamptz),
        ('admin@plataforma.local', ${adminHash}, 'CHANNEL_ADMIN'::"UserRole", ${now}::timestamptz),
        ('blog@plataforma.local', ${blogHash}, 'BLOG_ADMIN'::"UserRole", ${now}::timestamptz)
      ON CONFLICT (email) DO UPDATE SET
        "passwordHash" = EXCLUDED."passwordHash",
        role = EXCLUDED.role;
    `;

    const advertiserUserIdRes = await prisma.$queryRaw<{ id: string }>`
      SELECT id::text AS id FROM "User" WHERE email = 'advertiser@plataforma.local' LIMIT 1
    `;
    const channelAdminUserIdRes = await prisma.$queryRaw<{ id: string }>`
      SELECT id::text AS id FROM "User" WHERE email = 'admin@plataforma.local' LIMIT 1
    `;
    const advertiserUserId = advertiserUserIdRes.rows[0]?.id;
    const channelAdminUserId = channelAdminUserIdRes.rows[0]?.id;
    if (!advertiserUserId || !channelAdminUserId) return;

    await prisma.$queryRaw`
      INSERT INTO "Channel"("id", "ownerUserId", "platform", "name", "category", "audienceSize", "engagementHint", "pricePerPost", "status")
      VALUES
        ('11111111-1111-1111-1111-111111111111', ${channelAdminUserId}::uuid, 'TELEGRAM'::"ChannelPlatform", 'Crypto Daily LATAM', 'crypto', 18000, 'alto engagement en noticias diarias', 120, 'ACTIVE'::"ChannelStatus"),
        ('22222222-2222-2222-2222-222222222222', ${channelAdminUserId}::uuid, 'TELEGRAM'::"ChannelPlatform", 'Ecommerce Growth Hub', 'ecommerce', 9600, 'audiencia nicho de founders', 90, 'ACTIVE'::"ChannelStatus"),
        ('33333333-3333-3333-3333-333333333333', ${channelAdminUserId}::uuid, 'TELEGRAM'::"ChannelPlatform", 'Finanzas Personales Pro', 'finanzas', 22000, 'buen CTR en enlaces de herramientas', 150, 'ACTIVE'::"ChannelStatus")
      ON CONFLICT ("id") DO UPDATE SET
        "ownerUserId" = EXCLUDED."ownerUserId",
        "platform" = EXCLUDED."platform",
        "name" = EXCLUDED."name",
        "category" = EXCLUDED."category",
        "audienceSize" = EXCLUDED."audienceSize",
        "engagementHint" = EXCLUDED."engagementHint",
        "pricePerPost" = EXCLUDED."pricePerPost",
        "status" = EXCLUDED."status";
    `;

    await prisma.$queryRaw`
      INSERT INTO "Campaign"("id", "advertiserUserId", "channelId", "copyText", "destinationUrl", "status")
      VALUES (
        '44444444-4444-4444-4444-444444444444',
        ${advertiserUserId}::uuid,
        '11111111-1111-1111-1111-111111111111',
        'Prueba nuestra plataforma para lanzar anuncios en canales cerrados.',
        'http://localhost:3000',
        'DRAFT'::"CampaignStatus"
      )
      ON CONFLICT ("id") DO UPDATE SET
        "advertiserUserId" = EXCLUDED."advertiserUserId",
        "channelId" = EXCLUDED."channelId",
        "copyText" = EXCLUDED."copyText",
        "destinationUrl" = EXCLUDED."destinationUrl",
        "status" = EXCLUDED."status",
        "scheduledAt" = NULL,
        "publishedAt" = NULL;
    `;
  } catch {}
}
