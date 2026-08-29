import {
  isProviderError,
  normalizeProviderError,
  ProviderAuthenticationError,
  ProviderConfigurationError,
  ProviderCostGuardError,
} from "@/lib/providers/errors";

export type RetryResult<T> = {
  value: T;
  attempts: number;
};

function wait(ms: number) {
  if (ms <= 0) {
    return Promise.resolve();
  }

  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isRetryableProviderFailure(error: unknown) {
  if (
    error instanceof ProviderConfigurationError ||
    error instanceof ProviderCostGuardError ||
    error instanceof ProviderAuthenticationError
  ) {
    return false;
  }

  if (isProviderError(error)) {
    return error.retryable;
  }

  return normalizeProviderError(error).retryable;
}

export async function retryProviderOperation<T>(input: {
  operation: () => Promise<T>;
  maxRetries: number;
  baseDelayMs?: number;
  shouldRetry?: (error: unknown) => boolean;
}): Promise<RetryResult<T>> {
  const shouldRetry = input.shouldRetry || isRetryableProviderFailure;
  const baseDelayMs = input.baseDelayMs ?? 200;
  let attempts = 0;

  for (;;) {
    attempts += 1;

    try {
      return {
        value: await input.operation(),
        attempts,
      };
    } catch (error) {
      const canRetry = attempts <= input.maxRetries && shouldRetry(error);

      if (!canRetry) {
        throw Object.assign(error instanceof Error ? error : normalizeProviderError(error), { attempts });
      }

      await wait(baseDelayMs * attempts);
    }
  }
}

export function getAttemptCount(error: unknown, fallback = 1) {
  if (error && typeof error === "object" && "attempts" in error && typeof error.attempts === "number") {
    return Math.max(1, error.attempts);
  }

  return fallback;
}
