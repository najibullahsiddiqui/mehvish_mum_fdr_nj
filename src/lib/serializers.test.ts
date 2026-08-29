import { describe, expect, it } from "vitest";
import {
  serializeGenerationLog,
  serializeProject,
  serializeRandomRoomsEpisode,
  serializeRandomRoomsRoomProfile,
  serializeRandomRoomsSeries,
} from "@/lib/serializers";

describe("serializers", () => {
  it("serializes a project with nested records into JSON-safe values", () => {
    const createdAt = new Date("2026-07-07T10:00:00.000Z");
    const updatedAt = new Date("2026-07-08T10:00:00.000Z");
    const project = serializeProject({
      id: "project_1",
      ideaId: "idea_1",
      topic: "CreatorPilot workflow",
      pillar: "creator systems",
      videoType: "tutorial",
      targetLength: "8-10 minutes",
      language: "Hinglish",
      status: "scripting",
      notes: null,
      createdAt,
      updatedAt,
      researchBriefs: [
        {
          id: "research_1",
          projectId: "project_1",
          topic: "CreatorPilot workflow",
          referenceLinks: ["https://example.com"],
          viewerPain: "Planning is scattered.",
          videoPromise: "One workflow from idea to upload.",
          mainPoints: ["Capture", "Research", "Script"],
          examples: ["Example one", "Example two"],
          commonMistakes: ["Skipping notes", "Writing too early"],
          contrarianAngle: "The script is not step one.",
          hookAngles: ["Hook one", "Hook two", "Hook three"],
          titleAngles: ["Title one", "Title two", "Title three"],
          createdAt,
        },
      ],
      scripts: [
        {
          id: "script_1",
          projectId: "project_1",
          scriptType: "long_form",
          versionName: "Draft 1",
          hook: "Hook",
          intro: "Intro",
          body: "Body",
          cta: "CTA",
          outro: "Outro",
          visualNotes: ["Show dashboard"],
          onScreenText: ["Idea to upload"],
          contentMarkdown: "# Script",
          createdAt,
        },
      ],
      thumbnailPacks: [
        {
          id: "thumbnail_1",
          projectId: "project_1",
          textOptions: ["AI SYSTEM"],
          visualConcepts: ["Dashboard"],
          emotionAngle: "Clarity",
          imageGenerationPrompts: ["Creator desk"],
          canvaInstructions: "Use bold type.",
          photoshopInstructions: "Add contrast.",
          createdAt,
        },
      ],
      uploadPacks: [
        {
          id: "upload_1",
          projectId: "project_1",
          titleOptions: ["Title one"],
          finalTitle: "CreatorPilot Workflow",
          description: "Description",
          tags: ["ai", "youtube"],
          hashtags: ["#AI"],
          chapters: ["00:00 Intro"],
          pinnedComment: "Comment",
          communityPost: "Post",
          shortsCutdownIdeas: ["Hook clip"],
          uploadChecklist: ["Thumbnail"],
          createdAt,
        },
      ],
      performanceEntries: [
        {
          id: "performance_1",
          projectId: "project_1",
          publishDate: new Date("2026-07-09T00:00:00.000Z"),
          views24h: null,
          views7d: 1200,
          ctr: null,
          avgViewDuration: null,
          subscriberGain: 12,
          commentsSummary: null,
          whatWorked: "Clear promise",
          whatFailed: null,
          improvementNotes: ["Shorten intro"],
          nextVideoIdeas: ["Prompt library"],
          createdAt,
          updatedAt,
        },
      ],
    });

    expect(project.createdAt).toBe("2026-07-07T10:00:00.000Z");
    expect(project.updatedAt).toBe("2026-07-08T10:00:00.000Z");
    expect(project.notes).toBeNull();
    expect(project.researchBriefs[0].createdAt).toBe("2026-07-07T10:00:00.000Z");
    expect(project.scripts[0].scriptType).toBe("long_form");
    expect(project.performanceEntries[0].publishDate).toBe("2026-07-09T00:00:00.000Z");
    expect(project.performanceEntries[0].views24h).toBeNull();
    expect(() => JSON.stringify(project)).not.toThrow();
  });

  it("serializes generation logs with project topics and safe status fallback", () => {
    const log = serializeGenerationLog({
      id: "log_1",
      featureName: "research_desk",
      provider: "claude",
      providerId: null,
      providerKind: null,
      model: "claude-sonnet-4-5",
      status: "BROKEN_STATUS",
      attemptCount: null,
      errorCode: null,
      errorMessage: "The AI response was not valid JSON.",
      inputTokens: null,
      outputTokens: null,
      costEstimate: null,
      durationMs: 45,
      projectId: "project_1",
      project: { topic: "CreatorPilot workflow" },
      createdAt: new Date("2026-07-07T11:00:00.000Z"),
    });

    expect(log.status).toBe("SUCCESS");
    expect(log.projectTopic).toBe("CreatorPilot workflow");
    expect(log.createdAt).toBe("2026-07-07T11:00:00.000Z");
    expect(log.errorMessage).toContain("not valid JSON");
  });

  it("serializes random rooms series with characters and relationships", () => {
    const createdAt = new Date("2026-08-28T10:00:00.000Z");
    const updatedAt = new Date("2026-08-28T11:00:00.000Z");
    const series = serializeRandomRoomsSeries({
      id: "series_1",
      name: "Random Rooms",
      slug: "random-rooms",
      concept: "Recurring-character comedy.",
      tone: "Fast and absurd.",
      language: "hinglish",
      targetFormat: "youtube_shorts",
      defaultDurationSec: 60,
      contentRules: ["Keep continuity stable."],
      active: true,
      createdAt,
      updatedAt,
      characters: [
        {
          id: "character_1",
          seriesId: "series_1",
          code: "REX",
          name: "Rex",
          role: "Lead",
          characterType: "robot",
          personality: ["overconfident"],
          speakingStyle: ["dramatic"],
          catchphrases: [],
          doNotSay: [],
          visualDescription: "Red hoodie robot.",
          signatureTraits: ["LED eyes"],
          voiceProfile: { voiceStyle: "theatrical" },
          continuityNotes: null,
          referenceAssetNotes: null,
          active: true,
          createdAt,
          updatedAt,
        },
      ],
      relationships: [
        {
          id: "relationship_1",
          seriesId: "series_1",
          characterAId: "character_1",
          characterBId: "character_2",
          relationshipType: "partners",
          dynamic: "Back-and-forth.",
          conflictPattern: "Literal instructions.",
          comedyPattern: "Escalation.",
          continuityNotes: null,
          active: true,
          createdAt,
          updatedAt,
          characterA: {
            id: "character_1",
            code: "REX",
            name: "Rex",
            characterType: "robot",
            active: true,
          },
          characterB: null,
        },
      ],
      rooms: [
        {
          id: "room_1",
          seriesId: "series_1",
          code: "REX_APARTMENT",
          name: "Rex's Apartment",
          roomType: "compact futuristic apartment",
          description: "Advanced but dysfunctional.",
          visualStyle: "Stylized 3D animated sitcom.",
          lighting: "Warm evening light.",
          colorMood: "Red and cyan.",
          cameraConstraints: ["Keep the couch left."],
          props: ["red couch"],
          environmentRules: ["Do not move permanent furniture."],
          continuityNotes: null,
          referenceAssetNotes: null,
          active: true,
          createdAt,
          updatedAt,
        },
      ],
    });

    expect(series.createdAt).toBe("2026-08-28T10:00:00.000Z");
    expect(series.characters[0].voiceProfile).toMatchObject({ voiceStyle: "theatrical", voiceId: null });
    expect(series.relationships[0].characterA?.code).toBe("REX");
    expect(series.rooms[0].code).toBe("REX_APARTMENT");
    expect(() => JSON.stringify(series)).not.toThrow();
  });

  it("serializes room profiles into JSON-safe values", () => {
    const room = serializeRandomRoomsRoomProfile({
      id: "room_1",
      seriesId: "series_1",
      code: "AI_OFFICE",
      name: "AI Corporate Office",
      roomType: "futuristic corporate workspace",
      description: "Office for absurd AI workplace behavior.",
      visualStyle: "Clean animated sci-fi office.",
      lighting: "Bright cool office lighting.",
      colorMood: "Glass, cool gray, electric blue.",
      cameraConstraints: ["Keep table central."],
      props: ["conference table"],
      environmentRules: ["Coffee station remains visible."],
      continuityNotes: null,
      referenceAssetNotes: "Keep glass walls.",
      active: true,
      createdAt: new Date("2026-08-28T12:00:00.000Z"),
      updatedAt: new Date("2026-08-28T13:00:00.000Z"),
    });

    expect(room.createdAt).toBe("2026-08-28T12:00:00.000Z");
    expect(room.updatedAt).toBe("2026-08-28T13:00:00.000Z");
    expect(room.referenceAssetNotes).toBe("Keep glass walls.");
    expect(() => JSON.stringify(room)).not.toThrow();
  });

  it("serializes random rooms episodes with nested planning review data", () => {
    const createdAt = new Date("2026-08-29T10:00:00.000Z");
    const updatedAt = new Date("2026-08-29T11:00:00.000Z");
    const episode = serializeRandomRoomsEpisode({
      id: "episode_1",
      seriesId: "series_1",
      episodeNumber: 1,
      code: "RR_EP_0001",
      title: "Rex Gets Fired",
      premise: "Rex builds an AI that replaces him first.",
      hook: "Replacement automation starts with Rex.",
      comedyAngle: "Literal automation follows Rex's policy too well.",
      targetDurationSec: 30,
      targetAspectRatio: "9:16",
      language: "hinglish",
      status: "BROKEN_STATUS",
      notes: null,
      characterAssignments: [
        {
          id: "assignment_1",
          episodeId: "episode_1",
          characterId: "rex",
          roleInEpisode: "lead",
          priority: 1,
          notes: null,
          character: {
            id: "rex",
            code: "REX",
            name: "Rex",
            role: "Lead",
            characterType: "robot",
            active: true,
          },
          createdAt,
          updatedAt,
        },
      ],
      scenes: [
        {
          id: "scene_1",
          episodeId: "episode_1",
          sceneNumber: 1,
          roomId: null,
          room: null,
          title: "The Pitch",
          summary: "Rex pitches replacement automation.",
          purpose: "HOOK",
          beat: "Confidence before consequence.",
          durationSec: 8,
          status: "PLANNED",
          notes: "No physical room because this is a UI-only cold open.",
          shots: [
            {
              id: "shot_1",
              sceneId: "scene_1",
              shotNumber: 1,
              shotType: "intro",
              cameraFraming: "medium",
              cameraMovement: "push_in",
              actionDescription: "Rex points at the dashboard.",
              visualDescription: "Dashboard glow behind Rex.",
              imagePrompt: "Rex presenting an AI dashboard.",
              videoPrompt: "Push in on Rex.",
              durationSec: 4,
              emotion: "confident",
              continuityNotes: null,
              status: "PLANNED",
              createdAt,
              updatedAt,
            },
          ],
          dialogueLines: [],
          createdAt,
          updatedAt,
        },
      ],
      createdAt,
      updatedAt,
    });

    expect(episode.status).toBe("DRAFT");
    expect(episode.createdAt).toBe("2026-08-29T10:00:00.000Z");
    expect(episode.characterAssignments[0].character?.code).toBe("REX");
    expect(episode.review.characterCount).toBe(1);
    expect(episode.review.sceneCount).toBe(1);
    expect(episode.review.shotCount).toBe(1);
    expect(episode.review.plannedDurationSec).toBe(4);
    expect(episode.review.durationSource).toBe("shots");
    expect(episode.review.missingRooms).toBe(1);
    expect(() => JSON.stringify(episode)).not.toThrow();
  });
});
