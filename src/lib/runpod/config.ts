import { ProviderConfigurationError } from "@/lib/providers/errors";
import type { RunPodConfig } from "@/lib/runpod/types";

function intFromEnv(value: string | undefined, fallback: number, min: number, max: number) {
  if (!value?.trim()) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new ProviderConfigurationError(`Invalid RunPod numeric configuration: ${value}.`);
  }
  return parsed;
}

function cleanBaseUrl(value: string | undefined) {
  const raw = value?.trim() || "https://api.runpod.ai/v2";
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new ProviderConfigurationError("RUNPOD_BASE_URL must be a valid absolute URL.");
  }
  if (url.protocol !== "https:" && url.hostname !== "127.0.0.1" && url.hostname !== "localhost") {
    throw new ProviderConfigurationError("RUNPOD_BASE_URL must use HTTPS outside localhost.");
  }
  return raw.replace(/\/+$/, "");
}

export function getRunPodConfig(env: NodeJS.ProcessEnv = process.env): RunPodConfig {
  return {
    apiKey: env.RUNPOD_API_KEY?.trim() || null,
    baseUrl: cleanBaseUrl(env.RUNPOD_BASE_URL),
    videoEndpointId: env.RUNPOD_VIDEO_ENDPOINT_ID?.trim() || null,
    imageEndpointId: env.RUNPOD_IMAGE_ENDPOINT_ID?.trim() || null,
    requestTimeoutMs: intFromEnv(env.RUNPOD_REQUEST_TIMEOUT_MS, 15_000, 1_000, 120_000),
    executionTimeoutMs: intFromEnv(env.RUNPOD_EXECUTION_TIMEOUT_MS, 900_000, 5_000, 604_800_000),
    jobTtlMs: intFromEnv(env.RUNPOD_JOB_TTL_MS, 3_600_000, 10_000, 604_800_000),
  };
}

export function assertRunPodConfigured(config: RunPodConfig, endpointId?: string | null) {
  if (!config.apiKey) {
    throw new ProviderConfigurationError("RUNPOD_API_KEY is not configured.");
  }
  if (!endpointId) {
    throw new ProviderConfigurationError("The requested RunPod endpoint ID is not configured.");
  }
}
