import { jsonOk, parseBody, routeError } from "@/lib/api";
import { randomRoomsPlanningService } from "@/lib/random-rooms/planning-service";
import { serializeRandomRoomsDialogueLine } from "@/lib/serializers";
import { randomRoomsDialogueLineCreateSchema, randomRoomsReorderSchema } from "@/lib/validation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const lines = await randomRoomsPlanningService.listDialogueLines(id);

    return jsonOk(lines.map(serializeRandomRoomsDialogueLine));
  } catch (error) {
    return routeError(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const data = await parseBody(request, randomRoomsDialogueLineCreateSchema);
    const line = await randomRoomsPlanningService.createDialogueLine(id, data);

    return jsonOk(serializeRandomRoomsDialogueLine(line), "Dialogue line created.");
  } catch (error) {
    return routeError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const data = await parseBody(request, randomRoomsReorderSchema);
    const lines = await randomRoomsPlanningService.reorderDialogueLines(id, data.orderedIds);

    return jsonOk(lines.map(serializeRandomRoomsDialogueLine), "Dialogue reordered.");
  } catch (error) {
    return routeError(error);
  }
}
