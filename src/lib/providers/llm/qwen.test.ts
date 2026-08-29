import { describe, expect, it } from "vitest";
import { ProviderConfigurationError, ProviderUnavailableError } from "@/lib/providers/errors";
import { QwenLLMProvider } from "@/lib/providers/llm/qwen";

describe("QwenLLMProvider", () => {
  it("requires explicit Qwen configuration", () => {
    expect(() => new QwenLLMProvider({ apiKey: "", baseUrl: null, model: null })).toThrow(ProviderConfigurationError);
  });

  it("is a guarded boundary in Phase 2", async () => {
    const provider = new QwenLLMProvider({
      apiKey: "test-key",
      baseUrl: "https://example.invalid",
      model: "qwen-test",
    });

    await expect(
      provider.generateJson({
        featureName: "test_feature",
        system: "system",
        prompt: "prompt",
      }),
    ).rejects.toThrow(ProviderUnavailableError);
    expect(provider.capability.cloud).toBe(true);
    expect(provider.capability.potentiallyPaid).toBe(true);
  });
});
