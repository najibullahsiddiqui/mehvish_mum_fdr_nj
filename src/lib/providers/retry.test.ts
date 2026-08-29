import { describe, expect, it, vi } from "vitest";
import { ProviderAuthenticationError, ProviderResponseError } from "@/lib/providers/errors";
import { retryProviderOperation } from "@/lib/providers/retry";

describe("retryProviderOperation", () => {
  it("retries retryable provider failures with bounded attempts", async () => {
    const operation = vi
      .fn()
      .mockRejectedValueOnce(new ProviderResponseError("Bad JSON"))
      .mockResolvedValueOnce("ok");

    const result = await retryProviderOperation({
      operation,
      maxRetries: 2,
      baseDelayMs: 0,
    });

    expect(result).toEqual({ value: "ok", attempts: 2 });
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it("does not retry non-retryable authentication failures", async () => {
    const operation = vi.fn().mockRejectedValue(new ProviderAuthenticationError("Bad key"));

    await expect(
      retryProviderOperation({
        operation,
        maxRetries: 2,
        baseDelayMs: 0,
      }),
    ).rejects.toThrow(ProviderAuthenticationError);

    expect(operation).toHaveBeenCalledTimes(1);
  });
});
