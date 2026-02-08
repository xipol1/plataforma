export type ChannelType = "TELEGRAM" | "WHATSAPP" | "DISCORD" | "INSTAGRAM";
export type AdType = "POST" | "STORY" | "MENTION" | "FEATURED";

export type CommissionQuoteInput = {
  amount: number;
  currency?: string;
  channelType: ChannelType;
  adType: AdType;
};

export type CommissionQuote = {
  amountTotal: number;
  currency: string;
  commissionPercent: number;
  commissionAmount: number;
  creatorNetAmount: number;
  channelType: ChannelType;
  adType: AdType;
};

type CommissionConfig = {
  basePercent: number;
  minimumAmount: number;
  maxAmountRatio: number;
};

const defaultConfig: CommissionConfig = {
  basePercent: 12,
  minimumAmount: 2,
  maxAmountRatio: 0.5,
};

function channelAdjustment(channelType: ChannelType) {
  switch (channelType) {
    case "TELEGRAM":
      return -1;
    case "INSTAGRAM":
      return 2;
    case "DISCORD":
      return -2;
    case "WHATSAPP":
      return 0;
    default:
      return 0;
  }
}

function adTypeAdjustment(adType: AdType) {
  switch (adType) {
    case "POST":
      return 0;
    case "STORY":
      return -1;
    case "MENTION":
      return 1;
    case "FEATURED":
      return 3;
    default:
      return 0;
  }
}

function roundMoney(value: number) {
  return Number(value.toFixed(2));
}

export class CommissionService {
  private readonly config: CommissionConfig;

  constructor(config?: Partial<CommissionConfig>) {
    this.config = { ...defaultConfig, ...config };
  }

  quote(input: CommissionQuoteInput): CommissionQuote {
    const amount = Number(input.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("Amount must be a positive number");
    }

    let adjustedPercent =
      this.config.basePercent + channelAdjustment(input.channelType) + adTypeAdjustment(input.adType);

    adjustedPercent = Math.max(1, Math.min(adjustedPercent, 30));

    let commissionAmount = (amount * adjustedPercent) / 100;
    commissionAmount = Math.max(commissionAmount, this.config.minimumAmount);
    commissionAmount = Math.min(commissionAmount, amount * this.config.maxAmountRatio);

    const creatorNetAmount = amount - commissionAmount;

    return {
      amountTotal: roundMoney(amount),
      currency: input.currency ?? "USD",
      commissionPercent: adjustedPercent,
      commissionAmount: roundMoney(commissionAmount),
      creatorNetAmount: roundMoney(creatorNetAmount),
      channelType: input.channelType,
      adType: input.adType,
    };
  }
}

export const commissionService = new CommissionService();
