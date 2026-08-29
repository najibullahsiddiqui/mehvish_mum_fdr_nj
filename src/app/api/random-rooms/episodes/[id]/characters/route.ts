import { jsonOk, parseBody, routeError } from "@/lib/api";
import { randomRoomsPlanningService } from "@/lib/random-rooms/planning-service";
import { serializeRandomRoomsEpisodeCharacter } from "@/lib/serializers";
import { randomRoomsEpisodeCharacterCreateSchema } from "@/lib/validation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const assignments = await randomRoomsPlanningService.listEpisodeCharacters(id);

    return jsonOk(assignments.map(serializeRandomRoomsEpisodeCharacter));
  } catch (error) {
    return routeError(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const data = await parseBody(request, randomRoomsEpisodeCharacterCreateSchema);
    const assignment = await randomRoomsPlanningService.assignCharacter(id, data);

    return jsonOk(serializeRandomRoomsEpisodeCharacter(assignment), "Character assigned.");
  } catch (error) {
    return routeError(error);
  }
}
