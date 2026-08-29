import { jsonOk, parseBody, routeError } from "@/lib/api";
import { randomRoomsPlanningService } from "@/lib/random-rooms/planning-service";
import { serializeRandomRoomsEpisode } from "@/lib/serializers";
import { randomRoomsEpisodeUpdateSchema } from "@/lib/validation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const episode = await randomRoomsPlanningService.getEpisode(id);

    return jsonOk(serializeRandomRoomsEpisode(episode));
  } catch (error) {
    return routeError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const data = await parseBody(request, randomRoomsEpisodeUpdateSchema);
    const episode = await randomRoomsPlanningService.updateEpisode(id, data);

    return jsonOk(serializeRandomRoomsEpisode(episode), "Episode updated.");
  } catch (error) {
    return routeError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const episode = await randomRoomsPlanningService.archiveEpisode(id);

    return jsonOk(serializeRandomRoomsEpisode(episode), "Episode archived.");
  } catch (error) {
    return routeError(error);
  }
}
