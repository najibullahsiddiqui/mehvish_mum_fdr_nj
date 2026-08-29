import { jsonOk, parseBody, routeError } from "@/lib/api";
import { randomRoomsPlanningService } from "@/lib/random-rooms/planning-service";
import { serializeRandomRoomsDialogueLine } from "@/lib/serializers";
import { randomRoomsDialogueLineUpdateSchema } from "@/lib/validation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const line = await randomRoomsPlanningService.getDialogueLine(id);

    return jsonOk(serializeRandomRoomsDialogueLine(line));
  } catch (error) {
    return routeError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const data = await parseBody(request, randomRoomsDialogueLineUpdateSchema);
    const line = await randomRoomsPlanningService.updateDialogueLine(id, data);

    return jsonOk(serializeRandomRoomsDialogueLine(line), "Dialogue line updated.");
  } catch (error) {
    return routeError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const line = await randomRoomsPlanningService.deleteDialogueLine(id);

    return jsonOk(serializeRandomRoomsDialogueLine(line), "Dialogue line removed.");
  } catch (error) {
    return routeError(error);
  }
}
