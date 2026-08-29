import { ProviderConfigurationError } from "@/lib/providers/errors";

export type RenderEnv = Record<string, string | undefined>;

function boolFromEnv(value: string | undefined, fallback: boolean) {
  if (!value?.trim()) return fallback;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  throw new ProviderConfigurationError(`Invalid boolean configuration: ${value}.`);
}

function numberFromEnv(value: string | undefined, fallback: number) {
  if (!value?.trim()) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) throw new ProviderConfigurationError(`Invalid renderer numeric configuration: ${value}.`);
  return parsed;
}

export function getRenderConfig(env: RenderEnv = process.env) {
  return {
    enabled: boolFromEnv(env.RENDER_ENABLED, false),
    ffmpegPath: env.FFMPEG_PATH?.trim() || "ffmpeg",
    width: numberFromEnv(env.RENDER_WIDTH, 1080),
    height: numberFromEnv(env.RENDER_HEIGHT, 1920),
    fps: numberFromEnv(env.RENDER_FPS, 30),
    videoCrf: numberFromEnv(env.RENDER_VIDEO_CRF, 20),
    preset: env.RENDER_PRESET?.trim() || "medium",
  };
}

export function assertRenderConfigured(config = getRenderConfig()) {
  if (!config.enabled) {
    throw new ProviderConfigurationError("Local rendering is disabled. Set RENDER_ENABLED=true when you want to render final videos.");
  }
}
