import { ProviderConfigurationError } from "@/lib/providers/errors";

export const MEDIA_GENERATION_PROVIDERS = ["runpod-serverless", "comfyui"] as const;
export type MediaGenerationProviderName = (typeof MEDIA_GENERATION_PROVIDERS)[number];

export function getMediaGenerationProvider(
  env: Record<string, string | undefined> = process.env,
): MediaGenerationProviderName {
  const value = (env.MEDIA_GENERATION_PROVIDER || "runpod-serverless").trim().toLowerCase();
  if (MEDIA_GENERATION_PROVIDERS.includes(value as MediaGenerationProviderName)) {
    return value as MediaGenerationProviderName;
  }
  throw new ProviderConfigurationError(
    `MEDIA_GENERATION_PROVIDER must be one of: ${MEDIA_GENERATION_PROVIDERS.join(", ")}.`,
  );
}
