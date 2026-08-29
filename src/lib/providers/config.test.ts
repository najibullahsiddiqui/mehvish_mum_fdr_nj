import { describe, expect, it } from "vitest";
import { assertProviderAllowed, getAIProviderConfig, resolveLLMProviderId } from "@/lib/providers/config";
import { ProviderConfigurationError, ProviderCostGuardError } from "@/lib/providers/errors";
import { LLM_PROVIDER_CATALOG } from "@/lib/providers/catalog";

describe("provider config", () => {
  it("uses mock as the default test provider", () => {
    expect(resolveLLMProviderId({ NODE_ENV: "test" })).toBe("mock");
  });

  it("keeps legacy Claude inference when an API key exists", () => {
    const config = getAIProviderConfig({ CLAUDE_API_KEY: "test-key" });

    expect(config.llmProvider).toBe("claude");
    expect(config.allowPaidAI).toBe(true);
    expect(config.allowCloudAI).toBe(true);
    expect(config.legacyClaudeCompatibility).toBe(true);
  });

  it("honors explicit provider and safety settings", () => {
    const config = getAIProviderConfig({
      LLM_PROVIDER: "ollama",
      ALLOW_PAID_AI: "false",
      ALLOW_CLOUD_AI: "false",
      AI_MAX_RETRIES: "3",
      AI_REQUEST_TIMEOUT_MS: "12000",
      OLLAMA_MODEL: "llama3.1",
    });

    expect(config.llmProvider).toBe("ollama");
    expect(config.allowPaidAI).toBe(false);
    expect(config.allowCloudAI).toBe(false);
    expect(config.maxRetries).toBe(3);
    expect(config.requestTimeoutMs).toBe(12000);
  });

  it("rejects unsupported providers", () => {
    expect(() => resolveLLMProviderId({ LLM_PROVIDER: "surprise" })).toThrow(ProviderConfigurationError);
  });

  it("rejects invalid retry and timeout configuration", () => {
    expect(() => getAIProviderConfig({ LLM_PROVIDER: "mock", AI_MAX_RETRIES: "1.5" })).toThrow(ProviderConfigurationError);
    expect(() => getAIProviderConfig({ LLM_PROVIDER: "mock", AI_REQUEST_TIMEOUT_MS: "-1" })).toThrow(ProviderConfigurationError);
  });

  it("blocks paid and cloud providers when guards are disabled", () => {
    expect(() =>
      assertProviderAllowed(LLM_PROVIDER_CATALOG.claude.capability, {
        allowPaidAI: false,
        allowCloudAI: true,
      }),
    ).toThrow(ProviderCostGuardError);

    expect(() =>
      assertProviderAllowed(LLM_PROVIDER_CATALOG.claude.capability, {
        allowPaidAI: true,
        allowCloudAI: false,
      }),
    ).toThrow(ProviderCostGuardError);
  });

  it("allows local non-paid providers under strict guards", () => {
    expect(() =>
      assertProviderAllowed(LLM_PROVIDER_CATALOG.mock.capability, {
        allowPaidAI: false,
        allowCloudAI: false,
      }),
    ).not.toThrow();
  });
});
