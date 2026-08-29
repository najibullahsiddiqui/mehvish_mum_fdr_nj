export type ProviderErrorCode =
  | "PROVIDER_CONFIGURATION_ERROR"
  | "PROVIDER_UNAVAILABLE"
  | "PROVIDER_TIMEOUT"
  | "PROVIDER_RATE_LIMIT"
  | "PROVIDER_AUTHENTICATION_ERROR"
  | "PROVIDER_RESPONSE_ERROR"
  | "PROVIDER_COST_GUARD";

export function redactProviderMessage(value: string) {
  return value
    .replace(/sk-ant-[A-Za-z0-9_-]+/g, "[redacted]")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [redacted]")
    .replace(/(api[_-]?key["'\s:=]+)[A-Za-z0-9._-]+/gi, "$1[redacted]")
    .slice(0, 700);
}

export class ProviderError extends Error {
  constructor(
    message: string,
    public code: ProviderErrorCode,
    public status: number,
    public retryable: boolean,
    public diagnostics?: Record<string, unknown>,
  ) {
    super(redactProviderMessage(message));
    this.name = "ProviderError";
  }
}

export class ProviderConfigurationError extends ProviderError {
  constructor(message: string, diagnostics?: Record<string, unknown>) {
    super(message, "PROVIDER_CONFIGURATION_ERROR", 500, false, diagnostics);
    this.name = "ProviderConfigurationError";
  }
}

export class ProviderUnavailableError extends ProviderError {
  constructor(message: string, diagnostics?: Record<string, unknown>) {
    super(message, "PROVIDER_UNAVAILABLE", 503, true, diagnostics);
    this.name = "ProviderUnavailableError";
  }
}

export class ProviderTimeoutError extends ProviderError {
  constructor(message = "The provider request timed out.", diagnostics?: Record<string, unknown>) {
    super(message, "PROVIDER_TIMEOUT", 504, true, diagnostics);
    this.name = "ProviderTimeoutError";
  }
}

export class ProviderRateLimitError extends ProviderError {
  constructor(message = "The provider rate limit was reached.", diagnostics?: Record<string, unknown>) {
    super(message, "PROVIDER_RATE_LIMIT", 429, true, diagnostics);
    this.name = "ProviderRateLimitError";
  }
}

export class ProviderAuthenticationError extends ProviderError {
  constructor(message = "The provider rejected the configured credentials.", diagnostics?: Record<string, unknown>) {
    super(message, "PROVIDER_AUTHENTICATION_ERROR", 401, false, diagnostics);
    this.name = "ProviderAuthenticationError";
  }
}

export class ProviderResponseError extends ProviderError {
  constructor(message = "The provider returned an invalid response.", diagnostics?: Record<string, unknown>) {
    super(message, "PROVIDER_RESPONSE_ERROR", 502, true, diagnostics);
    this.name = "ProviderResponseError";
  }
}

export class ProviderCostGuardError extends ProviderError {
  constructor(message: string, diagnostics?: Record<string, unknown>) {
    super(message, "PROVIDER_COST_GUARD", 403, false, diagnostics);
    this.name = "ProviderCostGuardError";
  }
}

export function isProviderError(error: unknown): error is ProviderError {
  return error instanceof ProviderError;
}

export function normalizeProviderError(error: unknown): ProviderError {
  if (isProviderError(error)) {
    return error;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes("timeout") || error.name === "AbortError") {
      return new ProviderTimeoutError(error.message);
    }

    if (message.includes("rate limit") || message.includes("too many requests")) {
      return new ProviderRateLimitError(error.message);
    }

    if (message.includes("unauthorized") || message.includes("authentication") || message.includes("api key")) {
      return new ProviderAuthenticationError(error.message);
    }

    if (message.includes("fetch failed") || message.includes("econnrefused") || message.includes("enotfound")) {
      return new ProviderUnavailableError(error.message);
    }

    return new ProviderResponseError(error.message);
  }

  return new ProviderResponseError("The provider failed with an unknown error.");
}
