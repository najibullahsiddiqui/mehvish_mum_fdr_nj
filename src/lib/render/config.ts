import { ProviderConfigurationError } from "@/lib/providers/errors";

export type RenderEnv = Record<string, string | undefined>;

function boolFromEnv(value: string | undefined, fallback: boolean) {
  if (!value?.trim()) return fallback;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  throw new ProviderConfigurationError(`Invalid boolean configuration: ${value}.`);
}

export function getRenderConfig(env: RenderEnv = process.env) {
  return {
    enabled: boolFromEnv(env.RENDER_ENABLED, false),
    ffmpegPath: env.FFMPEG_PATH?.trim() || "ffmpeg",
    width: Number(env.RENDER_WIDTH || 1080),
    height: Number(env.RENDER_HEIGHT || 1920),
    fps: Number(env.RENDER_FPS || 30),
    videoCrf: Number(env.RENDER_VIDEO_CRF || 20),
    preset: env.RENDER_PRESET?.trim() || "medium",
  };
}

export function assertRenderConfigured(config = getRenderConfig()) {
  if (!config.enabled) {
    throw new ProviderConfigurationError("Local rendering is disabled. Set RENDER_ENABLED=true when you want to render final videos.");
  }
  for (const [name, value] of [["RENDER_WIDTH", config.width], ["RENDER_HEIGHT", config.height], ["RENDER_FPS", config.fps]]) {
    if (!Number.isFinite(value) || value <= 0) throw new ProviderConfigurationError(`${name} must be a positive number.`);
  }
}
