import { describe, expect, it } from "vitest";
import { HttpError } from "@/lib/api";
import { createRoomService, type RandomRoomsRoomDb, type RoomProfileRecord } from "@/lib/random-rooms/room-service";
import { randomRoomsRoomCreateSchema } from "@/lib/validation";

const now = new Date("2026-08-28T10:00:00.000Z");

function whereFrom(args: Record<string, unknown> | undefined) {
  return (args?.where || {}) as Record<string, unknown>;
}

function dataFrom<T>(args: Record<string, unknown>) {
  return args.data as Partial<T>;
}

function createFakeDb() {
  const series = [{ id: "series_1" }];
  const rooms: RoomProfileRecord[] = [];
  let counter = 1;

  const db: RandomRoomsRoomDb = {
    randomRoomsSeries: {
      findUnique: async (args) => {
        const where = whereFrom(args);
        return series.find((item) => item.id === where.id) || null;
      },
    },
    roomProfile: {
      findMany: async (args) => {
        const where = whereFrom(args);
        let result = [...rooms];

        if (typeof where.seriesId === "string") {
          result = result.filter((room) => room.seriesId === where.seriesId);
        }

        if (typeof where.active === "boolean") {
          result = result.filter((room) => room.active === where.active);
        }

        return result;
      },
      findUnique: async (args) => {
        const where = whereFrom(args);
        return (typeof where.id === "string" ? rooms.find((room) => room.id === where.id) : undefined) || null;
      },
      findFirst: async (args) => {
        const where = whereFrom(args);
        const not = where.NOT as { id?: string } | undefined;

        return (
          rooms.find(
            (room) =>
              room.seriesId === where.seriesId &&
              room.code === where.code &&
              (!not?.id || room.id !== not.id),
          ) || null
        );
      },
      create: async (args) => {
        const data = dataFrom<RoomProfileRecord>(args);
        const room: RoomProfileRecord = {
          id: data.id || `room_${counter++}`,
          seriesId: data.seriesId || "series_1",
          code: data.code || "ROOM",
          name: data.name || "Room",
          roomType: data.roomType || "room",
          description: data.description || "Description",
          visualStyle: data.visualStyle || "Style",
          lighting: data.lighting || "Lighting",
          colorMood: data.colorMood || "Mood",
          cameraConstraints: data.cameraConstraints || [],
          props: data.props || [],
          environmentRules: data.environmentRules || [],
          continuityNotes: data.continuityNotes ?? null,
          referenceAssetNotes: data.referenceAssetNotes ?? null,
          active: data.active ?? true,
          createdAt: now,
          updatedAt: now,
        };
        rooms.push(room);
        return room;
      },
      update: async (args) => {
        const where = whereFrom(args);
        const room = rooms.find((item) => item.id === where.id);

        if (!room) {
          throw new Error("Room not found");
        }

        Object.assign(room, dataFrom<RoomProfileRecord>(args), { updatedAt: now });
        return room;
      },
    },
  };

  return {
    db,
    rooms,
    service: createRoomService(db),
  };
}

function createRoomInput(code: string, seriesId = "series_1") {
  return randomRoomsRoomCreateSchema.parse({
    seriesId,
    code,
    name: "Rex's Apartment",
    roomType: "compact futuristic apartment",
    description: "A compact futuristic apartment that looks advanced but is slightly dysfunctional.",
    visualStyle: "Stylized 3D animated sitcom.",
    lighting: "Warm evening light with cyan tech accents.",
    colorMood: "Warm reds and cyan glow.",
    cameraConstraints: ["Keep geography stable."],
    props: ["red couch", "charging dock"],
    environmentRules: ["Permanent furniture should not move."],
  });
}

describe("room service", () => {
  it("creates, updates, deactivates, and reactivates rooms", async () => {
    const { service } = createFakeDb();
    const room = await service.createRoom(createRoomInput("rex_apartment"));

    expect(room.code).toBe("REX_APARTMENT");

    const updated = await service.updateRoom(room.id, {
      name: "Rex Apartment Prime",
      props: ["red couch", "new holographic display"],
    });
    expect(updated.name).toBe("Rex Apartment Prime");
    expect(updated.props).toContain("new holographic display");

    const inactive = await service.deactivateRoom(room.id);
    expect(inactive.active).toBe(false);

    const reactivated = await service.reactivateRoom(room.id);
    expect(reactivated.active).toBe(true);
  });

  it("prevents duplicate room codes within a series", async () => {
    const { service } = createFakeDb();
    await service.createRoom(createRoomInput("AI_OFFICE"));

    await expect(service.createRoom(createRoomInput("ai_office"))).rejects.toMatchObject({
      status: 409,
    } satisfies Partial<HttpError>);
  });

  it("rejects invalid series IDs", async () => {
    const { service } = createFakeDb();

    await expect(service.createRoom(createRoomInput("GLITCH_LAB", "missing_series"))).rejects.toMatchObject({
      status: 404,
    } satisfies Partial<HttpError>);

    await expect(service.listRooms({ seriesId: "missing_series" })).rejects.toMatchObject({
      status: 404,
    } satisfies Partial<HttpError>);
  });

  it("supports active filters and deterministic lookup by code", async () => {
    const { service } = createFakeDb();
    const office = await service.createRoom(createRoomInput("AI_OFFICE"));
    const lab = await service.createRoom(createRoomInput("GLITCH_LAB"));
    await service.deactivateRoom(lab.id);

    const activeRooms = await service.listRooms({ seriesId: "series_1", active: true });
    const inactiveRooms = await service.listRooms({ seriesId: "series_1", active: false });
    const found = await service.getRoomByCode("series_1", "ai_office");

    expect(activeRooms.map((room) => room.id)).toEqual([office.id]);
    expect(inactiveRooms.map((room) => room.id)).toEqual([lab.id]);
    expect(found?.id).toBe(office.id);
  });

  it("prevents duplicate room codes during updates", async () => {
    const { service } = createFakeDb();
    await service.createRoom(createRoomInput("AI_OFFICE"));
    const lab = await service.createRoom(createRoomInput("GLITCH_LAB"));

    await expect(service.updateRoom(lab.id, { code: "AI_OFFICE" })).rejects.toMatchObject({
      status: 409,
    } satisfies Partial<HttpError>);
  });
});
