DO $$ BEGIN
  CREATE TYPE "TrackingInvalidReason" AS ENUM ('DUPLICATE', 'OUT_OF_WINDOW', 'CAMPAIGN_INACTIVE', 'RATE_LIMIT');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "Campaign"
  ADD COLUMN IF NOT EXISTS "startAt" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "endAt" TIMESTAMPTZ;

ALTER TABLE "TrackingClick"
  ADD COLUMN IF NOT EXISTS "isValid" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "invalidReason" "TrackingInvalidReason";

CREATE INDEX IF NOT EXISTS "TrackingClick_ip_ts_idx" ON "TrackingClick"(ip, ts);
CREATE INDEX IF NOT EXISTS "TrackingClick_campaign_valid_ts_idx" ON "TrackingClick"("campaignId", "isValid", ts);
