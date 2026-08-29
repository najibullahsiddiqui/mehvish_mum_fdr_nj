import { describe, expect, it } from "vitest";
import { buildEpisodeReview, buildProductionManifest, calculateEpisodeDuration, productionManifestSchema } from "@/lib/random-rooms/manifest";
import type { RandomRoomsEpisode } from "@/lib/types";

const now = "2026-08-29T10:00:00.000Z";

function episodeFixture(): RandomRoomsEpisode {
  return {
    id: "episode_1",
    seriesId: "series_1",
    episodeNumber: 1,
    code: "RR_EP_0001",
    title: "Rex Gets Fired",
    premise: "Rex builds an AI that replaces him first.",
    hook: "Rex announces replacement automation.",
    comedyAngle: "Literal automation replaces its maker.",
    targetDurationSec: 30,
    targetAspectRatio: "9:16",
    language: "hinglish",
    status: "PLANNED",
    notes: null,
    characterAssignments: [
      {
        id: "assignment_1",
        episodeId: "episode_1",
        characterId: "rex",
        character: {
          id: "rex",
          code: "REX",
          name: "Rex",
          role: "Lead chaos-maker",
          characterType: "robot",
          active: true,
        },
        roleInEpisode: "lead",
        priority: 1,
        notes: null,
        createdAt: now,
        updatedAt: now,
      },
    ],
    scenes: [
      {
        id: "scene_1",
        episodeId: "episode_1",
        sceneNumber: 1,
        roomId: "room_1",
        room: {
          id: "room_1",
          seriesId: "series_1",
          code: "AI_OFFICE",
          name: "AI Corporate Office",
          roomType: "office",
          description: "Glass office.",
          visualStyle: "Stylized 3D.",
          lighting: "Cool.",
          colorMood: "Blue.",
          cameraConstraints: [],
          props: ["dashboard"],
          environmentRules: [],
          continuityNotes: null,
          referenceAssetNotes: null,
          active: true,
          createdAt: now,
          updatedAt: now,
        },
        title: "The Pitch",
        summary: "Rex pitches replacement automation.",
        purpose: "HOOK",
        beat: "Confidence before consequence.",
        durationSec: 8,
        status: "PLANNED",
        notes: null,
        shots: [
          {
            id: "shot_1",
            sceneId: "scene_1",
            shotNumber: 1,
            shotType: "intro",
            cameraFraming: "medium",
            cameraMovement: "push_in",
            actionDescription: "Rex points at the dashboard.",
            visualDescription: "Glass office and central table.",
            imagePrompt: "Rex in AI office.",
            videoPrompt: "Push in on Rex.",
            durationSec: 4,
            emotion: "confident",
            continuityNotes: null,
            status: "PLANNED",
            createdAt: now,
            updatedAt: now,
          },
          {
            id: "shot_2",
            sceneId: "scene_1",
            shotNumber: 2,
            shotType: "reaction",
            cameraFraming: "close_up",
            cameraMovement: "static",
            actionDescription: "Rex notices his own name.",
            visualDescription: "Dashboard alert behind Rex.",
            imagePrompt: "",
            videoPrompt: "",
            durationSec: 5,
            emotion: "panic",
            continuityNotes: null,
            status: "PLANNED",
            createdAt: now,
            updatedAt: now,
          },
        ],
        dialogueLines: [
          {
            id: "dialogue_1",
            sceneId: "scene_1",
            shotId: "shot_1",
            shot: {
              id: "shot_1",
              shotNumber: 1,
              shotType: "intro",
            },
            characterId: "rex",
            character: {
              id: "rex",
              code: "REX",
              name: "Rex",
              role: "Lead chaos-maker",
              characterType: "robot",
              active: true,
            },
            lineNumber: 1,
            text: "Obviously this is under control.",
            emotion: "confident",
            deliveryStyle: "fast theatrical pitch",
            captionText: "Under control.",
            startOffsetMs: null,
            durationEstimateMs: 1800,
            notes: null,
            createdAt: now,
            updatedAt: now,
          },
        ],
        createdAt: now,
        updatedAt: now,
      },
    ],
    review: {
      characterCount: 0,
      sceneCount: 0,
      shotCount: 0,
      dialogueLineCount: 0,
      plannedDurationSec: 0,
      targetDurationSec: 30,
      durationDeltaSec: 0,
      durationSource: "none",
      missingRooms: 0,
      missingPrompts: 0,
      durationWarning: null,
    },
    createdAt: now,
    updatedAt: now,
  };
}

describe("random rooms production manifest", () => {
  it("uses shot duration as authoritative when shots exist", () => {
    const episode = episodeFixture();

    expect(calculateEpisodeDuration(episode)).toEqual({
      durationSec: 9,
      source: "shots",
    });
  });

  it("falls back to scene duration before shots are planned", () => {
    const episode = episodeFixture();
    episode.scenes[0].shots = [];

    expect(calculateEpisodeDuration(episode)).toEqual({
      durationSec: 8,
      source: "scenes",
    });
  });

  it("builds deterministic review counts and warnings", () => {
    const review = buildEpisodeReview(episodeFixture());

    expect(review.characterCount).toBe(1);
    expect(review.sceneCount).toBe(1);
    expect(review.shotCount).toBe(2);
    expect(review.dialogueLineCount).toBe(1);
    expect(review.missingPrompts).toBe(1);
    expect(review.durationWarning).toContain("under the recommended 20 sec minimum");
  });

  it("builds a validated JSON-ready production manifest", () => {
    const manifest = buildProductionManifest(episodeFixture());

    expect(productionManifestSchema.parse(manifest)).toBeDefined();
    expect(manifest.episode.code).toBe("RR_EP_0001");
    expect(manifest.characters).toEqual([{ id: "rex", code: "REX", name: "Rex", roleInEpisode: "lead" }]);
    expect(manifest.rooms).toEqual([{ id: "room_1", code: "AI_OFFICE", name: "AI Corporate Office", roomType: "office" }]);
    expect(manifest.scenes[0].shots).toHaveLength(2);
    expect(JSON.stringify(manifest)).not.toContain("localPath");
    expect(JSON.stringify(manifest)).not.toContain("url");
  });
});
