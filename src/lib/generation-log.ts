import { prisma } from "@/lib/prisma";
import type { GenerationLogStatus } from "@/lib/types";
import { normalizeProviderError, redactProviderMessage } from "@/lib/providers/errors";

const FALLBACK_PROVIDER = "unknown";
const FALLBACK_MODEL = "unknown";

function durationMs(startedAt: number) {
  return Math.max(0, Date.now() - startedAt);
}

export function sanitizeGenerationError(error: unknown) {
  const message = error instanceof Error ? error.message : "Generation failed.";
  return redactProviderMessage(message).slice(0, 500);
}

async function safeCreateLog(input: {
  featureName: string;
  provider: string;
  providerId?: string | null;
  providerKind?: string | null;
  model: string;
  status: GenerationLogStatus;
  attemptCount?: number | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  costEstimate?: number | null;
  durationMs?: number | null;
  projectId?: string | null;
}) {
  try {
    const log = await prisma.generationLog.create({
      data: {
        featureName: input.featureName,
        provider: input.provider,
        providerId: input.providerId ?? null,
        providerKind: input.providerKind ?? null,
        model: input.model,
        status: input.status,
        attemptCount: input.attemptCount ?? null,
        errorCode: input.errorCode ?? null,
        errorMessage: input.errorMessage ?? null,
        inputTokens: input.inputTokens ?? null,
        outputTokens: input.outputTokens ?? null,
        costEstimate: input.costEstimate ?? null,
        durationMs: input.durationMs ?? null,
        projectId: input.projectId || undefined,
      },
      select: { id: true },
    });

    return log.id;
  } catch (error) {
    console.warn("Failed to write generation log.", sanitizeGenerationError(error));
    return null;
  }
}

async function safeUpdateLog(
  id: string | null,
  input: {
    featureName: string;
    provider: string;
    providerId?: string | null;
    providerKind?: string | null;
    model: string;
    status: GenerationLogStatus;
    attemptCount?: number | null;
    errorCode?: string | null;
    errorMessage?: string | null;
    inputTokens?: number | null;
    outputTokens?: number | null;
    costEstimate?: number | null;
    durationMs?: number | null;
    projectId?: string | null;
  },
) {
  if (!id) {
    return safeCreateLog(input);
  }

  try {
    await prisma.generationLog.update({
      where: { id },
      data: {
        provider: input.provider,
        providerId: input.providerId ?? null,
        providerKind: input.providerKind ?? null,
        model: input.model,
        status: input.status,
        attemptCount: input.attemptCount ?? null,
        errorCode: input.errorCode ?? null,
        errorMessage: input.errorMessage ?? null,
        inputTokens: input.inputTokens ?? null,
        outputTokens: input.outputTokens ?? null,
        costEstimate: input.costEstimate ?? null,
        durationMs: input.durationMs ?? null,
      },
    });

    return id;
  } catch (error) {
    console.warn("Failed to update generation log.", sanitizeGenerationError(error));
    return null;
  }
}

export async function startGenerationLog(input: {
  featureName: string;
  projectId?: string | null;
  provider?: string;
  providerId?: string | null;
  providerKind?: string | null;
  model?: string;
}) {
  const startedAt = Date.now();
  const id = await safeCreateLog({
    featureName: input.featureName,
    provider: input.provider || FALLBACK_PROVIDER,
    providerId: input.providerId,
    providerKind: input.providerKind,
    model: input.model || FALLBACK_MODEL,
    status: "STARTED",
    attemptCount: 0,
    projectId: input.projectId,
  });

  return { id, startedAt };
}

export async function completeGenerationLog(
  attempt: { id: string | null; startedAt: number },
  input: {
    featureName: string;
    provider: string;
    providerId?: string | null;
    providerKind?: string | null;
    model: string;
    inputTokens?: number | null;
    outputTokens?: number | null;
    costEstimate?: number | null;
    attemptCount?: number | null;
    projectId?: string | null;
  },
) {
  return safeUpdateLog(attempt.id, {
    featureName: input.featureName,
    provider: input.provider,
    providerId: input.providerId,
    providerKind: input.providerKind,
    model: input.model,
    status: "SUCCESS",
    attemptCount: input.attemptCount ?? 1,
    inputTokens: input.inputTokens ?? null,
    outputTokens: input.outputTokens ?? null,
    costEstimate: input.costEstimate ?? null,
    durationMs: durationMs(attempt.startedAt),
    projectId: input.projectId,
  });
}

export async function failGenerationLog(
  attempt: { id: string | null; startedAt: number },
  input: {
    featureName: string;
    provider?: string;
    providerId?: string | null;
    providerKind?: string | null;
    model?: string;
    error: unknown;
    errorCode?: string | null;
    attemptCount?: number | null;
    projectId?: string | null;
  },
) {
  const normalized = normalizeProviderError(input.error);

  return safeUpdateLog(attempt.id, {
    featureName: input.featureName,
    provider: input.provider || FALLBACK_PROVIDER,
    providerId: input.providerId,
    providerKind: input.providerKind,
    model: input.model || FALLBACK_MODEL,
    status: "FAILED",
    attemptCount: input.attemptCount ?? 1,
    errorCode: input.errorCode || normalized.code,
    errorMessage: sanitizeGenerationError(normalized),
    durationMs: durationMs(attempt.startedAt),
    projectId: input.projectId,
  });
}

export async function logGeneration(input: {
  featureName: string;
  provider: string;
  providerId?: string | null;
  providerKind?: string | null;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  costEstimate?: number;
  attemptCount?: number | null;
  projectId?: string | null;
}) {
  return safeCreateLog({
    featureName: input.featureName,
    provider: input.provider,
    providerId: input.providerId,
    providerKind: input.providerKind,
    model: input.model,
    status: "SUCCESS",
    attemptCount: input.attemptCount ?? 1,
    inputTokens: input.inputTokens ?? null,
    outputTokens: input.outputTokens ?? null,
    costEstimate: input.costEstimate ?? null,
    projectId: input.projectId,
  });
}
