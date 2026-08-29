import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import type { LLMProvider } from "@/lib/providers/types";
import { getAIProviderConfig } from "@/lib/providers/config";
import { getLLMProvider } from "@/lib/providers/registry";
import { ProviderResponseError } from "@/lib/providers/errors";
import { completeGenerationLog, failGenerationLog, startGenerationLog } from "@/lib/generation-log";
import { runLoggedJsonGeneration } from "@/lib/ai/generation-runner";

vi.mock("@/lib/providers/config", () => ({
  getAIProviderConfig: vi.fn(),
}));

vi.mock("@/lib/providers/registry", () => ({
  getLLMProvider: vi.fn(),
}));

vi.mock("@/lib/generation-log", () => ({
  completeGenerationLog: vi.fn(),
  failGenerationLog: vi.fn(),
  startGenerationLog: vi.fn(),
}));

const schema = z.object({
  value: z.string(),
});

function provider(generateJson: LLMProvider["generateJson"]): LLMProvider {
  return {
    id: "mock",
    name: "Mock LLM",
    model: "mock-model",
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
    generateJson,
  };
}

function mockConfig() {
  vi.mocked(getAIProviderConfig).mockReturnValue({
    llmProvider: "mock",
    allowPaidAI: false,
    allowCloudAI: false,
    maxRetries: 0,
    requestTimeoutMs: 1000,
    legacyClaudeCompatibility: false,
    ollamaBaseUrl: "http://127.0.0.1:11434",
    ollamaModel: null,
    qwenBaseUrl: null,
    qwenModel: null,
  });
}

function mockAttempt() {
  vi.mocked(startGenerationLog).mockResolvedValue({ id: "log_1", startedAt: 100 });
  vi.mocked(completeGenerationLog).mockResolvedValue("log_1");
  vi.mocked(failGenerationLog).mockResolvedValue("log_1");
}

describe("runLoggedJsonGeneration", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockConfig();
    mockAttempt();
  });

  it("validates provider output and completes the generation log", async () => {
    vi.mocked(getLLMProvider).mockReturnValue(
      provider(async <T>() => ({
        data: { value: "ok" } as T,
        provider: "Mock LLM",
        providerId: "mock",
        providerKind: "llm",
        model: "mock-model",
        usage: { inputTokens: 10, outputTokens: 20 },
        costEstimate: null,
        rawText: '{"value":"ok"}',
      })),
    );

    const result = await runLoggedJsonGeneration({
      featureName: "research_desk",
      projectId: "project_1",
      system: "system",
      prompt: "prompt",
      schema,
    });

    expect(result.data).toEqual({ value: "ok" });
    expect(completeGenerationLog).toHaveBeenCalledWith(
      { id: "log_1", startedAt: 100 },
      expect.objectContaining({
        featureName: "research_desk",
        provider: "Mock LLM",
        providerId: "mock",
        providerKind: "llm",
        model: "mock-model",
        inputTokens: 10,
        outputTokens: 20,
        attemptCount: 1,
        projectId: "project_1",
      }),
    );
    expect(failGenerationLog).not.toHaveBeenCalled();
  });

  it("logs failed schema validation with a normalized response error", async () => {
    vi.mocked(getLLMProvider).mockReturnValue(
      provider(async <T>() => ({
        data: { value: 123 } as T,
        provider: "Mock LLM",
        providerId: "mock",
        providerKind: "llm",
        model: "mock-model",
        rawText: '{"value":123}',
      })),
    );

    await expect(
      runLoggedJsonGeneration({
        featureName: "research_desk",
        projectId: "project_1",
        system: "system",
        prompt: "prompt",
        schema,
      }),
    ).rejects.toThrow(ProviderResponseError);

    expect(completeGenerationLog).not.toHaveBeenCalled();
    expect(failGenerationLog).toHaveBeenCalledWith(
      { id: "log_1", startedAt: 100 },
      expect.objectContaining({
        featureName: "research_desk",
        provider: "Mock LLM",
        providerId: "mock",
        providerKind: "llm",
        model: "mock-model",
        errorCode: "PROVIDER_RESPONSE_ERROR",
        attemptCount: 1,
        projectId: "project_1",
      }),
    );
  });
});
