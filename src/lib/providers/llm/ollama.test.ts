import { afterEach, describe, expect, it, vi } from "vitest";
import { ProviderConfigurationError } from "@/lib/providers/errors";
import { OllamaLLMProvider } from "@/lib/providers/llm/ollama";

describe("OllamaLLMProvider", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("requires a configured model", () => {
    expect(() => new OllamaLLMProvider({ model: null })).toThrow(ProviderConfigurationError);
  });

  it("calls the local Ollama generate endpoint and parses JSON", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        response: '{"value":"ok"}',
        prompt_eval_count: 4,
        eval_count: 5,
      }),
    } as Response);

    const provider = new OllamaLLMProvider({ model: "llama3.1", baseUrl: "http://127.0.0.1:11434" });
    const result = await provider.generateJson<{ value: string }>({
      featureName: "test_feature",
      system: "system",
      prompt: "prompt",
    });

    expect(result.data).toEqual({ value: "ok" });
    expect(result.providerId).toBe("ollama");
    expect(result.costEstimate).toBeNull();
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:11434/api/generate",
      expect.objectContaining({
        method: "POST",
      }),
    );
  });
});
