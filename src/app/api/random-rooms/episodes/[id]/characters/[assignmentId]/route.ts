import { jsonOk, parseBody, routeError } from "@/lib/api";
import { randomRoomsPlanningService } from "@/lib/random-rooms/planning-service";
import { serializeRandomRoomsEpisodeCharacter } from "@/lib/serializers";
import { randomRoomsEpisodeCharacterUpdateSchema } from "@/lib/validation";

type RouteContext = {
  params: Promise<{ id: string; assignmentId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id, assignmentId } = await context.params;
    const data = await parseBody(request, randomRoomsEpisodeCharacterUpdateSchema);
    const assignment = await randomRoomsPlanningService.updateCharacterAssignment(id, assignmentId, data);

    return jsonOk(serializeRandomRoomsEpisodeCharacter(assignment), "Character assignment updated.");
  } catch (error) {
    return routeError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id, assignmentId } = await context.params;
    const assignment = await randomRoomsPlanningService.removeCharacterAssignment(id, assignmentId);

    return jsonOk(serializeRandomRoomsEpisodeCharacter(assignment), "Character assignment removed.");
  } catch (error) {
    return routeError(error);
  }
}
