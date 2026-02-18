DO $$ BEGIN
  CREATE TYPE "ChatMessageStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED', 'BLOCKED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "ChatConversation" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "campaignId" UUID NOT NULL UNIQUE REFERENCES "Campaign"("id"),
  "advertiserUserId" UUID NOT NULL REFERENCES "User"("id"),
  "ownerUserId" UUID NOT NULL REFERENCES "User"("id"),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "ChatConversation_advertiserUserId_idx" ON "ChatConversation"("advertiserUserId");
CREATE INDEX IF NOT EXISTS "ChatConversation_ownerUserId_idx" ON "ChatConversation"("ownerUserId");

CREATE TABLE IF NOT EXISTS "ChatMessage" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "conversationId" UUID NOT NULL REFERENCES "ChatConversation"("id"),
  "senderUserId" UUID NOT NULL REFERENCES "User"("id"),
  "body" TEXT NOT NULL,
  "status" "ChatMessageStatus" NOT NULL DEFAULT 'PENDING_REVIEW'::"ChatMessageStatus",
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "reviewedByUserId" UUID REFERENCES "User"("id"),
  "reviewedAt" TIMESTAMPTZ,
  "rejectionReason" TEXT,
  "flags" TEXT
);

CREATE INDEX IF NOT EXISTS "ChatMessage_conversation_created_idx" ON "ChatMessage"("conversationId","createdAt");
CREATE INDEX IF NOT EXISTS "ChatMessage_status_created_idx" ON "ChatMessage"("status","createdAt");

