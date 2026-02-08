import { z } from "zod";

const campaignStatusEnum = z.enum([
  "DRAFT",
  "READY_FOR_PAYMENT",
  "PAID",
  "READY",
  "PUBLISHED",
  "DISPUTED",
  "COMPLETED",
  "REFUNDED",
]);

export const idParamSchema = z.object({
  id: z.string().uuid(),
});

export const createCampaignSchema = z.object({
  channelId: z.string().uuid(),
  copyText: z.string().min(1).max(5000),
  destinationUrl: z.string().url(),
  scheduledAt: z.string().datetime().optional(),
});

export const advertiserCampaignsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(50).default(20),
  offset: z.coerce.number().int().nonnegative().default(0),
  status: campaignStatusEnum.optional(),
});

export const inboxCampaignsQuerySchema = advertiserCampaignsQuerySchema;

export const opsCampaignsQuerySchema = z.object({
  status: campaignStatusEnum.optional(),
  channelId: z.string().uuid().optional(),
  advertiserUserId: z.string().uuid().optional(),
  limit: z.coerce.number().int().positive().max(50).default(20),
  offset: z.coerce.number().int().nonnegative().default(0),
});

export type CampaignStatus = z.infer<typeof campaignStatusEnum>;
