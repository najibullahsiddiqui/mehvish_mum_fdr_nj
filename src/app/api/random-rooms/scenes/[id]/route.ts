import { jsonOk, parseBody, routeError } from "@/lib/api";
import { randomRoomsPlanningService } from "@/lib/random-rooms/planning-service";
import { serializeRandomRoomsScene } from "@/lib/serializers";
import { randomRoomsSceneUpdateSchema } from "@/lib/validation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const scene = await randomRoomsPlanningService.getScene(id);

    return jsonOk(serializeRandomRoomsScene(scene));
  } catch (error) {
    return routeError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const data = await parseBody(request, randomRoomsSceneUpdateSchema);
    const scene = await randomRoomsPlanningService.updateScene(id, data);

    return jsonOk(serializeRandomRoomsScene(scene), "Scene updated.");
  } catch (error) {
    return routeError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const scene = await randomRoomsPlanningService.deleteScene(id);

    return jsonOk(serializeRandomRoomsScene(scene), "Scene removed.");
  } catch (error) {
    return routeError(error);
  }
}
