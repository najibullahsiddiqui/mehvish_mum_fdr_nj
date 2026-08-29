import { ProviderConfigurationError, ProviderCostGuardError } from "@/lib/providers/errors";

export type LocalTtsConfig = {
  enabled: boolean;
  baseUrl: string;
  speechPath: string;
  model: string;
  defaultVoice: string;
  timeoutMs: number;
};

type EnvLike = Record<string, string | undefined>;

function boolFromEnv(value: string | undefined, fallback: boolean) {
  if (!value?.trim()) return fallback;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  throw new ProviderConfigurationError(`Invalid boolean configuration: ${value}.`);
}

function timeoutFromEnv(value: string | undefined) {
  if (!value?.trim()) return 120_000;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1_000 || parsed > 900_000) {
    throw new ProviderConfigurationError("LOCAL_TTS_TIMEOUT_MS must be between 1000 and 900000.");
  }
  return parsed;
}

export function getLocalTtsConfig(env: EnvLike = process.env): LocalTtsConfig {
  const rawBase = env.LOCAL_TTS_BASE_URL?.trim() || "http://127.0.0.1:8880";
  let parsed: URL;
  try {
    parsed = new URL(rawBase);
  } catch {
    throw new ProviderConfigurationError("LOCAL_TTS_BASE_URL must be a valid absolute URL.");
  }
  if (!["127.0.0.1", "localhost"].includes(parsed.hostname)) {
    throw new ProviderConfigurationError("Local TTS must bind to localhost in this phase.");
  }

  const speechPath = env.LOCAL_TTS_SPEECH_PATH?.trim() || "/v1/audio/speech";
  if (!speechPath.startsWith("/")) throw new ProviderConfigurationError("LOCAL_TTS_SPEECH_PATH must start with '/'.");

  return {
    enabled: boolFromEnv(env.LOCAL_TTS_ENABLED, false),
    baseUrl: rawBase.replace(/\/+$/, ""),
    speechPath,
    model: env.LOCAL_TTS_MODEL?.trim() || "kokoro",
    defaultVoice: env.LOCAL_TTS_DEFAULT_VOICE?.trim() || "af_heart",
    timeoutMs: timeoutFromEnv(env.LOCAL_TTS_TIMEOUT_MS),
  };
}

export function assertLocalTtsEnabled(config: LocalTtsConfig) {
  if (!config.enabled) {
    throw new ProviderCostGuardError("Local TTS execution is disabled. Set LOCAL_TTS_ENABLED=true when the local service is ready.");
  }
}
