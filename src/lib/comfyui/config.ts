import { ProviderConfigurationError, ProviderCostGuardError } from "@/lib/providers/errors";
import type { ComfyUiConfig } from "@/lib/comfyui/types";

type Env = Record<string, string | undefined>;

function boolFromEnv(value: string | undefined, fallback: boolean) {
  if (!value?.trim()) return fallback;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  throw new ProviderConfigurationError(`Invalid boolean configuration: ${value}.`);
}

function intFromEnv(value: string | undefined, fallback: number, min: number, max: number) {
  if (!value?.trim()) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new ProviderConfigurationError(`Invalid ComfyUI numeric configuration: ${value}.`);
  }
  return parsed;
}

function cleanBaseUrl(value: string | undefined) {
  const raw = value?.trim() || "http://127.0.0.1:8188";
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new ProviderConfigurationError("COMFYUI_BASE_URL must be a valid absolute URL.");
  }
  if (url.protocol !== "https:" && !["127.0.0.1", "localhost"].includes(url.hostname)) {
    throw new ProviderConfigurationError("COMFYUI_BASE_URL must use HTTPS outside localhost.");
  }
  return raw.replace(/\/+$/, "");
}

export function getComfyUiConfig(env: Env = process.env): ComfyUiConfig {
  return {
    enabled: boolFromEnv(env.COMFYUI_ENABLED, false),
    baseUrl: cleanBaseUrl(env.COMFYUI_BASE_URL),
    requestTimeoutMs: intFromEnv(env.COMFYUI_REQUEST_TIMEOUT_MS, 20_000, 1_000, 120_000),
    imageWorkflowPath: env.COMFYUI_IMAGE_WORKFLOW_PATH?.trim() || null,
    videoWorkflowPath: env.COMFYUI_VIDEO_WORKFLOW_PATH?.trim() || null,
    defaultNegativePrompt:
      env.COMFYUI_DEFAULT_NEGATIVE_PROMPT?.trim() ||
      "blurry, low quality, deformed, extra limbs, bad anatomy, text, watermark",
  };
}

export function assertComfyUiEnabled(config: ComfyUiConfig) {
  if (!config.enabled) {
    throw new ProviderCostGuardError(
      "ComfyUI execution is disabled. Set COMFYUI_ENABLED=true only when the RunPod Pod is intentionally running.",
    );
  }
}
