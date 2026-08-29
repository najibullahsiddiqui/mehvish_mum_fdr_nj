import { describe, expect, it } from "vitest";
import { HttpError } from "@/lib/api";
import {
  createRandomRoomsPlanningService,
  type DialogueLineRecord,
  type EpisodeCharacterRecord,
  type EpisodeRecord,
  type RandomRoomsPlanningDb,
  type SceneRecord,
  type ShotRecord,
} from "@/lib/random-rooms/planning-service";
import type { RandomRoomsCharacterRecord, RandomRoomsRelationshipRecord, RandomRoomsSeriesRecord } from "@/lib/random-rooms/service";
import type { RoomProfileRecord } from "@/lib/random-rooms/room-service";
import {
  randomRoomsDialogueLineCreateSchema,
  randomRoomsEpisodeCharacterCreateSchema,
  randomRoomsEpisodeCreateSchema,
  randomRoomsSceneCreateSchema,
  randomRoomsShotCreateSchema,
} from "@/lib/validation";

const now = new Date("2026-08-29T10:00:00.000Z");

function whereFrom(args: Record<string, unknown> | undefined) {
  return (args?.where || {}) as Record<string, unknown>;
}

function dataFrom<T>(args: Record<string, unknown>) {
  return args.data as Partial<T>;
}

function matchesWhere(record: Record<string, unknown>, where: Record<string, unknown>) {
  return Object.entries(where).every(([key, value]) => {
    if (key === "NOT" && typeof value === "object" && value !== null) {
      const not = value as Record<string, unknown>;
      return Object.entries(not).every(([notKey, notValue]) => record[notKey] !== notValue);
    }

    if (typeof value === "object" && value !== null && "in" in value) {
      return Array.isArray(value.in) && value.in.includes(record[key]);
    }

    return record[key] === value;
  });
}

function sortRecords<T extends Record<string, unknown>>(records: T[], args?: Record<string, unknown>) {
  const orderBy = args?.orderBy;
  const firstOrder = Array.isArray(orderBy) ? orderBy[0] : orderBy;

  if (!firstOrder || typeof firstOrder !== "object") {
    return records;
  }

  const [key, direction] = Object.entries(firstOrder as Record<string, string>)[0] || [];

  if (!key) {
    return records;
  }

  return [...records].sort((a, b) => {
    const left = a[key];
    const right = b[key];

    if (left === right) return 0;
    if (left === undefined || left === null || right === undefined || right === null) return 0;

    return (left > right ? 1 : -1) * (direction === "desc" ? -1 : 1);
  });
}

function createFakeDb() {
  const series: RandomRoomsSeriesRecord[] = [
    {
      id: "series_1",
      name: "Random Rooms",
      slug: "random-rooms",
      concept: "Short AI office comedy.",
      tone: "Fast and absurd.",
      language: "hinglish",
      targetFormat: "youtube_shorts",
      defaultDurationSec: 30,
      contentRules: ["Keep character continuity stable."],
      active: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "series_2",
      name: "Other Rooms",
      slug: "other-rooms",
      concept: "Other series.",
      tone: "Dry.",
      language: "english",
      targetFormat: "youtube_shorts",
      defaultDurationSec: 30,
      contentRules: [],
      active: true,
      createdAt: now,
      updatedAt: now,
    },
  ];
  const characters: RandomRoomsCharacterRecord[] = [
    {
      id: "rex",
      seriesId: "series_1",
      code: "REX",
      name: "Rex",
      role: "Lead chaos-maker",
      characterType: "robot",
      personality: ["overconfident"],
      speakingStyle: ["dramatic"],
      catchphrases: [],
      doNotSay: [],
      visualDescription: "Robot in a red hoodie.",
      signatureTraits: ["red hoodie"],
      voiceProfile: null,
      continuityNotes: "Claims control.",
      referenceAssetNotes: null,
      active: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "glitch",
      seriesId: "series_1",
      code: "GLITCH",
      name: "Glitch",
      role: "Escalation engine",
      characterType: "AI entity",
      personality: ["literal"],
      speakingStyle: ["calm"],
      catchphrases: [],
      doNotSay: [],
      visualDescription: "Digital entity.",
      signatureTraits: ["cyan glow"],
      voiceProfile: null,
      continuityNotes: "Interprets literally.",
      referenceAssetNotes: null,
      active: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "outsider",
      seriesId: "series_2",
      code: "OUTSIDER",
      name: "Outsider",
      role: "Visitor",
      characterType: "human",
      personality: ["plain"],
      speakingStyle: ["plain"],
      catchphrases: [],
      doNotSay: [],
      visualDescription: "Visitor.",
      signatureTraits: [],
      voiceProfile: null,
      continuityNotes: null,
      referenceAssetNotes: null,
      active: true,
      createdAt: now,
      updatedAt: now,
    },
  ];
  const rooms: RoomProfileRecord[] = [
    {
      id: "office",
      seriesId: "series_1",
      code: "AI_OFFICE",
      name: "AI Corporate Office",
      roomType: "office",
      description: "Glass office.",
      visualStyle: "Stylized 3D.",
      lighting: "Cool.",
      colorMood: "Blue.",
      cameraConstraints: ["Keep table center."],
      props: ["dashboard"],
      environmentRules: ["Furniture stays put."],
      continuityNotes: "Coffee station remains visible.",
      referenceAssetNotes: null,
      active: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "other_room",
      seriesId: "series_2",
      code: "OTHER_ROOM",
      name: "Other Room",
      roomType: "room",
      description: "Wrong series room.",
      visualStyle: "Plain.",
      lighting: "Flat.",
      colorMood: "Gray.",
      cameraConstraints: [],
      props: [],
      environmentRules: [],
      continuityNotes: null,
      referenceAssetNotes: null,
      active: true,
      createdAt: now,
      updatedAt: now,
    },
  ];
  const relationships: RandomRoomsRelationshipRecord[] = [
    {
      id: "rex_glitch",
      seriesId: "series_1",
      characterAId: "glitch",
      characterBId: "rex",
      pairKey: "glitch__rex",
      relationshipType: "reluctant partners",
      dynamic: "Rex believes he controls Glitch.",
      conflictPattern: "Literal instructions escalate.",
      comedyPattern: "Calm chaos.",
      continuityNotes: "Rex claims control first.",
      active: true,
      characterA: { id: "glitch", code: "GLITCH", name: "Glitch", characterType: "AI entity", active: true },
      characterB: { id: "rex", code: "REX", name: "Rex", characterType: "robot", active: true },
      createdAt: now,
      updatedAt: now,
    },
  ];
  const episodes: EpisodeRecord[] = [];
  const assignments: EpisodeCharacterRecord[] = [];
  const scenes: SceneRecord[] = [];
  const shots: ShotRecord[] = [];
  const dialogueLines: DialogueLineRecord[] = [];
  let counter = 1;
  const nextId = (prefix: string) => `${prefix}_${counter++}`;
  const characterProfile = (id: string) => {
    const character = characters.find((item) => item.id === id);
    return character
      ? {
          id: character.id,
          code: character.code,
          name: character.name,
          role: character.role,
          characterType: character.characterType,
          active: character.active,
        }
      : null;
  };
  const roomById = (id: string | null) => rooms.find((room) => room.id === id) || null;
  const shotLabel = (id: string | null) => {
    const shot = shots.find((item) => item.id === id);
    return shot ? { id: shot.id, shotNumber: shot.shotNumber, shotType: shot.shotType } : null;
  };
  const withLineNested = (line: DialogueLineRecord): DialogueLineRecord => ({
    ...line,
    character: characterProfile(line.characterId),
    shot: shotLabel(line.shotId),
  });
  const withSceneNested = (scene: SceneRecord): SceneRecord => ({
    ...scene,
    room: roomById(scene.roomId),
    shots: sortRecords(shots.filter((shot) => shot.sceneId === scene.id), { orderBy: { shotNumber: "asc" } }),
    dialogueLines: sortRecords(dialogueLines.filter((line) => line.sceneId === scene.id), {
      orderBy: { lineNumber: "asc" },
    }).map(withLineNested),
  });
  const withAssignmentNested = (assignment: EpisodeCharacterRecord): EpisodeCharacterRecord => ({
    ...assignment,
    character: characterProfile(assignment.characterId),
  });
  const withEpisodeNested = (episode: EpisodeRecord): EpisodeRecord => ({
    ...episode,
    characterAssignments: sortRecords(
      assignments.filter((assignment) => assignment.episodeId === episode.id),
      { orderBy: { priority: "asc" } },
    ).map(withAssignmentNested),
    scenes: sortRecords(scenes.filter((scene) => scene.episodeId === episode.id), {
      orderBy: { sceneNumber: "asc" },
    }).map(withSceneNested),
  });

  const db: RandomRoomsPlanningDb = {
    randomRoomsSeries: {
      findUnique: async (args) => series.find((item) => matchesWhere(item as unknown as Record<string, unknown>, whereFrom(args))) || null,
    },
    character: {
      findMany: async (args) => sortRecords(characters.filter((item) => matchesWhere(item as unknown as Record<string, unknown>, whereFrom(args))), args),
      findUnique: async (args) => characters.find((item) => matchesWhere(item as unknown as Record<string, unknown>, whereFrom(args))) || null,
    },
    characterRelationship: {
      findMany: async (args) =>
        relationships.filter((item) => matchesWhere(item as unknown as Record<string, unknown>, whereFrom(args))),
    },
    roomProfile: {
      findUnique: async (args) => rooms.find((item) => matchesWhere(item as unknown as Record<string, unknown>, whereFrom(args))) || null,
    },
    episode: {
      findMany: async (args) =>
        sortRecords(episodes.filter((item) => matchesWhere(item as unknown as Record<string, unknown>, whereFrom(args))), args).map(
          withEpisodeNested,
        ),
      findUnique: async (args) => {
        const found = episodes.find((item) => matchesWhere(item as unknown as Record<string, unknown>, whereFrom(args)));
        return found ? withEpisodeNested(found) : null;
      },
      findFirst: async (args) =>
        sortRecords(episodes.filter((item) => matchesWhere(item as unknown as Record<string, unknown>, whereFrom(args))), args)[0] || null,
      create: async (args) => {
        const data = dataFrom<EpisodeRecord>(args);
        const episode: EpisodeRecord = {
          id: data.id || nextId("episode"),
          seriesId: data.seriesId || "series_1",
          episodeNumber: data.episodeNumber || 1,
          code: data.code || "RR_EP_0001",
          title: data.title || "Episode",
          premise: data.premise || "Premise",
          hook: data.hook || "",
          comedyAngle: data.comedyAngle || "",
          targetDurationSec: data.targetDurationSec || 30,
          targetAspectRatio: data.targetAspectRatio || "9:16",
          language: data.language || "hinglish",
          status: data.status || "DRAFT",
          notes: data.notes ?? null,
          createdAt: now,
          updatedAt: now,
        };
        episodes.push(episode);
        return episode;
      },
      update: async (args) => {
        const record = episodes.find((item) => matchesWhere(item as unknown as Record<string, unknown>, whereFrom(args)));
        if (!record) throw new Error("Episode not found");
        Object.assign(record, dataFrom<EpisodeRecord>(args), { updatedAt: now });
        return record;
      },
    },
    episodeCharacter: {
      findMany: async (args) =>
        sortRecords(assignments.filter((item) => matchesWhere(item as unknown as Record<string, unknown>, whereFrom(args))), args).map(
          withAssignmentNested,
        ),
      findUnique: async (args) => {
        const found = assignments.find((item) => matchesWhere(item as unknown as Record<string, unknown>, whereFrom(args)));
        return found ? withAssignmentNested(found) : null;
      },
      findFirst: async (args) =>
        sortRecords(assignments.filter((item) => matchesWhere(item as unknown as Record<string, unknown>, whereFrom(args))), args)[0] ||
        null,
      create: async (args) => {
        const data = dataFrom<EpisodeCharacterRecord>(args);
        const assignment: EpisodeCharacterRecord = {
          id: data.id || nextId("assignment"),
          episodeId: data.episodeId || "episode_1",
          characterId: data.characterId || "rex",
          roleInEpisode: data.roleInEpisode || "lead",
          priority: data.priority || 1,
          notes: data.notes ?? null,
          createdAt: now,
          updatedAt: now,
        };
        assignments.push(assignment);
        return withAssignmentNested(assignment);
      },
      update: async (args) => {
        const record = assignments.find((item) => matchesWhere(item as unknown as Record<string, unknown>, whereFrom(args)));
        if (!record) throw new Error("Assignment not found");
        Object.assign(record, dataFrom<EpisodeCharacterRecord>(args), { updatedAt: now });
        return withAssignmentNested(record);
      },
      delete: async (args) => {
        const index = assignments.findIndex((item) => matchesWhere(item as unknown as Record<string, unknown>, whereFrom(args)));
        if (index < 0) throw new Error("Assignment not found");
        return assignments.splice(index, 1)[0];
      },
    },
    scene: {
      findMany: async (args) =>
        sortRecords(scenes.filter((item) => matchesWhere(item as unknown as Record<string, unknown>, whereFrom(args))), args).map(
          withSceneNested,
        ),
      findUnique: async (args) => {
        const found = scenes.find((item) => matchesWhere(item as unknown as Record<string, unknown>, whereFrom(args)));
        return found ? withSceneNested(found) : null;
      },
      findFirst: async (args) =>
        sortRecords(scenes.filter((item) => matchesWhere(item as unknown as Record<string, unknown>, whereFrom(args))), args)[0] || null,
      create: async (args) => {
        const data = dataFrom<SceneRecord>(args);
        const scene: SceneRecord = {
          id: data.id || nextId("scene"),
          episodeId: data.episodeId || "episode_1",
          sceneNumber: data.sceneNumber || 1,
          roomId: data.roomId ?? null,
          title: data.title || "Scene",
          summary: data.summary || "Summary",
          purpose: data.purpose || "SETUP",
          beat: data.beat || "Beat",
          durationSec: data.durationSec || 8,
          status: data.status || "DRAFT",
          notes: data.notes ?? null,
          createdAt: now,
          updatedAt: now,
        };
        scenes.push(scene);
        return withSceneNested(scene);
      },
      update: async (args) => {
        const record = scenes.find((item) => matchesWhere(item as unknown as Record<string, unknown>, whereFrom(args)));
        if (!record) throw new Error("Scene not found");
        Object.assign(record, dataFrom<SceneRecord>(args), { updatedAt: now });
        return withSceneNested(record);
      },
      delete: async (args) => {
        const index = scenes.findIndex((item) => matchesWhere(item as unknown as Record<string, unknown>, whereFrom(args)));
        if (index < 0) throw new Error("Scene not found");
        const [deleted] = scenes.splice(index, 1);
        for (let shotIndex = shots.length - 1; shotIndex >= 0; shotIndex -= 1) {
          if (shots[shotIndex].sceneId === deleted.id) shots.splice(shotIndex, 1);
        }
        for (let lineIndex = dialogueLines.length - 1; lineIndex >= 0; lineIndex -= 1) {
          if (dialogueLines[lineIndex].sceneId === deleted.id) dialogueLines.splice(lineIndex, 1);
        }
        return deleted;
      },
    },
    shot: {
      findMany: async (args) =>
        sortRecords(shots.filter((item) => matchesWhere(item as unknown as Record<string, unknown>, whereFrom(args))), args),
      findUnique: async (args) => shots.find((item) => matchesWhere(item as unknown as Record<string, unknown>, whereFrom(args))) || null,
      findFirst: async (args) =>
        sortRecords(shots.filter((item) => matchesWhere(item as unknown as Record<string, unknown>, whereFrom(args))), args)[0] || null,
      create: async (args) => {
        const data = dataFrom<ShotRecord>(args);
        const shot: ShotRecord = {
          id: data.id || nextId("shot"),
          sceneId: data.sceneId || "scene_1",
          shotNumber: data.shotNumber || 1,
          shotType: data.shotType || "action",
          cameraFraming: data.cameraFraming || "medium",
          cameraMovement: data.cameraMovement || "static",
          actionDescription: data.actionDescription || "Action",
          visualDescription: data.visualDescription || "Visual",
          imagePrompt: data.imagePrompt || "",
          videoPrompt: data.videoPrompt || "",
          durationSec: data.durationSec || 3,
          emotion: data.emotion || "neutral",
          continuityNotes: data.continuityNotes ?? null,
          status: data.status || "DRAFT",
          createdAt: now,
          updatedAt: now,
        };
        shots.push(shot);
        return shot;
      },
      update: async (args) => {
        const record = shots.find((item) => matchesWhere(item as unknown as Record<string, unknown>, whereFrom(args)));
        if (!record) throw new Error("Shot not found");
        Object.assign(record, dataFrom<ShotRecord>(args), { updatedAt: now });
        return record;
      },
      delete: async (args) => {
        const index = shots.findIndex((item) => matchesWhere(item as unknown as Record<string, unknown>, whereFrom(args)));
        if (index < 0) throw new Error("Shot not found");
        return shots.splice(index, 1)[0];
      },
    },
    dialogueLine: {
      findMany: async (args) =>
        sortRecords(dialogueLines.filter((item) => matchesWhere(item as unknown as Record<string, unknown>, whereFrom(args))), args).map(
          withLineNested,
        ),
      findUnique: async (args) => {
        const found = dialogueLines.find((item) => matchesWhere(item as unknown as Record<string, unknown>, whereFrom(args)));
        return found ? withLineNested(found) : null;
      },
      findFirst: async (args) =>
        sortRecords(dialogueLines.filter((item) => matchesWhere(item as unknown as Record<string, unknown>, whereFrom(args))), args)[0] ||
        null,
      create: async (args) => {
        const data = dataFrom<DialogueLineRecord>(args);
        const line: DialogueLineRecord = {
          id: data.id || nextId("dialogue"),
          sceneId: data.sceneId || "scene_1",
          shotId: data.shotId ?? null,
          characterId: data.characterId || "rex",
          lineNumber: data.lineNumber || 1,
          text: data.text || "Line",
          emotion: data.emotion ?? null,
          deliveryStyle: data.deliveryStyle ?? null,
          captionText: data.captionText || data.text || "Line",
          startOffsetMs: data.startOffsetMs ?? null,
          durationEstimateMs: data.durationEstimateMs ?? null,
          notes: data.notes ?? null,
          createdAt: now,
          updatedAt: now,
        };
        dialogueLines.push(line);
        return withLineNested(line);
      },
      update: async (args) => {
        const record = dialogueLines.find((item) => matchesWhere(item as unknown as Record<string, unknown>, whereFrom(args)));
        if (!record) throw new Error("Dialogue not found");
        Object.assign(record, dataFrom<DialogueLineRecord>(args), { updatedAt: now });
        return withLineNested(record);
      },
      updateMany: async (args) => {
        const where = whereFrom(args);
        const data = dataFrom<DialogueLineRecord>(args);
        dialogueLines.filter((item) => matchesWhere(item as unknown as Record<string, unknown>, where)).forEach((item) => Object.assign(item, data));
        return { count: dialogueLines.length };
      },
      delete: async (args) => {
        const index = dialogueLines.findIndex((item) => matchesWhere(item as unknown as Record<string, unknown>, whereFrom(args)));
        if (index < 0) throw new Error("Dialogue not found");
        return dialogueLines.splice(index, 1)[0];
      },
    },
  };

  return {
    db,
    service: createRandomRoomsPlanningService(db),
    episodes,
    assignments,
    scenes,
    shots,
    dialogueLines,
  };
}

async function createEpisode(service: ReturnType<typeof createRandomRoomsPlanningService>, title = "Rex Gets Fired") {
  return service.createEpisode(
    randomRoomsEpisodeCreateSchema.parse({
      seriesId: "series_1",
      title,
      premise: "Rex builds an AI that replaces him first.",
      targetDurationSec: 30,
    }),
  );
}

async function createAssignedEpisode(service: ReturnType<typeof createRandomRoomsPlanningService>) {
  const episode = await createEpisode(service);
  await service.assignCharacter(
    episode.id,
    randomRoomsEpisodeCharacterCreateSchema.parse({
      characterId: "rex",
      roleInEpisode: "lead",
      priority: 1,
    }),
  );
  return episode;
}

async function createScene(service: ReturnType<typeof createRandomRoomsPlanningService>, episodeId: string, title: string) {
  return service.createScene(
    episodeId,
    randomRoomsSceneCreateSchema.parse({
      roomId: "office",
      title,
      summary: `${title} summary.`,
      purpose: "SETUP",
      beat: `${title} beat.`,
      durationSec: 8,
    }),
  );
}

async function createShot(service: ReturnType<typeof createRandomRoomsPlanningService>, sceneId: string, action: string) {
  return service.createShot(
    sceneId,
    randomRoomsShotCreateSchema.parse({
      actionDescription: action,
      visualDescription: `${action} visual.`,
      imagePrompt: `${action} image prompt.`,
      videoPrompt: `${action} video prompt.`,
      durationSec: 3,
    }),
  );
}

describe("random rooms planning service", () => {
  it("creates episodes with deterministic numbers and stable codes", async () => {
    const { service } = createFakeDb();
    const first = await createEpisode(service, "First");
    const second = await createEpisode(service, "Second");

    expect(first.episodeNumber).toBe(1);
    expect(first.code).toBe("RR_EP_0001");
    expect(second.episodeNumber).toBe(2);
    expect(second.code).toBe("RR_EP_0002");

    await expect(
      service.createEpisode(
        randomRoomsEpisodeCreateSchema.parse({
          seriesId: "series_1",
          episodeNumber: 2,
          code: "RR_EP_0009",
          title: "Duplicate number",
          premise: "Duplicate.",
        }),
      ),
    ).rejects.toMatchObject({ status: 409 } satisfies Partial<HttpError>);

    await expect(
      service.createEpisode(
        randomRoomsEpisodeCreateSchema.parse({
          seriesId: "series_1",
          episodeNumber: 9,
          code: "rr_ep_0002",
          title: "Duplicate code",
          premise: "Duplicate.",
        }),
      ),
    ).rejects.toMatchObject({ status: 409 } satisfies Partial<HttpError>);
  });

  it("validates character assignment and room ownership", async () => {
    const { service } = createFakeDb();
    const episode = await createEpisode(service);

    await expect(
      service.assignCharacter(
        episode.id,
        randomRoomsEpisodeCharacterCreateSchema.parse({
          characterId: "outsider",
          roleInEpisode: "visitor",
        }),
      ),
    ).rejects.toMatchObject({ status: 422 } satisfies Partial<HttpError>);

    await expect(
      service.createScene(
        episode.id,
        randomRoomsSceneCreateSchema.parse({
          roomId: "other_room",
          title: "Wrong room",
          summary: "Uses another series room.",
          purpose: "SETUP",
          beat: "Bad ownership.",
          durationSec: 8,
        }),
      ),
    ).rejects.toMatchObject({ status: 422 } satisfies Partial<HttpError>);
  });

  it("requires dialogue characters to be assigned to the episode", async () => {
    const { service } = createFakeDb();
    const episode = await createAssignedEpisode(service);
    const scene = await createScene(service, episode.id, "Opening");

    await expect(
      service.createDialogueLine(
        scene.id,
        randomRoomsDialogueLineCreateSchema.parse({
          characterId: "glitch",
          text: "Instruction interpreted successfully.",
        }),
      ),
    ).rejects.toMatchObject({ status: 422 } satisfies Partial<HttpError>);

    const line = await service.createDialogueLine(
      scene.id,
      randomRoomsDialogueLineCreateSchema.parse({
        characterId: "rex",
        text: "Obviously this is under control.",
      }),
    );

    expect(line.lineNumber).toBe(1);
    expect(line.captionText).toBe("Obviously this is under control.");
  });

  it("normalizes scene, shot, and dialogue ordering after reorders and deletes", async () => {
    const { service } = createFakeDb();
    const episode = await createAssignedEpisode(service);
    const firstScene = await createScene(service, episode.id, "First scene");
    const secondScene = await createScene(service, episode.id, "Second scene");
    const reorderedScenes = await service.reorderScenes(episode.id, [secondScene.id, firstScene.id]);

    expect(reorderedScenes.map((scene) => [scene.id, scene.sceneNumber])).toEqual([
      [secondScene.id, 1],
      [firstScene.id, 2],
    ]);

    const firstShot = await createShot(service, secondScene.id, "First action");
    const secondShot = await createShot(service, secondScene.id, "Second action");
    const reorderedShots = await service.reorderShots(secondScene.id, [secondShot.id, firstShot.id]);

    expect(reorderedShots.map((shot) => [shot.id, shot.shotNumber])).toEqual([
      [secondShot.id, 1],
      [firstShot.id, 2],
    ]);

    const firstLine = await service.createDialogueLine(
      secondScene.id,
      randomRoomsDialogueLineCreateSchema.parse({ characterId: "rex", text: "First line." }),
    );
    const secondLine = await service.createDialogueLine(
      secondScene.id,
      randomRoomsDialogueLineCreateSchema.parse({ characterId: "rex", text: "Second line." }),
    );
    const reorderedDialogue = await service.reorderDialogueLines(secondScene.id, [secondLine.id, firstLine.id]);

    expect(reorderedDialogue.map((line) => [line.id, line.lineNumber])).toEqual([
      [secondLine.id, 1],
      [firstLine.id, 2],
    ]);

    await service.deleteShot(secondShot.id);
    expect((await service.listShots(secondScene.id)).map((shot) => shot.shotNumber)).toEqual([1]);

    await service.deleteDialogueLine(secondLine.id);
    expect((await service.listDialogueLines(secondScene.id)).map((line) => line.lineNumber)).toEqual([1]);
  });

  it("blocks removing an assigned character while dialogue references it", async () => {
    const { service } = createFakeDb();
    const episode = await createAssignedEpisode(service);
    const assignment = (await service.listEpisodeCharacters(episode.id))[0];
    const scene = await createScene(service, episode.id, "Opening");
    await service.createDialogueLine(
      scene.id,
      randomRoomsDialogueLineCreateSchema.parse({ characterId: "rex", text: "Obviously this is under control." }),
    );

    await expect(service.removeCharacterAssignment(episode.id, assignment.id)).rejects.toMatchObject({
      status: 422,
    } satisfies Partial<HttpError>);
  });

  it("returns validated context for mock-safe generation", async () => {
    const { service } = createFakeDb();
    const context = await service.getEpisodePlanGenerationContext({
      seriesId: "series_1",
      premise: "Rex automates his own firing.",
      selectedCharacterIds: ["rex", "glitch"],
      roomId: "office",
      targetDurationSec: 30,
    });

    expect(context.series.name).toBe("Random Rooms");
    expect(context.characters.map((character) => character.code)).toEqual(["REX", "GLITCH"]);
    expect(context.relationships).toHaveLength(1);
    expect(context.room?.code).toBe("AI_OFFICE");
  });
});
