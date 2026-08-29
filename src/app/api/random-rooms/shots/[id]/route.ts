import { jsonOk, parseBody, routeError } from "@/lib/api";
import { randomRoomsPlanningService } from "@/lib/random-rooms/planning-service";
import { serializeRandomRoomsShot } from "@/lib/serializers";
import { randomRoomsShotUpdateSchema } from "@/lib/validation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const shot = await randomRoomsPlanningService.getShot(id);

    return jsonOk(serializeRandomRoomsShot(shot));
  } catch (error) {
    return routeError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const data = await parseBody(request, randomRoomsShotUpdateSchema);
    const shot = await randomRoomsPlanningService.updateShot(id, data);

    return jsonOk(serializeRandomRoomsShot(shot), "Shot updated.");
  } catch (error) {
    return routeError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const shot = await randomRoomsPlanningService.deleteShot(id);

    return jsonOk(serializeRandomRoomsShot(shot), "Shot removed.");
  } catch (error) {
    return routeError(error);
  }
}
