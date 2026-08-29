import { HttpError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { normalizeRoomCode } from "@/lib/random-rooms/normalize";
import type { randomRoomsRoomCreateSchema, randomRoomsRoomUpdateSchema } from "@/lib/validation";
import type { z } from "zod";

export type RandomRoomsRoomCreateInput = z.infer<typeof randomRoomsRoomCreateSchema>;
export type RandomRoomsRoomUpdateInput = z.infer<typeof randomRoomsRoomUpdateSchema>;

type QueryArgs = Record<string, unknown>;
type MaybeDate = Date | string;

export type RoomProfileRecord = {
  id: string;
  seriesId: string;
  code: string;
  name: string;
  roomType: string;
  description: string;
  visualStyle: string;
  lighting: string;
  colorMood: string;
  cameraConstraints: string[];
  props: string[];
  environmentRules: string[];
  continuityNotes: string | null;
  referenceAssetNotes: string | null;
  active: boolean;
  createdAt: MaybeDate;
  updatedAt: MaybeDate;
};

export type RandomRoomsRoomDb = {
  randomRoomsSeries: {
    findUnique(args: QueryArgs): Promise<{ id: string } | null>;
  };
  roomProfile: {
    findMany(args?: QueryArgs): Promise<RoomProfileRecord[]>;
    findUnique(args: QueryArgs): Promise<RoomProfileRecord | null>;
    findFirst(args: QueryArgs): Promise<RoomProfileRecord | null>;
    create(args: QueryArgs): Promise<RoomProfileRecord>;
    update(args: QueryArgs): Promise<RoomProfileRecord>;
  };
};

export type RoomListFilters = {
  seriesId?: string;
  active?: boolean;
};

function definedData(input: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(input).filter((entry) => entry[1] !== undefined));
}

export function createRoomService(db: RandomRoomsRoomDb) {
  async function ensureSeries(seriesId: string) {
    const series = await db.randomRoomsSeries.findUnique({ where: { id: seriesId } });

    if (!series) {
      throw new HttpError("Random Rooms series not found.", 404);
    }

    return series;
  }

  async function ensureRoom(roomId: string) {
    const room = await db.roomProfile.findUnique({ where: { id: roomId } });

    if (!room) {
      throw new HttpError("Room not found.", 404);
    }

    return room;
  }

  async function assertRoomCodeAvailable(seriesId: string, code: string, excludeId?: string) {
    const existing = await db.roomProfile.findFirst({
      where: {
        seriesId,
        code,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    });

    if (existing) {
      throw new HttpError("A room with this code already exists in the selected series.", 409);
    }
  }

  return {
    async listRooms(filters: RoomListFilters = {}) {
      if (filters.seriesId) {
        await ensureSeries(filters.seriesId);
      }

      return db.roomProfile.findMany({
        where: definedData({
          seriesId: filters.seriesId,
          active: filters.active,
        }),
        orderBy: [{ active: "desc" }, { updatedAt: "desc" }],
      });
    },

    async getRoom(roomId: string) {
      return ensureRoom(roomId);
    },

    async getRoomByCode(seriesId: string, code: string) {
      await ensureSeries(seriesId);

      return db.roomProfile.findFirst({
        where: {
          seriesId,
          code: normalizeRoomCode(code),
        },
      });
    },

    async createRoom(input: RandomRoomsRoomCreateInput) {
      await ensureSeries(input.seriesId);
      const code = normalizeRoomCode(input.code);
      await assertRoomCodeAvailable(input.seriesId, code);

      return db.roomProfile.create({
        data: {
          ...input,
          code,
        },
      });
    },

    async updateRoom(roomId: string, input: RandomRoomsRoomUpdateInput) {
      const room = await ensureRoom(roomId);
      const code = input.code ? normalizeRoomCode(input.code) : undefined;

      if (code && code !== room.code) {
        await assertRoomCodeAvailable(room.seriesId, code, roomId);
      }

      return db.roomProfile.update({
        where: { id: roomId },
        data: definedData({
          ...input,
          code,
        }),
      });
    },

    async deactivateRoom(roomId: string) {
      await ensureRoom(roomId);

      return db.roomProfile.update({
        where: { id: roomId },
        data: { active: false },
      });
    },

    async reactivateRoom(roomId: string) {
      await ensureRoom(roomId);

      return db.roomProfile.update({
        where: { id: roomId },
        data: { active: true },
      });
    },
  };
}

export const roomService = createRoomService(prisma as unknown as RandomRoomsRoomDb);
