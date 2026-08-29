import { LLM_PROVIDER_CATALOG } from "@/lib/providers/catalog";
import { assertProviderAllowed, getAIProviderConfig, type AIProviderConfig, type ProviderEnv } from "@/lib/providers/config";
import { ProviderConfigurationError, normalizeProviderError } from "@/lib/providers/errors";
import { ClaudeLLMProvider } from "@/lib/providers/llm/claude";
import { MockLLMProvider } from "@/lib/providers/llm/mock";
import { OllamaLLMProvider } from "@/lib/providers/llm/ollama";
import { QwenLLMProvider } from "@/lib/providers/llm/qwen";
import { withTimeout } from "@/lib/providers/timeout";
import type { LLMProvider, LLMProviderId, ProviderStatus, ProviderStatusSnapshot } from "@/lib/providers/types";

function modelFor(id: LLMProviderId, config: AIProviderConfig, env: ProviderEnv) {
  switch (id) {
    case "mock":
      return "creatorpilot-mock";
    case "claude":
      return env.CLAUDE_MODEL?.trim() || "claude-sonnet-4-5";
    case "ollama":
      return config.ollamaModel;
    case "qwen":
      return config.qwenModel;
  }
}

function isConfigured(id: LLMProviderId, config: AIProviderConfig, env: ProviderEnv) {
  switch (id) {
    case "mock":
      return true;
    case "claude":
      return !!env.CLAUDE_API_KEY?.trim();
    case "ollama":
      return !!config.ollamaModel;
    case "qwen":
      return !!env.QWEN_API_KEY?.trim() && !!config.qwenBaseUrl && !!config.qwenModel;
  }
}

export function createLLMProvider(id: LLMProviderId, config: AIProviderConfig, env: ProviderEnv = process.env): LLMProvider {
  switch (id) {
    case "mock":
      return new MockLLMProvider();
    case "claude":
      return new ClaudeLLMProvider({ apiKey: env.CLAUDE_API_KEY, model: env.CLAUDE_MODEL });
    case "ollama":
      return new OllamaLLMProvider({ baseUrl: config.ollamaBaseUrl, model: config.ollamaModel });
    case "qwen":
      return new QwenLLMProvider({
        apiKey: env.QWEN_API_KEY,
        baseUrl: config.qwenBaseUrl,
        model: config.qwenModel,
      });
  }
}

export function getLLMProvider(input: { env?: ProviderEnv; config?: AIProviderConfig } = {}): LLMProvider {
  const env = input.env || process.env;
  const config = input.config || getAIProviderConfig(env);
  const descriptor = LLM_PROVIDER_CATALOG[config.llmProvider];

  if (!descriptor) {
    throw new ProviderConfigurationError(`Unsupported LLM provider "${config.llmProvider}".`);
  }

  assertProviderAllowed(descriptor.capability, config);
  return createLLMProvider(config.llmProvider, config, env);
}

function baseStatus(id: LLMProviderId, config: AIProviderConfig, env: ProviderEnv): ProviderStatus {
  const descriptor = LLM_PROVIDER_CATALOG[id];
  const model = modelFor(id, config, env);
  let allowed = true;
  let message: string | undefined;
  let errorCode: string | undefined;

  try {
    assertProviderAllowed(descriptor.capability, config);
  } catch (error) {
    const normalized = normalizeProviderError(error);
    allowed = false;
    message = normalized.message;
    errorCode = normalized.code;
  }

  return {
    provider: descriptor.name,
    providerId: id,
    kind: descriptor.kind,
    configured: isConfigured(id, config, env),
    available: id === "mock" ? true : null,
    local: descriptor.capability.local,
    cloud: descriptor.capability.cloud,
    potentiallyPaid: descriptor.capability.potentiallyPaid,
    allowed,
    active: config.llmProvider === id,
    model,
    message,
    errorCode,
  };
}

async function ollamaStatus(config: AIProviderConfig, env: ProviderEnv): Promise<ProviderStatus> {
  const status = baseStatus("ollama", config, env);

  if (!status.configured) {
    return {
      ...status,
      available: false,
      message: status.message || "OLLAMA_MODEL is not configured.",
      errorCode: status.errorCode || "PROVIDER_CONFIGURATION_ERROR",
    };
  }

  try {
    const provider = new OllamaLLMProvider({ baseUrl: config.ollamaBaseUrl, model: config.ollamaModel });
    const available = await withTimeout((signal) => provider.healthCheck(signal), Math.min(config.requestTimeoutMs, 3000), "Ollama health check");
    return {
      ...status,
      available,
      message: available ? status.message : status.message || "Ollama is not reachable.",
      errorCode: available ? status.errorCode : status.errorCode || "PROVIDER_UNAVAILABLE",
    };
  } catch (error) {
    const normalized = normalizeProviderError(error);
    return {
      ...status,
      available: false,
      message: normalized.message,
      errorCode: normalized.code,
    };
  }
}

export async function getProviderStatusSnapshot(input: { env?: ProviderEnv; checkLocalHealth?: boolean } = {}): Promise<ProviderStatusSnapshot> {
  const env = input.env || process.env;
  let config: AIProviderConfig;
  let configMessage: string | undefined;
  let configErrorCode: string | undefined;

  try {
    config = getAIProviderConfig(env);
  } catch (error) {
    const normalized = normalizeProviderError(error);
    configMessage = normalized.message;
    configErrorCode = normalized.code;
    config = {
      llmProvider: "mock",
      allowPaidAI: false,
      allowCloudAI: false,
      maxRetries: 2,
      requestTimeoutMs: 60000,
      legacyClaudeCompatibility: false,
      ollamaBaseUrl: env.OLLAMA_BASE_URL?.trim() || "http://127.0.0.1:11434",
      ollamaModel: env.OLLAMA_MODEL?.trim() || null,
      qwenBaseUrl: env.QWEN_BASE_URL?.trim() || null,
      qwenModel: env.QWEN_MODEL?.trim() || null,
    };
  }

  const providers: ProviderStatus[] = [
    baseStatus("mock", config, env),
    baseStatus("claude", config, env),
    input.checkLocalHealth ? await ollamaStatus(config, env) : baseStatus("ollama", config, env),
    baseStatus("qwen", config, env),
  ].map((provider) => (configMessage ? { ...provider, active: false } : provider));

  const active = providers.find((provider) => provider.active) || providers[0];
  const llmProvider = configMessage
    ? {
        provider: "Not configured",
        providerId: "none",
        kind: "llm" as const,
        configured: false,
        available: false,
        local: false,
        cloud: false,
        potentiallyPaid: false,
        allowed: false,
        active: false,
        model: null,
        message: configMessage,
        errorCode: configErrorCode,
      }
    : active;

  return {
    activeLLMProvider: configMessage ? null : active?.providerId || null,
    llmProvider,
    providers,
    costSafety: {
      allowPaidAI: config.allowPaidAI,
      allowCloudAI: config.allowCloudAI,
      maxRetries: config.maxRetries,
      requestTimeoutMs: config.requestTimeoutMs,
    },
  };
}
