import { runLoggedJsonGeneration } from "@/lib/ai/generation-runner";
import { jsonOk, parseBody, routeError } from "@/lib/api";
import { RANDOM_ROOMS_SYSTEM_PROMPT, buildEpisodePlanPrompt } from "@/lib/random-rooms/prompts";
import { randomRoomsPlanningService } from "@/lib/random-rooms/planning-service";
import { randomRoomsEpisodePlanOutputSchema } from "@/lib/random-rooms/schemas";
import { randomRoomsEpisodePlanGenerateSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const input = await parseBody(request, randomRoomsEpisodePlanGenerateSchema);
    const context = await randomRoomsPlanningService.getEpisodePlanGenerationContext(input);
    const result = await runLoggedJsonGeneration({
      featureName: "random_rooms_episode_plan",
      system: RANDOM_ROOMS_SYSTEM_PROMPT,
      prompt: buildEpisodePlanPrompt({
        series: context.series,
        premise: input.premise,
        characters: context.characters,
        relationships: context.relationships,
        room: context.room,
        targetDurationSec: input.targetDurationSec,
        notes: input.notes,
      }),
      schema: randomRoomsEpisodePlanOutputSchema,
      maxTokens: 3600,
      temperature: 0.6,
    });

    return jsonOk(
      {
        plan: result.data,
        provider: result.provider,
        providerId: result.providerId,
        model: result.model,
        usage: result.usage,
        costEstimate: result.costEstimate,
      },
      "Episode plan generated.",
    );
  } catch (error) {
    return routeError(error);
  }
}
