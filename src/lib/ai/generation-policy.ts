import { ProviderConfigurationError } from "@/lib/providers/errors";

export const LLM_GENERATION_FEATURES = [
  "research_desk",
  "script_studio",
  "thumbnail_lab",
  "upload_pack",
  "performance_journal",
  "random_rooms_episode_plan",
] as const;

export type LLMGenerationFeature = (typeof LLM_GENERATION_FEATURES)[number];

export function assertLLMGenerationFeature(featureName: string): asserts featureName is LLMGenerationFeature {
  if (!LLM_GENERATION_FEATURES.includes(featureName as LLMGenerationFeature)) {
    throw new ProviderConfigurationError(`${featureName} is not configured for LLM generation.`);
  }
}
