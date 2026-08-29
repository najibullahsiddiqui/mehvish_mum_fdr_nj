import { describe, expect, it } from "vitest";
import { researchOutputSchema, scriptOutputSchema, thumbnailOutputSchema, uploadPackOutputSchema, performanceOutputSchema } from "@/lib/ai/schemas";
import { MockLLMProvider } from "@/lib/providers/llm/mock";
import { randomRoomsEpisodePlanOutputSchema } from "@/lib/random-rooms/schemas";

describe("MockLLMProvider", () => {
  it("returns valid structured data for existing CreatorPilot features", async () => {
    const provider = new MockLLMProvider();

    await expect(
      provider.generateJson({
        featureName: "research_desk",
        system: "system",
        prompt: "prompt",
      }).then((result) => researchOutputSchema.parse(result.data)),
    ).resolves.toBeDefined();

    await expect(
      provider.generateJson({
        featureName: "script_studio",
        system: "system",
        prompt: "prompt",
      }).then((result) => scriptOutputSchema.parse(result.data)),
    ).resolves.toBeDefined();

    await expect(
      provider.generateJson({
        featureName: "thumbnail_lab",
        system: "system",
        prompt: "prompt",
      }).then((result) => thumbnailOutputSchema.parse(result.data)),
    ).resolves.toBeDefined();

    await expect(
      provider.generateJson({
        featureName: "upload_pack",
        system: "system",
        prompt: "prompt",
      }).then((result) => uploadPackOutputSchema.parse(result.data)),
    ).resolves.toBeDefined();

    await expect(
      provider.generateJson({
        featureName: "performance_journal",
        system: "system",
        prompt: "prompt",
      }).then((result) => performanceOutputSchema.parse(result.data)),
    ).resolves.toBeDefined();

    await expect(
      provider.generateJson({
        featureName: "random_rooms_episode_plan",
        system: "system",
        prompt: "prompt",
      }).then((result) => randomRoomsEpisodePlanOutputSchema.parse(result.data)),
    ).resolves.toBeDefined();
  });

  it("is local and non-paid", () => {
    const provider = new MockLLMProvider();

    expect(provider.capability.local).toBe(true);
    expect(provider.capability.cloud).toBe(false);
    expect(provider.capability.potentiallyPaid).toBe(false);
  });
});
