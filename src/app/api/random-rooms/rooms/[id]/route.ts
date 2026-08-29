import { jsonOk, parseBody, routeError } from "@/lib/api";
import { roomService } from "@/lib/random-rooms/room-service";
import { serializeRandomRoomsRoomProfile } from "@/lib/serializers";
import { randomRoomsRoomUpdateSchema } from "@/lib/validation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const room = await roomService.getRoom(id);

    return jsonOk(serializeRandomRoomsRoomProfile(room));
  } catch (error) {
    return routeError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const data = await parseBody(request, randomRoomsRoomUpdateSchema);
    const room = await roomService.updateRoom(id, data);

    return jsonOk(serializeRandomRoomsRoomProfile(room), "Room updated.");
  } catch (error) {
    return routeError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const room = await roomService.deactivateRoom(id);

    return jsonOk(serializeRandomRoomsRoomProfile(room), "Room deactivated.");
  } catch (error) {
    return routeError(error);
  }
}
