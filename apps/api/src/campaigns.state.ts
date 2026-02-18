import type { CampaignStatus } from "./campaigns.schemas.js";

const transitions: Record<CampaignStatus, CampaignStatus[]> = {
  DRAFT: ["READY_FOR_PAYMENT"],
  READY_FOR_PAYMENT: ["PAID", "SUBMITTED"],
  PAID: ["SUBMITTED", "PUBLISHED"],
  SUBMITTED: ["PUBLISHED"],
  READY: [],
  PUBLISHED: ["COMPLETED"],
  DISPUTED: [],
  COMPLETED: [],
  REFUNDED: [],
};

export function canTransition(from: CampaignStatus, to: CampaignStatus) {
  return transitions[from].includes(to);
}
