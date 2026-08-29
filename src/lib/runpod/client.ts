import {
  ProviderAuthenticationError,
  ProviderRateLimitError,
  ProviderResponseError,
  ProviderTimeoutError,
  ProviderUnavailableError,
} from "@/lib/providers/errors";
import { assertRunPodConfigured } from "@/lib/runpod/config";
import type {
  RunPodConfig,
  RunPodHealthResponse,
  RunPodJobStatus,
  RunPodStatusResponse,
  RunPodSubmitOptions,
  RunPodSubmitResponse,
} from "@/lib/runpod/types";

function normalizeStatus(value: unknown): RunPodJobStatus {
  const status = String(value || "UNKNOWN").toUpperCase();
  switch (status) {
    case "IN_QUEUE":
    case "IN_PROGRESS":
    case "COMPLETED":
    case "FAILED":
    case "TIMED_OUT":
    case "CANCELLED":
      return status;
    default:
      return "UNKNOWN";
  }
}

export class RunPodClient {
  constructor(private readonly config: RunPodConfig) {}

  private async request<T>(endpointId: string, path: string, init: RequestInit = {}): Promise<T> {
    assertRunPodConfigured(this.config, endpointId);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.requestTimeoutMs);

    try {
      const response = await fetch(`${this.config.baseUrl}/${encodeURIComponent(endpointId)}${path}`, {
        ...init,
        headers: {
          authorization: `Bearer ${this.config.apiKey}`,
          "content-type": "application/json",
          ...(init.headers || {}),
        },
        signal: controller.signal,
        cache: "no-store",
      });

      if (response.status === 401 || response.status === 403) {
        throw new ProviderAuthenticationError("RunPod rejected the configured credentials.", { status: response.status });
      }
      if (response.status === 429) {
        throw new ProviderRateLimitError("RunPod rate limit reached.", { status: response.status });
      }
      if (response.status >= 500) {
        throw new ProviderUnavailableError(`RunPod returned HTTP ${response.status}.`, { status: response.status });
      }
      if (!response.ok) {
        const text = await response.text();
        throw new ProviderResponseError(`RunPod returned HTTP ${response.status}: ${text.slice(0, 300)}`, {
          status: response.status,
        });
      }

      const text = await response.text();
      if (!text) return {} as T;
      try {
        return JSON.parse(text) as T;
      } catch {
        throw new ProviderResponseError("RunPod returned a non-JSON response.");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new ProviderTimeoutError("RunPod request timed out.");
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  async submit(options: RunPodSubmitOptions): Promise<RunPodSubmitResponse> {
    const payload: Record<string, unknown> = {
      input: options.input,
      policy: {
        executionTimeout: options.executionTimeoutMs ?? this.config.executionTimeoutMs,
        ttl: options.ttlMs ?? this.config.jobTtlMs,
      },
    };
    if (options.webhook) payload.webhook = options.webhook;

    const result = await this.request<RunPodSubmitResponse>(options.endpointId, "/run", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!result?.id) {
      throw new ProviderResponseError("RunPod job submission did not return a job ID.");
    }
    return result;
  }

  async status(endpointId: string, jobId: string): Promise<RunPodStatusResponse> {
    const result = await this.request<Record<string, unknown>>(
      endpointId,
      `/status/${encodeURIComponent(jobId)}`,
      { method: "GET" },
    );
    return {
      ...(result as Omit<RunPodStatusResponse, "status">),
      id: String(result.id || jobId),
      status: normalizeStatus(result.status),
    };
  }

  async cancel(endpointId: string, jobId: string) {
    return this.request<Record<string, unknown>>(endpointId, `/cancel/${encodeURIComponent(jobId)}`, {
      method: "POST",
    });
  }

  async health(endpointId: string): Promise<RunPodHealthResponse> {
    return this.request<RunPodHealthResponse>(endpointId, "/health", { method: "GET" });
  }
}
