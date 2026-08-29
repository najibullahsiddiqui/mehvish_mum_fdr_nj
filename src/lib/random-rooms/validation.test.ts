import { describe, expect, it } from "vitest";
import {
  randomRoomsCharacterCreateSchema,
  randomRoomsCharacterUpdateSchema,
  randomRoomsDialogueLineCreateSchema,
  randomRoomsEpisodeCharacterCreateSchema,
  randomRoomsEpisodeCreateSchema,
  randomRoomsEpisodePlanGenerateSchema,
  randomRoomsReorderSchema,
  randomRoomsRelationshipCreateSchema,
  randomRoomsRoomCreateSchema,
  randomRoomsRoomUpdateSchema,
  randomRoomsSceneCreateSchema,
  randomRoomsShotCreateSchema,
  randomRoomsSeriesCreateSchema,
  randomRoomsSeriesUpdateSchema,
} from "@/lib/validation";

describe("random rooms validation", () => {
  it("applies safe series defaults and validates duration", () => {
    const series = randomRoomsSeriesCreateSchema.parse({ name: "Random Rooms" });

    expect(series.slug).toBe("random-rooms");
    expect(series.language).toBe("hinglish");
    expect(series.targetFormat).toBe("youtube_shorts");
    expect(series.defaultDurationSec).toBe(60);
    expect(series.active).toBe(true);
    expect(randomRoomsSeriesUpdateSchema.safeParse({ defaultDurationSec: 0 }).success).toBe(false);
  });

  it("normalizes stable character codes and rejects unstable formats", () => {
    const character = randomRoomsCharacterCreateSchema.parse({
      seriesId: "series_1",
      code: "rex",
      name: "Rex",
      role: "Lead",
      characterType: "robot",
      personality: ["overconfident"],
      speakingStyle: ["dramatic"],
      visualDescription: "Compact rounded robot in a red hoodie.",
    });

    expect(character.code).toBe("REX");
    expect(character.voiceProfile).toEqual({
      voiceProviderHint: null,
      voiceId: null,
      voiceStyle: null,
      voiceNotes: null,
    });
    expect(randomRoomsCharacterUpdateSchema.safeParse({ code: "rex bot" }).success).toBe(false);
    expect(randomRoomsCharacterCreateSchema.safeParse({ code: "R", name: "Rex" }).success).toBe(false);
  });

  it("validates required character arrays and relationship pairs", () => {
    expect(
      randomRoomsCharacterCreateSchema.safeParse({
        seriesId: "series_1",
        code: "MAYA",
        name: "Maya",
        role: "Mediator",
        characterType: "human",
        personality: [],
        speakingStyle: ["grounded"],
        visualDescription: "Calm studio host.",
      }).success,
    ).toBe(false);

    expect(
      randomRoomsRelationshipCreateSchema.safeParse({
        seriesId: "series_1",
        characterAId: "character_1",
        characterBId: "character_1",
        relationshipType: "partners",
        dynamic: "Same person.",
        conflictPattern: "None.",
        comedyPattern: "None.",
      }).success,
    ).toBe(false);
  });

  it("validates room profile fields and stable room codes", () => {
    const room = randomRoomsRoomCreateSchema.parse({
      seriesId: "series_1",
      code: "rex_apartment",
      name: "Rex's Apartment",
      roomType: "compact futuristic apartment",
      description: "A compact futuristic apartment that looks advanced but is slightly dysfunctional.",
      visualStyle: "Stylized 3D animated sitcom.",
      lighting: "Warm evening light with cyan tech accents.",
      colorMood: "Warm reds and cyan glow.",
      cameraConstraints: ["Keep the red couch against the left wall."],
      props: ["red couch", "charging dock"],
      environmentRules: ["Permanent furniture should not move."],
    });

    expect(room.code).toBe("REX_APARTMENT");
    expect(room.active).toBe(true);
    expect(randomRoomsRoomCreateSchema.safeParse({ ...room, code: "rex apartment" }).success).toBe(false);
    expect(randomRoomsRoomUpdateSchema.safeParse({ code: "GLITCH_LAB", active: false }).success).toBe(true);
    expect(randomRoomsRoomUpdateSchema.safeParse({ description: "" }).success).toBe(false);
  });

  it("validates episode planning inputs with stable defaults", () => {
    const episode = randomRoomsEpisodeCreateSchema.parse({
      seriesId: "series_1",
      code: "rr_ep_0001",
      title: "Rex Gets Fired",
      premise: "Rex builds an AI that replaces him first.",
    });

    expect(episode.code).toBe("RR_EP_0001");
    expect(episode.targetAspectRatio).toBe("9:16");
    expect(episode.targetDurationSec).toBe(30);
    expect(episode.status).toBe("DRAFT");
    expect(randomRoomsEpisodeCreateSchema.safeParse({ ...episode, targetAspectRatio: "vertical" }).success).toBe(false);
    expect(randomRoomsEpisodeCreateSchema.safeParse({ ...episode, status: "RENDERING" }).success).toBe(false);
  });

  it("validates character assignments, scenes, shots, and dialogue lines", () => {
    expect(
      randomRoomsEpisodeCharacterCreateSchema.safeParse({
        characterId: "character_1",
        roleInEpisode: "lead",
        priority: 1,
      }).success,
    ).toBe(true);

    expect(
      randomRoomsSceneCreateSchema.safeParse({
        title: "Office pitch",
        summary: "Rex pitches the replacement system.",
        purpose: "HOOK",
        beat: "Confidence before consequence.",
        durationSec: 7,
      }).success,
    ).toBe(false);

    expect(
      randomRoomsSceneCreateSchema.safeParse({
        roomId: "room_1",
        title: "Office pitch",
        summary: "Rex pitches the replacement system.",
        purpose: "HOOK",
        beat: "Confidence before consequence.",
        durationSec: 7,
      }).success,
    ).toBe(true);

    expect(
      randomRoomsShotCreateSchema.safeParse({
        actionDescription: "Rex points at the dashboard.",
        visualDescription: "Glass office, central table, dashboard glow.",
      }).success,
    ).toBe(true);

    expect(
      randomRoomsDialogueLineCreateSchema.safeParse({
        characterId: "character_1",
        text: "Obviously this is under control.",
        durationEstimateMs: 1800,
      }).success,
    ).toBe(true);

    expect(
      randomRoomsDialogueLineCreateSchema.safeParse({
        characterId: "character_1",
        text: "",
      }).success,
    ).toBe(false);
  });

  it("validates reorder and optional episode plan generation input", () => {
    expect(randomRoomsReorderSchema.safeParse({ orderedIds: ["scene_2", "scene_1"] }).success).toBe(true);
    expect(randomRoomsReorderSchema.safeParse({ orderedIds: [] }).success).toBe(false);

    expect(
      randomRoomsEpisodePlanGenerateSchema.safeParse({
        seriesId: "series_1",
        premise: "Rex automates his own firing.",
        selectedCharacterIds: ["rex", "glitch"],
        targetDurationSec: 30,
      }).success,
    ).toBe(true);

    expect(
      randomRoomsEpisodePlanGenerateSchema.safeParse({
        seriesId: "series_1",
        premise: "Rex automates his own firing.",
        selectedCharacterIds: [],
        targetDurationSec: 30,
      }).success,
    ).toBe(false);
  });
});
