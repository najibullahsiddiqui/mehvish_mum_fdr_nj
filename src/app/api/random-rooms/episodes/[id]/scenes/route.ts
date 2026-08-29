import { jsonOk, parseBody, routeError } from "@/lib/api";
import { randomRoomsPlanningService } from "@/lib/random-rooms/planning-service";
import { serializeRandomRoomsScene } from "@/lib/serializers";
import { randomRoomsReorderSchema, randomRoomsSceneCreateSchema } from "@/lib/validation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const scenes = await randomRoomsPlanningService.listScenes(id);

    return jsonOk(scenes.map(serializeRandomRoomsScene));
  } catch (error) {
    return routeError(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const data = await parseBody(request, randomRoomsSceneCreateSchema);
    const scene = await randomRoomsPlanningService.createScene(id, data);

    return jsonOk(serializeRandomRoomsScene(scene), "Scene created.");
  } catch (error) {
    return routeError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const data = await parseBody(request, randomRoomsReorderSchema);
    const scenes = await randomRoomsPlanningService.reorderScenes(id, data.orderedIds);

    return jsonOk(scenes.map(serializeRandomRoomsScene), "Scenes reordered.");
  } catch (error) {
    return routeError(error);
  }
}
