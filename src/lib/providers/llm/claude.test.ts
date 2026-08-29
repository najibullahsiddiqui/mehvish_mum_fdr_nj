import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProviderConfigurationError } from "@/lib/providers/errors";
import { ClaudeLLMProvider } from "@/lib/providers/llm/claude";

const anthropicMocks = vi.hoisted(() => ({
  create: vi.fn(),
}));

vi.mock("@anthropic-ai/sdk", () => ({
  default: class MockAnthropic {
    messages = {
      create: anthropicMocks.create,
    };
  },
}));

describe("ClaudeLLMProvider", () => {
  beforeEach(() => {
    anthropicMocks.create.mockReset();
  });

  it("requires an API key", () => {
    expect(() => new ClaudeLLMProvider({ apiKey: "", model: "claude-test" })).toThrow(ProviderConfigurationError);
  });

  it("implements the LLM JSON contract without exposing Claude to routes", async () => {
    anthropicMocks.create.mockResolvedValue({
      content: [{ type: "text", text: '{"value":"ok"}' }],
      usage: {
        input_tokens: 11,
        output_tokens: 7,
      },
    });

    const provider = new ClaudeLLMProvider({ apiKey: "test-key", model: "claude-test" });
    const result = await provider.generateJson<{ value: string }>({
      featureName: "test_feature",
      system: "system",
      prompt: "prompt",
      maxTokens: 50,
    });

    expect(result).toMatchObject({
      data: { value: "ok" },
      providerId: "claude",
      providerKind: "llm",
      model: "claude-test",
      usage: {
        inputTokens: 11,
        outputTokens: 7,
      },
    });
    expect(anthropicMocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "claude-test",
        max_tokens: 50,
      }),
      undefined,
    );
  });
});
