CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS "TrackingEvent" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "campaignId" UUID NOT NULL REFERENCES "Campaign"("id"),
  "clickId" UUID REFERENCES "TrackingClick"("id"),
  "type" TEXT NOT NULL,
  "value" NUMERIC,
  "currency" TEXT,
  "meta" TEXT,
  "ts" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "ip" TEXT NOT NULL,
  "userAgent" TEXT NOT NULL,
  "referrer" TEXT
);

CREATE INDEX IF NOT EXISTS "TrackingEvent_campaignId_idx" ON "TrackingEvent"("campaignId");
CREATE INDEX IF NOT EXISTS "TrackingEvent_clickId_idx" ON "TrackingEvent"("clickId");
CREATE INDEX IF NOT EXISTS "TrackingEvent_ts_idx" ON "TrackingEvent"("ts");
CREATE INDEX IF NOT EXISTS "TrackingEvent_campaign_type_ts_idx" ON "TrackingEvent"("campaignId","type","ts");
