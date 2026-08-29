import type { LLMProviderId, ProviderCapability } from "@/lib/providers/types";

export type LLMProviderDescriptor = {
  id: LLMProviderId;
  name: string;
  kind: "llm";
  defaultModel: string | null;
  capability: ProviderCapability;
};

export const LLM_PROVIDER_CATALOG: Record<LLMProviderId, LLMProviderDescriptor> = {
  mock: {
    id: "mock",
    name: "Mock LLM",
    kind: "llm",
    defaultModel: "creatorpilot-mock",
    capability: {
      providerId: "mock",
      kind: "llm",
      supportsStructuredJson: true,
      supportsText: true,
      supportsStreaming: false,
      local: true,
      cloud: false,
      potentiallyPaid: false,
    },
  },
  claude: {
    id: "claude",
    name: "Claude",
    kind: "llm",
    defaultModel: "claude-sonnet-4-5",
    capability: {
      providerId: "claude",
      kind: "llm",
      supportsStructuredJson: true,
      supportsText: true,
      supportsStreaming: false,
      local: false,
      cloud: true,
      potentiallyPaid: true,
    },
  },
  ollama: {
    id: "ollama",
    name: "Ollama",
    kind: "llm",
    defaultModel: null,
    capability: {
      providerId: "ollama",
      kind: "llm",
      supportsStructuredJson: true,
      supportsText: true,
      supportsStreaming: false,
      local: true,
      cloud: false,
      potentiallyPaid: false,
    },
  },
  qwen: {
    id: "qwen",
    name: "Alibaba Qwen",
    kind: "llm",
    defaultModel: null,
    capability: {
      providerId: "qwen",
      kind: "llm",
      supportsStructuredJson: true,
      supportsText: true,
      supportsStreaming: false,
      local: false,
      cloud: true,
      potentiallyPaid: true,
    },
  },
};
