import { describe, expect, it } from "vitest";
import {
  normalizeProviderError,
  ProviderAuthenticationError,
  ProviderCostGuardError,
  ProviderResponseError,
  ProviderTimeoutError,
  redactProviderMessage,
} from "@/lib/providers/errors";

describe("provider errors", () => {
  it("redacts common secret shapes", () => {
    expect(redactProviderMessage("token sk-ant-secret123 and Bearer abc.def api_key=secret")).not.toContain("secret123");
    expect(redactProviderMessage("token sk-ant-secret123 and Bearer abc.def api_key=secret")).toContain("[redacted]");
  });

  it("normalizes timeout and authentication errors", () => {
    expect(normalizeProviderError(new Error("request timeout"))).toBeInstanceOf(ProviderTimeoutError);
    expect(normalizeProviderError(new Error("invalid api key"))).toBeInstanceOf(ProviderAuthenticationError);
  });

  it("keeps normalized provider errors unchanged", () => {
    const error = new ProviderCostGuardError("Paid AI blocked.");

    expect(normalizeProviderError(error)).toBe(error);
    expect(error.retryable).toBe(false);
  });

  it("marks provider response errors as retryable", () => {
    const error = new ProviderResponseError("Malformed JSON");

    expect(error.retryable).toBe(true);
    expect(error.code).toBe("PROVIDER_RESPONSE_ERROR");
  });
});
