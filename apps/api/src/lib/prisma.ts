import dotenv from "dotenv";
import { Pool, type QueryResult, type QueryResultRow } from "pg";
import { newDb, DataType } from "pg-mem";
import { randomUUID } from "node:crypto";
import { hashPassword } from "../auth/password.js";

dotenv.config({ path: "../../.env" });
dotenv.config();

type SqlTemplate = TemplateStringsArray;

class PrismaClient {
  private pool!: Pool; // definite assignment (we always set it in constructor)

  constructor() {
    const usePgMem = process.env.USE_PGMEM === "1";
    const isProd = process.env.NODE_ENV === "production";

    if (isProd && usePgMem) {
      throw new Error("USE_PGMEM no está permitido en producción");
    }

    if (usePgMem) {
      const db = newDb();

      db.public.registerFunction({
        name: "gen_random_uuid",
        args: [],
        returns: DataType.uuid,
        impure: true,
        implementation: () => randomUUID(),
      });
      db.public.registerFunction({
        name: "uuid_generate_v4",
        args: [],
        returns: DataType.uuid,
        impure: true,
        implementation: () => randomUUID(),
      });

      db.public.none(`
        CREATE TYPE "UserRole" AS ENUM ('ADVERTISER', 'CHANNEL_ADMIN', 'OPS', 'BLOG_ADMIN');
        CREATE TYPE "ChannelPlatform" AS ENUM ('TELEGRAM', 'DISCORD', 'WHATSAPP');
        CREATE TYPE "ChannelStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED');
        CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'READY_FOR_PAYMENT', 'PAID', 'SUBMITTED', 'READY', 'PUBLISHED', 'DISPUTED', 'COMPLETED', 'REFUNDED');
        CREATE TYPE "PaymentProvider" AS ENUM ('STRIPE');
        CREATE TYPE "PaymentStatus" AS ENUM ('CREATED', 'REQUIRES_PAYMENT', 'SUCCEEDED', 'FAILED', 'RELEASED', 'REFUNDED');
        CREATE TYPE "PayoutMethod" AS ENUM ('BANK', 'STRIPE');
        CREATE TYPE "ChatMessageStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED', 'BLOCKED');

        CREATE TYPE "BlogStatus" AS ENUM ('DRAFT','PENDING_VERIFICATION','VERIFIED','REJECTED');
        CREATE TYPE "BlogOfferType" AS ENUM ('SPONSORED_POST','LINK_INSERTION','HOMEPAGE_MENTION');
        CREATE TYPE "BlogOrderStatus" AS ENUM ('REQUESTED','ACCEPTED','REJECTED','NEEDS_CHANGES','IN_ESCROW','PUBLISHED','VERIFIED','SETTLED','CANCELED');
        CREATE TYPE "ProofStatus" AS ENUM ('PENDING','VALID','INVALID');

        CREATE TABLE "User" (
          "id" UUID PRIMARY KEY,
          "email" TEXT NOT NULL UNIQUE,
          "passwordHash" TEXT NOT NULL,
          "role" "UserRole" NOT NULL,
          "createdAt" TIMESTAMPTZ NOT NULL
        );

        CREATE TABLE "Channel" (
          "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "ownerUserId" UUID NOT NULL,
          "platform" "ChannelPlatform" NOT NULL,
          "platformRef" TEXT,
          "platformUserRef" TEXT,
          "name" TEXT NOT NULL,
          "category" TEXT NOT NULL,
          "audienceSize" INTEGER NOT NULL,
          "engagementHint" TEXT NOT NULL,
          "pricePerPost" INTEGER NOT NULL,
          "status" "ChannelStatus" NOT NULL,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE "Campaign" (
          "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "advertiserUserId" UUID NOT NULL,
          "channelId" UUID NOT NULL,
          "copyText" TEXT NOT NULL,
          "destinationUrl" TEXT NOT NULL,
          "scheduledAt" TIMESTAMPTZ,
          "status" "CampaignStatus" NOT NULL,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          "publishedAt" TIMESTAMPTZ
        );

        CREATE TABLE "Payment" (
          "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "campaignId" UUID NOT NULL UNIQUE,
          "provider" "PaymentProvider" NOT NULL,
          "providerRef" TEXT,
          "amount" INTEGER NOT NULL,
          "currency" TEXT NOT NULL,
          "status" "PaymentStatus" NOT NULL,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE "TrackingClick" (
          "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "campaignId" UUID NOT NULL,
          "ts" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          "ip" TEXT NOT NULL,
          "userAgent" TEXT NOT NULL,
          "referrer" TEXT
        );

        CREATE TABLE "TrackingEvent" (
          "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "campaignId" UUID NOT NULL,
          "clickId" UUID,
          "type" TEXT NOT NULL,
          "value" NUMERIC,
          "currency" TEXT,
          "meta" TEXT,
          "ts" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          "ip" TEXT NOT NULL,
          "userAgent" TEXT NOT NULL,
          "referrer" TEXT
        );

        CREATE INDEX "Channel_status_idx" ON "Channel"("status");
        CREATE INDEX "Channel_category_idx" ON "Channel"("category");
        CREATE INDEX "Channel_pricePerPost_idx" ON "Channel"("pricePerPost");
        CREATE INDEX "Campaign_advertiserUserId_idx" ON "Campaign"("advertiserUserId");
        CREATE INDEX "Campaign_channelId_idx" ON "Campaign"("channelId");
        CREATE INDEX "Campaign_status_idx" ON "Campaign"("status");
        CREATE INDEX "TrackingClick_campaignId_idx" ON "TrackingClick"("campaignId");
        CREATE INDEX "TrackingClick_ts_idx" ON "TrackingClick"("ts");
        CREATE INDEX "TrackingEvent_campaignId_idx" ON "TrackingEvent"("campaignId");
        CREATE INDEX "TrackingEvent_clickId_idx" ON "TrackingEvent"("clickId");
        CREATE INDEX "TrackingEvent_ts_idx" ON "TrackingEvent"("ts");
        CREATE INDEX "TrackingEvent_campaign_type_ts_idx" ON "TrackingEvent"("campaignId","type","ts");

        CREATE TYPE "TrackingInvalidReason" AS ENUM ('DUPLICATE', 'OUT_OF_WINDOW', 'CAMPAIGN_INACTIVE', 'RATE_LIMIT');
        ALTER TABLE "Campaign" ADD COLUMN "startAt" TIMESTAMPTZ;
        ALTER TABLE "Campaign" ADD COLUMN "endAt" TIMESTAMPTZ;
        ALTER TABLE "TrackingClick" ADD COLUMN "isValid" BOOLEAN NOT NULL DEFAULT false;
        ALTER TABLE "TrackingClick" ADD COLUMN "invalidReason" "TrackingInvalidReason";
        CREATE INDEX "TrackingClick_ip_ts_idx" ON "TrackingClick"(ip, ts);
        CREATE INDEX "TrackingClick_campaign_valid_ts_idx" ON "TrackingClick"("campaignId", "isValid", ts);
        
        CREATE TABLE "BlogSite" (
          "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "ownerUserId" UUID NOT NULL,
          "name" TEXT NOT NULL,
          "domain" TEXT NOT NULL UNIQUE,
          "language" TEXT NOT NULL,
          "country" TEXT,
          "categories" TEXT NOT NULL,
          "status" "BlogStatus" NOT NULL,
          "monthlyTraffic" INTEGER,
          "DR" INTEGER,
          "DA" INTEGER,
          "indexedPages" INTEGER,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX "BlogSite_ownerUserId_idx" ON "BlogSite"("ownerUserId");

        CREATE TABLE "BlogPlacementOffer" (
          "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "blogSiteId" UUID NOT NULL,
          "type" "BlogOfferType" NOT NULL,
          "basePrice" INTEGER NOT NULL,
          "currency" TEXT NOT NULL,
          "turnaroundDays" INTEGER NOT NULL,
          "dofollow" BOOLEAN NOT NULL,
          "sponsoredLabel" BOOLEAN NOT NULL,
          "constraints" TEXT,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX "BlogPlacementOffer_blogSiteId_idx" ON "BlogPlacementOffer"("blogSiteId");

        CREATE TABLE "BlogOrderRequest" (
          "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "advertiserId" UUID NOT NULL,
          "blogSiteId" UUID NOT NULL,
          "offerId" UUID,
          "targetUrl" TEXT NOT NULL,
          "anchorText" TEXT NOT NULL,
          "contentBrief" TEXT NOT NULL,
          "contentProvidedBy" TEXT NOT NULL,
          "status" "BlogOrderStatus" NOT NULL,
          "proposedPrice" INTEGER NOT NULL,
          "finalPrice" INTEGER,
          "currency" TEXT NOT NULL,
          "requestedPublishWindowStart" TIMESTAMPTZ,
          "requestedPublishWindowEnd" TIMESTAMPTZ,
          "notes" TEXT,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX "BlogOrderRequest_blogSiteId_idx" ON "BlogOrderRequest"("blogSiteId");
        CREATE INDEX "BlogOrderRequest_advertiserId_idx" ON "BlogOrderRequest"("advertiserId");
        CREATE INDEX "BlogOrderRequest_status_idx" ON "BlogOrderRequest"("status");

        CREATE TABLE "BlogPublicationProof" (
          "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "orderId" UUID NOT NULL UNIQUE,
          "publishedUrl" TEXT NOT NULL,
          "publishedAt" TIMESTAMPTZ NOT NULL,
          "proofStatus" "ProofStatus" NOT NULL,
          "lastCheckedAt" TIMESTAMPTZ,
          "notes" TEXT
        );

        CREATE TABLE "BlogMetricsSnapshot" (
          "orderId" UUID PRIMARY KEY,
          "clicks" INTEGER,
          "impressions" INTEGER,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE "AuditLog" (
          "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "ts" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          "actorUserId" UUID,
          "entityType" TEXT NOT NULL,
          "entityId" UUID NOT NULL,
          "action" TEXT NOT NULL,
          "meta" TEXT
        );
        CREATE TABLE "PayoutConfig" (
          "userId" UUID PRIMARY KEY,
          "method" "PayoutMethod" NOT NULL,
          "identifier" TEXT NOT NULL,
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE "ChatConversation" (
          "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "campaignId" UUID NOT NULL UNIQUE,
          "advertiserUserId" UUID NOT NULL,
          "ownerUserId" UUID NOT NULL,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX "ChatConversation_campaignId_idx" ON "ChatConversation"("campaignId");
        CREATE INDEX "ChatConversation_advertiserUserId_idx" ON "ChatConversation"("advertiserUserId");
        CREATE INDEX "ChatConversation_ownerUserId_idx" ON "ChatConversation"("ownerUserId");

        CREATE TABLE "ChatMessage" (
          "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "conversationId" UUID NOT NULL,
          "senderUserId" UUID NOT NULL,
          "body" TEXT NOT NULL,
          "status" "ChatMessageStatus" NOT NULL DEFAULT 'PENDING_REVIEW'::"ChatMessageStatus",
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          "reviewedByUserId" UUID,
          "reviewedAt" TIMESTAMPTZ,
          "rejectionReason" TEXT,
          "flags" TEXT
        );
        CREATE INDEX "ChatMessage_conversation_created_idx" ON "ChatMessage"("conversationId","createdAt");
        CREATE INDEX "ChatMessage_status_created_idx" ON "ChatMessage"("status","createdAt");
      `);

      const { Pool: MemPool } = db.adapters.createPg();
      const memPool = new MemPool();
      this.pool = memPool;

      // Bootstrap users (parameterized, idempotent)
      void (async () => {
        const check = await memPool.query(
          `SELECT 1 FROM "User" WHERE "email" = $1 LIMIT 1`,
          ["ops@plataforma.local"],
        );

        const now = new Date().toISOString();

        const upsertSql = `
          INSERT INTO "User"("id", "email", "passwordHash", "role", "createdAt")
          VALUES ($1::uuid, $2, $3, $4::"UserRole", $5::timestamptz)
          ON CONFLICT ("email") DO UPDATE SET
            "passwordHash" = EXCLUDED."passwordHash",
            "role" = EXCLUDED."role";
        `;

        await memPool.query(upsertSql, [
          randomUUID(),
          "ops@plataforma.local",
          await hashPassword("ops12345"),
          "OPS",
          now,
        ]);
        await memPool.query(upsertSql, [
          randomUUID(),
          "advertiser@plataforma.local",
          await hashPassword("advertiser123"),
          "ADVERTISER",
          now,
        ]);
        await memPool.query(upsertSql, [
          randomUUID(),
          "admin@plataforma.local",
          await hashPassword("admin123"),
          "CHANNEL_ADMIN",
          now,
        ]);
        await memPool.query(upsertSql, [
          randomUUID(),
          "blog@plataforma.local",
          await hashPassword("blogadmin123"),
          "BLOG_ADMIN",
          now,
        ]);

        // Sample data (keep as raw SQL)
        await memPool.query(`
          INSERT INTO "Channel"("id", "ownerUserId", "platform", "name", "category", "audienceSize", "engagementHint", "pricePerPost", "status")
          SELECT '11111111-1111-1111-1111-111111111111', id, 'TELEGRAM'::"ChannelPlatform", 'Crypto Daily LATAM', 'crypto', 18000, 'alto engagement en noticias diarias', 120, 'ACTIVE'::"ChannelStatus"
          FROM "User" WHERE email = 'admin@plataforma.local'
          ON CONFLICT ("id") DO NOTHING;
        `);
        await memPool.query(`
          INSERT INTO "Channel"("id", "ownerUserId", "platform", "name", "category", "audienceSize", "engagementHint", "pricePerPost", "status")
          SELECT '22222222-2222-2222-2222-222222222222', id, 'TELEGRAM'::"ChannelPlatform", 'Ecommerce Growth Hub', 'ecommerce', 9600, 'audiencia nicho de founders', 90, 'ACTIVE'::"ChannelStatus"
          FROM "User" WHERE email = 'admin@plataforma.local'
          ON CONFLICT ("id") DO NOTHING;
        `);
        await memPool.query(`
          INSERT INTO "Channel"("id", "ownerUserId", "platform", "name", "category", "audienceSize", "engagementHint", "pricePerPost", "status")
          SELECT '33333333-3333-3333-3333-333333333333', id, 'TELEGRAM'::"ChannelPlatform", 'Finanzas Personales Pro', 'finanzas', 22000, 'buen CTR en enlaces de herramientas', 150, 'ACTIVE'::"ChannelStatus"
          FROM "User" WHERE email = 'admin@plataforma.local'
          ON CONFLICT ("id") DO NOTHING;
        `);
        await memPool.query(`
          INSERT INTO "Campaign"("id", "advertiserUserId", "channelId", "copyText", "destinationUrl", "status")
          SELECT '44444444-4444-4444-4444-444444444444', u.id, '11111111-1111-1111-1111-111111111111', 'Prueba nuestra plataforma para lanzar anuncios en canales cerrados.', 'http://localhost:3000', 'DRAFT'::"CampaignStatus"
          FROM "User" u WHERE u.email = 'advertiser@plataforma.local'
          ON CONFLICT ("id") DO NOTHING;
        `);
        await memPool.query(`
          INSERT INTO "Campaign"("id", "advertiserUserId", "channelId", "copyText", "destinationUrl", "scheduledAt", "status")
          SELECT '55555555-5555-5555-5555-555555555555', u.id, '22222222-2222-2222-2222-222222222222', 'Lanzamiento nueva funcionalidad de la app.', 'http://localhost:3000', NOW() + INTERVAL '2 days', 'READY'::"CampaignStatus"
          FROM "User" u WHERE u.email = 'advertiser@plataforma.local'
          ON CONFLICT ("id") DO NOTHING;
        `);
        await memPool.query(`
          INSERT INTO "Payment"("campaignId","provider","providerRef","amount","currency","status","createdAt")
          SELECT '44444444-4444-4444-4444-444444444444'::uuid, 'STRIPE'::"PaymentProvider", 'pi_dev_mock_4444', 120, 'USD', 'SUCCEEDED'::"PaymentStatus", NOW() - INTERVAL '10 days'
          WHERE NOT EXISTS (SELECT 1 FROM "Payment" WHERE "campaignId" = '44444444-4444-4444-4444-444444444444'::uuid);
        `);
        await memPool.query(`
          INSERT INTO "TrackingClick"("campaignId","ts","ip","userAgent","referrer","isValid")
          VALUES ('44444444-4444-4444-4444-444444444444'::uuid, NOW() - INTERVAL '5 days', '127.0.0.1', 'Mozilla/5.0', 'https://ref.example', true)
          ON CONFLICT DO NOTHING;
        `);
        await memPool.query(`
          INSERT INTO "AuditLog"("actorUserId","entityType","entityId","action","meta")
          SELECT u.id, 'Channel', '11111111-1111-1111-1111-111111111111'::uuid, 'VERIFY', '{"status":"OK"}'
          FROM "User" u WHERE u.email = 'admin@plataforma.local'
          ON CONFLICT DO NOTHING;
        `);
        await memPool.query(`
          INSERT INTO "AuditLog"("actorUserId","entityType","entityId","action","meta")
          SELECT u.id, 'Campaign', '55555555-5555-5555-5555-555555555555'::uuid, 'SCHEDULE', '{"scheduledAt":"in 2 days"}'
          FROM "User" u WHERE u.email = 'advertiser@plataforma.local'
          ON CONFLICT DO NOTHING;
        `);
        
      })().catch((e) => {
        console.error("[pg-mem bootstrap] failed:", e);
        process.exit(1);
      });

      return;
    }

    // Postgres real
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }

  async $queryRaw<T extends QueryResultRow>(
    strings: SqlTemplate,
    ...values: unknown[]
  ): Promise<QueryResult<T>> {
    const text = strings.reduce(
      (acc, part, index) =>
        `${acc}${part}${index < values.length ? `$${index + 1}` : ""}`,
      "",
    );
    return this.pool.query<T>(text, values);
  }

  async $query<T extends QueryResultRow>(
    text: string,
    values: unknown[] = [],
  ): Promise<QueryResult<T>> {
    return this.pool.query<T>(text, values);
  }

  async $disconnect() {
    await this.pool.end();
  }
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
