import { jsonOk, routeError } from "@/lib/api";
import { buildProductionManifest } from "@/lib/random-rooms/manifest";
import { randomRoomsPlanningService } from "@/lib/random-rooms/planning-service";
import { serializeRandomRoomsEpisode } from "@/lib/serializers";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const episode = serializeRandomRoomsEpisode(await randomRoomsPlanningService.getEpisode(id));

    return jsonOk(buildProductionManifest(episode));
  } catch (error) {
    return routeError(error);
  }
}
