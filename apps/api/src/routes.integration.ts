import { Router } from "express";
import { z } from "zod";

import { commissionService, type AdType, type ChannelType } from "./commission.js";
import { listProviders } from "./providers.js";

const router = Router();

const quoteSchema = z.object({
  amount: z.coerce.number().positive(),
  currency: z.string().length(3).optional(),
  channelType: z.enum(["TELEGRAM", "WHATSAPP", "DISCORD", "INSTAGRAM"]),
  adType: z.enum(["POST", "STORY", "MENTION", "FEATURED"]),
});

router.get("/meta/providers", (_req, res) => {
  return res.status(200).json({ providers: listProviders() });
});

router.post("/campaigns/quote", (req, res) => {
  const parsed = quoteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input", issues: parsed.error.flatten() });
  }

  try {
    const quote = commissionService.quote({
      amount: parsed.data.amount,
      currency: parsed.data.currency?.toUpperCase(),
      channelType: parsed.data.channelType as ChannelType,
      adType: parsed.data.adType as AdType,
    });

    return res.status(200).json(quote);
  } catch (error) {
    return res.status(400).json({ message: error instanceof Error ? error.message : "Invalid quote input" });
  }
});

export default router;
