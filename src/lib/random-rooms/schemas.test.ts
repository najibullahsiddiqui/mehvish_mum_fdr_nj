import { describe, expect, it } from "vitest";
import { randomRoomsEpisodePlanOutputSchema } from "@/lib/random-rooms/schemas";

describe("random rooms structured generation schemas", () => {
  it("accepts a compact structured episode plan", () => {
    expect(
      randomRoomsEpisodePlanOutputSchema.parse({
        title: "Rex Gets Fired",
        hook: "Rex builds replacement automation.",
        comedyAngle: "Automation replaces the person who wrote the policy.",
        scenes: [
          {
            purpose: "HOOK",
            title: "The Pitch",
            summary: "Rex pitches the dashboard.",
            beat: "Confidence before consequence.",
            durationSec: 7,
            roomCode: "AI_OFFICE",
            shots: [
              {
                shotType: "intro",
                cameraFraming: "medium",
                cameraMovement: "push_in",
                actionDescription: "Rex points at the dashboard.",
                visualDescription: "Glass office and central table.",
                imagePrompt: "Rex presenting an AI dashboard.",
                videoPrompt: "Slow push-in on Rex.",
                durationSec: 3,
                emotion: "confident",
              },
            ],
            dialogue: [
              {
                characterCode: "REX",
                text: "Obviously this is under control.",
              },
            ],
          },
        ],
      }),
    ).toBeDefined();
  });

  it("rejects invalid structured generation output", () => {
    expect(
      randomRoomsEpisodePlanOutputSchema.safeParse({
        title: "Bad Plan",
        hook: "Missing useful structure.",
        comedyAngle: "None.",
        scenes: [
          {
            purpose: "RENDER",
            title: "",
            summary: "Bad scene.",
            beat: "Bad beat.",
            durationSec: 0,
            shots: [],
            dialogue: [],
          },
        ],
      }).success,
    ).toBe(false);
  });
});
