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

class MockTelegramProvider implements ChannelProvider {
  name: ProviderName = "TELEGRAM";

  capabilities: ProviderCapabilities = {
    supportsChannelOwnershipCheck: true,
    supportsAudienceRead: true,
    supportsMessageSend: true,
  };

  async verifyChannelOwnership(params: { channelRef: string; userRef: string }) {
    if (!params.channelRef || !params.userRef) return false;
    return true;
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
  new MockTelegramProvider(),
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
