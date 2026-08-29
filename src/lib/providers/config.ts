import { LLM_PROVIDER_IDS, type LLMProviderId, type ProviderCapability } from "@/lib/providers/types";
import { ProviderConfigurationError, ProviderCostGuardError } from "@/lib/providers/errors";

export type ProviderEnv = Record<string, string | undefined>;

export type AIProviderConfig = {
  llmProvider: LLMProviderId;
  allowPaidAI: boolean;
  allowCloudAI: boolean;
  maxRetries: number;
  requestTimeoutMs: number;
  legacyClaudeCompatibility: boolean;
  ollamaBaseUrl: string;
  ollamaModel: string | null;
  qwenBaseUrl: string | null;
  qwenModel: string | null;
};

function parseBoolean(value: string | undefined, fallback: boolean) {
  if (value === undefined || value.trim() === "") {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

function parsePositiveInteger(value: string | undefined, fallback: number, name: string) {
  if (value === undefined || value.trim() === "") {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new ProviderConfigurationError(`${name} must be a non-negative integer.`);
  }

  return parsed;
}

export function resolveLLMProviderId(env: ProviderEnv = process.env): LLMProviderId {
  const configured = env.LLM_PROVIDER?.trim().toLowerCase();

  if (configured) {
    if (!LLM_PROVIDER_IDS.includes(configured as LLMProviderId)) {
      throw new ProviderConfigurationError(`Unsupported LLM_PROVIDER "${configured}".`, {
        supported: LLM_PROVIDER_IDS,
      });
    }

    return configured as LLMProviderId;
  }

  if (env.NODE_ENV === "test") {
    return "mock";
  }

  if (env.CLAUDE_API_KEY?.trim()) {
    return "claude";
  }

  throw new ProviderConfigurationError("LLM_PROVIDER is not configured. Set LLM_PROVIDER=mock, claude, ollama, or qwen.");
}

export function getAIProviderConfig(env: ProviderEnv = process.env): AIProviderConfig {
  const legacyClaudeCompatibility = !env.LLM_PROVIDER && !!env.CLAUDE_API_KEY?.trim();

  return {
    llmProvider: resolveLLMProviderId(env),
    allowPaidAI: parseBoolean(env.ALLOW_PAID_AI, legacyClaudeCompatibility),
    allowCloudAI: parseBoolean(env.ALLOW_CLOUD_AI, legacyClaudeCompatibility),
    maxRetries: parsePositiveInteger(env.AI_MAX_RETRIES, 2, "AI_MAX_RETRIES"),
    requestTimeoutMs: parsePositiveInteger(env.AI_REQUEST_TIMEOUT_MS, 60000, "AI_REQUEST_TIMEOUT_MS"),
    legacyClaudeCompatibility,
    ollamaBaseUrl: env.OLLAMA_BASE_URL?.trim() || "http://127.0.0.1:11434",
    ollamaModel: env.OLLAMA_MODEL?.trim() || null,
    qwenBaseUrl: env.QWEN_BASE_URL?.trim() || null,
    qwenModel: env.QWEN_MODEL?.trim() || null,
  };
}

export function assertProviderAllowed(capability: ProviderCapability, config: Pick<AIProviderConfig, "allowCloudAI" | "allowPaidAI">) {
  if (capability.potentiallyPaid && !config.allowPaidAI) {
    throw new ProviderCostGuardError(
      `${capability.providerId} is marked as potentially paid. Set ALLOW_PAID_AI=true to enable it explicitly.`,
      { providerId: capability.providerId, kind: capability.kind },
    );
  }

  if (capability.cloud && !config.allowCloudAI) {
    throw new ProviderCostGuardError(
      `${capability.providerId} is a cloud provider. Set ALLOW_CLOUD_AI=true to enable cloud AI explicitly.`,
      { providerId: capability.providerId, kind: capability.kind },
    );
  }
}
