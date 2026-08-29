import { HttpError, jsonOk, parseBody, routeError } from "@/lib/api";
import { roomService } from "@/lib/random-rooms/room-service";
import { serializeRandomRoomsRoomProfile } from "@/lib/serializers";
import { randomRoomsRoomCreateSchema } from "@/lib/validation";

function activeFilter(value: string | null) {
  if (value === null) {
    return undefined;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  throw new HttpError("Use active=true or active=false.", 422);
}

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const rooms = await roomService.listRooms({
      seriesId: params.get("seriesId") || undefined,
      active: activeFilter(params.get("active")),
    });

    return jsonOk(rooms.map(serializeRandomRoomsRoomProfile));
  } catch (error) {
    return routeError(error);
  }
}

export async function POST(request: Request) {
  try {
    const data = await parseBody(request, randomRoomsRoomCreateSchema);
    const room = await roomService.createRoom(data);

    return jsonOk(serializeRandomRoomsRoomProfile(room), "Room created.");
  } catch (error) {
    return routeError(error);
  }
}
