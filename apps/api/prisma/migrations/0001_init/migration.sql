CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
  CREATE TYPE "UserRole" AS ENUM ('ADVERTISER', 'CHANNEL_ADMIN', 'OPS');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ChannelPlatform" AS ENUM ('TELEGRAM');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ChannelStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'READY_FOR_PAYMENT', 'PAID', 'READY', 'PUBLISHED', 'DISPUTED', 'COMPLETED', 'REFUNDED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "PaymentProvider" AS ENUM ('STRIPE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "PaymentStatus" AS ENUM ('CREATED', 'REQUIRES_PAYMENT', 'SUCCEEDED', 'FAILED', 'RELEASED', 'REFUNDED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "User" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "role" "UserRole" NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Channel" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "ownerUserId" UUID NOT NULL REFERENCES "User"("id"),
  "platform" "ChannelPlatform" NOT NULL,
  "name" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "audienceSize" INTEGER NOT NULL,
  "engagementHint" TEXT NOT NULL,
  "pricePerPost" INTEGER NOT NULL,
  "status" "ChannelStatus" NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Campaign" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "advertiserUserId" UUID NOT NULL REFERENCES "User"("id"),
  "channelId" UUID NOT NULL REFERENCES "Channel"("id"),
  "copyText" TEXT NOT NULL,
  "destinationUrl" TEXT NOT NULL,
  "scheduledAt" TIMESTAMPTZ,
  "status" "CampaignStatus" NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "publishedAt" TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "Payment" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "campaignId" UUID NOT NULL UNIQUE REFERENCES "Campaign"("id"),
  "provider" "PaymentProvider" NOT NULL,
  "providerRef" TEXT,
  "amount" INTEGER NOT NULL,
  "currency" TEXT NOT NULL,
  "status" "PaymentStatus" NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "TrackingClick" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "campaignId" UUID NOT NULL REFERENCES "Campaign"("id"),
  "ts" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "ip" TEXT NOT NULL,
  "userAgent" TEXT NOT NULL,
  "referrer" TEXT
);

CREATE INDEX IF NOT EXISTS "Channel_status_idx" ON "Channel"("status");
CREATE INDEX IF NOT EXISTS "Channel_category_idx" ON "Channel"("category");
CREATE INDEX IF NOT EXISTS "Channel_pricePerPost_idx" ON "Channel"("pricePerPost");
CREATE INDEX IF NOT EXISTS "Campaign_advertiserUserId_idx" ON "Campaign"("advertiserUserId");
CREATE INDEX IF NOT EXISTS "Campaign_channelId_idx" ON "Campaign"("channelId");
CREATE INDEX IF NOT EXISTS "Campaign_status_idx" ON "Campaign"("status");
CREATE INDEX IF NOT EXISTS "TrackingClick_campaignId_idx" ON "TrackingClick"("campaignId");
CREATE INDEX IF NOT EXISTS "TrackingClick_ts_idx" ON "TrackingClick"("ts");
