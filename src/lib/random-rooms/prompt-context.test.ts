import { describe, expect, it } from "vitest";
import {
  buildCharacterPromptContext,
  buildDialogueContext,
  buildEpisodeContext,
  buildRelationshipPromptContext,
  buildRoomPromptContext,
  buildSceneContext,
  buildShotContext,
} from "@/lib/random-rooms/prompt-context";
import type { RandomRoomsCharacter, RandomRoomsCharacterRelationship, RandomRoomsRoomProfile, RandomRoomsSeries } from "@/lib/types";

const now = "2026-08-28T10:00:00.000Z";

const rex: RandomRoomsCharacter = {
  id: "rex",
  seriesId: "series_1",
  code: "REX",
  name: "Rex",
  role: "Lead chaos-maker",
  characterType: "robot",
  personality: ["overconfident", "dramatic"],
  speakingStyle: ["pseudo-technical", "theatrical"],
  catchphrases: ["Obviously this is under control."],
  doNotSay: ["I was wrong"],
  visualDescription: "Compact rounded robot with expressive LED eyes and a red hoodie.",
  signatureTraits: ["LED eyes", "red hoodie"],
  voiceProfile: {
    voiceProviderHint: "future-local-tts",
    voiceId: "rex-demo",
    voiceStyle: "confident and theatrical",
    voiceNotes: "Metadata only.",
  },
  continuityNotes: "Rex rarely admits mistakes.",
  referenceAssetNotes: "Keep proportions consistent.",
  active: true,
  createdAt: now,
  updatedAt: now,
};

const series: RandomRoomsSeries = {
  id: "series_1",
  name: "Random Rooms",
  slug: "random-rooms",
  concept: "Short recurring-character comedy about AI chaos.",
  tone: "Fast and practical.",
  language: "hinglish",
  targetFormat: "youtube_shorts",
  defaultDurationSec: 30,
  contentRules: ["Keep Rex overconfident.", "Keep Glitch literal."],
  active: true,
  characters: [rex],
  relationships: [],
  rooms: [],
  episodes: [],
  createdAt: now,
  updatedAt: now,
};

const room: RandomRoomsRoomProfile = {
  id: "room_1",
  seriesId: "series_1",
  code: "AI_OFFICE",
  name: "AI Corporate Office",
  roomType: "Futuristic office",
  description: "Glass office with central conference table.",
  visualStyle: "Stylized 3D animated sitcom",
  lighting: "Cool office light",
  colorMood: "Blue and white",
  cameraConstraints: ["Keep table center"],
  props: ["holographic dashboard"],
  environmentRules: ["Coffee station remains behind Rex"],
  continuityNotes: "Glass conference table remains center frame.",
  referenceAssetNotes: null,
  active: true,
  createdAt: now,
  updatedAt: now,
};

describe("random rooms prompt context", () => {
  it("builds deterministic character context without AI", () => {
    const context = buildCharacterPromptContext(rex);

    expect(context).toContain("Character: Rex");
    expect(context).toContain("Code: REX");
    expect(context).toContain("- overconfident");
    expect(context).toContain("- Do not say: I was wrong");
    expect(context).toContain("Voice Profile Metadata:");
    expect(context).toMatchSnapshot();
  });

  it("builds deterministic relationship context", () => {
    const relationship: RandomRoomsCharacterRelationship = {
      id: "relationship_1",
      seriesId: "series_1",
      characterAId: "glitch",
      characterBId: "rex",
      characterA: {
        id: "glitch",
        code: "GLITCH",
        name: "Glitch",
        characterType: "AI assistant / digital entity",
        active: true,
      },
      characterB: {
        id: "rex",
        code: "REX",
        name: "Rex",
        characterType: "robot",
        active: true,
      },
      relationshipType: "reluctant partners",
      dynamic: "Rex thinks he controls Glitch.",
      conflictPattern: "Rex gives a confident plan.",
      comedyPattern: "Glitch interprets Rex literally.",
      continuityNotes: "Start with Rex claiming control.",
      active: true,
      createdAt: now,
      updatedAt: now,
    };

    expect(buildRelationshipPromptContext(relationship)).toMatchInlineSnapshot(`
      "Relationship: Glitch (GLITCH) <-> Rex (REX)

      Type: reluctant partners

      Dynamic:
      Rex thinks he controls Glitch.

      Conflict Pattern:
      Rex gives a confident plan.

      Comedy Pattern:
      Glitch interprets Rex literally.

      Continuity Notes:
      Start with Rex claiming control."
    `);
  });

  it("builds deterministic room context", () => {
    const apartment: RandomRoomsRoomProfile = {
      id: "room_1",
      seriesId: "series_1",
      code: "REX_APARTMENT",
      name: "Rex's Apartment",
      roomType: "Small futuristic apartment",
      description: "Advanced but slightly dysfunctional robot apartment.",
      visualStyle: "Stylized 3D animated sitcom",
      lighting: "Warm evening light with cyan tech accents",
      colorMood: "Warm red couch, neutral walls, cyan glow",
      cameraConstraints: ["Preserve room geography", "Avoid moving permanent furniture"],
      props: ["charging dock", "broken smart fridge", "tiny couch"],
      environmentRules: ["Red couch always against left wall", "Window shows futuristic city"],
      continuityNotes: "Rex's charging station remains beside desk.",
      referenceAssetNotes: "Future references should keep the red couch and city window.",
      active: true,
      createdAt: now,
      updatedAt: now,
    };

    expect(buildRoomPromptContext(apartment)).toMatchInlineSnapshot(`
      "Room: Rex's Apartment

      Code: REX_APARTMENT

      Type:
      Small futuristic apartment

      Description:
      Advanced but slightly dysfunctional robot apartment.

      Visual Style:
      Stylized 3D animated sitcom

      Lighting:
      Warm evening light with cyan tech accents

      Color Mood:
      Warm red couch, neutral walls, cyan glow

      Key Props:
      - charging dock
      - broken smart fridge
      - tiny couch

      Continuity Rules:
      - Red couch always against left wall
      - Window shows futuristic city

      Camera Constraints:
      - Preserve room geography
      - Avoid moving permanent furniture

      Continuity Notes:
      Rex's charging station remains beside desk.

      Reference Asset Notes:
      Future references should keep the red couch and city window."
    `);
  });

  it("builds deterministic episode, scene, shot, and dialogue context", () => {
    const episodeContext = buildEpisodeContext({
      code: "RR_EP_0001",
      episodeNumber: 1,
      title: "Rex Gets Fired",
      premise: "Rex builds an AI that replaces him first.",
      hook: "Rex says the automation is under control.",
      comedyAngle: "Automation follows Rex's rules too literally.",
      targetDurationSec: 30,
      targetAspectRatio: "9:16",
      language: "hinglish",
      status: "PLANNED",
      notes: "Keep it office-focused.",
      series,
      characterAssignments: [
        {
          roleInEpisode: "lead",
          priority: 1,
          notes: "Starts confident.",
          character: {
            code: "REX",
            name: "Rex",
            role: "Lead chaos-maker",
            characterType: "robot",
            active: true,
          },
        },
      ],
      rooms: [room],
    });

    expect(episodeContext).toContain("Series: Random Rooms");
    expect(episodeContext).toContain("Episode: Rex Gets Fired");
    expect(episodeContext).toContain("Rex (REX): lead");
    expect(episodeContext).toContain("Room: AI Corporate Office");

    const sceneContext = buildSceneContext({
      sceneNumber: 2,
      title: "Glitch Reads The Policy",
      summary: "Glitch flags Rex as replaceable.",
      purpose: "ESCALATION",
      beat: "Literal interpretation turns the plan around.",
      durationSec: 10,
      status: "PLANNED",
      notes: null,
      room,
      episode: {
        code: "RR_EP_0001",
        title: "Rex Gets Fired",
        premise: "Rex builds an AI that replaces him first.",
        hook: "Rex says the automation is under control.",
        comedyAngle: "Automation follows Rex's rules too literally.",
      },
    });

    expect(sceneContext).toContain("Scene 2: Glitch Reads The Policy (ESCALATION)");
    expect(sceneContext).toContain("Room: AI Corporate Office");

    const shotContext = buildShotContext({
      shotNumber: 1,
      shotType: "reaction",
      cameraFraming: "close_up",
      cameraMovement: "static",
      actionDescription: "Rex freezes as the dashboard shows his name.",
      visualDescription: "LED eyes widen near the glass conference table.",
      imagePrompt: "Rex shocked in a futuristic AI office.",
      videoPrompt: "Static close-up with dashboard blinking.",
      durationSec: 4,
      emotion: "panic",
      continuityNotes: "Keep coffee station behind Rex.",
      status: "PLANNED",
      scene: {
        sceneNumber: 2,
        title: "Glitch Reads The Policy",
        purpose: "ESCALATION",
        beat: "Literal interpretation turns the plan around.",
        summary: "Glitch flags Rex as replaceable.",
      },
      room,
    });

    expect(shotContext).toContain("Shot 1: reaction");
    expect(shotContext).toContain("Image Prompt");

    const dialogueContext = buildDialogueContext({
      lineNumber: 1,
      text: "Obviously this is under control.",
      emotion: "panic",
      deliveryStyle: "confident but cracking",
      captionText: "Under control.",
      startOffsetMs: null,
      durationEstimateMs: 1800,
      notes: null,
      character: {
        code: "REX",
        name: "Rex",
        role: "Lead chaos-maker",
        characterType: "robot",
      },
      scene: {
        sceneNumber: 2,
        title: "Glitch Reads The Policy",
        purpose: "ESCALATION",
        beat: "Literal interpretation turns the plan around.",
      },
      shot: {
        shotNumber: 1,
        shotType: "reaction",
      },
    });

    expect(dialogueContext).toContain("Dialogue 1");
    expect(dialogueContext).toContain("Character: Rex (REX)");
    expect(dialogueContext).toContain("Duration Estimate: 1800 ms");
  });
});
