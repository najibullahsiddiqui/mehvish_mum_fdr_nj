import { afterEach, describe, expect, it, vi } from "vitest";
import { ProviderCostGuardError } from "@/lib/providers/errors";
import { getLLMProvider, getProviderStatusSnapshot } from "@/lib/providers/registry";

describe("provider registry", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("selects the mock provider under strict cost guards", () => {
    const provider = getLLMProvider({
      env: {
        LLM_PROVIDER: "mock",
        ALLOW_PAID_AI: "false",
        ALLOW_CLOUD_AI: "false",
      },
    });

    expect(provider.id).toBe("mock");
    expect(provider.capability.local).toBe(true);
  });

  it("blocks Claude unless paid and cloud AI are explicitly allowed", () => {
    expect(() =>
      getLLMProvider({
        env: {
          LLM_PROVIDER: "claude",
          CLAUDE_API_KEY: "test-key",
          ALLOW_PAID_AI: "false",
          ALLOW_CLOUD_AI: "true",
        },
      }),
    ).toThrow(ProviderCostGuardError);
  });

  it("returns safe status without exposing secret values", async () => {
    const status = await getProviderStatusSnapshot({
      env: {
        LLM_PROVIDER: "claude",
        CLAUDE_API_KEY: "secret-key",
        CLAUDE_MODEL: "claude-test",
        ALLOW_PAID_AI: "true",
        ALLOW_CLOUD_AI: "true",
      },
    });

    expect(status.activeLLMProvider).toBe("claude");
    expect(status.llmProvider.model).toBe("claude-test");
    expect(JSON.stringify(status)).not.toContain("secret-key");
  });

  it("reports no active provider when configuration cannot be inferred", async () => {
    const status = await getProviderStatusSnapshot({ env: {} });

    expect(status.activeLLMProvider).toBeNull();
    expect(status.llmProvider.providerId).toBe("none");
    expect(status.llmProvider.allowed).toBe(false);
    expect(status.providers.every((provider) => !provider.active)).toBe(true);
  });

  it("health-checks Ollama without requiring it to be installed", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
    } as Response);

    const status = await getProviderStatusSnapshot({
      checkLocalHealth: true,
      env: {
        LLM_PROVIDER: "ollama",
        OLLAMA_MODEL: "llama3.1",
        ALLOW_PAID_AI: "false",
        ALLOW_CLOUD_AI: "false",
      },
    });

    expect(fetchMock).toHaveBeenCalledWith("http://127.0.0.1:11434/api/tags", expect.any(Object));
    expect(status.llmProvider.providerId).toBe("ollama");
    expect(status.llmProvider.available).toBe(false);
  });
});
