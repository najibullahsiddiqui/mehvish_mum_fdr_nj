import { HttpError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { episodeCodeFromNumber, normalizeEpisodeCode } from "@/lib/random-rooms/normalize";
import type { RandomRoomsCharacterRecord, RandomRoomsRelationshipRecord, RandomRoomsSeriesRecord } from "@/lib/random-rooms/service";
import type { RoomProfileRecord } from "@/lib/random-rooms/room-service";
import type {
  randomRoomsDialogueLineCreateSchema,
  randomRoomsDialogueLineUpdateSchema,
  randomRoomsEpisodeCharacterCreateSchema,
  randomRoomsEpisodeCharacterUpdateSchema,
  randomRoomsEpisodeCreateSchema,
  randomRoomsEpisodePlanGenerateSchema,
  randomRoomsEpisodeUpdateSchema,
  randomRoomsSceneCreateSchema,
  randomRoomsSceneUpdateSchema,
  randomRoomsShotCreateSchema,
  randomRoomsShotUpdateSchema,
} from "@/lib/validation";
import type { z } from "zod";

export type RandomRoomsEpisodeCreateInput = z.infer<typeof randomRoomsEpisodeCreateSchema>;
export type RandomRoomsEpisodeUpdateInput = z.infer<typeof randomRoomsEpisodeUpdateSchema>;
export type RandomRoomsEpisodeCharacterCreateInput = z.infer<typeof randomRoomsEpisodeCharacterCreateSchema>;
export type RandomRoomsEpisodeCharacterUpdateInput = z.infer<typeof randomRoomsEpisodeCharacterUpdateSchema>;
export type RandomRoomsSceneCreateInput = z.infer<typeof randomRoomsSceneCreateSchema>;
export type RandomRoomsSceneUpdateInput = z.infer<typeof randomRoomsSceneUpdateSchema>;
export type RandomRoomsShotCreateInput = z.infer<typeof randomRoomsShotCreateSchema>;
export type RandomRoomsShotUpdateInput = z.infer<typeof randomRoomsShotUpdateSchema>;
export type RandomRoomsDialogueLineCreateInput = z.infer<typeof randomRoomsDialogueLineCreateSchema>;
export type RandomRoomsDialogueLineUpdateInput = z.infer<typeof randomRoomsDialogueLineUpdateSchema>;
export type RandomRoomsEpisodePlanGenerateInput = z.infer<typeof randomRoomsEpisodePlanGenerateSchema>;

type QueryArgs = Record<string, unknown>;
type MaybeDate = Date | string;

export type EpisodeCharacterProfileRecord = {
  id: string;
  code: string;
  name: string;
  role: string;
  characterType: string;
  active: boolean;
};

export type EpisodeCharacterRecord = {
  id: string;
  episodeId: string;
  characterId: string;
  character?: EpisodeCharacterProfileRecord | null;
  roleInEpisode: string;
  priority: number;
  notes: string | null;
  createdAt: MaybeDate;
  updatedAt: MaybeDate;
};

export type DialogueShotRecord = {
  id: string;
  shotNumber: number;
  shotType: string;
};

export type DialogueLineRecord = {
  id: string;
  sceneId: string;
  shotId: string | null;
  shot?: DialogueShotRecord | null;
  characterId: string;
  character?: EpisodeCharacterProfileRecord | null;
  lineNumber: number;
  text: string;
  emotion: string | null;
  deliveryStyle: string | null;
  captionText: string;
  startOffsetMs: number | null;
  durationEstimateMs: number | null;
  notes: string | null;
  createdAt: MaybeDate;
  updatedAt: MaybeDate;
};

export type ShotRecord = {
  id: string;
  sceneId: string;
  shotNumber: number;
  shotType: string;
  cameraFraming: string;
  cameraMovement: string;
  actionDescription: string;
  visualDescription: string;
  imagePrompt: string;
  videoPrompt: string;
  durationSec: number;
  emotion: string;
  continuityNotes: string | null;
  status: string;
  createdAt: MaybeDate;
  updatedAt: MaybeDate;
};

export type SceneRecord = {
  id: string;
  episodeId: string;
  sceneNumber: number;
  roomId: string | null;
  room?: RoomProfileRecord | null;
  title: string;
  summary: string;
  purpose: string;
  beat: string;
  durationSec: number;
  status: string;
  notes: string | null;
  shots?: ShotRecord[];
  dialogueLines?: DialogueLineRecord[];
  createdAt: MaybeDate;
  updatedAt: MaybeDate;
};

export type EpisodeRecord = {
  id: string;
  seriesId: string;
  episodeNumber: number;
  code: string;
  title: string;
  premise: string;
  hook: string;
  comedyAngle: string;
  targetDurationSec: number;
  targetAspectRatio: string;
  language: string;
  status: string;
  notes: string | null;
  characterAssignments?: EpisodeCharacterRecord[];
  scenes?: SceneRecord[];
  createdAt: MaybeDate;
  updatedAt: MaybeDate;
};

export type RandomRoomsPlanningDb = {
  randomRoomsSeries: {
    findUnique(args: QueryArgs): Promise<RandomRoomsSeriesRecord | null>;
  };
  character: {
    findMany(args?: QueryArgs): Promise<RandomRoomsCharacterRecord[]>;
    findUnique(args: QueryArgs): Promise<RandomRoomsCharacterRecord | null>;
  };
  characterRelationship: {
    findMany(args?: QueryArgs): Promise<RandomRoomsRelationshipRecord[]>;
  };
  roomProfile: {
    findUnique(args: QueryArgs): Promise<RoomProfileRecord | null>;
  };
  episode: {
    findMany(args?: QueryArgs): Promise<EpisodeRecord[]>;
    findUnique(args: QueryArgs): Promise<EpisodeRecord | null>;
    findFirst(args: QueryArgs): Promise<EpisodeRecord | null>;
    create(args: QueryArgs): Promise<EpisodeRecord>;
    update(args: QueryArgs): Promise<EpisodeRecord>;
  };
  episodeCharacter: {
    findMany(args?: QueryArgs): Promise<EpisodeCharacterRecord[]>;
    findUnique(args: QueryArgs): Promise<EpisodeCharacterRecord | null>;
    findFirst(args: QueryArgs): Promise<EpisodeCharacterRecord | null>;
    create(args: QueryArgs): Promise<EpisodeCharacterRecord>;
    update(args: QueryArgs): Promise<EpisodeCharacterRecord>;
    delete(args: QueryArgs): Promise<EpisodeCharacterRecord>;
  };
  scene: {
    findMany(args?: QueryArgs): Promise<SceneRecord[]>;
    findUnique(args: QueryArgs): Promise<SceneRecord | null>;
    findFirst(args: QueryArgs): Promise<SceneRecord | null>;
    create(args: QueryArgs): Promise<SceneRecord>;
    update(args: QueryArgs): Promise<SceneRecord>;
    delete(args: QueryArgs): Promise<SceneRecord>;
  };
  shot: {
    findMany(args?: QueryArgs): Promise<ShotRecord[]>;
    findUnique(args: QueryArgs): Promise<ShotRecord | null>;
    findFirst(args: QueryArgs): Promise<ShotRecord | null>;
    create(args: QueryArgs): Promise<ShotRecord>;
    update(args: QueryArgs): Promise<ShotRecord>;
    delete(args: QueryArgs): Promise<ShotRecord>;
  };
  dialogueLine: {
    findMany(args?: QueryArgs): Promise<DialogueLineRecord[]>;
    findUnique(args: QueryArgs): Promise<DialogueLineRecord | null>;
    findFirst(args: QueryArgs): Promise<DialogueLineRecord | null>;
    create(args: QueryArgs): Promise<DialogueLineRecord>;
    update(args: QueryArgs): Promise<DialogueLineRecord>;
    updateMany(args: QueryArgs): Promise<unknown>;
    delete(args: QueryArgs): Promise<DialogueLineRecord>;
  };
};

export const episodeCharacterSelect = {
  id: true,
  code: true,
  name: true,
  role: true,
  characterType: true,
  active: true,
};

export const dialogueShotSelect = {
  id: true,
  shotNumber: true,
  shotType: true,
};

export const randomRoomsEpisodeCharacterInclude = {
  character: { select: episodeCharacterSelect },
};

export const randomRoomsDialogueLineInclude = {
  character: { select: episodeCharacterSelect },
  shot: { select: dialogueShotSelect },
};

export const randomRoomsSceneInclude = {
  room: true,
  shots: { orderBy: { shotNumber: "asc" as const } },
  dialogueLines: {
    include: randomRoomsDialogueLineInclude,
    orderBy: { lineNumber: "asc" as const },
  },
};

export const randomRoomsEpisodeInclude = {
  characterAssignments: {
    include: randomRoomsEpisodeCharacterInclude,
    orderBy: [{ priority: "asc" as const }, { createdAt: "asc" as const }],
  },
  scenes: {
    include: randomRoomsSceneInclude,
    orderBy: { sceneNumber: "asc" as const },
  },
};

const TEMP_ORDER_BASE = 100000;

function definedData(input: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(input).filter((entry) => entry[1] !== undefined));
}

function textOrNull(value: string | null | undefined) {
  return value?.trim() ? value.trim() : null;
}

function assertFullOrder(records: Array<{ id: string }>, orderedIds: string[], label: string) {
  const recordIds = records.map((record) => record.id);
  const uniqueIds = new Set(orderedIds);

  if (uniqueIds.size !== orderedIds.length) {
    throw new HttpError(`${label} order contains duplicate IDs.`, 422);
  }

  if (recordIds.length !== orderedIds.length || recordIds.some((id) => !uniqueIds.has(id))) {
    throw new HttpError(`${label} order must include every current item exactly once.`, 422);
  }
}

function assertRoomReason(roomId: string | null | undefined, notes: string | null | undefined) {
  if (!roomId && !notes?.trim()) {
    throw new HttpError("Add a room or explain why this scene has no room in notes.", 422);
  }
}

export function createRandomRoomsPlanningService(db: RandomRoomsPlanningDb) {
  async function ensureSeries(seriesId: string) {
    const series = await db.randomRoomsSeries.findUnique({ where: { id: seriesId } });

    if (!series) {
      throw new HttpError("Random Rooms series not found.", 404);
    }

    return series;
  }

  async function ensureCharacter(characterId: string) {
    const character = await db.character.findUnique({ where: { id: characterId } });

    if (!character) {
      throw new HttpError("Character not found.", 404);
    }

    return character;
  }

  async function ensureRoom(roomId: string) {
    const room = await db.roomProfile.findUnique({ where: { id: roomId } });

    if (!room) {
      throw new HttpError("Room not found.", 404);
    }

    return room;
  }

  async function ensureEpisode(episodeId: string) {
    const episode = await db.episode.findUnique({ where: { id: episodeId } });

    if (!episode) {
      throw new HttpError("Episode not found.", 404);
    }

    return episode;
  }

  async function getEpisodeOrThrow(episodeId: string) {
    const episode = await db.episode.findUnique({
      where: { id: episodeId },
      include: randomRoomsEpisodeInclude,
    });

    if (!episode) {
      throw new HttpError("Episode not found.", 404);
    }

    return episode;
  }

  async function ensureScene(sceneId: string) {
    const scene = await db.scene.findUnique({ where: { id: sceneId } });

    if (!scene) {
      throw new HttpError("Scene not found.", 404);
    }

    return scene;
  }

  async function getSceneOrThrow(sceneId: string) {
    const scene = await db.scene.findUnique({
      where: { id: sceneId },
      include: randomRoomsSceneInclude,
    });

    if (!scene) {
      throw new HttpError("Scene not found.", 404);
    }

    return scene;
  }

  async function ensureShot(shotId: string) {
    const shot = await db.shot.findUnique({ where: { id: shotId } });

    if (!shot) {
      throw new HttpError("Shot not found.", 404);
    }

    return shot;
  }

  async function ensureDialogueLine(dialogueLineId: string) {
    const line = await db.dialogueLine.findUnique({ where: { id: dialogueLineId } });

    if (!line) {
      throw new HttpError("Dialogue line not found.", 404);
    }

    return line;
  }

  async function assertEpisodeNumberAvailable(seriesId: string, episodeNumber: number, excludeId?: string) {
    const existing = await db.episode.findFirst({
      where: {
        seriesId,
        episodeNumber,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    });

    if (existing) {
      throw new HttpError("An episode with this number already exists in the selected series.", 409);
    }
  }

  async function assertEpisodeCodeAvailable(seriesId: string, code: string, excludeId?: string) {
    const existing = await db.episode.findFirst({
      where: {
        seriesId,
        code,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    });

    if (existing) {
      throw new HttpError("An episode with this code already exists in the selected series.", 409);
    }
  }

  async function assertSceneNumberAvailable(episodeId: string, sceneNumber: number, excludeId?: string) {
    const existing = await db.scene.findFirst({
      where: {
        episodeId,
        sceneNumber,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    });

    if (existing) {
      throw new HttpError("A scene with this number already exists in this episode.", 409);
    }
  }

  async function assertShotNumberAvailable(sceneId: string, shotNumber: number, excludeId?: string) {
    const existing = await db.shot.findFirst({
      where: {
        sceneId,
        shotNumber,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    });

    if (existing) {
      throw new HttpError("A shot with this number already exists in this scene.", 409);
    }
  }

  async function assertDialogueLineNumberAvailable(sceneId: string, lineNumber: number, excludeId?: string) {
    const existing = await db.dialogueLine.findFirst({
      where: {
        sceneId,
        lineNumber,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    });

    if (existing) {
      throw new HttpError("A dialogue line with this number already exists in this scene.", 409);
    }
  }

  async function nextEpisodeNumber(seriesId: string) {
    const latest = await db.episode.findFirst({
      where: { seriesId },
      orderBy: { episodeNumber: "desc" },
    });

    return latest ? latest.episodeNumber + 1 : 1;
  }

  async function nextSceneNumber(episodeId: string) {
    const latest = await db.scene.findFirst({
      where: { episodeId },
      orderBy: { sceneNumber: "desc" },
    });

    return latest ? latest.sceneNumber + 1 : 1;
  }

  async function nextShotNumber(sceneId: string) {
    const latest = await db.shot.findFirst({
      where: { sceneId },
      orderBy: { shotNumber: "desc" },
    });

    return latest ? latest.shotNumber + 1 : 1;
  }

  async function nextDialogueLineNumber(sceneId: string) {
    const latest = await db.dialogueLine.findFirst({
      where: { sceneId },
      orderBy: { lineNumber: "desc" },
    });

    return latest ? latest.lineNumber + 1 : 1;
  }

  async function assertRoomInEpisodeSeries(episode: Pick<EpisodeRecord, "seriesId">, roomId: string | null | undefined) {
    if (!roomId) {
      return;
    }

    const room = await ensureRoom(roomId);

    if (room.seriesId !== episode.seriesId) {
      throw new HttpError("Scene room must belong to the same series as the episode.", 422);
    }
  }

  async function ensureCharacterAssignedToEpisode(episodeId: string, characterId: string) {
    const assignment = await db.episodeCharacter.findFirst({
      where: {
        episodeId,
        characterId,
      },
    });

    if (!assignment) {
      throw new HttpError("Dialogue character must be assigned to this episode.", 422);
    }

    return assignment;
  }

  async function assertShotInScene(sceneId: string, shotId: string | null | undefined) {
    if (!shotId) {
      return;
    }

    const shot = await ensureShot(shotId);

    if (shot.sceneId !== sceneId) {
      throw new HttpError("Dialogue shot must belong to the same scene.", 422);
    }
  }

  async function normalizeSceneNumbers(episodeId: string) {
    const scenes = await db.scene.findMany({
      where: { episodeId },
      orderBy: { sceneNumber: "asc" },
    });

    await applySceneOrder(episodeId, scenes.map((scene) => scene.id));
  }

  async function normalizeShotNumbers(sceneId: string) {
    const shots = await db.shot.findMany({
      where: { sceneId },
      orderBy: { shotNumber: "asc" },
    });

    await applyShotOrder(sceneId, shots.map((shot) => shot.id));
  }

  async function normalizeDialogueLineNumbers(sceneId: string) {
    const lines = await db.dialogueLine.findMany({
      where: { sceneId },
      orderBy: { lineNumber: "asc" },
    });

    await applyDialogueOrder(sceneId, lines.map((line) => line.id));
  }

  async function applySceneOrder(episodeId: string, orderedIds: string[]) {
    const scenes = await db.scene.findMany({
      where: { episodeId },
      orderBy: { sceneNumber: "asc" },
    });

    assertFullOrder(scenes, orderedIds, "Scene");

    for (let index = 0; index < orderedIds.length; index += 1) {
      await db.scene.update({
        where: { id: orderedIds[index] },
        data: { sceneNumber: TEMP_ORDER_BASE + index },
      });
    }

    for (let index = 0; index < orderedIds.length; index += 1) {
      await db.scene.update({
        where: { id: orderedIds[index] },
        data: { sceneNumber: index + 1 },
      });
    }

    return db.scene.findMany({
      where: { episodeId },
      include: randomRoomsSceneInclude,
      orderBy: { sceneNumber: "asc" },
    });
  }

  async function applyShotOrder(sceneId: string, orderedIds: string[]) {
    const shots = await db.shot.findMany({
      where: { sceneId },
      orderBy: { shotNumber: "asc" },
    });

    assertFullOrder(shots, orderedIds, "Shot");

    for (let index = 0; index < orderedIds.length; index += 1) {
      await db.shot.update({
        where: { id: orderedIds[index] },
        data: { shotNumber: TEMP_ORDER_BASE + index },
      });
    }

    for (let index = 0; index < orderedIds.length; index += 1) {
      await db.shot.update({
        where: { id: orderedIds[index] },
        data: { shotNumber: index + 1 },
      });
    }

    return db.shot.findMany({
      where: { sceneId },
      orderBy: { shotNumber: "asc" },
    });
  }

  async function applyDialogueOrder(sceneId: string, orderedIds: string[]) {
    const lines = await db.dialogueLine.findMany({
      where: { sceneId },
      orderBy: { lineNumber: "asc" },
    });

    assertFullOrder(lines, orderedIds, "Dialogue");

    for (let index = 0; index < orderedIds.length; index += 1) {
      await db.dialogueLine.update({
        where: { id: orderedIds[index] },
        data: { lineNumber: TEMP_ORDER_BASE + index },
      });
    }

    for (let index = 0; index < orderedIds.length; index += 1) {
      await db.dialogueLine.update({
        where: { id: orderedIds[index] },
        data: { lineNumber: index + 1 },
      });
    }

    return db.dialogueLine.findMany({
      where: { sceneId },
      include: randomRoomsDialogueLineInclude,
      orderBy: { lineNumber: "asc" },
    });
  }

  return {
    async listEpisodes(filters: { seriesId?: string; status?: string } = {}) {
      if (filters.seriesId) {
        await ensureSeries(filters.seriesId);
      }

      return db.episode.findMany({
        where: definedData({
          seriesId: filters.seriesId,
          status: filters.status,
        }),
        include: randomRoomsEpisodeInclude,
        orderBy: [{ status: "asc" }, { episodeNumber: "asc" }],
      });
    },

    async getEpisode(episodeId: string) {
      return getEpisodeOrThrow(episodeId);
    },

    async createEpisode(input: RandomRoomsEpisodeCreateInput) {
      await ensureSeries(input.seriesId);
      const episodeNumber = input.episodeNumber ?? (await nextEpisodeNumber(input.seriesId));
      const code = normalizeEpisodeCode(input.code || episodeCodeFromNumber(episodeNumber));

      await assertEpisodeNumberAvailable(input.seriesId, episodeNumber);
      await assertEpisodeCodeAvailable(input.seriesId, code);

      const episode = await db.episode.create({
        data: {
          ...input,
          episodeNumber,
          code,
        },
      });

      return getEpisodeOrThrow(episode.id);
    },

    async updateEpisode(episodeId: string, input: RandomRoomsEpisodeUpdateInput) {
      const episode = await ensureEpisode(episodeId);
      const episodeNumber = input.episodeNumber;
      const code = input.code ? normalizeEpisodeCode(input.code) : undefined;

      if (episodeNumber && episodeNumber !== episode.episodeNumber) {
        await assertEpisodeNumberAvailable(episode.seriesId, episodeNumber, episodeId);
      }

      if (code && code !== episode.code) {
        await assertEpisodeCodeAvailable(episode.seriesId, code, episodeId);
      }

      const updated = await db.episode.update({
        where: { id: episodeId },
        data: definedData({
          ...input,
          code,
        }),
      });

      return getEpisodeOrThrow(updated.id);
    },

    async archiveEpisode(episodeId: string) {
      await ensureEpisode(episodeId);
      const episode = await db.episode.update({
        where: { id: episodeId },
        data: { status: "ARCHIVED" },
      });

      return getEpisodeOrThrow(episode.id);
    },

    async listEpisodeCharacters(episodeId: string) {
      await ensureEpisode(episodeId);

      return db.episodeCharacter.findMany({
        where: { episodeId },
        include: randomRoomsEpisodeCharacterInclude,
        orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
      });
    },

    async assignCharacter(episodeId: string, input: RandomRoomsEpisodeCharacterCreateInput) {
      const [episode, character] = await Promise.all([ensureEpisode(episodeId), ensureCharacter(input.characterId)]);

      if (character.seriesId !== episode.seriesId) {
        throw new HttpError("Assigned character must belong to the same series as the episode.", 422);
      }

      const existing = await db.episodeCharacter.findFirst({
        where: {
          episodeId,
          characterId: input.characterId,
        },
      });

      if (existing) {
        throw new HttpError("This character is already assigned to the episode.", 409);
      }

      return db.episodeCharacter.create({
        data: {
          episodeId,
          characterId: input.characterId,
          roleInEpisode: input.roleInEpisode,
          priority: input.priority,
          notes: input.notes,
        },
        include: randomRoomsEpisodeCharacterInclude,
      });
    },

    async updateCharacterAssignment(episodeId: string, assignmentId: string, input: RandomRoomsEpisodeCharacterUpdateInput) {
      await ensureEpisode(episodeId);
      const assignment = await db.episodeCharacter.findUnique({
        where: { id: assignmentId },
        include: randomRoomsEpisodeCharacterInclude,
      });

      if (!assignment || assignment.episodeId !== episodeId) {
        throw new HttpError("Character assignment not found.", 404);
      }

      return db.episodeCharacter.update({
        where: { id: assignmentId },
        data: definedData(input),
        include: randomRoomsEpisodeCharacterInclude,
      });
    },

    async removeCharacterAssignment(episodeId: string, assignmentId: string) {
      await ensureEpisode(episodeId);
      const assignment = await db.episodeCharacter.findUnique({ where: { id: assignmentId } });

      if (!assignment || assignment.episodeId !== episodeId) {
        throw new HttpError("Character assignment not found.", 404);
      }

      const scenes = await db.scene.findMany({ where: { episodeId } });
      const existingDialogue = scenes.length
        ? await db.dialogueLine.findFirst({
            where: {
              sceneId: { in: scenes.map((scene) => scene.id) },
              characterId: assignment.characterId,
            },
          })
        : null;

      if (existingDialogue) {
        throw new HttpError("Remove this character's dialogue lines before removing the episode assignment.", 422);
      }

      return db.episodeCharacter.delete({ where: { id: assignmentId } });
    },

    async listScenes(episodeId: string) {
      await ensureEpisode(episodeId);

      return db.scene.findMany({
        where: { episodeId },
        include: randomRoomsSceneInclude,
        orderBy: { sceneNumber: "asc" },
      });
    },

    async getScene(sceneId: string) {
      return getSceneOrThrow(sceneId);
    },

    async createScene(episodeId: string, input: RandomRoomsSceneCreateInput) {
      const episode = await ensureEpisode(episodeId);
      assertRoomReason(input.roomId, input.notes);
      await assertRoomInEpisodeSeries(episode, input.roomId);
      const sceneNumber = input.sceneNumber ?? (await nextSceneNumber(episodeId));
      await assertSceneNumberAvailable(episodeId, sceneNumber);

      const scene = await db.scene.create({
        data: {
          episodeId,
          sceneNumber,
          roomId: input.roomId,
          title: input.title,
          summary: input.summary,
          purpose: input.purpose,
          beat: input.beat,
          durationSec: input.durationSec,
          status: input.status,
          notes: input.notes,
        },
      });

      return getSceneOrThrow(scene.id);
    },

    async updateScene(sceneId: string, input: RandomRoomsSceneUpdateInput) {
      const scene = await ensureScene(sceneId);
      const episode = await ensureEpisode(scene.episodeId);
      const roomId = input.roomId === undefined ? scene.roomId : input.roomId;
      const notes = input.notes === undefined ? scene.notes : input.notes;

      assertRoomReason(roomId, notes);
      await assertRoomInEpisodeSeries(episode, roomId);

      if (input.sceneNumber && input.sceneNumber !== scene.sceneNumber) {
        await assertSceneNumberAvailable(scene.episodeId, input.sceneNumber, sceneId);
      }

      const updated = await db.scene.update({
        where: { id: sceneId },
        data: definedData(input),
      });

      return getSceneOrThrow(updated.id);
    },

    async deleteScene(sceneId: string) {
      const scene = await ensureScene(sceneId);
      const deleted = await db.scene.delete({ where: { id: sceneId } });
      await normalizeSceneNumbers(scene.episodeId);
      return deleted;
    },

    async reorderScenes(episodeId: string, orderedIds: string[]) {
      await ensureEpisode(episodeId);
      return applySceneOrder(episodeId, orderedIds);
    },

    async listShots(sceneId: string) {
      await ensureScene(sceneId);

      return db.shot.findMany({
        where: { sceneId },
        orderBy: { shotNumber: "asc" },
      });
    },

    async getShot(shotId: string) {
      const shot = await db.shot.findUnique({ where: { id: shotId } });

      if (!shot) {
        throw new HttpError("Shot not found.", 404);
      }

      return shot;
    },

    async createShot(sceneId: string, input: RandomRoomsShotCreateInput) {
      await ensureScene(sceneId);
      const shotNumber = input.shotNumber ?? (await nextShotNumber(sceneId));
      await assertShotNumberAvailable(sceneId, shotNumber);

      return db.shot.create({
        data: {
          sceneId,
          shotNumber,
          shotType: input.shotType,
          cameraFraming: input.cameraFraming,
          cameraMovement: input.cameraMovement,
          actionDescription: input.actionDescription,
          visualDescription: input.visualDescription,
          imagePrompt: input.imagePrompt,
          videoPrompt: input.videoPrompt,
          durationSec: input.durationSec,
          emotion: input.emotion,
          continuityNotes: input.continuityNotes,
          status: input.status,
        },
      });
    },

    async updateShot(shotId: string, input: RandomRoomsShotUpdateInput) {
      const shot = await ensureShot(shotId);

      if (input.shotNumber && input.shotNumber !== shot.shotNumber) {
        await assertShotNumberAvailable(shot.sceneId, input.shotNumber, shotId);
      }

      return db.shot.update({
        where: { id: shotId },
        data: definedData(input),
      });
    },

    async deleteShot(shotId: string) {
      const shot = await ensureShot(shotId);
      await db.dialogueLine.updateMany({
        where: { shotId },
        data: { shotId: null },
      });
      const deleted = await db.shot.delete({ where: { id: shotId } });
      await normalizeShotNumbers(shot.sceneId);
      return deleted;
    },

    async reorderShots(sceneId: string, orderedIds: string[]) {
      await ensureScene(sceneId);
      return applyShotOrder(sceneId, orderedIds);
    },

    async listDialogueLines(sceneId: string) {
      await ensureScene(sceneId);

      return db.dialogueLine.findMany({
        where: { sceneId },
        include: randomRoomsDialogueLineInclude,
        orderBy: { lineNumber: "asc" },
      });
    },

    async getDialogueLine(dialogueLineId: string) {
      const line = await db.dialogueLine.findUnique({
        where: { id: dialogueLineId },
        include: randomRoomsDialogueLineInclude,
      });

      if (!line) {
        throw new HttpError("Dialogue line not found.", 404);
      }

      return line;
    },

    async createDialogueLine(sceneId: string, input: RandomRoomsDialogueLineCreateInput) {
      const scene = await ensureScene(sceneId);
      await ensureCharacterAssignedToEpisode(scene.episodeId, input.characterId);
      await assertShotInScene(sceneId, input.shotId);
      const lineNumber = input.lineNumber ?? (await nextDialogueLineNumber(sceneId));
      await assertDialogueLineNumberAvailable(sceneId, lineNumber);

      return db.dialogueLine.create({
        data: {
          sceneId,
          lineNumber,
          shotId: input.shotId,
          characterId: input.characterId,
          text: input.text,
          emotion: input.emotion,
          deliveryStyle: input.deliveryStyle,
          captionText: textOrNull(input.captionText) || input.text,
          startOffsetMs: input.startOffsetMs,
          durationEstimateMs: input.durationEstimateMs,
          notes: input.notes,
        },
        include: randomRoomsDialogueLineInclude,
      });
    },

    async updateDialogueLine(dialogueLineId: string, input: RandomRoomsDialogueLineUpdateInput) {
      const line = await ensureDialogueLine(dialogueLineId);
      const scene = await ensureScene(line.sceneId);
      const characterId = input.characterId ?? line.characterId;
      const shotId = input.shotId === undefined ? line.shotId : input.shotId;

      await ensureCharacterAssignedToEpisode(scene.episodeId, characterId);
      await assertShotInScene(line.sceneId, shotId);

      if (input.lineNumber && input.lineNumber !== line.lineNumber) {
        await assertDialogueLineNumberAvailable(line.sceneId, input.lineNumber, dialogueLineId);
      }

      const captionText =
        input.captionText === undefined ? undefined : textOrNull(input.captionText) || input.text || line.text;

      return db.dialogueLine.update({
        where: { id: dialogueLineId },
        data: definedData({
          ...input,
          shotId,
          characterId,
          captionText,
        }),
        include: randomRoomsDialogueLineInclude,
      });
    },

    async deleteDialogueLine(dialogueLineId: string) {
      const line = await ensureDialogueLine(dialogueLineId);
      const deleted = await db.dialogueLine.delete({ where: { id: dialogueLineId } });
      await normalizeDialogueLineNumbers(line.sceneId);
      return deleted;
    },

    async reorderDialogueLines(sceneId: string, orderedIds: string[]) {
      await ensureScene(sceneId);
      return applyDialogueOrder(sceneId, orderedIds);
    },

    async getEpisodePlanGenerationContext(input: RandomRoomsEpisodePlanGenerateInput) {
      const series = await ensureSeries(input.seriesId);
      const characters = await db.character.findMany({
        where: { id: { in: input.selectedCharacterIds } },
      });

      if (characters.length !== input.selectedCharacterIds.length) {
        throw new HttpError("All selected characters must exist.", 404);
      }

      if (characters.some((character) => character.seriesId !== series.id)) {
        throw new HttpError("All selected characters must belong to the selected series.", 422);
      }

      const room = input.roomId ? await ensureRoom(input.roomId) : null;

      if (room && room.seriesId !== series.id) {
        throw new HttpError("Selected room must belong to the selected series.", 422);
      }

      const relationships = await db.characterRelationship.findMany({
        where: {
          seriesId: series.id,
          active: true,
        },
        include: {
          characterA: { select: { id: true, code: true, name: true, characterType: true, active: true } },
          characterB: { select: { id: true, code: true, name: true, characterType: true, active: true } },
        },
      });
      const selected = new Set(input.selectedCharacterIds);

      return {
        series,
        characters: input.selectedCharacterIds
          .map((id) => characters.find((character) => character.id === id))
          .filter((character): character is RandomRoomsCharacterRecord => !!character),
        relationships: relationships.filter(
          (relationship) => selected.has(relationship.characterAId) && selected.has(relationship.characterBId),
        ),
        room,
      };
    },
  };
}

export const randomRoomsPlanningService = createRandomRoomsPlanningService(prisma as unknown as RandomRoomsPlanningDb);
