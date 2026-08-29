import { describe, expect, it } from "vitest";
import { assertLLMGenerationFeature } from "@/lib/ai/generation-policy";
import { ProviderConfigurationError } from "@/lib/providers/errors";

describe("generation policy", () => {
  it("allows explicit LLM generation features", () => {
    expect(() => assertLLMGenerationFeature("research_desk")).not.toThrow();
    expect(() => assertLLMGenerationFeature("script_studio")).not.toThrow();
    expect(() => assertLLMGenerationFeature("random_rooms_episode_plan")).not.toThrow();
  });

  it("blocks deterministic operations from using the LLM runner", () => {
    expect(() => assertLLMGenerationFeature("markdown_export")).toThrow(ProviderConfigurationError);
    expect(() => assertLLMGenerationFeature("status_transition")).toThrow(ProviderConfigurationError);
  });
});
