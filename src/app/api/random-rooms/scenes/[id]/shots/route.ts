import { jsonOk, parseBody, routeError } from "@/lib/api";
import { randomRoomsPlanningService } from "@/lib/random-rooms/planning-service";
import { serializeRandomRoomsShot } from "@/lib/serializers";
import { randomRoomsReorderSchema, randomRoomsShotCreateSchema } from "@/lib/validation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const shots = await randomRoomsPlanningService.listShots(id);

    return jsonOk(shots.map(serializeRandomRoomsShot));
  } catch (error) {
    return routeError(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const data = await parseBody(request, randomRoomsShotCreateSchema);
    const shot = await randomRoomsPlanningService.createShot(id, data);

    return jsonOk(serializeRandomRoomsShot(shot), "Shot created.");
  } catch (error) {
    return routeError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const data = await parseBody(request, randomRoomsReorderSchema);
    const shots = await randomRoomsPlanningService.reorderShots(id, data.orderedIds);

    return jsonOk(shots.map(serializeRandomRoomsShot), "Shots reordered.");
  } catch (error) {
    return routeError(error);
  }
}
