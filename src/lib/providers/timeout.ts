import { normalizeProviderError, ProviderTimeoutError } from "@/lib/providers/errors";

export async function withTimeout<T>(
  task: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
  label = "provider request",
): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      task(controller.signal),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          reject(new ProviderTimeoutError(`${label} timed out after ${timeoutMs}ms.`));
        }, timeoutMs);
      }),
    ]);
  } catch (error) {
    if (controller.signal.aborted) {
      throw new ProviderTimeoutError(`${label} timed out after ${timeoutMs}ms.`);
    }

    throw normalizeProviderError(error);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}
