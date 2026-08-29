import { HttpError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { randomRoomsEpisodeInclude, type EpisodeRecord } from "@/lib/random-rooms/planning-service";
import { normalizeCharacterCode, normalizeRelationshipPair, relationshipPairKey } from "@/lib/random-rooms/normalize";
import type { RoomProfileRecord } from "@/lib/random-rooms/room-service";
import type { CharacterVoiceProfile } from "@/lib/types";
import type {
  randomRoomsCharacterCreateSchema,
  randomRoomsCharacterUpdateSchema,
  randomRoomsRelationshipCreateSchema,
  randomRoomsRelationshipUpdateSchema,
  randomRoomsSeriesCreateSchema,
  randomRoomsSeriesUpdateSchema,
} from "@/lib/validation";
import type { z } from "zod";

export type RandomRoomsSeriesCreateInput = z.infer<typeof randomRoomsSeriesCreateSchema>;
export type RandomRoomsSeriesUpdateInput = z.infer<typeof randomRoomsSeriesUpdateSchema>;
export type RandomRoomsCharacterCreateInput = z.infer<typeof randomRoomsCharacterCreateSchema>;
export type RandomRoomsCharacterUpdateInput = z.infer<typeof randomRoomsCharacterUpdateSchema>;
export type RandomRoomsRelationshipCreateInput = z.infer<typeof randomRoomsRelationshipCreateSchema>;
export type RandomRoomsRelationshipUpdateInput = z.infer<typeof randomRoomsRelationshipUpdateSchema>;

type QueryArgs = Record<string, unknown>;
type MaybeDate = Date | string;
type JsonValue = CharacterVoiceProfile | Record<string, unknown> | null;

export type RandomRoomsCharacterRecord = {
  id: string;
  seriesId: string;
  code: string;
  name: string;
  role: string;
  characterType: string;
  personality: string[];
  speakingStyle: string[];
  catchphrases: string[];
  doNotSay: string[];
  visualDescription: string;
  signatureTraits: string[];
  voiceProfile?: JsonValue;
  continuityNotes: string | null;
  referenceAssetNotes: string | null;
  active: boolean;
  createdAt: MaybeDate;
  updatedAt: MaybeDate;
};

export type RandomRoomsRelationshipIdentityRecord = {
  id: string;
  code: string;
  name: string;
  characterType: string;
  active: boolean;
};

export type RandomRoomsRelationshipRecord = {
  id: string;
  seriesId: string;
  characterAId: string;
  characterBId: string;
  pairKey: string;
  relationshipType: string;
  dynamic: string;
  conflictPattern: string;
  comedyPattern: string;
  continuityNotes: string | null;
  active: boolean;
  createdAt: MaybeDate;
  updatedAt: MaybeDate;
  characterA?: RandomRoomsRelationshipIdentityRecord | null;
  characterB?: RandomRoomsRelationshipIdentityRecord | null;
};

export type RandomRoomsSeriesRecord = {
  id: string;
  name: string;
  slug: string;
  concept: string;
  tone: string;
  language: string;
  targetFormat: string;
  defaultDurationSec: number;
  contentRules: string[];
  active: boolean;
  characters?: RandomRoomsCharacterRecord[];
  relationships?: RandomRoomsRelationshipRecord[];
  rooms?: RoomProfileRecord[];
  episodes?: EpisodeRecord[];
  createdAt: MaybeDate;
  updatedAt: MaybeDate;
};

export type RandomRoomsDb = {
  randomRoomsSeries: {
    findMany(args?: QueryArgs): Promise<RandomRoomsSeriesRecord[]>;
    findUnique(args: QueryArgs): Promise<RandomRoomsSeriesRecord | null>;
    create(args: QueryArgs): Promise<RandomRoomsSeriesRecord>;
    update(args: QueryArgs): Promise<RandomRoomsSeriesRecord>;
  };
  character: {
    findMany(args?: QueryArgs): Promise<RandomRoomsCharacterRecord[]>;
    findUnique(args: QueryArgs): Promise<RandomRoomsCharacterRecord | null>;
    findFirst(args: QueryArgs): Promise<RandomRoomsCharacterRecord | null>;
    create(args: QueryArgs): Promise<RandomRoomsCharacterRecord>;
    update(args: QueryArgs): Promise<RandomRoomsCharacterRecord>;
  };
  characterRelationship: {
    findMany(args?: QueryArgs): Promise<RandomRoomsRelationshipRecord[]>;
    findUnique(args: QueryArgs): Promise<RandomRoomsRelationshipRecord | null>;
    create(args: QueryArgs): Promise<RandomRoomsRelationshipRecord>;
    update(args: QueryArgs): Promise<RandomRoomsRelationshipRecord>;
  };
};

const relationshipCharacterSelect = {
  id: true,
  code: true,
  name: true,
  characterType: true,
  active: true,
};

export const randomRoomsRelationshipInclude = {
  characterA: { select: relationshipCharacterSelect },
  characterB: { select: relationshipCharacterSelect },
};

export const randomRoomsSeriesInclude = {
  characters: { orderBy: [{ active: "desc" as const }, { updatedAt: "desc" as const }] },
  rooms: { orderBy: [{ active: "desc" as const }, { updatedAt: "desc" as const }] },
  episodes: {
    include: randomRoomsEpisodeInclude,
    orderBy: [{ status: "asc" as const }, { episodeNumber: "asc" as const }],
  },
  relationships: {
    include: randomRoomsRelationshipInclude,
    orderBy: [{ active: "desc" as const }, { updatedAt: "desc" as const }],
  },
};

function normalizeVoiceProfile(profile: Partial<CharacterVoiceProfile> | null | undefined): CharacterVoiceProfile {
  return {
    voiceProviderHint: profile?.voiceProviderHint?.trim() || null,
    voiceId: profile?.voiceId?.trim() || null,
    voiceStyle: profile?.voiceStyle?.trim() || null,
    voiceNotes: profile?.voiceNotes?.trim() || null,
  };
}

function definedData(input: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(input).filter((entry) => entry[1] !== undefined));
}

function assertDifferentCharacters(characterAId: string, characterBId: string) {
  if (characterAId === characterBId) {
    throw new HttpError("Choose two different characters.", 422);
  }
}

export function createRandomRoomsService(db: RandomRoomsDb) {
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

  async function ensureRelationship(relationshipId: string) {
    const relationship = await db.characterRelationship.findUnique({
      where: { id: relationshipId },
      include: randomRoomsRelationshipInclude,
    });

    if (!relationship) {
      throw new HttpError("Character relationship not found.", 404);
    }

    return relationship;
  }

  async function assertSlugAvailable(slug: string, excludeId?: string) {
    const existing = await db.randomRoomsSeries.findUnique({ where: { slug } });

    if (existing && existing.id !== excludeId) {
      throw new HttpError("A Random Rooms series already uses this slug.", 409);
    }
  }

  async function assertCharacterCodeAvailable(seriesId: string, code: string, excludeId?: string) {
    const existing = await db.character.findFirst({
      where: {
        seriesId,
        code,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    });

    if (existing) {
      throw new HttpError("A character with this code already exists in the selected series.", 409);
    }
  }

  async function loadRelationshipCharacters(seriesId: string, characterAId: string, characterBId: string) {
    assertDifferentCharacters(characterAId, characterBId);

    const characters = await db.character.findMany({
      where: {
        id: { in: [characterAId, characterBId] },
      },
    });

    if (characters.length !== 2) {
      throw new HttpError("Both relationship characters must exist.", 404);
    }

    if (characters.some((character) => character.seriesId !== seriesId)) {
      throw new HttpError("Both relationship characters must belong to the selected series.", 422);
    }

    return characters;
  }

  async function assertRelationshipPairAvailable(seriesId: string, characterAId: string, characterBId: string, excludeId?: string) {
    const pairKey = relationshipPairKey(characterAId, characterBId);
    const existing = await db.characterRelationship.findUnique({
      where: {
        seriesId_pairKey: {
          seriesId,
          pairKey,
        },
      },
    });

    if (existing && existing.id !== excludeId) {
      throw new HttpError("A relationship already exists for this character pair.", 409);
    }

    return pairKey;
  }

  return {
    async listSeries() {
      return db.randomRoomsSeries.findMany({
        include: randomRoomsSeriesInclude,
        orderBy: [{ active: "desc" }, { updatedAt: "desc" }],
      });
    },

    async getSeriesBySlug(slug: string) {
      return db.randomRoomsSeries.findUnique({
        where: { slug },
        include: randomRoomsSeriesInclude,
      });
    },

    async createSeries(input: RandomRoomsSeriesCreateInput) {
      await assertSlugAvailable(input.slug);

      return db.randomRoomsSeries.create({
        data: input,
        include: randomRoomsSeriesInclude,
      });
    },

    async updateSeries(seriesId: string, input: RandomRoomsSeriesUpdateInput) {
      await ensureSeries(seriesId);

      if (input.slug) {
        await assertSlugAvailable(input.slug, seriesId);
      }

      return db.randomRoomsSeries.update({
        where: { id: seriesId },
        data: input,
        include: randomRoomsSeriesInclude,
      });
    },

    async listCharacters(seriesId?: string) {
      return db.character.findMany({
        where: seriesId ? { seriesId } : undefined,
        orderBy: [{ active: "desc" }, { updatedAt: "desc" }],
      });
    },

    async createCharacter(input: RandomRoomsCharacterCreateInput) {
      await ensureSeries(input.seriesId);
      const code = normalizeCharacterCode(input.code);
      await assertCharacterCodeAvailable(input.seriesId, code);

      return db.character.create({
        data: {
          ...input,
          code,
          voiceProfile: normalizeVoiceProfile(input.voiceProfile),
        },
      });
    },

    async updateCharacter(characterId: string, input: RandomRoomsCharacterUpdateInput) {
      const character = await ensureCharacter(characterId);
      const code = input.code ? normalizeCharacterCode(input.code) : undefined;

      if (code && code !== character.code) {
        await assertCharacterCodeAvailable(character.seriesId, code, characterId);
      }

      return db.character.update({
        where: { id: characterId },
        data: definedData({
          ...input,
          code,
          voiceProfile: input.voiceProfile === undefined ? undefined : normalizeVoiceProfile(input.voiceProfile),
        }),
      });
    },

    async deactivateCharacter(characterId: string) {
      await ensureCharacter(characterId);

      return db.character.update({
        where: { id: characterId },
        data: { active: false },
      });
    },

    async listRelationships(seriesId?: string) {
      return db.characterRelationship.findMany({
        where: seriesId ? { seriesId } : undefined,
        include: randomRoomsRelationshipInclude,
        orderBy: [{ active: "desc" }, { updatedAt: "desc" }],
      });
    },

    async createRelationship(input: RandomRoomsRelationshipCreateInput) {
      await ensureSeries(input.seriesId);
      await loadRelationshipCharacters(input.seriesId, input.characterAId, input.characterBId);
      const [characterAId, characterBId] = normalizeRelationshipPair(input.characterAId, input.characterBId);
      const pairKey = await assertRelationshipPairAvailable(input.seriesId, characterAId, characterBId);

      return db.characterRelationship.create({
        data: {
          ...input,
          characterAId,
          characterBId,
          pairKey,
        },
        include: randomRoomsRelationshipInclude,
      });
    },

    async updateRelationship(relationshipId: string, input: RandomRoomsRelationshipUpdateInput) {
      const relationship = await ensureRelationship(relationshipId);
      const nextCharacterAId = input.characterAId ?? relationship.characterAId;
      const nextCharacterBId = input.characterBId ?? relationship.characterBId;
      const charactersChanged =
        nextCharacterAId !== relationship.characterAId || nextCharacterBId !== relationship.characterBId;

      assertDifferentCharacters(nextCharacterAId, nextCharacterBId);

      let normalizedCharacterAId: string | undefined;
      let normalizedCharacterBId: string | undefined;
      let pairKey: string | undefined;

      if (charactersChanged) {
        await loadRelationshipCharacters(relationship.seriesId, nextCharacterAId, nextCharacterBId);
        [normalizedCharacterAId, normalizedCharacterBId] = normalizeRelationshipPair(nextCharacterAId, nextCharacterBId);
        pairKey = await assertRelationshipPairAvailable(
          relationship.seriesId,
          normalizedCharacterAId,
          normalizedCharacterBId,
          relationshipId,
        );
      }

      return db.characterRelationship.update({
        where: { id: relationshipId },
        data: definedData({
          relationshipType: input.relationshipType,
          dynamic: input.dynamic,
          conflictPattern: input.conflictPattern,
          comedyPattern: input.comedyPattern,
          continuityNotes: input.continuityNotes,
          active: input.active,
          characterAId: normalizedCharacterAId,
          characterBId: normalizedCharacterBId,
          pairKey,
        }),
        include: randomRoomsRelationshipInclude,
      });
    },

    async deactivateRelationship(relationshipId: string) {
      await ensureRelationship(relationshipId);

      return db.characterRelationship.update({
        where: { id: relationshipId },
        data: { active: false },
        include: randomRoomsRelationshipInclude,
      });
    },
  };
}

export const randomRoomsService = createRandomRoomsService(prisma as unknown as RandomRoomsDb);
