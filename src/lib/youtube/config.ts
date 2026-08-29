import { ProviderConfigurationError } from "@/lib/providers/errors";

export type YouTubeEnv = Record<string, string | undefined>;

function boolFromEnv(value: string | undefined, fallback: boolean) {
  if (!value?.trim()) return fallback;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  throw new ProviderConfigurationError(`Invalid boolean configuration: ${value}.`);
}

export function getYouTubeConfig(env: YouTubeEnv = process.env) {
  return {
    enabled: boolFromEnv(env.YOUTUBE_PUBLISH_ENABLED, false),
    analyticsEnabled: boolFromEnv(env.YOUTUBE_ANALYTICS_ENABLED, false),
    clientId: env.YOUTUBE_CLIENT_ID?.trim() || "",
    clientSecret: env.YOUTUBE_CLIENT_SECRET?.trim() || "",
    refreshToken: env.YOUTUBE_REFRESH_TOKEN?.trim() || "",
    categoryId: env.YOUTUBE_CATEGORY_ID?.trim() || "24",
    defaultPrivacy: env.YOUTUBE_DEFAULT_PRIVACY?.trim() || "private",
    containsSyntheticMedia: boolFromEnv(env.YOUTUBE_CONTAINS_SYNTHETIC_MEDIA, true),
    selfDeclaredMadeForKids: boolFromEnv(env.YOUTUBE_MADE_FOR_KIDS, false),
    requestTimeoutMs: Number(env.YOUTUBE_REQUEST_TIMEOUT_MS || 120000),
  };
}

export function assertYouTubeConfigured(config = getYouTubeConfig(), purpose: "publish" | "analytics" = "publish") {
  const enabled = purpose === "publish" ? config.enabled : config.analyticsEnabled;
  if (!enabled) throw new ProviderConfigurationError(`YouTube ${purpose} is disabled.`);
  if (!config.clientId || !config.clientSecret || !config.refreshToken) {
    throw new ProviderConfigurationError("YouTube OAuth client ID, client secret, and refresh token are required.");
  }
  if (!Number.isFinite(config.requestTimeoutMs) || config.requestTimeoutMs <= 0) {
    throw new ProviderConfigurationError("YOUTUBE_REQUEST_TIMEOUT_MS must be a positive number.");
  }
  if (!["private", "unlisted", "public"].includes(config.defaultPrivacy)) {
    throw new ProviderConfigurationError("YOUTUBE_DEFAULT_PRIVACY must be private, unlisted, or public.");
  }
}

export function publicYouTubeStatus(env: YouTubeEnv = process.env) {
  const config = getYouTubeConfig(env);
  return {
    publishEnabled: config.enabled,
    analyticsEnabled: config.analyticsEnabled,
    configured: !!config.clientId && !!config.clientSecret && !!config.refreshToken,
    categoryId: config.categoryId,
    defaultPrivacy: config.defaultPrivacy,
    containsSyntheticMedia: config.containsSyntheticMedia,
    selfDeclaredMadeForKids: config.selfDeclaredMadeForKids,
  };
}
