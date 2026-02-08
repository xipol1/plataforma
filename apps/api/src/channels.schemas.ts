import { z } from "zod";

export const createChannelSchema = z.object({
  platform: z.literal("TELEGRAM"),
  name: z.string().min(1).max(200),
  category: z.string().min(1).max(100),
  audienceSize: z.number().int().nonnegative(),
  engagementHint: z.string().min(1).max(300),
  pricePerPost: z.number().int().positive(),
});

export const listChannelsQuerySchema = z.object({
  category: z.string().min(1).optional(),
  min_price: z.coerce.number().int().nonnegative().optional(),
  max_price: z.coerce.number().int().nonnegative().optional(),
  min_audience: z.coerce.number().int().nonnegative().optional(),
  limit: z.coerce.number().int().positive().max(50).default(20),
  offset: z.coerce.number().int().nonnegative().default(0),
});

export const updateChannelSchema = z
  .object({
    platform: z.literal("TELEGRAM").optional(),
    name: z.string().min(1).max(200).optional(),
    category: z.string().min(1).max(100).optional(),
    audienceSize: z.number().int().nonnegative().optional(),
    engagementHint: z.string().min(1).max(300).optional(),
    pricePerPost: z.number().int().positive().optional(),
    status: z.enum(["PENDING", "ACTIVE", "SUSPENDED"]).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: "At least one field is required" });
