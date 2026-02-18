CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
  CREATE TYPE "PayoutMethod" AS ENUM ('BANK', 'STRIPE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "actorUserId" UUID,
  "entityType" TEXT NOT NULL,
  "entityId" UUID,
  "action" TEXT NOT NULL,
  "ts" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "meta" TEXT
);

CREATE INDEX IF NOT EXISTS "AuditLog_entityType_idx" ON "AuditLog"("entityType");
CREATE INDEX IF NOT EXISTS "AuditLog_entityId_idx" ON "AuditLog"("entityId");
CREATE INDEX IF NOT EXISTS "AuditLog_ts_idx" ON "AuditLog"("ts");

CREATE TABLE IF NOT EXISTS "PayoutConfig" (
  "userId" UUID PRIMARY KEY REFERENCES "User"("id"),
  "method" "PayoutMethod" NOT NULL,
  "identifier" TEXT NOT NULL,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
