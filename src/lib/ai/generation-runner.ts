import { ZodError, type ZodType } from "zod";
import { assertLLMGenerationFeature } from "@/lib/ai/generation-policy";
import { getAIProviderConfig } from "@/lib/providers/config";
import { LLM_PROVIDER_CATALOG } from "@/lib/providers/catalog";
import { normalizeProviderError, ProviderResponseError } from "@/lib/providers/errors";
import { getLLMProvider } from "@/lib/providers/registry";
import { getAttemptCount, retryProviderOperation } from "@/lib/providers/retry";
import { withTimeout } from "@/lib/providers/timeout";
import { completeGenerationLog, failGenerationLog, startGenerationLog } from "@/lib/generation-log";

export async function runLoggedJsonGeneration<T>(input: {
  featureName: string;
  projectId?: string | null;
  system: string;
  prompt: string;
  schema: ZodType<T>;
  maxTokens?: number;
  temperature?: number;
}) {
  const attempt = await startGenerationLog({
    featureName: input.featureName,
    projectId: input.projectId,
  });

  let providerName: string | undefined;
  let providerId: string | undefined;
  let providerKind: string | undefined;
  let modelName: string | undefined;
  let attemptCount = 1;

  try {
    assertLLMGenerationFeature(input.featureName);
    const config = getAIProviderConfig();
    const descriptor = LLM_PROVIDER_CATALOG[config.llmProvider];
    providerName = descriptor.name;
    providerId = descriptor.id;
    providerKind = descriptor.kind;
    modelName = descriptor.defaultModel || undefined;

    const provider = getLLMProvider({ config });
    providerName = provider.name;
    providerId = provider.id;
    providerKind = provider.capability.kind;
    modelName = provider.model;

    const { value, attempts } = await retryProviderOperation({
      maxRetries: config.maxRetries,
      operation: async () =>
        withTimeout(
          async (signal) => {
            const result = await provider.generateJson<unknown>({
              featureName: input.featureName,
              system: input.system,
              prompt: input.prompt,
              maxTokens: input.maxTokens,
              temperature: input.temperature,
              signal,
            });

            try {
              const data = input.schema.parse(result.data);
              return { result, data };
            } catch (error) {
              if (error instanceof ZodError) {
                throw new ProviderResponseError("Provider returned JSON that did not match the required schema.", {
                  issues: error.issues.map((issue) => issue.path.join(".")),
                });
              }

              throw error;
            }
          },
          config.requestTimeoutMs,
          `${provider.id} ${input.featureName}`,
        ),
    });
    attemptCount = attempts;

    await completeGenerationLog(attempt, {
      featureName: input.featureName,
      provider: value.result.provider,
      providerId: value.result.providerId,
      providerKind: value.result.providerKind,
      model: value.result.model,
      inputTokens: value.result.usage?.inputTokens,
      outputTokens: value.result.usage?.outputTokens,
      costEstimate: value.result.costEstimate,
      attemptCount,
      projectId: input.projectId,
    });

    return {
      data: value.data,
      provider: value.result.provider,
      providerId: value.result.providerId,
      providerKind: value.result.providerKind,
      model: value.result.model,
      usage: value.result.usage,
      costEstimate: value.result.costEstimate,
      rawText: value.result.rawText,
      attemptCount,
    };
  } catch (error) {
    const normalized = normalizeProviderError(error);
    attemptCount = getAttemptCount(error, attemptCount);

    await failGenerationLog(attempt, {
      featureName: input.featureName,
      provider: providerName,
      providerId,
      providerKind,
      model: modelName,
      error: normalized,
      errorCode: normalized.code,
      attemptCount,
      projectId: input.projectId,
    });
    throw normalized;
  }
}
