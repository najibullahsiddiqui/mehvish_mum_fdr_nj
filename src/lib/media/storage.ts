import { mkdir } from "node:fs/promises";
import path from "node:path";
import { ProviderConfigurationError } from "@/lib/providers/errors";

const SEGMENT_PATTERN = /[^a-zA-Z0-9._-]+/g;

export function getMediaRoot(env: NodeJS.ProcessEnv = process.env) {
  return path.resolve(env.MEDIA_ROOT?.trim() || "outputs");
}

export function safeMediaSegment(value: string, fallback = "item") {
  const cleaned = value.trim().replace(SEGMENT_PATTERN, "-").replace(/^-+|-+$/g, "").slice(0, 96);
  return cleaned || fallback;
}

export function resolveMediaPath(parts: string[], env: NodeJS.ProcessEnv = process.env) {
  const root = getMediaRoot(env);
  const target = path.resolve(root, ...parts.map((part) => safeMediaSegment(part)));
  if (target !== root && !target.startsWith(`${root}${path.sep}`)) {
    throw new ProviderConfigurationError("Resolved media path escapes MEDIA_ROOT.");
  }
  return target;
}

export function episodeMediaDirectory(seriesSlug: string, episodeCode: string, category: string, env: NodeJS.ProcessEnv = process.env) {
  return resolveMediaPath(["random-rooms", seriesSlug, "episodes", episodeCode, category], env);
}

export async function ensureEpisodeMediaDirectory(
  seriesSlug: string,
  episodeCode: string,
  category: string,
  env: NodeJS.ProcessEnv = process.env,
) {
  const directory = episodeMediaDirectory(seriesSlug, episodeCode, category, env);
  await mkdir(directory, { recursive: true });
  return directory;
}
