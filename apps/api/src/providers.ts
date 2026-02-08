export type ProviderName = "TELEGRAM" | "WHATSAPP" | "DISCORD" | "INSTAGRAM";

export type ProviderCapabilities = {
  supportsChannelOwnershipCheck: boolean;
  supportsAudienceRead: boolean;
  supportsMessageSend: boolean;
};

export interface ChannelProvider {
  name: ProviderName;
  capabilities: ProviderCapabilities;
  verifyChannelOwnership(params: { channelRef: string; userRef: string }): Promise<boolean>;
}

class TelegramProvider implements ChannelProvider {
  name: ProviderName = "TELEGRAM";

  capabilities: ProviderCapabilities = {
    supportsChannelOwnershipCheck: true,
    supportsAudienceRead: true,
    supportsMessageSend: true,
  };

  async verifyChannelOwnership(params: { channelRef: string; userRef: string }) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return false;
    const chatId = params.channelRef;
    const userId = params.userRef;
    const url = `https://api.telegram.org/bot${token}/getChatMember?chat_id=${encodeURIComponent(
      chatId,
    )}&user_id=${encodeURIComponent(userId)}`;
    const res = await fetch(url);
    if (!res.ok) return false;
    const data = (await res.json()) as { ok: boolean; result?: { status?: string } };
    if (!data.ok || !data.result) return false;
    const status = data.result.status;
    return status === "administrator" || status === "creator";
  }
}

class PlaceholderProvider implements ChannelProvider {
  constructor(
    public readonly name: ProviderName,
    public readonly capabilities: ProviderCapabilities,
  ) {}

  async verifyChannelOwnership() {
    return false;
  }
}

const providers: ChannelProvider[] = [
  new TelegramProvider(),
  new PlaceholderProvider("WHATSAPP", {
    supportsChannelOwnershipCheck: false,
    supportsAudienceRead: false,
    supportsMessageSend: false,
  }),
  new PlaceholderProvider("DISCORD", {
    supportsChannelOwnershipCheck: false,
    supportsAudienceRead: false,
    supportsMessageSend: false,
  }),
  new PlaceholderProvider("INSTAGRAM", {
    supportsChannelOwnershipCheck: false,
    supportsAudienceRead: false,
    supportsMessageSend: false,
  }),
];

export function listProviders() {
  return providers.map((provider) => ({ name: provider.name, capabilities: provider.capabilities }));
}

export function getProviderByName(name: ProviderName) {
  return providers.find((p) => p.name === name);
}
