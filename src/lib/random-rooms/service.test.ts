import { describe, expect, it } from "vitest";
import { HttpError } from "@/lib/api";
import { relationshipPairKey } from "@/lib/random-rooms/normalize";
import {
  createRandomRoomsService,
  type RandomRoomsCharacterRecord,
  type RandomRoomsDb,
  type RandomRoomsRelationshipRecord,
  type RandomRoomsSeriesRecord,
} from "@/lib/random-rooms/service";
import { randomRoomsCharacterCreateSchema, randomRoomsRelationshipCreateSchema } from "@/lib/validation";

const now = new Date("2026-08-28T10:00:00.000Z");

function whereFrom(args: Record<string, unknown> | undefined) {
  return (args?.where || {}) as Record<string, unknown>;
}

function dataFrom<T>(args: Record<string, unknown>) {
  return args.data as Partial<T>;
}

function createFakeDb() {
  const series: RandomRoomsSeriesRecord[] = [
    {
      id: "series_1",
      name: "Random Rooms",
      slug: "random-rooms",
      concept: "Short recurring-character comedy.",
      tone: "Fast and absurd.",
      language: "hinglish",
      targetFormat: "youtube_shorts",
      defaultDurationSec: 60,
      contentRules: [],
      active: true,
      createdAt: now,
      updatedAt: now,
    },
  ];
  const characters: RandomRoomsCharacterRecord[] = [];
  const relationships: RandomRoomsRelationshipRecord[] = [];
  let counter = 1;

  const nextId = (prefix: string) => `${prefix}_${counter++}`;
  const relationshipWithCharacters = (relationship: RandomRoomsRelationshipRecord): RandomRoomsRelationshipRecord => ({
    ...relationship,
    characterA: identityFor(relationship.characterAId),
    characterB: identityFor(relationship.characterBId),
  });
  const seriesWithNested = (record: RandomRoomsSeriesRecord): RandomRoomsSeriesRecord => ({
    ...record,
    characters: characters.filter((character) => character.seriesId === record.id),
    relationships: relationships.filter((relationship) => relationship.seriesId === record.id).map(relationshipWithCharacters),
  });
  const identityFor = (id: string) => {
    const character = characters.find((item) => item.id === id);

    if (!character) {
      return null;
    }

    return {
      id: character.id,
      code: character.code,
      name: character.name,
      characterType: character.characterType,
      active: character.active,
    };
  };

  const db: RandomRoomsDb = {
    randomRoomsSeries: {
      findMany: async () => series.map(seriesWithNested),
      findUnique: async (args) => {
        const where = whereFrom(args);
        const found =
          typeof where.id === "string"
            ? series.find((item) => item.id === where.id)
            : typeof where.slug === "string"
              ? series.find((item) => item.slug === where.slug)
              : undefined;

        return found ? seriesWithNested(found) : null;
      },
      create: async (args) => {
        const data = dataFrom<RandomRoomsSeriesRecord>(args);
        const record: RandomRoomsSeriesRecord = {
          id: data.id || nextId("series"),
          name: data.name || "Random Rooms",
          slug: data.slug || "random-rooms",
          concept: data.concept || "",
          tone: data.tone || "",
          language: data.language || "hinglish",
          targetFormat: data.targetFormat || "youtube_shorts",
          defaultDurationSec: data.defaultDurationSec || 60,
          contentRules: data.contentRules || [],
          active: data.active ?? true,
          createdAt: now,
          updatedAt: now,
        };
        series.push(record);
        return seriesWithNested(record);
      },
      update: async (args) => {
        const where = whereFrom(args);
        const record = series.find((item) => item.id === where.id);

        if (!record) {
          throw new Error("Series not found");
        }

        Object.assign(record, dataFrom<RandomRoomsSeriesRecord>(args), { updatedAt: now });
        return seriesWithNested(record);
      },
    },
    character: {
      findMany: async (args) => {
        const where = whereFrom(args);
        let result = [...characters];
        const idFilter = where.id as { in?: string[] } | undefined;

        if (idFilter?.in) {
          result = result.filter((character) => idFilter.in?.includes(character.id));
        }

        if (typeof where.seriesId === "string") {
          result = result.filter((character) => character.seriesId === where.seriesId);
        }

        return result;
      },
      findUnique: async (args) => {
        const where = whereFrom(args);
        const found = typeof where.id === "string" ? characters.find((character) => character.id === where.id) : undefined;

        return found || null;
      },
      findFirst: async (args) => {
        const where = whereFrom(args);
        const not = where.NOT as { id?: string } | undefined;

        return (
          characters.find(
            (character) =>
              character.seriesId === where.seriesId &&
              character.code === where.code &&
              (!not?.id || character.id !== not.id),
          ) || null
        );
      },
      create: async (args) => {
        const data = dataFrom<RandomRoomsCharacterRecord>(args);
        const record: RandomRoomsCharacterRecord = {
          id: data.id || nextId("character"),
          seriesId: data.seriesId || "series_1",
          code: data.code || "CHARACTER",
          name: data.name || "Character",
          role: data.role || "Role",
          characterType: data.characterType || "type",
          personality: data.personality || [],
          speakingStyle: data.speakingStyle || [],
          catchphrases: data.catchphrases || [],
          doNotSay: data.doNotSay || [],
          visualDescription: data.visualDescription || "Visual description",
          signatureTraits: data.signatureTraits || [],
          voiceProfile: data.voiceProfile || null,
          continuityNotes: data.continuityNotes ?? null,
          referenceAssetNotes: data.referenceAssetNotes ?? null,
          active: data.active ?? true,
          createdAt: now,
          updatedAt: now,
        };
        characters.push(record);
        return record;
      },
      update: async (args) => {
        const where = whereFrom(args);
        const record = characters.find((character) => character.id === where.id);

        if (!record) {
          throw new Error("Character not found");
        }

        Object.assign(record, dataFrom<RandomRoomsCharacterRecord>(args), { updatedAt: now });
        return record;
      },
    },
    characterRelationship: {
      findMany: async (args) => {
        const where = whereFrom(args);
        const result =
          typeof where.seriesId === "string"
            ? relationships.filter((relationship) => relationship.seriesId === where.seriesId)
            : relationships;

        return result.map(relationshipWithCharacters);
      },
      findUnique: async (args) => {
        const where = whereFrom(args);
        const compound = where.seriesId_pairKey as { seriesId: string; pairKey: string } | undefined;
        const found =
          typeof where.id === "string"
            ? relationships.find((relationship) => relationship.id === where.id)
            : compound
              ? relationships.find(
                  (relationship) => relationship.seriesId === compound.seriesId && relationship.pairKey === compound.pairKey,
                )
              : undefined;

        return found ? relationshipWithCharacters(found) : null;
      },
      create: async (args) => {
        const data = dataFrom<RandomRoomsRelationshipRecord>(args);
        const record: RandomRoomsRelationshipRecord = {
          id: data.id || nextId("relationship"),
          seriesId: data.seriesId || "series_1",
          characterAId: data.characterAId || "character_a",
          characterBId: data.characterBId || "character_b",
          pairKey: data.pairKey || relationshipPairKey(data.characterAId || "character_a", data.characterBId || "character_b"),
          relationshipType: data.relationshipType || "partners",
          dynamic: data.dynamic || "Dynamic",
          conflictPattern: data.conflictPattern || "Conflict",
          comedyPattern: data.comedyPattern || "Comedy",
          continuityNotes: data.continuityNotes ?? null,
          active: data.active ?? true,
          createdAt: now,
          updatedAt: now,
        };
        relationships.push(record);
        return relationshipWithCharacters(record);
      },
      update: async (args) => {
        const where = whereFrom(args);
        const record = relationships.find((relationship) => relationship.id === where.id);

        if (!record) {
          throw new Error("Relationship not found");
        }

        Object.assign(record, dataFrom<RandomRoomsRelationshipRecord>(args), { updatedAt: now });
        return relationshipWithCharacters(record);
      },
    },
  };

  return {
    db,
    service: createRandomRoomsService(db),
    characters,
    relationships,
  };
}

async function createCharacter(service: ReturnType<typeof createRandomRoomsService>, code: string, name = code) {
  return service.createCharacter(
    randomRoomsCharacterCreateSchema.parse({
      seriesId: "series_1",
      code,
      name,
      role: "Cast member",
      characterType: "robot",
      personality: ["confident"],
      speakingStyle: ["direct"],
      visualDescription: `${name} visual identity.`,
    }),
  );
}

describe("random rooms service", () => {
  it("creates, updates, and deactivates characters", async () => {
    const { service } = createFakeDb();
    const character = await createCharacter(service, "maya", "Maya");

    expect(character.code).toBe("MAYA");

    const updated = await service.updateCharacter(character.id, { role: "Grounded mediator", active: true });
    expect(updated.role).toBe("Grounded mediator");

    const inactive = await service.deactivateCharacter(character.id);
    expect(inactive.active).toBe(false);
  });

  it("prevents duplicate character codes within a series", async () => {
    const { service } = createFakeDb();
    await createCharacter(service, "REX", "Rex");

    await expect(createCharacter(service, "rex", "Rex Copy")).rejects.toMatchObject({
      status: 409,
    } satisfies Partial<HttpError>);
  });

  it("creates normalized relationships and prevents reverse duplicates", async () => {
    const { service, relationships } = createFakeDb();
    const rex = await createCharacter(service, "REX", "Rex");
    const glitch = await createCharacter(service, "GLITCH", "Glitch");

    const relationship = await service.createRelationship(
      randomRoomsRelationshipCreateSchema.parse({
        seriesId: "series_1",
        characterAId: rex.id,
        characterBId: glitch.id,
        relationshipType: "reluctant partners",
        dynamic: "Rex thinks he controls Glitch.",
        conflictPattern: "Rex gives confident plans.",
        comedyPattern: "Glitch interprets Rex literally.",
      }),
    );

    expect(relationship.pairKey).toBe(relationshipPairKey(rex.id, glitch.id));
    expect([relationship.characterAId, relationship.characterBId]).toEqual([glitch.id, rex.id].sort());
    expect(relationships).toHaveLength(1);

    await expect(
      service.createRelationship(
        randomRoomsRelationshipCreateSchema.parse({
          seriesId: "series_1",
          characterAId: glitch.id,
          characterBId: rex.id,
          relationshipType: "reverse duplicate",
          dynamic: "Duplicate.",
          conflictPattern: "Duplicate.",
          comedyPattern: "Duplicate.",
        }),
      ),
    ).rejects.toMatchObject({ status: 409 } satisfies Partial<HttpError>);
  });

  it("rejects same-character relationships and cross-series relationships", async () => {
    const { db, service } = createFakeDb();
    const rex = await createCharacter(service, "REX", "Rex");
    const otherSeries = await service.createSeries({
      name: "Other Rooms",
      slug: "other-rooms",
      concept: "",
      tone: "",
      language: "hinglish",
      targetFormat: "youtube_shorts",
      defaultDurationSec: 60,
      contentRules: [],
      active: true,
    });
    const outsider = await service.createCharacter(
      randomRoomsCharacterCreateSchema.parse({
        seriesId: otherSeries.id,
        code: "OUTSIDER",
        name: "Outsider",
        role: "Visitor",
        characterType: "human",
        personality: ["curious"],
        speakingStyle: ["plain"],
        visualDescription: "Visitor profile.",
      }),
    );

    await expect(
      service.createRelationship({
        seriesId: "series_1",
        characterAId: rex.id,
        characterBId: rex.id,
        relationshipType: "self",
        dynamic: "Self.",
        conflictPattern: "Self.",
        comedyPattern: "Self.",
        continuityNotes: null,
        active: true,
      }),
    ).rejects.toMatchObject({ status: 422 } satisfies Partial<HttpError>);

    await expect(
      service.createRelationship(
        randomRoomsRelationshipCreateSchema.parse({
          seriesId: "series_1",
          characterAId: rex.id,
          characterBId: outsider.id,
          relationshipType: "crossover",
          dynamic: "Wrong series.",
          conflictPattern: "Wrong series.",
          comedyPattern: "Wrong series.",
        }),
      ),
    ).rejects.toMatchObject({ status: 422 } satisfies Partial<HttpError>);

    expect(await db.characterRelationship.findMany()).toHaveLength(0);
  });

  it("updates and deactivates relationships safely", async () => {
    const { service } = createFakeDb();
    const rex = await createCharacter(service, "REX", "Rex");
    const glitch = await createCharacter(service, "GLITCH", "Glitch");
    const relationship = await service.createRelationship(
      randomRoomsRelationshipCreateSchema.parse({
        seriesId: "series_1",
        characterAId: rex.id,
        characterBId: glitch.id,
        relationshipType: "reluctant partners",
        dynamic: "Rex thinks he controls Glitch.",
        conflictPattern: "Rex gives confident plans.",
        comedyPattern: "Glitch interprets Rex literally.",
      }),
    );

    const updated = await service.updateRelationship(relationship.id, {
      comedyPattern: "Glitch improves the wrong thing.",
    });
    expect(updated.comedyPattern).toBe("Glitch improves the wrong thing.");

    const inactive = await service.deactivateRelationship(relationship.id);
    expect(inactive.active).toBe(false);
  });
});
